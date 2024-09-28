# src/ufw_log_reader.py
import time
import os
import logging
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import subprocess

logger = logging.getLogger(__name__)

class UFWLogHandler(FileSystemEventHandler):
    def __init__(self, log_file):
        self.log_file = log_file
        self.file = open(log_file, 'r')
        self.file.seek(0, os.SEEK_END)

    def on_moved(self, event):
        if event.src_path == self.log_file:
            self.file.close()
            self.file = open(self.log_file, 'r')
            logger.info(f"Log file {self.log_file} moved to {event.dest_path}. Reopening.", extra={'log_level': 'INFO'})

    def on_created(self, event):
        if event.src_path == self.log_file:
            self.file.close()
            self.file = open(self.log_file, 'r')
            logger.info(f"Log file {self.log_file} created. Reopening.", extra={'log_level': 'INFO'})

    def read_lines(self):
        while True:
            line = self.file.readline()
            if line:
                logger.info(line.strip(), extra={'log_level': 'UFW_LOG'})
            else:
                time.sleep(1)

def check_ufw_logging():
    """
    Проверяет, включено ли логирование UFW.
    """
    try:
        result = subprocess.run(['ufw', 'status', 'verbose'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if 'Logging: on' in result.stdout or 'Logging:' in result.stdout:
            return True
    except Exception as e:
        logger.error(f'Error checking UFW logging status: {str(e)}', extra={'log_level': 'ERROR'})
    return False

def ufw_log_reader():
    """
    Непрерывно читает файл логов UFW и выводит логи в stdout в формате JSON.
    Обрабатывает ротацию логов.
    """
    # Проверка включения логирования UFW
    ufw_logging_enabled = check_ufw_logging()
    if not ufw_logging_enabled:
        logger.info('UFW logging is not enabled. Log reader will not start.', extra={'log_level': 'INFO'})
        return

    ufw_log_file = '/var/log/ufw.log'
    if not os.path.exists(ufw_log_file):
        logger.error(f'UFW log file {ufw_log_file} does not exist.', extra={'log_level': 'ERROR'})
        return

    logger.info(f'Starting UFW log reader for {ufw_log_file}', extra={'log_level': 'INFO'})

    event_handler = UFWLogHandler(ufw_log_file)
    observer = Observer()
    log_dir = os.path.dirname(ufw_log_file)
    observer.schedule(event_handler, path=log_dir, recursive=False)
    observer.start()

    try:
        event_handler.read_lines()
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
