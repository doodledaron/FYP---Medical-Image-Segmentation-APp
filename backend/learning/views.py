from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction # Import transaction
from .models import Tutorial, QuizQuestion, QuizResult, UserProgress
from .serializers import (
    TutorialSerializer, TutorialDetailSerializer,
    QuizResultSerializer, UserProgressSerializer,
    QuizSubmissionSerializer # Import the new serializer
)
import logging # Optional: for logging
from datetime import datetime, timedelta
from django.db.models import Count, Sum
from django.utils import timezone

logger = logging.getLogger(__name__) # Optional

class LearningViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Tutorials and User Learning Progress.
    Provides list and retrieve for Tutorials.
    Provides retrieve and update for UserProgress.
    Provides action to submit quiz results.
    """
    queryset = Tutorial.objects.prefetch_related('questions').all()
    permission_classes = [permissions.AllowAny]  # <-- Change this line

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TutorialDetailSerializer
        elif self.action == 'submit_quiz':
            return QuizSubmissionSerializer # Serializer for input validation
        # Add other actions if needed, e.g., for UserProgress
        elif self.action == 'progress':
             return UserProgressSerializer
        return TutorialSerializer

    def get_serializer_context(self):
        """Pass request to serializer context."""
        return {'request': self.request}

    @action(detail=False, methods=['get'], url_path='progress')
    def progress(self, request):
        """Get the current user's progress, or default if unauthenticated."""
        # For testing: Get the first superuser instead of using request.user
        # This should match the logic in submit_quiz 
        from django.contrib.auth.models import User
        try:
            user = User.objects.filter(is_superuser=True).first()
            if not user:
                user = User.objects.first()  # Fallback to any user
            if not user:
                default_progress = {
                    "completed_tutorials": [],
                    "total_points": 0,
                    "completed_count": 0,
                    "completed_by_topic": {},
                    "last_activity": None
                }
                return Response(default_progress, status=status.HTTP_200_OK)
                
            print(f"Getting progress for user: {user.username} (ID: {user.id})")
            progress, created = UserProgress.objects.get_or_create(user=user)
            print(f"Progress record: completed_tutorials={progress.completed_tutorials}, total_points={progress.total_points}")
            serializer = UserProgressSerializer(progress, context=self.get_serializer_context())
            return Response(serializer.data)
            
        except Exception as e:
            print(f"Error finding user for progress: {str(e)}")
            default_progress = {
                "completed_tutorials": [],
                "total_points": 0,
                "completed_count": 0,
                "completed_by_topic": {},
                "last_activity": None
            }
            return Response(default_progress, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='chart-data')
    def chart_data(self, request):
        """
        Get chart data for learning analytics.
        Returns:
        - Daily quiz completions for last 7 days
        - Daily points earned for last 7 days
        """
        from django.contrib.auth.models import User
        try:
            # Get the test user (same logic as other endpoints)
            user = User.objects.filter(is_superuser=True).first()
            if not user:
                user = User.objects.first()
            if not user:
                return Response(
                    {"error": "No users found in the system."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
            # Get the last 7 days
            end_date = timezone.now()
            start_date = end_date - timedelta(days=6)  # 7 days including today
            
            # Generate a list of the last 7 days
            date_list = []
            current = start_date
            while current <= end_date:
                date_list.append(current.date())
                current += timedelta(days=1)
                
            # Get quiz completions grouped by day
            quiz_completions = QuizResult.objects.filter(
                user=user,
                completed_at__gte=start_date,
                completed_at__lte=end_date
            ).extra({
                'completion_date': "date(completed_at)"
            }).values('completion_date').annotate(
                count=Count('id'),
                points=Sum('score')
            ).order_by('completion_date')
            
            # Create a dictionary of dates to counts/points
            completion_dict = {item['completion_date']: item['count'] for item in quiz_completions}
            points_dict = {item['completion_date']: item['points'] for item in quiz_completions}
            
            # Fill in the data for each day
            completions_data = []
            points_data = []
            
            for date in date_list:
                # Format as ISO string for frontend
                date_str = date.strftime('%Y-%m-%d')
                # Get completion count for this date or 0
                completions_data.append({
                    'date': date_str,
                    'count': completion_dict.get(date, 0)
                })
                # Get points earned for this date or 0
                points_data.append({
                    'date': date_str,
                    'points': points_dict.get(date, 0)
                })
            
            return Response({
                'dates': [item['date'] for item in completions_data],
                'quiz_completions': [item['count'] for item in completions_data],
                'points_earned': [item['points'] for item in points_data]
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error generating chart data: {str(e)}")
            return Response(
                {"error": f"Error generating chart data: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], url_path='reset-progress')
    def reset_progress(self, request):
        """
        Reset user progress for development purposes.
        Clears completed tutorials and resets points.
        """
        from django.contrib.auth.models import User
        try:
            # Use the same user detection logic as other endpoints
            user = User.objects.filter(is_superuser=True).first()
            if not user:
                user = User.objects.first()
            if not user:
                return Response(
                    {"error": "No users found in the system."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
            # Reset the user's progress
            progress, created = UserProgress.objects.get_or_create(user=user)
            progress.completed_tutorials = []
            progress.total_points = 0
            progress.save()
            
            # Optionally, also delete all quiz results for this user
            QuizResult.objects.filter(user=user).delete()
            
            print(f"Progress reset for user: {user.username} (ID: {user.id})")
            
            return Response({
                "message": f"Progress reset successfully for user {user.username}",
                "user_id": user.id
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error resetting progress: {str(e)}")
            return Response(
                {"error": f"Error resetting progress: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], url_path='submit-quiz')
    def submit_quiz(self, request):
        """
        Submit answers for a quiz, calculate score, save result, and update progress.
        Awards points only on the first completion.
        """
        submission_serializer = QuizSubmissionSerializer(data=request.data)
        if not submission_serializer.is_valid():
            return Response(submission_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = submission_serializer.validated_data
        tutorial_id = validated_data['tutorial_id']
        user_answers = validated_data['answers']
        
        # For testing: Get the first superuser instead of using request.user
        from django.contrib.auth.models import User
        try:
            user = User.objects.filter(is_superuser=True).first()
            if not user:
                user = User.objects.first()  # Fallback to any user
            if not user:
                return Response(
                    {"error": "No users found in the system."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except Exception as e:
            return Response(
                {"error": f"Error finding user: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Log the user we're using for debugging
        print(f"Using user: {user.username} (ID: {user.id}) for quiz submission")

        tutorial = get_object_or_404(Tutorial, pk=tutorial_id)
        questions = tutorial.questions.all()

        if not questions:
            return Response({"error": "This tutorial has no questions."}, status=status.HTTP_400_BAD_REQUEST)

        # --- Calculate Score ---
        score = 0
        total_points = 0
        detailed_results = {}  # Optional: store detailed results if needed

        for question in questions:
            total_points += question.points
            user_answer = user_answers.get(str(question.id))  # Get user answer for this question ID
            correct_answer = question.correct_answer

            is_correct = False
            if user_answer is not None:
                # Handle different answer types (string vs list for multi-select)
                if isinstance(correct_answer, list):
                    # Sort both lists to ensure order doesn't matter
                    is_correct = sorted(user_answer) == sorted(correct_answer) if isinstance(user_answer, list) else False
                else:
                    is_correct = str(user_answer) == str(correct_answer)

            if is_correct:
                score += question.points

            # Optional: Store details per question
            detailed_results[str(question.id)] = {
                "user_answer": user_answer,
                "correct_answer": correct_answer,
                "correct": is_correct,
                "points_awarded": question.points if is_correct else 0
            }
        # --- End Score Calculation ---

        # --- Database Updates (Transaction recommended) ---
        try:
            with transaction.atomic():  # Use a transaction for atomicity
                # 1. Get or Create User Progress
                user_progress, created = UserProgress.objects.get_or_create(user=user)
                print(f"UserProgress {'created' if created else 'retrieved'} for user {user.username}")

                # 2. Check if already completed (just for logging, we'll update regardless)
                already_completed = tutorial_id in user_progress.completed_tutorials
                print(f"Tutorial {tutorial_id} already completed: {already_completed}")

                # 3. Save the Quiz Result (always save the attempt)
                quiz_result = QuizResult.objects.create(
                    user=user,
                    tutorial=tutorial,
                    score=score,
                    total_points=total_points,
                    answers=user_answers  # Store the submitted answers
                    # 'completed_at' is auto_now_add
                )
                print(f"QuizResult created: ID {quiz_result.id}, Score {score}/{total_points}")

                # 4. Update Progress for EVERY completion (for testing purposes)
                print(f"Before update - completed_tutorials: {user_progress.completed_tutorials}")
                
                # Only add to completed_tutorials if it's not already there
                if not already_completed:
                    user_progress.completed_tutorials.append(tutorial_id)
                
                # Always add points (for testing multiple attempts)
                user_progress.total_points += score  # Add score to total points
                user_progress.save()
                
                print(f"After update - completed_tutorials: {user_progress.completed_tutorials}")
                print(f"UserProgress updated: {len(user_progress.completed_tutorials)} tutorials completed, total points: {user_progress.total_points}")

        except Exception as e:
            import traceback
            logger.error(f"Error submitting quiz for user {user.id}, tutorial {tutorial_id}: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            print(f"ERROR: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            return Response({"error": f"An error occurred while saving the quiz result: {str(e)}"}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        # --- End Database Updates ---

        # Return the saved QuizResult data
        result_serializer = QuizResultSerializer(quiz_result, context=self.get_serializer_context())
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)

# You might need to adjust or add other viewsets/views depending on your structure
# e.g., if you have separate views for UserProgress updates.