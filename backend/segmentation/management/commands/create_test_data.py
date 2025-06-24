from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from segmentation.models import SegmentationTask
from django.core.files.base import ContentFile
import uuid


class Command(BaseCommand):
    help = 'Create test segmentation data for dashboard debugging'

    def handle(self, *args, **options):
        # Create a test user if it doesn't exist
        test_user, created = User.objects.get_or_create(
            username='testuser',
            defaults={'email': 'test@example.com', 'first_name': 'Test', 'last_name': 'User'}
        )
        
        if created:
            test_user.set_password('testpass123')
            test_user.save()
            self.stdout.write(self.style.SUCCESS(f'Created test user: {test_user.username}'))
        
        # Create test segmentation tasks
        test_data = [
            {
                'file_name': 'lung_scan_001.nii.gz',
                'status': 'completed',
                'tumor_volume': 15.3,
                'lung_volume': 4200.5,
                'lesion_count': 2,
                'confidence_score': 0.92
            },
            {
                'file_name': 'lung_scan_002.nii.gz',
                'status': 'completed',
                'tumor_volume': 8.7,
                'lung_volume': 3850.2,
                'lesion_count': 1,
                'confidence_score': 0.88
            },
            {
                'file_name': 'lung_scan_003.nii.gz',
                'status': 'processing',
                'tumor_volume': None,
                'lung_volume': None,
                'lesion_count': None,
                'confidence_score': None
            },
            {
                'file_name': 'lung_scan_004.nii.gz',
                'status': 'failed',
                'error': 'File format not supported',
                'tumor_volume': None,
                'lung_volume': None,
                'lesion_count': None,
                'confidence_score': None
            },
            {
                'file_name': 'lung_scan_005.nii.gz',
                'status': 'queued',
                'tumor_volume': None,
                'lung_volume': None,
                'lesion_count': None,
                'confidence_score': None
            }
        ]
        
        created_count = 0
        for data in test_data:
            # Check if task with this filename already exists
            if not SegmentationTask.objects.filter(file_name=data['file_name']).exists():
                # Create a dummy file content
                dummy_content = ContentFile(b'dummy nifti content', name=data['file_name'])
                
                task = SegmentationTask.objects.create(
                    user=test_user,
                    file_name=data['file_name'],
                    nifti_file=dummy_content,
                    status=data['status'],
                    tumor_volume=data.get('tumor_volume'),
                    lung_volume=data.get('lung_volume'),
                    lesion_count=data.get('lesion_count'),
                    confidence_score=data.get('confidence_score'),
                    error=data.get('error')
                )
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created task: {task.file_name} ({task.status})')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Task already exists: {data["file_name"]}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\nCreated {created_count} new segmentation tasks')
        )
        
        # Display summary
        total_tasks = SegmentationTask.objects.count()
        completed_tasks = SegmentationTask.objects.filter(status='completed').count()
        
        self.stdout.write(f'\nDatabase Summary:')
        self.stdout.write(f'Total tasks: {total_tasks}')
        self.stdout.write(f'Completed tasks: {completed_tasks}')
        completion_rate = (completed_tasks/total_tasks*100) if total_tasks > 0 else 0
        self.stdout.write(f'Completion rate: {completion_rate:.1f}%') 