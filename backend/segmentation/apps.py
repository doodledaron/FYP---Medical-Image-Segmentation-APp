from django.apps import AppConfig
import logging.config
from django.conf import settings


class SegmentationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "segmentation"
    def ready(self):
        logging.config.dictConfig(settings.LOGGING)