import pytest
import tempfile
import os
import django
from django.conf import settings

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medlearn.settings')

# Configure Django for testing
pytest_plugins = ('pytest_django',)

from django.test import override_settings
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from segmentation.models import SegmentationTask
from learning.models import Tutorial, QuizQuestion, UserProgress

# Test media directory
TEST_MEDIA_ROOT = tempfile.mkdtemp()

@pytest.fixture(scope='session')
def django_db_setup():
    """Configure test database settings"""
    settings.DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
        'ATOMIC_REQUESTS': False,
        'AUTOCOMMIT': True,
        'CONN_MAX_AGE': 0,
        'OPTIONS': {},
        'TIME_ZONE': None,
    }

@pytest.fixture
def test_user():
    """Create a test user"""
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )

@pytest.fixture
def test_nifti_file():
    """Create a mock NIFTI file for testing"""
    content = b"mock nifti file content"
    return SimpleUploadedFile(
        name="test_scan.nii.gz",
        content=content,
        content_type="application/gzip"
    )

@pytest.fixture
def sample_segmentation_task(test_user, test_nifti_file):
    """Create a sample segmentation task"""
    with override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT):
        return SegmentationTask.objects.create(
            user=test_user,
            file_name="test_scan.nii.gz",
            nifti_file=test_nifti_file,
            status="queued"
        )

@pytest.fixture
def sample_tutorial():
    """Create a sample tutorial"""
    return Tutorial.objects.create(
        id="tut_001",
        title="Introduction to Image Segmentation",
        thumbnail="https://example.com/thumb.jpg",
        duration="10:30",
        tutorial_type="practice",
        topic="image_segmentation",
        description="Basic concepts of image segmentation"
    )

@pytest.fixture
def sample_quiz_question(sample_tutorial):
    """Create a sample quiz question"""
    return QuizQuestion.objects.create(
        id="q_001",
        tutorial=sample_tutorial,
        question="What is image segmentation?",
        type="multiple-choice",
        options=["Option A", "Option B", "Option C", "Option D"],
        correct_answer=["Option A"],
        explanation="Image segmentation divides an image into segments",
        points=10
    )

@pytest.fixture
def api_client():
    """Create an API client for testing"""
    from rest_framework.test import APIClient
    return APIClient()

# Cleanup after tests
@pytest.fixture(autouse=True)
def cleanup_test_files():
    """Clean up test files after each test"""
    yield
    # Clean up any test files created during testing
    import shutil
    if os.path.exists(TEST_MEDIA_ROOT):
        shutil.rmtree(TEST_MEDIA_ROOT, ignore_errors=True) 