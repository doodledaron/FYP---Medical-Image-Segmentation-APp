import os
from celery import Celery
from django.conf import settings
import logging.config
from django.conf import settings

# Set the default Django settings module for celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medlearn.settings')

# Create the celery app
app = Celery('medlearn')

# Load Django logging configuration
# logging.config.dictConfig(settings.LOGGING)

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs
app.autodiscover_tasks()

# Configure Celery Beat schedule if needed
app.conf.beat_schedule = {
    'cleanup-old-tasks': {
        'task': 'segmentation.tasks.cleanup_old_tasks',
        'schedule': 60 * 60 * 24,  # Run daily
        'args': (30,),  # Delete tasks older than 30 days
    },
}

@app.task(bind=True)
def debug_task(self):
    """
    Debug task to verify Celery is working
    """
    print(f'Request: {self.request!r}')