# src/logging_config.py
import logging
import json


class JsonFormatter(logging.Formatter):
    def format(self, record):
        extra = getattr(record, 'extra', {})
        log_record = {
            'log_level': record.levelname,
            'message': record.getMessage(),
            'extra': extra
        }
        return json.dumps(log_record)


def setup_logging():
    logger = logging.getLogger()
    # handler = logging.StreamHandler()
    # formatter = JsonFormatter()
    # handler.setFormatter(formatter)
    # logger.addHandler(handler)
    logger.setLevel(logging.INFO)

    # Настройка логгера Kopf
    logging.getLogger('kopf').handlers = []
    logging.getLogger('kopf').propagate = True
