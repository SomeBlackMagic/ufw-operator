# src/status_updater.py
import kopf
import logging
import time
from kubernetes import client

logger = logging.getLogger(__name__)


def update_firewallrule_status(api: client.CustomObjectsApi, name: str, group: str, version: str, rule_status: dict):
    """
    Обновляет статус FirewallRule ресурса.
    Группирует правила по имени узла.
    """
    max_retries = 5
    for attempt in range(max_retries):
        try:
            # Получение текущего состояния
            firewallrule = api.get_cluster_custom_object(group=group, version=version, plural='firewallrules',
                                                         name=name)
            current_status = firewallrule.get('status', {})
            current_rules = current_status.get('rules', {})

            node = rule_status['node']
            rule = rule_status['rule']
            rule_hash = rule_status['hash']

            if node not in current_rules:
                current_rules[node] = {}

            # Обновление или добавление правила для узла
            current_rules[node][rule] = rule_hash

            # Подготовка патча
            patch = {
                'status': {
                    'rules': current_rules
                }
            }

            # Обновление статуса
            api.patch_cluster_custom_object_status(group=group, version=version, plural='firewallrules', name=name,
                                                   body=patch)
            logger.info(f"Updated status for node {node}, rule '{rule}' with hash {rule_hash}",
                        extra={'log_level': 'INFO'})
            return
        except client.exceptions.Conflict:
            logger.warning(
                f"Conflict when updating status for rule '{rule}' on node '{node}'. Retrying... (Attempt {attempt + 1}/{max_retries})",
                extra={'log_level': 'WARNING'})
            time.sleep(2 ** attempt)  # Экспоненциальный бэкоф
        except Exception as e:
            logger.error(f"Failed to update FirewallRule status: {str(e)}", extra={'log_level': 'ERROR'})
            return
    logger.error(f"Exceeded maximum retries when updating status for rule '{rule}' on node '{node}'.",
                 extra={'log_level': 'ERROR'})
