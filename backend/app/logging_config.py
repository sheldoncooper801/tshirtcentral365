import logging
import sys


def setup_logging(level: str = "INFO"):
    log_level = getattr(logging, level.upper(), logging.INFO)

    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.setLevel(log_level)
    root.handlers = [handler]

    for name in ["uvicorn", "uvicorn.error", "uvicorn.access"]:
        logging.getLogger(name).setLevel(log_level)

    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.WARNING
    )

    logger = logging.getLogger("tsc365")
    logger.setLevel(log_level)
    logger.info(f"Logging initialized at {level} level")
    return logger
