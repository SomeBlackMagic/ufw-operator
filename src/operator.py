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
        # Extract the 'extra' field if present
        extra = getattr(record, 'extra', {})
        log_record = {
            'log_level': record.levelname,
            'message': record.getMessage(),
            'extra': extra
        }
        return json.dumps(log_record)

# Set up the root logger with the JSON formatter
logger = logging.getLogger()
# handler = logging.StreamHandler()
# formatter = JsonFormatter()
# handler.setFormatter(formatter)
# logger.addHandler(handler)
logger.setLevel(logging.INFO)

# Ensure all loggers propagate to the root logger
logging.getLogger('kopf').handlers = []
logging.getLogger('kopf').propagate = True

# Load Kubernetes configuration
config.load_incluster_config()

@kopf.on.startup()
def configure(settings: kopf.OperatorSettings, **kwargs):
    """
    Configure the operator on startup.
    """
    # Set the server timeout to 1 hour
    settings.watching.server_timeout = 60 * 60
    # Start the UFW log reader thread
    threading.Thread(target=ufw_log_reader, daemon=True).start()
    logger.info('Operator startup complete', extra={'log_level': 'INFO'})

def ufw_log_reader():
    """
    Continuously read the UFW log file and output logs to stdout in JSON format.
    """
    # Check if UFW logging is enabled
    ufw_logging_enabled = check_ufw_logging()
    if not ufw_logging_enabled:
        logger.info('UFW logging is not enabled. Log reader will not start.', extra={'log_level': 'INFO'})
        return

    ufw_log_file = '/var/log/ufw.log'
    if not os.path.exists(ufw_log_file):
        logger.error(f'UFW log file {ufw_log_file} does not exist.', extra={'log_level': 'ERROR'})
        return

    logger.info(f'Starting UFW log reader for {ufw_log_file}', extra={'log_level': 'INFO'})

    try:
        with open(ufw_log_file, 'r') as f:
            # Move to the end of the file
            f.seek(0, os.SEEK_END)
            while True:
                line = f.readline()
                if line:
                    # Output the log line with a custom log_level
                    logger.info(line.strip(), extra={'log_level': 'UFW_LOG'})
                else:
                    time.sleep(1)
    except Exception as e:
        logger.error(f'Error reading UFW log file: {str(e)}', extra={'log_level': 'ERROR'})

def check_ufw_logging():
    """
    Check if UFW logging is enabled.
    """
    try:
        result = subprocess.run(['ufw', 'status', 'verbose'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if 'Logging: on' in result.stdout or 'Logging:' in result.stdout:
            return True
    except Exception as e:
        logger.error(f'Error checking UFW logging status: {str(e)}', extra={'log_level': 'ERROR'})
    return False

# Handler for creation and update of FirewallRule
@kopf.on.create('firewallrules', group='my.firewall', clusterwide=True)
@kopf.on.update('firewallrules', group='my.firewall', clusterwide=True)
def on_firewallrule_event(spec, name, namespace, **kwargs):
    """
    Handle creation and update events for FirewallRule resources.
    """
    logger.info(f"Configuring firewall rules for {name}", extra={'log_level': 'INFO'})
    asyncio.create_task(apply_rules_periodically(spec))

async def apply_rules_periodically(spec):
    """
    Periodically apply firewall rules every 60 seconds.
    """
    while True:
        apply_rules(spec)
        await asyncio.sleep(60)

def apply_rules(spec):
    """
    Apply UFW configuration based on the FirewallRule specification.
    """
    node_selector = spec.get('nodeSelector', {})
    ufw_options = spec.get('ufwOptions', {})
    rules = spec.get('rules', [])

    # Get the current node name
    try:
        with open('/etc/hostname', 'r') as f:
            node_name = f.read().strip()
    except Exception as e:
        logger.error(f'Error reading hostname: {str(e)}', extra={'log_level': 'ERROR'})
        return

    v1 = client.CoreV1Api()
    try:
        node = v1.read_node(name=node_name)
    except Exception as e:
        logger.error(f'Error reading node {node_name}: {str(e)}', extra={'log_level': 'ERROR'})
        return

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
                    logger.info(f"Set logging level: {logging_level}", extra={'log_level': 'INFO', 'cmd': cmd})
                except subprocess.CalledProcessError as e:
                    logger.error(f"Failed to set logging level: {str(e)}", extra={'log_level': 'ERROR', 'cmd': cmd})

            # Configure default policies
            default_policies = ufw_options.get('defaultPolicies', {})
            incoming_policy = default_policies.get('incoming')
            outgoing_policy = default_policies.get('outgoing')
            if incoming_policy:
                cmd = ['ufw', 'default', incoming_policy, 'incoming']
                try:
                    subprocess.run(cmd, check=True)
                    logger.info(f"Set default incoming policy: {incoming_policy}", extra={'log_level': 'INFO', 'cmd': cmd})
                except subprocess.CalledProcessError as e:
                    logger.error(f"Failed to set default incoming policy: {str(e)}", extra={'log_level': 'ERROR', 'cmd': cmd})
            if outgoing_policy:
                cmd = ['ufw', 'default', outgoing_policy, 'outgoing']
                try:
                    subprocess.run(cmd, check=True)
                    logger.info(f"Set default outgoing policy: {outgoing_policy}", extra={'log_level': 'INFO', 'cmd': cmd})
                except subprocess.CalledProcessError as e:
                    logger.error(f"Failed to set default outgoing policy: {str(e)}", extra={'log_level': 'ERROR', 'cmd': cmd})

            # Configure profiles
            profiles = ufw_options.get('profiles', [])
            for profile in profiles:
                profile_name = profile.get('name')
                action = profile.get('action')
                if profile_name and action:
                    cmd = ['ufw', action, 'from', 'any', 'app', profile_name]
                    try:
                        subprocess.run(cmd, check=True)
                        logger.info(f"{action.capitalize()} traffic for profile {profile_name}", extra={'log_level': 'INFO', 'cmd': cmd})
                    except subprocess.CalledProcessError as e:
                        logger.error(f"Failed to apply profile {profile_name}: {str(e)}", extra={'log_level': 'ERROR', 'cmd': cmd})

        # Apply UFW rules
        for rule in rules:
            cmd = ['ufw'] + rule.split()
            try:
                subprocess.run(cmd, check=True)
                logger.info(f"Applied rule: {' '.join(cmd)}", extra={'log_level': 'INFO', 'cmd': cmd})
            except subprocess.CalledProcessError as e:
                logger.error(f"Failed to apply rule: {str(e)}", extra={'log_level': 'ERROR', 'cmd': cmd})
    else:
        # Node does not match nodeSelector; no action needed
        logger.debug(f"Node {node_name} does not match selector {node_selector}", extra={'log_level': 'DEBUG'})

