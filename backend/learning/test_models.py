import pytest
from django.contrib.auth.models import User
from learning.models import Tutorial, QuizQuestion, QuizResult, UserProgress

@pytest.mark.django_db
class TestTutorial:
    """Test cases for Tutorial model"""
    
    def test_create_tutorial(self):
        """Test creating a tutorial"""
        tutorial = Tutorial.objects.create(
            id="tut_001",
            title="Introduction to Segmentation",
            thumbnail="https://example.com/thumb.jpg",
            duration="15:30",
            tutorial_type="practice",
            topic="image_segmentation",
            description="Learn the basics of image segmentation"
        )
        
        assert tutorial.id == "tut_001"
        assert tutorial.title == "Introduction to Segmentation"
        assert tutorial.tutorial_type == "practice"
        assert tutorial.topic == "image_segmentation"
        assert str(tutorial) == "Introduction to Segmentation"
    
    def test_tutorial_defaults(self):
        """Test default values for tutorial"""
        tutorial = Tutorial.objects.create(
            id="tut_002",
            title="Basic Tutorial",
            thumbnail="https://example.com/thumb.jpg",
            duration="10:00"
        )
        
        assert tutorial.tutorial_type == "practice"
        assert tutorial.topic == "general"
        assert tutorial.video_url is None
        assert tutorial.transcript is None
        assert tutorial.ai_generated_notes is None
    
    def test_tutorial_with_video_content(self):
        """Test tutorial with video-specific fields"""
        tutorial = Tutorial.objects.create(
            id="vid_001",
            title="Video Tutorial",
            thumbnail="https://example.com/thumb.jpg",
            duration="20:45",
            tutorial_type="video",
            topic="clustering",
            video_url="https://youtube.com/watch?v=xyz",
            transcript="This is the video transcript...",
            ai_generated_notes=["Key point 1", "Key point 2", "Summary"]
        )
        
        assert tutorial.tutorial_type == "video"
        assert tutorial.video_url == "https://youtube.com/watch?v=xyz"
        assert tutorial.transcript == "This is the video transcript..."
        assert len(tutorial.ai_generated_notes) == 3
        assert "Key point 1" in tutorial.ai_generated_notes
    
    def test_tutorial_topic_choices(self):
        """Test valid topic choices"""
        valid_topics = [
            'image_segmentation', 'edge_detection', 'clustering',
            'thresholding', 'region_growing', 'tnm', 'general'
        ]
        
        for topic in valid_topics:
            tutorial = Tutorial.objects.create(
                id=f"tut_{topic}",
                title=f"Tutorial for {topic}",
                thumbnail="https://example.com/thumb.jpg",
                duration="10:00",
                topic=topic
            )
            assert tutorial.topic == topic
    
    def test_tutorial_ordering(self):
        """Test tutorial ordering by topic and id"""
        tutorial1 = Tutorial.objects.create(
            id="tut_002",
            title="Second Tutorial",
            thumbnail="https://example.com/thumb.jpg",
            duration="10:00",
            topic="image_segmentation"
        )
        tutorial2 = Tutorial.objects.create(
            id="tut_001",
            title="First Tutorial",
            thumbnail="https://example.com/thumb.jpg",
            duration="10:00",
            topic="image_segmentation"
        )
        
        tutorials = list(Tutorial.objects.all())
        assert tutorials[0] == tutorial2  # Should be ordered by id within topic
        assert tutorials[1] == tutorial1


@pytest.mark.django_db
class TestQuizQuestion:
    """Test cases for QuizQuestion model"""
    
    def test_create_quiz_question(self, sample_tutorial):
        """Test creating a quiz question"""
        question = QuizQuestion.objects.create(
            id="q_001",
            tutorial=sample_tutorial,
            question="What is image segmentation?",
            type="multiple-choice",
            options=["A", "B", "C", "D"],
            correct_answer=["A"],
            explanation="Segmentation divides images into regions",
            points=10
        )
        
        assert question.tutorial == sample_tutorial
        assert question.question == "What is image segmentation?"
        assert question.type == "multiple-choice"
        assert len(question.options) == 4
        assert question.correct_answer == ["A"]
        assert question.points == 10
        assert "What is image segmentation?" in str(question)
    
    def test_multiple_select_question(self, sample_tutorial):
        """Test multiple select question"""
        question = QuizQuestion.objects.create(
            id="q_002",
            tutorial=sample_tutorial,
            question="Which are segmentation techniques?",
            type="multiple-select",
            options=["Thresholding", "Clustering", "Dancing", "Region Growing"],
            correct_answer=["Thresholding", "Clustering", "Region Growing"],
            points=15
        )
        
        assert question.type == "multiple-select"
        assert len(question.correct_answer) == 3
        assert "Thresholding" in question.correct_answer
        assert "Dancing" not in question.correct_answer
    
    def test_true_false_question(self, sample_tutorial):
        """Test true/false question"""
        question = QuizQuestion.objects.create(
            id="q_003",
            tutorial=sample_tutorial,
            question="Image segmentation is only used in medical imaging",
            type="true-false",
            options=["True", "False"],
            correct_answer=["False"],
            explanation="Segmentation is used in many fields",
            points=5
        )
        
        assert question.type == "true-false"
        assert question.correct_answer == ["False"]
    
    def test_question_defaults(self, sample_tutorial):
        """Test default values for quiz question"""
        question = QuizQuestion.objects.create(
            id="q_004",
            tutorial=sample_tutorial,
            question="Basic question",
            type="multiple-choice",
            correct_answer=["A"]
        )
        
        assert question.points == 10  # Default points
        assert question.explanation is None
        assert question.options is None


@pytest.mark.django_db
class TestQuizResult:
    """Test cases for QuizResult model"""
    
    def test_create_quiz_result(self, test_user, sample_tutorial):
        """Test creating a quiz result"""
        result = QuizResult.objects.create(
            user=test_user,
            tutorial=sample_tutorial,
            score=80,
            total_points=100,
            answers={"q1": "A", "q2": ["B", "C"], "q3": "True"}
        )
        
        assert result.user == test_user
        assert result.tutorial == sample_tutorial
        assert result.score == 80
        assert result.total_points == 100
        assert result.answers["q1"] == "A"
        assert result.answers["q2"] == ["B", "C"]
        assert "80/100" in str(result)
    
    def test_quiz_result_relationships(self, test_user, sample_tutorial):
        """Test quiz result relationships"""
        result = QuizResult.objects.create(
            user=test_user,
            tutorial=sample_tutorial,
            score=90,
            total_points=100,
            answers={}
        )
        
        # Test forward relationships
        assert result.user == test_user
        assert result.tutorial == sample_tutorial
        
        # Test reverse relationships
        user_results = test_user.quiz_results.all()
        assert result in user_results
    
    def test_quiz_result_ordering(self, test_user, sample_tutorial):
        """Test quiz results are ordered by completion date (newest first)"""
        result1 = QuizResult.objects.create(
            user=test_user,
            tutorial=sample_tutorial,
            score=70,
            total_points=100,
            answers={}
        )
        result2 = QuizResult.objects.create(
            user=test_user,
            tutorial=sample_tutorial,
            score=85,
            total_points=100,
            answers={}
        )
        
        results = list(QuizResult.objects.all())
        assert results[0] == result2  # Newest first
        assert results[1] == result1


@pytest.mark.django_db
class TestUserProgress:
    """Test cases for UserProgress model"""
    
    def test_create_user_progress(self, test_user):
        """Test creating user progress"""
        progress = UserProgress.objects.create(
            user=test_user,
            completed_tutorials=["tut_001", "tut_002"],
            total_points=150
        )
        
        assert progress.user == test_user
        assert len(progress.completed_tutorials) == 2
        assert "tut_001" in progress.completed_tutorials
        assert progress.total_points == 150
        assert test_user.username in str(progress)
    
    def test_user_progress_defaults(self, test_user):
        """Test default values for user progress"""
        progress = UserProgress.objects.create(user=test_user)
        
        assert progress.completed_tutorials == []
        assert progress.total_points == 0
        assert progress.last_activity is not None
    
    def test_user_progress_relationship(self, test_user):
        """Test one-to-one relationship with user"""
        progress = UserProgress.objects.create(
            user=test_user,
            total_points=200
        )
        
        # Test forward relationship
        assert progress.user == test_user
        
        # Test reverse relationship
        assert test_user.progress == progress
    
    def test_add_completed_tutorial(self, test_user):
        """Test adding completed tutorials"""
        progress = UserProgress.objects.create(user=test_user)
        
        # Add tutorials
        progress.completed_tutorials.append("tut_001")
        progress.completed_tutorials.append("tut_002")
        progress.total_points += 50
        progress.save()
        
        progress.refresh_from_db()
        assert len(progress.completed_tutorials) == 2
        assert progress.total_points == 50


@pytest.mark.django_db
class TestModelRelationships:
    """Test relationships between learning models"""
    
    def test_tutorial_questions_relationship(self, sample_tutorial):
        """Test tutorial-questions relationship"""
        question1 = QuizQuestion.objects.create(
            id="q_001",
            tutorial=sample_tutorial,
            question="Question 1",
            type="multiple-choice",
            correct_answer=["A"]
        )
        question2 = QuizQuestion.objects.create(
            id="q_002",
            tutorial=sample_tutorial,
            question="Question 2",
            type="multiple-choice",
            correct_answer=["B"]
        )
        
        # Test reverse relationship
        tutorial_questions = sample_tutorial.questions.all()
        assert len(tutorial_questions) == 2
        assert question1 in tutorial_questions
        assert question2 in tutorial_questions
    
    def test_cascade_deletion(self, sample_tutorial):
        """Test cascade deletion of questions when tutorial is deleted"""
        question = QuizQuestion.objects.create(
            id="q_001",
            tutorial=sample_tutorial,
            question="Test question",
            type="multiple-choice",
            correct_answer=["A"]
        )
        
        tutorial_id = sample_tutorial.id
        question_id = question.id
        
        # Delete tutorial
        sample_tutorial.delete()
        
        # Question should be deleted too (CASCADE)
        with pytest.raises(QuizQuestion.DoesNotExist):
            QuizQuestion.objects.get(id=question_id)
        
        # Verify tutorial is deleted
        with pytest.raises(Tutorial.DoesNotExist):
            Tutorial.objects.get(id=tutorial_id) 