import kopf
import asyncio
import kubernetes
import subprocess
import logging
import json
import threading
import time
import os

from kubernetes import client, config

# Configure logging to output in JSON format
class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            'log_level': record.levelname,
            'message': record.getMessage(),
            'extra': getattr(record, 'extra', {})
        }
        return json.dumps(log_record)

logger = logging.getLogger()
handler = logging.StreamHandler()
formatter = JsonFormatter()
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# Load Kubernetes configuration
config.load_incluster_config()

@kopf.on.startup()
def configure(settings: kopf.OperatorSettings, **_):
    # Set timeout for the operator
    settings.watching.server_timeout = 60 * 60
    # Start the UFW log reader thread
    threading.Thread(target=ufw_log_reader, daemon=True).start()

def ufw_log_reader():
    # Check if UFW logging is enabled
    ufw_logging_enabled = check_ufw_logging()
    if not ufw_logging_enabled:
        logger.info('', extra={'message': 'UFW logging is not enabled. Log reader will not start.', 'log_level': 'INFO'})
        return

    ufw_log_file = '/var/log/ufw.log'
    if not os.path.exists(ufw_log_file):
        logger.error('', extra={'message': f'UFW log file {ufw_log_file} does not exist.', 'log_level': 'ERROR'})
        return

    logger.info('', extra={'message': f'Starting UFW log reader for {ufw_log_file}', 'log_level': 'INFO'})

    with open(ufw_log_file, 'r') as f:
        # Go to the end of the file
        f.seek(0, os.SEEK_END)
        while True:
            line = f.readline()
            if line:
                # Output the log line
                logger.info('', extra={'message': line.strip(), 'log_level': 'UFW_LOG'})
            else:
                time.sleep(1)

def check_ufw_logging():
    try:
        result = subprocess.run(['ufw', 'status', 'verbose'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if 'Logging: on' in result.stdout or 'Logging: ' in result.stdout:
            return True
    except Exception as e:
        logger.error('', extra={'message': f'Error checking UFW logging status: {str(e)}', 'log_level': 'ERROR'})
    return False

# Handler for creation and update of FirewallRule
@kopf.on.create('firewallrules', group='my.firewall')
@kopf.on.update('firewallrules', group='my.firewall')
def on_firewallrule_event(spec, name, **kwargs):
    logger.info('', extra={'message': f"Configuring firewall rules for {name}", 'log_level': 'INFO'})
    asyncio.create_task(apply_rules_periodically(spec))

# Periodic task to apply rules every 60 seconds
async def apply_rules_periodically(spec):
    while True:
        apply_rules(spec)
        await asyncio.sleep(60)

def apply_rules(spec):
    node_selector = spec.get('nodeSelector', {})
    ufw_options = spec.get('ufwOptions', {})
    rules = spec.get('rules', [])

    # Get the current node name
    with open('/etc/hostname', 'r') as f:
        node_name = f.read().strip()

    v1 = client.CoreV1Api()
    node = v1.read_node(name=node_name)
    node_labels = node.metadata.labels or {}

    # Check if the node matches the nodeSelector
    match = all(node_labels.get(k) == v for k, v in node_selector.items())

    if match:
        # Configure global UFW options
        if ufw_options:
            # Configure logging
            logging_level = ufw_options.get('logging')
            if logging_level:
                cmd = ['ufw', 'logging', logging_level]
                try:
                    subprocess.run(cmd, check=True)
                    logger.info('', extra={
                        'message': f"Set logging level: {logging_level}",
                        'log_level': 'INFO',
                        'extra': {'cmd': cmd}
                    })
                except subprocess.CalledProcessError as e:
                    logger.error('', extra={
                        'message': f"Failed to set logging level: {str(e)}",
                        'log_level': 'ERROR',
                        'extra': {'cmd': cmd}
                    })

            # Configure default policies
            default_policies = ufw_options.get('defaultPolicies', {})
            incoming_policy = default_policies.get('incoming')
            outgoing_policy = default_policies.get('outgoing')
            if incoming_policy:
                cmd = ['ufw', 'default', incoming_policy, 'incoming']
                try:
                    subprocess.run(cmd, check=True)
                    logger.info('', extra={
                        'message': f"Set default incoming policy: {incoming_policy}",
                        'log_level': 'INFO',
                        'extra': {'cmd': cmd}
                    })
                except subprocess.CalledProcessError as e:
                    logger.error('', extra={
                        'message': f"Failed to set default incoming policy: {str(e)}",
                        'log_level': 'ERROR',
                        'extra': {'cmd': cmd}
                    })
            if outgoing_policy:
                cmd = ['ufw', 'default', outgoing_policy, 'outgoing']
                try:
                    subprocess.run(cmd, check=True)
                    logger.info('', extra={
                        'message': f"Set default outgoing policy: {outgoing_policy}",
                        'log_level': 'INFO',
                        'extra': {'cmd': cmd}
                    })
                except subprocess.CalledProcessError as e:
                    logger.error('', extra={
                        'message': f"Failed to set default outgoing policy: {str(e)}",
                        'log_level': 'ERROR',
                        'extra': {'cmd': cmd}
                    })

            # Configure profiles
            profiles = ufw_options.get('profiles', [])
            for profile in profiles:
                profile_name = profile.get('name')
                action = profile.get('action')
                if profile_name and action:
                    cmd = ['ufw', action, 'from', 'any', 'app', profile_name]
                    try:
                        subprocess.run(cmd, check=True)
                        logger.info('', extra={
                            'message': f"{action.capitalize()} traffic for profile {profile_name}",
                            'log_level': 'INFO',
                            'extra': {'cmd': cmd}
                        })
                    except subprocess.CalledProcessError as e:
                        logger.error('', extra={
                            'message': f"Failed to apply profile {profile_name}: {str(e)}",
                            'log_level': 'ERROR',
                            'extra': {'cmd': cmd}
                        })

        # Apply UFW rules
        for rule in rules:
            cmd = ['ufw'] + rule.split()
            try:
                subprocess.run(cmd, check=True)
                logger.info('', extra={
                    'message': f"Applied rule: {' '.join(cmd)}",
                    'log_level': 'INFO',
                    'extra': {'cmd': cmd}
                })
            except subprocess.CalledProcessError as e:
                logger.error('', extra={
                    'message': f"Failed to apply rule: {str(e)}",
                    'log_level': 'ERROR',
                    'extra': {'cmd': cmd}
                })
    else:
        # Node does not match nodeSelector; no action needed
        pass
