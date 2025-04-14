# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from .views import TutorialViewSet, QuizResultViewSet, UserProgressView

# # Create a router and register our viewsets
# router = DefaultRouter()
# router.register(r'tutorials', TutorialViewSet, basename='tutorial')
# router.register(r'quiz-results', QuizResultViewSet, basename='quiz-result')

# # The API URLs are determined automatically by the router
# urlpatterns = [
#     path('', include(router.urls)),
    
#     # Custom endpoints not handled by the router
#     path('progress/', UserProgressView.as_view(), name='user-progress'),
#     path('tutorials/<str:tutorial_id>/submit-quiz/', UserProgressView.as_view(), name='submit-quiz'),
# ]