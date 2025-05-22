import os
from pathlib import Path
from dotenv import load_dotenv
from django.urls import reverse_lazy
# Load environment variables
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# NNUNet paths - updated to match the working run_inference.py
NNUNET_BASE = os.path.join(BASE_DIR, 'models', 'nnunet')
NNUNET_RAW = os.path.join(NNUNET_BASE, 'nnUNet_raw')
NNUNET_PREPROCESSED = os.path.join(NNUNET_BASE, 'nnUNet_preprocessed')
# Point directly to the nnUNet_results folder, not the base folder
NNUNET_RESULTS = os.path.join(NNUNET_BASE, 'nnUNet_results')

# Define paths for I/O
NNUNET_INPUT_DIR = os.path.join(BASE_DIR, 'models', 'input_dir')
NNUNET_OUTPUT_DIR = os.path.join(BASE_DIR, 'models', 'output_dir')
SEGMENTATION_RESULTS_PATH = os.path.join(BASE_DIR, 'media', 'segmentations')
LOG_DIR = BASE_DIR / 'logs'
os.makedirs(LOG_DIR, exist_ok=True)

# Create directories if they don't exist
os.makedirs(NNUNET_RAW, exist_ok=True)
os.makedirs(NNUNET_PREPROCESSED, exist_ok=True)
os.makedirs(NNUNET_RESULTS, exist_ok=True)
os.makedirs(NNUNET_INPUT_DIR, exist_ok=True)
os.makedirs(NNUNET_OUTPUT_DIR, exist_ok=True)
os.makedirs(SEGMENTATION_RESULTS_PATH, exist_ok=True)

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-default-dev-key-change-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
# DEBUG = os.environ.get('DEBUG', 'True') == 'True'
DEBUG = True

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Application definition
INSTALLED_APPS = [
    # Unfold admin (must be before django.contrib.admin)
    'unfold',
    'unfold.contrib.filters',  # Optional but recommended
    'unfold.contrib.forms',    # Optional but recommended
    'colorfield',              # Required for Unfold color picker
    
    # Django core apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'corsheaders',
    'django_celery_results',
    'drf_yasg',
    
    # Project apps
    'api',
    'segmentation.apps.SegmentationConfig',
    'learning',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'medlearn.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'medlearn.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB', 'medlearn'),
        'USER': os.environ.get('POSTGRES_USER', 'postgres'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'postgres'),
        'HOST': os.environ.get('POSTGRES_HOST', 'localhost'),
        'PORT': os.environ.get('POSTGRES_PORT', '5432'),
    }
}

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': LOG_DIR / 'django.log',  # Save logs to the 'logs' directory
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },

    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
        '': {  # root logger catches everything including celery
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# increase data upload limit
DATA_UPLOAD_MAX_MEMORY_SIZE = 524288000  # 500 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 524288000  # 500 MB

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        # ignore authentication first for development purpose
        # 'rest_framework.authentication.SessionAuthentication',
        # 'rest_framework.authentication.BasicAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        # allow all for development purpose
        'rest_framework.permissions.AllowAny',
        # 'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}

# CORS settings
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
]

# Celery settings
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = 'django-db'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE


# File storage paths
NIFTI_UPLOAD_PATH = BASE_DIR / 'media' / 'uploads'
SEGMENTATION_RESULTS_PATH = BASE_DIR / 'media' / 'segmentations'

# Create directories if they don't exist
os.makedirs(NIFTI_UPLOAD_PATH, exist_ok=True)
os.makedirs(SEGMENTATION_RESULTS_PATH, exist_ok=True)

# Unfold Admin Settings
UNFOLD = {
    "SITE_TITLE": "MedLearn AI",
    "SITE_HEADER": "MedLearn AI Admin",
    "SITE_SYMBOL": "medical_services",  # Material icon name
    "SHOW_VIEW_ON_SITE": False,
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": True,
        "navigation": [
            {
                "separator": False,
                "collapsible": False,
                "items": [
                    {
                        "title": "Dashboard",
                        "icon": "dashboard",
                        "link": "/admin/",
                    },
                ],
            },
            # {
            #     "title": "Learning",
            #     "separator": False,
            #     "collapsible": True,
            #     "items": [
            #         {
            #             "title": "Tutorials",
            #             "icon": "school",
            #             "link": "/admin/learning/tutorial/",
            #         },
            #         {
            #             "title": "Quiz Questions",
            #             "icon": "quiz",
            #             "link": "/admin/learning/quizquestion/",
            #         },
            #         {
            #             "title": "Quiz Results",
            #             "icon": "fact_check",
            #             "link": "/admin/learning/quizresult/",
            #         },
            #         {
            #             "title": "User Progress",
            #             "icon": "trending_up",
            #             "link": "/admin/learning/userprogress/",
            #         },
            #     ],
            # },
            {
                "title": "Segmentation",
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": "Segmentation Tasks",
                        "icon": "biotech",
                        "link": "/admin/segmentation/segmentationtask/",
                    },
                ],
            },
            {
                "title": "User Management",
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": "Users",
                        "icon": "people",
                        "link": "/admin/auth/user/",
                    },
                    {
                        "title": "Groups",
                        "icon": "group_work",
                        "link": "/admin/auth/group/",
                    },
                ],
            },
        ],
    },
    "COLORS": {
        "primary": {
            "50": "#eff6ff",
            "100": "#dbeafe",
            "200": "#bfdbfe",
            "300": "#93c5fd",
            "400": "#60a5fa",
            "500": "#3b82f6",
            "600": "#2563eb",
            "700": "#1d4ed8",
            "800": "#1e40af",
            "900": "#1e3a8a",
        },
    },
}