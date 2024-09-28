# src/ufw_manager.py
import subprocess
import logging

logger = logging.getLogger(__name__)

def apply_rule(rule: str) -> bool:
    """
    Применяет правило UFW.
    Возвращает True при успехе, False в противном случае.
    """
    cmd = ['ufw'] + rule.split()
    try:
        subprocess.run(cmd, check=True)
        logger.info(f"Applied rule: {' '.join(cmd)}", extra={'log_level': 'INFO', 'cmd': cmd})
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to apply rule: {str(e)}", extra={'log_level': 'ERROR', 'cmd': cmd})
        return False

def enable_ufw():
    """
    Включает UFW без интерактивных запросов.
    """
    cmd = ['ufw', '--force', 'enable']
    try:
        subprocess.run(cmd, check=True)
        logger.info("UFW enabled successfully.", extra={'log_level': 'INFO', 'cmd': cmd})
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to enable UFW: {str(e)}", extra={'log_level': 'ERROR', 'cmd': cmd})
