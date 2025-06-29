import pytest
import json
from unittest.mock import patch, MagicMock
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from learning.models import Tutorial, QuizQuestion, QuizResult, UserProgress

@pytest.mark.django_db
class TestLearningViewSet:
    """Test cases for Learning API endpoints"""
    
    def test_list_tutorials(self, api_client, sample_tutorial):
        """Test listing tutorials"""
        url = reverse('learning-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert 'results' in data
        assert len(data['results']) >= 1
        
        # Check tutorial data structure
        tutorial_data = data['results'][0]
        assert 'id' in tutorial_data
        assert 'title' in tutorial_data
        assert 'tutorial_type' in tutorial_data
        assert 'topic' in tutorial_data
        assert 'has_completed' in tutorial_data
    
    def test_retrieve_tutorial_detail(self, api_client, sample_tutorial_with_questions):
        """Test retrieving a specific tutorial with questions"""
        url = reverse('learning-detail', kwargs={'pk': sample_tutorial_with_questions.id})
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data['id'] == sample_tutorial_with_questions.id
        assert data['title'] == sample_tutorial_with_questions.title
        assert 'questions' in data
        assert len(data['questions']) >= 1
        
        # Check question structure
        question = data['questions'][0]
        assert 'id' in question
        assert 'question' in question
        assert 'type' in question
        assert 'options' in question
        assert 'correct_answer' in question
        assert 'points' in question
    
    def test_retrieve_nonexistent_tutorial(self, api_client):
        """Test retrieving a non-existent tutorial"""
        url = reverse('learning-detail', kwargs={'pk': 'nonexistent'})
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_submit_quiz_success(self, api_client, sample_tutorial_with_questions, test_user):
        """Test successful quiz submission"""
        # Get the first question to submit an answer
        question = sample_tutorial_with_questions.questions.first()
        
        url = reverse('learning-submit-quiz')
        quiz_data = {
            'tutorial_id': sample_tutorial_with_questions.id,
            'answers': {
                str(question.id): question.correct_answer
            }
        }
        
        response = api_client.post(url, quiz_data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        
        assert 'id' in data
        assert data['tutorial'] == sample_tutorial_with_questions.id
        assert data['score'] >= 0
        assert data['total_points'] >= 0
        
        # Verify quiz result was created in database
        quiz_result = QuizResult.objects.get(id=data['id'])
        assert quiz_result.tutorial == sample_tutorial_with_questions
        assert quiz_result.score == data['score']
    
    def test_submit_quiz_incorrect_answers(self, api_client, sample_tutorial_with_questions):
        """Test quiz submission with incorrect answers"""
        question = sample_tutorial_with_questions.questions.first()
        
        # Submit wrong answer
        wrong_answer = "wrong_answer" if question.correct_answer != "wrong_answer" else "another_wrong"
        
        url = reverse('learning-submit-quiz')
        quiz_data = {
            'tutorial_id': sample_tutorial_with_questions.id,
            'answers': {
                str(question.id): wrong_answer
            }
        }
        
        response = api_client.post(url, quiz_data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        
        # Score should be 0 for wrong answers
        assert data['score'] == 0
        assert data['total_points'] > 0
    
    def test_submit_quiz_multiple_choice(self, api_client, test_user):
        """Test quiz submission for multiple choice questions"""
        # Create tutorial with multiple choice question
        tutorial = Tutorial.objects.create(
            id='test_mc',
            title='Multiple Choice Test',
            thumbnail='http://example.com/thumb.jpg',
            duration='10:00',
            tutorial_type='practice',
            topic='general'
        )
        
        question = QuizQuestion.objects.create(
            id='mc_q1',
            tutorial=tutorial,
            question='What is 2+2?',
            type='multiple-choice',
            options=['2', '3', '4', '5'],
            correct_answer='4',
            points=10
        )
        
        url = reverse('learning-submit-quiz')
        quiz_data = {
            'tutorial_id': tutorial.id,
            'answers': {
                str(question.id): '4'
            }
        }
        
        response = api_client.post(url, quiz_data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data['score'] == 10
    
    def test_submit_quiz_multiple_select(self, api_client, test_user):
        """Test quiz submission for multiple select questions"""
        tutorial = Tutorial.objects.create(
            id='test_ms',
            title='Multiple Select Test',
            thumbnail='http://example.com/thumb.jpg',
            duration='10:00',
            tutorial_type='practice',
            topic='general'
        )
        
        question = QuizQuestion.objects.create(
            id='ms_q1',
            tutorial=tutorial,
            question='Which are even numbers?',
            type='multiple-select',
            options=['1', '2', '3', '4'],
            correct_answer=['2', '4'],
            points=15
        )
        
        url = reverse('learning-submit-quiz')
        quiz_data = {
            'tutorial_id': tutorial.id,
            'answers': {
                str(question.id): ['2', '4']
            }
        }
        
        response = api_client.post(url, quiz_data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data['score'] == 15
    
    def test_submit_quiz_invalid_tutorial(self, api_client):
        """Test quiz submission with invalid tutorial ID"""
        url = reverse('learning-submit-quiz')
        quiz_data = {
            'tutorial_id': 'nonexistent',
            'answers': {}
        }
        
        response = api_client.post(url, quiz_data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert 'tutorial_id' in data
    
    def test_submit_quiz_no_questions(self, api_client, test_user):
        """Test quiz submission for tutorial with no questions"""
        # Create tutorial without questions
        tutorial = Tutorial.objects.create(
            id='test_empty',
            title='Empty Tutorial',
            thumbnail='http://example.com/thumb.jpg',
            duration='05:00',
            tutorial_type='practice',
            topic='general'
        )
        
        url = reverse('learning-submit-quiz')
        quiz_data = {
            'tutorial_id': tutorial.id,
            'answers': {}
        }
        
        response = api_client.post(url, quiz_data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert 'error' in data
        assert 'no questions' in data['error'].lower()
    
    def test_get_user_progress(self, api_client, test_user):
        """Test getting user progress"""
        url = reverse('learning-progress')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert 'completed_tutorials' in data
        assert 'total_points' in data
        assert 'completed_count' in data
        assert 'completed_by_topic' in data
        assert isinstance(data['completed_tutorials'], list)
        assert isinstance(data['total_points'], int)
    
    def test_get_user_progress_with_completed_tutorials(self, api_client, sample_tutorial_with_questions, test_user):
        """Test user progress after completing a tutorial"""
        # Submit quiz first to complete tutorial
        question = sample_tutorial_with_questions.questions.first()
        
        submit_url = reverse('learning-submit-quiz')
        quiz_data = {
            'tutorial_id': sample_tutorial_with_questions.id,
            'answers': {
                str(question.id): question.correct_answer
            }
        }
        api_client.post(submit_url, quiz_data, format='json')
        
        # Now check progress
        progress_url = reverse('learning-progress')
        response = api_client.get(progress_url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data['completed_count'] >= 1
        assert sample_tutorial_with_questions.id in data['completed_tutorials']
        assert data['total_points'] > 0
    
    def test_get_chart_data(self, api_client, test_user):
        """Test getting chart data for analytics"""
        url = reverse('learning-chart-data')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert 'dates' in data
        assert 'quiz_completions' in data
        assert 'points_earned' in data
        assert isinstance(data['dates'], list)
        assert isinstance(data['quiz_completions'], list)
        assert isinstance(data['points_earned'], list)
        assert len(data['dates']) == len(data['quiz_completions'])
        assert len(data['dates']) == len(data['points_earned'])
    
    def test_reset_progress(self, api_client, sample_tutorial_with_questions, test_user):
        """Test resetting user progress"""
        # First complete a tutorial
        question = sample_tutorial_with_questions.questions.first()
        
        submit_url = reverse('learning-submit-quiz')
        quiz_data = {
            'tutorial_id': sample_tutorial_with_questions.id,
            'answers': {
                str(question.id): question.correct_answer
            }
        }
        api_client.post(submit_url, quiz_data, format='json')
        
        # Verify progress exists
        progress_url = reverse('learning-progress')
        response = api_client.get(progress_url)
        assert response.json()['completed_count'] >= 1
        
        # Reset progress
        reset_url = reverse('learning-reset-progress')
        response = api_client.post(reset_url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'message' in data
        
        # Verify progress was reset
        response = api_client.get(progress_url)
        progress_data = response.json()
        assert progress_data['completed_count'] == 0
        assert progress_data['total_points'] == 0


@pytest.mark.django_db
class TestLearningAuthentication:
    """Test authentication and permissions for learning endpoints"""
    
    def test_list_tutorials_anonymous(self):
        """Test that anonymous users can list tutorials"""
        client = APIClient()
        url = reverse('learning-list')
        
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_submit_quiz_anonymous(self, sample_tutorial_with_questions):
        """Test that anonymous users can submit quizzes"""
        client = APIClient()
        question = sample_tutorial_with_questions.questions.first()
        
        url = reverse('learning-submit-quiz')
        quiz_data = {
            'tutorial_id': sample_tutorial_with_questions.id,
            'answers': {
                str(question.id): question.correct_answer
            }
        }
        
        response = client.post(url, quiz_data, format='json')
        
        # Should work for anonymous users (permission_classes = [permissions.AllowAny])
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_get_progress_anonymous(self):
        """Test that anonymous users can get default progress"""
        client = APIClient()
        url = reverse('learning-progress')
        
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'completed_tutorials' in data


@pytest.mark.django_db 
class TestLearningErrorHandling:
    """Test error handling in learning views"""
    
    def test_submit_quiz_malformed_data(self, api_client, sample_tutorial_with_questions):
        """Test quiz submission with malformed data"""
        url = reverse('learning-submit-quiz')
        
        # Missing tutorial_id
        response = api_client.post(url, {'answers': {}}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Missing answers
        response = api_client.post(url, {'tutorial_id': sample_tutorial_with_questions.id}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Invalid JSON
        response = api_client.post(url, 'invalid json', content_type='application/json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_submit_quiz_partial_answers(self, api_client, test_user):
        """Test quiz submission with only some questions answered"""
        # Create tutorial with multiple questions
        tutorial = Tutorial.objects.create(
            id='test_partial',
            title='Partial Test',
            thumbnail='http://example.com/thumb.jpg',
            duration='10:00',
            tutorial_type='practice',
            topic='general'
        )
        
        q1 = QuizQuestion.objects.create(
            id='partial_q1',
            tutorial=tutorial,
            question='Question 1?',
            type='multiple-choice',
            options=['A', 'B'],
            correct_answer='A',
            points=10
        )
        
        q2 = QuizQuestion.objects.create(
            id='partial_q2', 
            tutorial=tutorial,
            question='Question 2?',
            type='multiple-choice',
            options=['X', 'Y'],
            correct_answer='Y',
            points=10
        )
        
        # Only answer first question
        url = reverse('learning-submit-quiz')
        quiz_data = {
            'tutorial_id': tutorial.id,
            'answers': {
                str(q1.id): 'A'
                # q2 not answered
            }
        }
        
        response = api_client.post(url, quiz_data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data['score'] == 10  # Only first question scored
        assert data['total_points'] == 20  # Both questions counted


@pytest.mark.django_db
class TestLearningDataIntegrity:
    """Test data integrity and business logic"""
    
    def test_progress_updates_correctly(self, api_client, test_user):
        """Test that user progress updates correctly with multiple quiz submissions"""
        # Get initial progress state
        progress_url = reverse('learning-progress')
        initial_response = api_client.get(progress_url)
        initial_data = initial_response.json()
        initial_count = initial_data['completed_count']
        initial_points = initial_data['total_points']
        initial_topics = initial_data.get('completed_by_topic', {})
        
        # Create two tutorials
        tutorial1 = Tutorial.objects.create(
            id='integrity_test_1',
            title='Tutorial 1',
            thumbnail='http://example.com/thumb.jpg',
            duration='10:00',
            tutorial_type='practice',
            topic='general'
        )
        
        tutorial2 = Tutorial.objects.create(
            id='integrity_test_2',
            title='Tutorial 2',
            thumbnail='http://example.com/thumb.jpg',
            duration='15:00',
            tutorial_type='practice',
            topic='tnm'
        )
        
        # Add questions
        q1 = QuizQuestion.objects.create(
            id='int_test_q1',
            tutorial=tutorial1,
            question='Question 1?',
            type='multiple-choice',
            options=['A', 'B'],
            correct_answer='A',
            points=10
        )
        
        q2 = QuizQuestion.objects.create(
            id='int_test_q2',
            tutorial=tutorial2,
            question='Question 2?',
            type='multiple-choice', 
            options=['X', 'Y'],
            correct_answer='Y',
            points=15
        )
        
        submit_url = reverse('learning-submit-quiz')
        
        # Complete first tutorial
        response = api_client.post(submit_url, {
            'tutorial_id': tutorial1.id,
            'answers': {str(q1.id): 'A'}
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # Check progress after first tutorial
        response = api_client.get(progress_url)
        data = response.json()
        assert data['completed_count'] == initial_count + 1
        assert tutorial1.id in data['completed_tutorials']
        assert data['total_points'] == initial_points + 10
        
        # Complete second tutorial
        response = api_client.post(submit_url, {
            'tutorial_id': tutorial2.id,
            'answers': {str(q2.id): 'Y'}
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # Check final progress
        response = api_client.get(progress_url)
        final_data = response.json()
        assert final_data['completed_count'] == initial_count + 2
        assert tutorial1.id in final_data['completed_tutorials']
        assert tutorial2.id in final_data['completed_tutorials']
        assert final_data['total_points'] == initial_points + 25
        
        # Check topic breakdown (only check that our new tutorials are counted)
        assert 'completed_by_topic' in final_data
        final_topics = final_data['completed_by_topic']
        
        # Verify that our tutorials added to the topic counts
        initial_general = initial_topics.get('general', 0)
        initial_tnm = initial_topics.get('tnm', 0)
        
        assert final_topics.get('general', 0) == initial_general + 1
        assert final_topics.get('tnm', 0) == initial_tnm + 1
    
    def test_quiz_result_stores_answers_correctly(self, api_client, test_user):
        """Test that quiz results store the submitted answers correctly"""
        tutorial = Tutorial.objects.create(
            id='answer_test',
            title='Answer Storage Test',
            thumbnail='http://example.com/thumb.jpg',
            duration='10:00',
            tutorial_type='practice',
            topic='general'
        )
        
        question = QuizQuestion.objects.create(
            id='ans_q1',
            tutorial=tutorial,
            question='Test question?',
            type='multiple-select',
            options=['A', 'B', 'C', 'D'],
            correct_answer=['B', 'C'],
            points=20
        )
        
        url = reverse('learning-submit-quiz')
        user_answers = {str(question.id): ['A', 'D']}  # Wrong answers
        
        response = api_client.post(url, {
            'tutorial_id': tutorial.id,
            'answers': user_answers
        }, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        
        # Verify the quiz result was stored with correct answers
        quiz_result = QuizResult.objects.get(id=data['id'])
        assert quiz_result.answers == user_answers
        assert quiz_result.score == 0  # Wrong answers
        assert quiz_result.total_points == 20 