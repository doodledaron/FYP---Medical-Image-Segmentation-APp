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
        if not request.user or not request.user.is_authenticated:
            # Return default progress for unauthenticated users
            default_progress = {
                "completed_tutorials": [],
                "quiz_results": [],
                # Add any other default fields your serializer expects
            }
            return Response(default_progress, status=status.HTTP_200_OK)
        progress, created = UserProgress.objects.get_or_create(user=request.user)
        serializer = UserProgressSerializer(progress, context=self.get_serializer_context())
        return Response(serializer.data)


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
        user = request.user

        tutorial = get_object_or_404(Tutorial, pk=tutorial_id)
        questions = tutorial.questions.all()

        if not questions:
             return Response({"error": "This tutorial has no questions."}, status=status.HTTP_400_BAD_REQUEST)


        # --- Calculate Score ---
        score = 0
        total_points = 0
        detailed_results = {} # Optional: store detailed results if needed

        for question in questions:
            total_points += question.points
            user_answer = user_answers.get(str(question.id)) # Get user answer for this question ID
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
            with transaction.atomic(): # Use a transaction for atomicity
                # 1. Get or Create User Progress
                user_progress, _ = UserProgress.objects.get_or_create(user=user)

                # 2. Check if already completed
                already_completed = tutorial_id in user_progress.completed_tutorials

                # 3. Save the Quiz Result (always save the attempt)
                quiz_result = QuizResult.objects.create(
                    user=user,
                    tutorial=tutorial,
                    score=score,
                    total_points=total_points,
                    answers=user_answers # Store the submitted answers
                    # 'completed_at' is auto_now_add
                )

                # 4. Update Progress ONLY if it's the first completion
                if not already_completed:
                    user_progress.completed_tutorials.append(tutorial_id)
                    user_progress.total_points += score # Add score to total points
                    user_progress.save()

        except Exception as e:
             logger.error(f"Error submitting quiz for user {user.id}, tutorial {tutorial_id}: {e}")
             return Response({"error": "An error occurred while saving the quiz result."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        # --- End Database Updates ---

        # Return the saved QuizResult data
        result_serializer = QuizResultSerializer(quiz_result, context=self.get_serializer_context())
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)

# You might need to adjust or add other viewsets/views depending on your structure
# e.g., if you have separate views for UserProgress updates.