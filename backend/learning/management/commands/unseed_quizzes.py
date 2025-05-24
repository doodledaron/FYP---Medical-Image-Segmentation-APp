from django.core.management.base import BaseCommand
from learning.models import Tutorial, QuizQuestion
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Removes seeded data for medical image segmentation quizzes'

    def handle(self, *args, **kwargs):
        # Delete test user
        try:
            user = User.objects.get(username='medical_student')
            user.delete()
            self.stdout.write(self.style.SUCCESS('Deleted medical student test user'))
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING('Test user "medical_student" does not exist'))

        # Delete tutorials
        tutorial_ids = [
            'segmentation-basics',
            'edge-region-segmentation',
            'advanced-segmentation',
            'medical-imaging-segmentation'
        ]
        tutorials_deleted, _ = Tutorial.objects.filter(id__in=tutorial_ids).delete()
        self.stdout.write(self.style.SUCCESS(f'Deleted {tutorials_deleted} tutorials'))

        # Delete quiz questions
        question_ids = [
            'q1-segmentation-factors',
            'q2-segmentation-approaches',
            'q3-edge-segmentation',
            'q4-region-criteria',
            'q5-thresholding',
            'q6-edge-components',
            'q7-laplacian',
            'q8-gradient-operator',
            'q9-segmentation-process',
            'q10-threshold-based',
            'q11-clustering-technique',
            'q12-histogram-segmentation',
            'q13-zero-crossing',
            'q14-edge-detectors',
            'q15-sobel-detection',
            'vq1-advantages-canny',
            'vq2-gray-level-segmentation',
            'vq3-edge-algorithm',
            'vq4-thresholding',
            'vq5-gray-level',
            'vq6-region-growing',
            'vq7-clustering-example'
        ]
        questions_deleted, _ = QuizQuestion.objects.filter(id__in=question_ids).delete()
        self.stdout.write(self.style.SUCCESS(f'Deleted {questions_deleted} quiz questions'))

        self.stdout.write(self.style.SUCCESS('Successfully unseeded medical image segmentation quizzes'))