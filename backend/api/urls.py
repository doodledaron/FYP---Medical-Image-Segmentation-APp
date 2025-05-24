from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import api_root

# API root view
urlpatterns = [
    path('', api_root, name='api-root'),
    
    # Add any API-wide endpoints here
    # For example, user authentication endpoints could go here
    path('auth/', include('rest_framework.urls')),  # Built-in DRF auth views
]