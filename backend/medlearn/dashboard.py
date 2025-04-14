from datetime import timedelta
from django.db.models import Count, Sum, Avg, F
from django.db.models.functions import TruncDay
from django.utils import timezone
from django.contrib.auth.models import User
from segmentation.models import SegmentationTask
# from learning.models import QuizResult

def dashboard(request, context=None):
    """Create a custom dashboard for the Unfold admin"""
    
    # Date ranges
    today = timezone.now().date()
    last_7_days = today - timedelta(days=7)
    last_30_days = today - timedelta(days=30)
    
    # User stats
    total_users = User.objects.count()
    new_users_7d = User.objects.filter(date_joined__gte=last_7_days).count()
    
    # Segmentation stats
    total_tasks = SegmentationTask.objects.count()
    recent_tasks = SegmentationTask.objects.filter(created_at__date__gte=last_7_days).count()
    
    tasks_by_status = list(SegmentationTask.objects.values('status')
                           .annotate(count=Count('id'))
                           .order_by('status'))
    
    # Learning stats
    # total_quiz_submissions = QuizResult.objects.count()
    # avg_score = QuizResult.objects.aggregate(
    #     avg=Avg(F('score') * 100.0 / F('total_points'))
    # )['avg'] or 0
    
    # Tasks over time
    tasks_over_time = list(SegmentationTask.objects
                         .filter(created_at__date__gte=last_30_days)
                         .annotate(day=TruncDay('created_at'))
                         .values('day')
                         .annotate(count=Count('id'))
                         .order_by('day'))
    
    # Latest segmentation tasks
    latest_tasks = list(SegmentationTask.objects
                       .select_related('user')
                       .order_by('-created_at')[:5]
                       .values('id', 'file_name', 'status', 'created_at', 'user__username'))
    
    # Top users by completed segmentations
    top_users = list(SegmentationTask.objects
                    .filter(status='completed')
                    .values('user__username')
                    .annotate(count=Count('id'))
                    .order_by('-count')[:5])
    
    return {
        # Dashboard layout definition
        'layout': [
            # Header widgets (full width)
            {
                'width': 'full',
                'type': 'header',
                'title': 'MedLearn AI Dashboard',
                'subtitle': f'Overview of platform activity - Updated: {timezone.now().strftime("%Y-%m-%d %H:%M")}',
            },
            
            # First row - stats cards
            {
                'width': '1/3',
                'type': 'card',
                'title': 'Total Users',
                'value': total_users,
                'subtitle': f'+{new_users_7d} this week',
                'icon': 'people',
                'color': 'bg-blue-50 text-blue-700',
            },
            {
                'width': '1/3',
                'type': 'card',
                'title': 'Segmentation Tasks',
                'value': total_tasks,
                'subtitle': f'{recent_tasks} in last week',
                'icon': 'biotech',
                'color': 'bg-purple-50 text-purple-700',
            },
            {
                'width': '1/3',
                'type': 'card',
                'title': 'Processing Speed',
                'value': 'Real-time',
                'subtitle': 'Powered by nnUNet',
                'icon': 'speed',
                'color': 'bg-green-50 text-green-700',
            },
            
            # Second row - charts and tables
            {
                'width': '1/2',
                'type': 'chart',
                'title': 'Segmentation Tasks by Status',
                'chart_type': 'pie',
                'data': {
                    'labels': [item['status'].capitalize() for item in tasks_by_status],
                    'datasets': [
                        {
                            'data': [item['count'] for item in tasks_by_status],
                            'backgroundColor': [
                                'rgba(209, 213, 219, 0.8)',  # gray for queued
                                'rgba(96, 165, 250, 0.8)',   # blue for processing
                                'rgba(52, 211, 153, 0.8)',   # green for completed
                                'rgba(248, 113, 113, 0.8)',  # red for failed
                            ],
                        }
                    ]
                },
            },
            {
                'width': '1/2',
                'type': 'chart',
                'title': 'Segmentation Tasks (Last 30 days)',
                'chart_type': 'line',
                'data': {
                    'labels': [item['day'].strftime('%b %d') for item in tasks_over_time],
                    'datasets': [
                        {
                            'label': 'Tasks',
                            'data': [item['count'] for item in tasks_over_time],
                            'borderColor': 'rgba(79, 70, 229, 1)',
                            'backgroundColor': 'rgba(79, 70, 229, 0.1)',
                            'fill': True,
                        }
                    ]
                },
            },
            
            # Third row - tables
            {
                'width': '1/2',
                'type': 'table',
                'title': 'Latest Segmentation Tasks',
                'columns': [
                    {'field': 'file_name', 'label': 'File'},
                    {'field': 'status', 'label': 'Status'},
                    {'field': 'user__username', 'label': 'User'},
                    {'field': 'created_at', 'label': 'Date'},
                ],
                'data': latest_tasks,
            },
            {
                'width': '1/2',
                'type': 'table',
                'title': 'Top Users',
                'columns': [
                    {'field': 'user__username', 'label': 'Username'},
                    {'field': 'count', 'label': 'Completed Tasks'},
                ],
                'data': top_users,
            },
        ]
    }