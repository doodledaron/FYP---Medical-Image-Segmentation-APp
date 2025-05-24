from rest_framework import serializers
from .models import Tutorial, QuizQuestion, QuizResult, UserProgress
from django.contrib.auth.models import User

class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = ['id', 'question', 'type', 'options', 'points', 'correct_answer', 'explanation']


class TutorialSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, read_only=True, source='quizquestion_set')
    has_completed = serializers.SerializerMethodField()

    class Meta:
        model = Tutorial
        fields = [
            'id', 'title', 'thumbnail', 'duration', 'tutorial_type', 'topic',
            'description', 'video_url', 'transcript', 'ai_generated_notes',
            'questions', 'has_completed', 'created_at', 'updated_at'
        ]

    def get_has_completed(self, obj):
        # For testing: Get the first superuser instead of the authenticated user
        try:
            user = User.objects.filter(is_superuser=True).first()
            if not user:
                user = User.objects.first()  # Fallback to any user
            if not user:
                return False
                
            progress = user.progress
            is_completed = obj.id in progress.completed_tutorials
            print(f"Tutorial {obj.id} completed status: {is_completed} for user {user.username}")
            return is_completed
        except Exception as e:
            print(f"Error checking completion status: {str(e)}")
            return False


class TutorialDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed tutorial view"""
    questions = QuizQuestionSerializer(many=True, read_only=True)
    has_completed = serializers.SerializerMethodField()
    
    class Meta:
        model = Tutorial
        fields = [
            'id', 'title', 'thumbnail', 'duration', 
            'tutorial_type', 'topic', 'description',
            'video_url', 'ai_generated_notes', 'questions', 
            'has_completed', 'created_at', 'updated_at'
        ]
    
    def get_has_completed(self, obj):
        """Check if current user has completed this tutorial"""
        # For testing: Get the first superuser instead of the authenticated user
        try:
            user = User.objects.filter(is_superuser=True).first()
            if not user:
                user = User.objects.first()  # Fallback to any user
            if not user:
                return False
                
            progress = user.progress
            is_completed = obj.id in progress.completed_tutorials
            print(f"Tutorial {obj.id} completed status: {is_completed} for user {user.username}")
            return is_completed
        except Exception as e:
            print(f"Error checking completion status: {str(e)}")
            return False


class QuizResultSerializer(serializers.ModelSerializer):
    tutorial_title = serializers.CharField(source='tutorial.title', read_only=True)
    tutorial_topic = serializers.CharField(source='tutorial.topic', read_only=True)
    # Add user field for creation, but make it read-only in responses
    user = serializers.PrimaryKeyRelatedField(read_only=True, default=serializers.CurrentUserDefault())


    class Meta:
        model = QuizResult
        # Ensure 'user' is included for creation context
        fields = ['id', 'user', 'tutorial', 'tutorial_title', 'tutorial_topic', 'score', 'total_points', 'answers', 'completed_at']
        read_only_fields = ['id', 'tutorial_title', 'tutorial_topic', 'completed_at'] # Keep user writable on input

    # Optional: Add validation if needed
    def validate(self, data):
        # Example: Ensure score is not negative
        if data.get('score', 0) < 0:
            raise serializers.ValidationError("Score cannot be negative.")
        # Ensure tutorial exists
        if not Tutorial.objects.filter(pk=data['tutorial'].id).exists():
             raise serializers.ValidationError(f"Tutorial with id {data['tutorial'].id} not found.")
        return data


class QuizSubmissionSerializer(serializers.Serializer):
    """Serializer for submitting quiz answers"""
    tutorial_id = serializers.CharField(max_length=50)
    answers = serializers.JSONField() # e.g., {"q1": "A", "q2": ["B", "C"]}

    def validate_tutorial_id(self, value):
        """Check that the tutorial exists."""
        try:
            Tutorial.objects.get(pk=value)
        except Tutorial.DoesNotExist:
            raise serializers.ValidationError("Invalid tutorial ID.")
        return value


class QuestionResultSerializer(serializers.Serializer):
    """Serializer for individual question results"""
    question_id = serializers.CharField()
    correct = serializers.BooleanField()
    user_answer = serializers.JSONField()
    correct_answer = serializers.JSONField()
    explanation = serializers.CharField()
    
    class Meta:
        fields = ['question_id', 'correct', 'user_answer', 'correct_answer', 'explanation']


class QuizDetailResultSerializer(serializers.ModelSerializer):
    """Detailed quiz result with per-question info"""
    tutorial_title = serializers.CharField(source='tutorial.title', read_only=True)
    tutorial_topic = serializers.CharField(source='tutorial.topic', read_only=True)
    question_results = QuestionResultSerializer(many=True, read_only=True)
    
    class Meta:
        model = QuizResult
        fields = [
            'id', 'tutorial', 'tutorial_title', 'tutorial_topic',
            'score', 'total_points', 'completed_at', 'question_results'
        ]


class UserProgressSerializer(serializers.ModelSerializer):
    completed_count = serializers.SerializerMethodField()
    completed_by_topic = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProgress
        fields = [
            'completed_tutorials', 'total_points', 
            'completed_count', 'completed_by_topic', 
            'last_activity'
        ]
    
    def get_completed_count(self, obj):
        return len(obj.completed_tutorials)
    
    def get_completed_by_topic(self, obj):
        """Group completed tutorials by topic"""
        if not obj.completed_tutorials:
            return {}
            
        # Get all completed tutorials
        tutorials = Tutorial.objects.filter(id__in=obj.completed_tutorials)
        
        # Group by topic
        result = {}
        for tutorial in tutorials:
            if tutorial.topic not in result:
                result[tutorial.topic] = 0
            result[tutorial.topic] += 1
            
        return result