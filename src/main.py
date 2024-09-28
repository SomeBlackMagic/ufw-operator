# src/main.py
import kopf
import asyncio
import os
import logging
import json

from kubernetes import client, config
from utils import compute_hash
from logging_config import setup_logging
from ufw_manager import apply_rule, enable_ufw
from status_updater import update_firewallrule_status
from ufw_log_reader import ufw_log_reader

# Настройка логирования
setup_logging()
logger = logging.getLogger(__name__)

# Загрузка конфигурации Kubernetes
config.load_incluster_config()


def get_current_pod_info() -> dict:
    """
    Получает информацию о текущем поде.
    """
    pod_name = os.environ.get('HOSTNAME', '')
    namespace_path = "/var/run/secrets/kubernetes.io/serviceaccount/namespace"
    try:
        with open(namespace_path, 'r') as f:
            namespace = f.read().strip()
    except Exception as e:
        logger.error(f"Failed to read namespace from {namespace_path}: {str(e)}", extra={'log_level': 'ERROR'})
        namespace = ''
    v1 = client.CoreV1Api()
    try:
        pod = v1.read_namespaced_pod(name=pod_name, namespace=namespace)
        return pod.to_dict()
    except Exception as e:
        logger.error(f"Failed to get pod info: {str(e)}", extra={'log_level': 'ERROR'})
        return {}


def get_node_name() -> str:
    """
    Получает имя узла, на котором запущен текущий под.
    """
    pod_info = get_current_pod_info()
    return pod_info.get('spec', {}).get('node_name', '')


@kopf.on.startup()
def configure(settings: kopf.OperatorSettings, **kwargs):
    """
    Настройка оператора при старте.
    """
    # Установка таймаута сервера на 1 час
    settings.watching.server_timeout = 60 * 60
    # Включение UFW
    enable_ufw()
    # Запуск потока для чтения логов UFW
    asyncio.create_task(run_ufw_log_reader())
    logger.info('Operator startup complete', extra={'log_level': 'INFO'})


async def run_ufw_log_reader():
    """
    Запускает поток для чтения логов UFW.
    """
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, ufw_log_reader)


@kopf.on.create('firewallrules', group='my.firewall')
@kopf.on.update('firewallrules', group='my.firewall')
def on_firewallrule_event(spec, name, namespace, **kwargs):
    """
    Обработчик событий создания и обновления FirewallRule.
    """
    logger.info(f"Configuring firewall rules for {name}", extra={'log_level': 'INFO'})
    asyncio.create_task(apply_rules_periodically(spec, name, group='my.firewall', version='v1'))


async def apply_rules_periodically(spec, name, group, version):
    """
    Периодически применяет правила фаервола каждые 60 секунд.
    """
    api = client.CustomObjectsApi()
    while True:
        apply_rules(spec, api, name, group, version)
        await asyncio.sleep(60)


def apply_rules(spec, api: client.CustomObjectsApi, name: str, group: str, version: str):
    """
    Применяет конфигурацию UFW на основе спецификации FirewallRule.
    """
    node_selector = spec.get('nodeSelector', {})
    ufw_options = spec.get('ufwOptions', {})
    rules = spec.get('rules', [])
    safe_mode = spec.get('safeMode', True)  # По умолчанию True

    node_name = get_node_name()
    if not node_name:
        logger.error('Unable to determine node name.', extra={'log_level': 'ERROR'})
        return

    v1 = client.CoreV1Api()
    try:
        node = v1.read_node(name=node_name)
    except Exception as e:
        logger.error(f'Error reading node {node_name}: {str(e)}', extra={'log_level': 'ERROR'})
        return

    node_labels = node.metadata.labels or {}

    # Проверка соответствия nodeSelector
    match = all(node_labels.get(k) == v for k, v in node_selector.items())

    if match:
        # Настройка глобальных опций UFW
        if ufw_options:
            # Настройка логирования
            logging_level = ufw_options.get('logging')
            if logging_level:
                rule = f"logging {logging_level}"
                if apply_rule(rule):
                    logger.info(f"Set logging level: {logging_level}", extra={'log_level': 'INFO', 'cmd': rule.split()})

            # Настройка политик по умолчанию
            default_policies = ufw_options.get('defaultPolicies', {})
            incoming_policy = default_policies.get('incoming')
            outgoing_policy = default_policies.get('outgoing')
            if incoming_policy:
                rule = f"default {incoming_policy} incoming"
                if apply_rule(rule):
                    logger.info(f"Set default incoming policy: {incoming_policy}",
                                extra={'log_level': 'INFO', 'cmd': rule.split()})
            if outgoing_policy:
                rule = f"default {outgoing_policy} outgoing"
                if apply_rule(rule):
                    logger.info(f"Set default outgoing policy: {outgoing_policy}",
                                extra={'log_level': 'INFO', 'cmd': rule.split()})

            # Настройка профилей
            profiles = ufw_options.get('profiles', [])
            for profile in profiles:
                profile_name = profile.get('name')
                action = profile.get('action')
                if profile_name and action:
                    rule = f"{action} from any app {profile_name}"
                    if apply_rule(rule):
                        logger.info(f"{action.capitalize()} traffic for profile {profile_name}",
                                    extra={'log_level': 'INFO', 'cmd': rule.split()})

        # Применение Safe Mode правила
        if safe_mode:
            ssh_rule = "allow 22/tcp"
            ssh_hash = compute_hash(ssh_rule)
            if apply_rule(ssh_rule):
                logger.info(f"Safe Mode: Applied rule to allow SSH traffic: {ssh_rule}",
                            extra={'log_level': 'INFO', 'cmd': ssh_rule.split()})
                # Обновление статуса
                rule_status = {
                    'node': node_name,
                    'rule': ssh_rule,
                    'hash': ssh_hash
                }
                update_firewallrule_status(api, name, group, version, rule_status)

        # Применение пользовательских правил
        for rule in rules:
            rule_hash = compute_hash(rule)
            if apply_rule(rule):
                logger.info(f"Applied rule: {rule}", extra={'log_level': 'INFO', 'cmd': rule.split()})
                # Обновление статуса
                rule_status = {
                    'node': node_name,
                    'rule': rule,
                    'hash': rule_hash
                }
                update_firewallrule_status(api, name, group, version, rule_status)
    else:
        logger.debug(f"Node {node_name} does not match selector {node_selector}", extra={'log_level': 'DEBUG'})
