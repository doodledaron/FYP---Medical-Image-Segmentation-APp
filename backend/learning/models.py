from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField

class Tutorial(models.Model):
    """Tutorial model for learning content"""
    TUTORIAL_TYPES = [
        ('practice', 'Practice Quiz'),
        ('video', 'Video Tutorial'),
    ]
    
    # In Tutorial model
    TOPIC_CHOICES = [
        ('image_segmentation', 'Image Segmentation'),
        ('edge_detection', 'Edge Detection'),
        ('clustering', 'Clustering Methods'),
        ('thresholding', 'Thresholding Techniques'),
        ('region_growing', 'Region Growing'),
        ('tnm', 'TNM Staging'),  # ✅ ADD THIS
        ('general', 'General Topics'),
    ]

    
    id = models.CharField(max_length=50, primary_key=True)
    title = models.CharField(max_length=200)
    thumbnail = models.URLField(max_length=500)
    duration = models.CharField(max_length=10)  # Format: "MM:SS"
    tutorial_type = models.CharField(max_length=20, choices=TUTORIAL_TYPES, default='practice')
    topic = models.CharField(max_length=30, choices=TOPIC_CHOICES, default='general')
    description = models.TextField(blank=True, null=True)
    video_url = models.URLField(max_length=500, blank=True, null=True)  # Only for video tutorials
    transcript = models.TextField(blank=True, null=True)  # Store video transcript
    ai_generated_notes = ArrayField(models.TextField(), blank=True, null=True)  # AI-generated notes from transcript
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['topic', 'id']
        verbose_name = 'Tutorial'
        verbose_name_plural = 'Tutorials'


class QuizQuestion(models.Model):
    """Quiz question model"""
    # In QuizQuestion model
    TYPE_CHOICES = [
        ('multiple-choice', 'Multiple Choice'),
        ('multiple-select', 'Multiple Select'),
        ('true-false', 'True or False'),  # ✅ OPTIONAL: add if needed
    ]

    
    id = models.CharField(max_length=50, primary_key=True)
    tutorial = models.ForeignKey(Tutorial, on_delete=models.CASCADE, related_name='questions')
    question = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    options = ArrayField(models.CharField(max_length=500), blank=True, null=True)
    correct_answer = models.JSONField()  # Can be string or list of strings
    explanation = models.TextField(blank=True, null=True)
    points = models.IntegerField(default=10)
    
    def __str__(self):
        return f"{self.tutorial.id} - {self.question[:50]}"
    
    class Meta:
        ordering = ['tutorial', 'id']
        verbose_name = 'Quiz Question'
        verbose_name_plural = 'Quiz Questions'


class QuizResult(models.Model):
    """Quiz result model for tracking user quiz completions"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_results')
    tutorial = models.ForeignKey(Tutorial, on_delete=models.CASCADE)
    score = models.IntegerField()
    total_points = models.IntegerField()
    answers = models.JSONField()  # Store answers as JSON
    completed_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.tutorial.title} - {self.score}/{self.total_points}"
    
    class Meta:
        ordering = ['-completed_at']
        verbose_name = 'Quiz Result'
        verbose_name_plural = 'Quiz Results'


class UserProgress(models.Model):
    """User progress model for tracking learning progress"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='progress')
    completed_tutorials = ArrayField(models.CharField(max_length=50), default=list, blank=True)
    total_points = models.IntegerField(default=0)
    last_activity = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s Progress"
    
    class Meta:
        verbose_name = 'User Progress'
        verbose_name_plural = 'User Progress'