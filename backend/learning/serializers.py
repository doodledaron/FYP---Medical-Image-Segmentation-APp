# from rest_framework import serializers
# from .models import Tutorial, QuizQuestion, QuizResult, UserProgress

# class QuizQuestionSerializer(serializers.ModelSerializer):
#     """Serializer for quiz questions"""
#     class Meta:
#         model = QuizQuestion
#         fields = ['id', 'question', 'type', 'options', 'points', 'explanation']
#         # Note: We intentionally exclude 'correct_answer' to prevent cheating

# class TutorialSerializer(serializers.ModelSerializer):
#     """Basic serializer for tutorials"""
#     questions_count = serializers.SerializerMethodField()
    
#     class Meta:
#         model = Tutorial
#         fields = ['id', 'title', 'thumbnail', 'duration', 'questions_count', 'created_at']
    
#     def get_questions_count(self, obj):
#         return obj.questions.count()

# class TutorialDetailSerializer(serializers.ModelSerializer):
#     """Detailed serializer for a single tutorial"""
#     questions = QuizQuestionSerializer(many=True, read_only=True)
    
#     class Meta:
#         model = Tutorial
#         fields = ['id', 'title', 'thumbnail', 'duration', 'study_notes', 'questions', 'created_at']

# class QuizResultSerializer(serializers.ModelSerializer):
#     """Serializer for quiz results"""
#     tutorial_title = serializers.ReadOnlyField(source='tutorial.title')
#     percentage = serializers.SerializerMethodField()
    
#     class Meta:
#         model = QuizResult
#         fields = ['id', 'tutorial', 'tutorial_title', 'score', 'total_points', 
#                  'percentage', 'completed_at']
#         read_only_fields = ['id', 'tutorial', 'score', 'total_points', 'completed_at']
    
#     def get_percentage(self, obj):
#         if obj.total_points > 0:
#             return round((obj.score / obj.total_points) * 100, 1)
#         return 0

# class UserProgressSerializer(serializers.ModelSerializer):
#     """Serializer for user progress"""
#     username = serializers.ReadOnlyField(source='user.username')
#     completed_tutorials_count = serializers.SerializerMethodField()
    
#     class Meta:
#         model = UserProgress
#         fields = ['id', 'username', 'completed_tutorials', 'completed_tutorials_count',
#                  'total_points', 'last_updated']
#         read_only_fields = ['id', 'username', 'completed_tutorials', 
#                            'total_points', 'last_updated']
    
#     def get_completed_tutorials_count(self, obj):
#         return len(obj.completed_tutorials)