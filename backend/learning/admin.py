# from django.contrib import admin
# from .models import Tutorial, QuizQuestion, QuizResult, UserProgress
# from django import forms
# from unfold.admin import ModelAdmin, TabularInline
# from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm
# import json

# class QuizQuestionInline(TabularInline):
#     model = QuizQuestion
#     extra = 1
#     fields = ('id', 'question', 'type', 'options', 'correct_answer', 'explanation', 'points')
    
#     # Custom form to handle JSON field input
#     formfield_overrides = {
#         # Display JSON fields as textarea
#         models.JSONField: {'widget': forms.Textarea(attrs={'rows': 3, 'cols': 40})},
#     }


# @admin.register(Tutorial)
# class TutorialAdmin(ModelAdmin):
#     list_display = ('id', 'title', 'duration', 'created_at')
#     search_fields = ('id', 'title')
#     list_filter = ('created_at',)
#     inlines = [QuizQuestionInline]
    
#     fieldsets = (
#         (None, {
#             'fields': ('id', 'title', 'thumbnail', 'duration')
#         }),
#         ('Content', {
#             'fields': ('study_notes',),
#             'classes': ('collapse',),
#         }),
#         ('Timestamps', {
#             'fields': ('created_at', 'updated_at'),
#             'classes': ('collapse',),
#         }),
#     )
    
#     readonly_fields = ('created_at', 'updated_at')
    
#     # Custom form to handle ArrayField input
#     def get_form(self, request, obj=None, **kwargs):
#         form = super().get_form(request, obj, **kwargs)
#         if 'study_notes' in form.base_fields:
#             form.base_fields['study_notes'].widget = forms.Textarea(attrs={'rows': 5, 'cols': 80})
#             form.base_fields['study_notes'].help_text = 'Enter each note on a new line. They will be stored as separate items.'
#         return form
    
#     # Process the study_notes field before saving
#     def save_model(self, request, obj, form, change):
#         if 'study_notes' in form.cleaned_data and form.cleaned_data['study_notes']:
#             # If input is a string, convert it to a list of lines
#             if isinstance(form.cleaned_data['study_notes'], str):
#                 obj.study_notes = [line.strip() for line in form.cleaned_data['study_notes'].split('\n') if line.strip()]
#         super().save_model(request, obj, form, change)

#     # Custom sidebar icon and color
#     icon = "school"
#     unfold_icon_color = "text-blue-500" 


# @admin.register(QuizQuestion)
# class QuizQuestionAdmin(ModelAdmin):
#     list_display = ('id', 'tutorial', 'question_preview', 'type', 'points')
#     list_filter = ('tutorial', 'type')
#     search_fields = ('id', 'question', 'tutorial__title')
    
#     formfield_overrides = {
#         # Display JSON fields as textarea
#         models.JSONField: {'widget': forms.Textarea(attrs={'rows': 3, 'cols': 40})},
#     }
    
#     fieldsets = (
#         (None, {
#             'fields': ('id', 'tutorial', 'question', 'type', 'points')
#         }),
#         ('Answer Options', {
#             'fields': ('options', 'correct_answer', 'explanation'),
#         }),
#     )
    
#     def question_preview(self, obj):
#         return obj.question[:50] + '...' if len(obj.question) > 50 else obj.question
#     question_preview.short_description = 'Question'
    
#     # Custom sidebar icon and color
#     icon = "quiz"
#     unfold_icon_color = "text-indigo-500"


# @admin.register(QuizResult)
# class QuizResultAdmin(ModelAdmin):
#     list_display = ('user', 'tutorial', 'score', 'total_points', 'percentage', 'completed_at')
#     list_filter = ('tutorial', 'completed_at', 'user')
#     search_fields = ('user__username', 'tutorial__title')
#     readonly_fields = ('user', 'tutorial', 'score', 'total_points', 'answers', 'completed_at')
    
#     fieldsets = (
#         (None, {
#             'fields': ('user', 'tutorial', 'score', 'total_points', 'completed_at')
#         }),
#         ('Detailed Answers', {
#             'fields': ('answers',),
#             'classes': ('collapse',),
#         }),
#     )
    
#     def percentage(self, obj):
#         if obj.total_points > 0:
#             return f"{(obj.score / obj.total_points) * 100:.1f}%"
#         return "0%"
#     percentage.short_description = 'Score %'
    
#     def has_add_permission(self, request):
#         return False
    
#     # Custom sidebar icon and color
#     icon = "fact_check"
#     unfold_icon_color = "text-green-500"


# @admin.register(UserProgress)
# class UserProgressAdmin(ModelAdmin):
#     list_display = ('user', 'total_points', 'completed_tutorials_count', 'last_updated')
#     search_fields = ('user__username',)
#     readonly_fields = ('last_updated',)
    
#     fieldsets = (
#         (None, {
#             'fields': ('user', 'total_points', 'completed_tutorials')
#         }),
#         ('Last Updated', {
#             'fields': ('last_updated',),
#         }),
#     )
    
#     def completed_tutorials_count(self, obj):
#         return len(obj.completed_tutorials)
#     completed_tutorials_count.short_description = 'Completed Tutorials'
    
#     # Custom sidebar icon and color
#     icon = "trending_up"
#     unfold_icon_color = "text-amber-500"