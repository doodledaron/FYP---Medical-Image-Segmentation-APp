from django.contrib import admin
from .models import Tutorial, QuizQuestion, QuizResult, UserProgress
from django import forms
from django.db import models
# from unfold.admin import ModelAdmin, TabularInline
# from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm
import json

class QuizQuestionInline(admin.TabularInline):
    model = QuizQuestion
    extra = 1
    fields = ('id', 'question', 'type', 'options', 'correct_answer', 'explanation', 'points')
    
    # Custom form to handle JSON field input
    formfield_overrides = {
        # Display JSON fields as textarea
        models.JSONField: {'widget': forms.Textarea(attrs={'rows': 3, 'cols': 40})},
    }


@admin.register(Tutorial)
class TutorialAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'duration', 'tutorial_type', 'topic', 'created_at')
    search_fields = ('id', 'title')
    list_filter = ('tutorial_type', 'topic', 'created_at')
    inlines = [QuizQuestionInline]
    
    fieldsets = (
        (None, {
            'fields': ('id', 'title', 'thumbnail', 'duration', 'tutorial_type', 'topic')
        }),
        ('Content', {
            'fields': ('description', 'video_url', 'transcript', 'ai_generated_notes'),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
 


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'tutorial', 'question_preview', 'type', 'points')
    list_filter = ('tutorial', 'type')
    search_fields = ('id', 'question', 'tutorial__title')
    
    formfield_overrides = {
        # Display JSON fields as textarea
        models.JSONField: {'widget': forms.Textarea(attrs={'rows': 3, 'cols': 40})},
    }
    
    fieldsets = (
        (None, {
            'fields': ('id', 'tutorial', 'question', 'type', 'points')
        }),
        ('Answer Options', {
            'fields': ('options', 'correct_answer', 'explanation'),
        }),
    )
    
    def question_preview(self, obj):
        return obj.question[:50] + '...' if len(obj.question) > 50 else obj.question
    question_preview.short_description = 'Question'


@admin.register(QuizResult)
class QuizResultAdmin(admin.ModelAdmin):
    list_display = ('user', 'tutorial', 'score', 'total_points', 'percentage', 'completed_at')
    list_filter = ('tutorial', 'completed_at', 'user')
    search_fields = ('user__username', 'tutorial__title')
    readonly_fields = ('user', 'tutorial', 'score', 'total_points', 'answers', 'completed_at')
    
    fieldsets = (
        (None, {
            'fields': ('user', 'tutorial', 'score', 'total_points', 'completed_at')
        }),
        ('Detailed Answers', {
            'fields': ('answers',),
            'classes': ('collapse',),
        }),
    )
    
    def percentage(self, obj):
        if obj.total_points > 0:
            return f"{(obj.score / obj.total_points) * 100:.1f}%"
        return "0%"
    percentage.short_description = 'Score %'
    
    def has_add_permission(self, request):
        return False


@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'total_points', 'completed_tutorials_count', 'last_activity')
    search_fields = ('user__username',)
    readonly_fields = ('last_activity',)
    
    fieldsets = (
        (None, {
            'fields': ('user', 'total_points', 'completed_tutorials')
        }),
        ('Last Updated', {
            'fields': ('last_activity',),
        }),
    )
    
    def completed_tutorials_count(self, obj):
        return len(obj.completed_tutorials)
    completed_tutorials_count.short_description = 'Completed Tutorials'