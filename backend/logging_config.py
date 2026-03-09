import logging
import os
from logging.handlers import RotatingFileHandler


def setup_logging():
    level = os.getenv('LOG_LEVEL', 'INFO').upper()
    log_dir = os.path.join(os.path.dirname(__file__), 'logs')
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, 'app.log')

    handlers = [logging.StreamHandler()]
    # file handler with rotation
    fh = RotatingFileHandler(log_file, maxBytes=5 * 1024 * 1024, backupCount=3)
    handlers.append(fh)

    logging.basicConfig(
        level=getattr(logging, level, logging.INFO),
        format='%(asctime)s %(levelname)s %(name)s: %(message)s',
        handlers=handlers
    )

    # reduce noisy loggers
    logging.getLogger('werkzeug').setLevel(logging.WARNING)
    logging.getLogger('urllib3').setLevel(logging.WARNING)
