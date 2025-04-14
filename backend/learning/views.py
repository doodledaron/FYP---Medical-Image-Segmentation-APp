# from rest_framework import viewsets, status, views
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated
# from django.shortcuts import get_object_or_404
# from django.utils import timezone
# from .models import Tutorial, QuizQuestion, QuizResult, UserProgress
# from .serializers import (
#     TutorialSerializer, TutorialDetailSerializer, 
#     QuizResultSerializer, UserProgressSerializer
# )

# class TutorialViewSet(viewsets.ReadOnlyModelViewSet):
#     """
#     API endpoint for viewing tutorials
#     """
#     queryset = Tutorial.objects.all()
#     serializer_class = TutorialSerializer
    
#     def get_serializer_class(self):
#         if self.action == 'retrieve':
#             return TutorialDetailSerializer
#         return TutorialSerializer
    
#     @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
#     def submit_quiz(self, request, pk=None):
#         """
#         Submit answers for a tutorial quiz
#         """
#         tutorial = self.get_object()
#         answers = request.data.get('answers', {})
        
#         if not answers:
#             return Response(
#                 {"error": "No answers provided"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         # Get all quiz questions for this tutorial
#         questions = tutorial.questions.all()
        
#         # Calculate score
#         score = 0
#         total_points = 0
        
#         for question in questions:
#             total_points += question.points
            
#             # Skip if no answer provided for this question
#             if question.id not in answers:
#                 continue
                
#             user_answer = answers[question.id]
            
#             # Check if answer is correct
#             if isinstance(question.correct_answer, list) and isinstance(user_answer, list):
#                 # Multiple select question
#                 is_correct = (
#                     len(question.correct_answer) == len(user_answer) and
#                     all(a in user_answer for a in question.correct_answer)
#                 )
#             else:
#                 # Multiple choice or free text question
#                 is_correct = str(user_answer).lower() == str(question.correct_answer).lower()
                
#             if is_correct:
#                 score += question.points
        
#         # Create quiz result
#         quiz_result = QuizResult.objects.create(
#             user=request.user,
#             tutorial=tutorial,
#             score=score,
#             total_points=total_points,
#             answers=answers
#         )
        
#         # Update user progress
#         user_progress, created = UserProgress.objects.get_or_create(
#             user=request.user,
#             defaults={'completed_tutorials': [], 'total_points': 0}
#         )
        
#         # Add tutorial to completed list if not already there
#         if tutorial.id not in user_progress.completed_tutorials:
#             user_progress.completed_tutorials.append(tutorial.id)
            
#         # Update total points
#         user_progress.total_points += score
#         user_progress.save()
        
#         # Return the result
#         serializer = QuizResultSerializer(quiz_result)
#         return Response(serializer.data, status=status.HTTP_201_CREATED)


# class QuizResultViewSet(viewsets.ReadOnlyModelViewSet):
#     """
#     API endpoint for viewing quiz results
#     """
#     serializer_class = QuizResultSerializer
#     permission_classes = [IsAuthenticated]
    
#     def get_queryset(self):
#         """
#         This view returns quiz results for the current user
#         """
#         return QuizResult.objects.filter(user=self.request.user).order_by('-completed_at')


# class UserProgressView(views.APIView):
#     """
#     API endpoint for viewing and updating user progress
#     """
#     permission_classes = [IsAuthenticated]
    
#     def get(self, request, format=None):
#         """
#         Get the current user's progress
#         """
#         user_progress, created = UserProgress.objects.get_or_create(
#             user=request.user,
#             defaults={'completed_tutorials': [], 'total_points': 0}
#         )
#         serializer = UserProgressSerializer(user_progress)
#         return Response(serializer.data)
    
#     def post(self, request, tutorial_id=None, format=None):
#         """
#         Submit a quiz for a tutorial and update progress
#         """
#         # This endpoint is handled by the submit_quiz action in TutorialViewSet
#         # But we include it here for API discoverability
#         tutorial = get_object_or_404(Tutorial, id=tutorial_id)
        
#         # Forward to the tutorial's submit_quiz action
#         from rest_framework.reverse import reverse
#         from django.http import HttpResponseRedirect
        
#         url = reverse('tutorial-submit-quiz', args=[tutorial_id])
#         return HttpResponseRedirect(url)