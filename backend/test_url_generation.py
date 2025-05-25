#!/usr/bin/env python
"""
Simple test script to debug URL generation for FileFields
"""
import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medlearn.settings')
django.setup()

from segmentation.models import SegmentationTask

def test_url_generation():
    print("=== Testing FileField URL Generation ===")
    
    # Get a completed task if any exists
    tasks = SegmentationTask.objects.filter(status='completed')[:1]
    
    if not tasks:
        print("No completed tasks found. Let's create a test case.")
        # Get any task
        tasks = SegmentationTask.objects.all()[:1]
        
    if not tasks:
        print("No tasks found at all!")
        return
        
    task = tasks[0]
    print(f"Testing with task: {task.id}")
    print(f"Task status: {task.status}")
    
    # Check tumor segmentation field
    print(f"\n--- Tumor Segmentation ---")
    print(f"Field object: {task.tumor_segmentation}")
    print(f"Field type: {type(task.tumor_segmentation)}")
    print(f"Has name: {hasattr(task.tumor_segmentation, 'name')}")
    
    if hasattr(task.tumor_segmentation, 'name'):
        print(f"Name: {task.tumor_segmentation.name}")
        print(f"Name is truthy: {bool(task.tumor_segmentation.name)}")
        
        if task.tumor_segmentation.name:
            try:
                url = task.tumor_segmentation.url
                print(f"URL generated successfully: {url}")
            except Exception as e:
                print(f"Error generating URL: {e}")
                # Check if file exists
                full_path = os.path.join(settings.MEDIA_ROOT, task.tumor_segmentation.name)
                print(f"File path: {full_path}")
                print(f"File exists: {os.path.exists(full_path)}")
    
    # Check lung segmentation field
    print(f"\n--- Lung Segmentation ---")
    print(f"Field object: {task.lung_segmentation}")
    print(f"Field type: {type(task.lung_segmentation)}")
    print(f"Has name: {hasattr(task.lung_segmentation, 'name')}")
    
    if hasattr(task.lung_segmentation, 'name'):
        print(f"Name: {task.lung_segmentation.name}")
        print(f"Name is truthy: {bool(task.lung_segmentation.name)}")
        
        if task.lung_segmentation.name:
            try:
                url = task.lung_segmentation.url
                print(f"URL generated successfully: {url}")
            except Exception as e:
                print(f"Error generating URL: {e}")
                # Check if file exists
                full_path = os.path.join(settings.MEDIA_ROOT, task.lung_segmentation.name)
                print(f"File path: {full_path}")
                print(f"File exists: {os.path.exists(full_path)}")
    
    # Test manual file assignment
    print(f"\n--- Manual Assignment Test ---")
    
    # Create test paths (these don't have to exist for URL generation test)
    test_tumor_path = f"segmentations/tumor_seg_{task.id}.nii.gz"
    test_lung_path = f"segmentations/lung_seg_{task.id}.nii.gz"
    
    print(f"Testing with tumor path: {test_tumor_path}")
    print(f"Testing with lung path: {test_lung_path}")
    
    # Assign and test
    task.tumor_segmentation.name = test_tumor_path
    task.lung_segmentation.name = test_lung_path
    
    try:
        tumor_url = task.tumor_segmentation.url
        print(f"Manual tumor URL: {tumor_url}")
    except Exception as e:
        print(f"Error with manual tumor URL: {e}")
        
    try:
        lung_url = task.lung_segmentation.url
        print(f"Manual lung URL: {lung_url}")
    except Exception as e:
        print(f"Error with manual lung URL: {e}")

if __name__ == "__main__":
    test_url_generation() 