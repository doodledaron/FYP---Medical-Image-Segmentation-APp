# Learning App Tests Guide

## Overview

I've created comprehensive test views for your learning app based on the segmentation test structure. The tests cover all major functionality including:

- **Tutorial Management**: List and retrieve tutorials
- **Quiz Submission**: Submit quiz answers with scoring
- **User Progress**: Track learning progress and analytics  
- **Authentication**: Test anonymous and authenticated access
- **Error Handling**: Validate proper error responses
- **Data Integrity**: Ensure data consistency

## Test Structure

### Test Classes Created:

1. **`TestLearningViewSet`** - Main API endpoint tests
2. **`TestLearningAuthentication`** - Authentication and permissions
3. **`TestLearningErrorHandling`** - Error cases and edge conditions
4. **`TestLearningDataIntegrity`** - Business logic and data consistency

### API Endpoints Tested:

- `GET /api/learning/` - List tutorials
- `GET /api/learning/{id}/` - Retrieve tutorial details
- `POST /api/learning/submit-quiz/` - Submit quiz answers
- `GET /api/learning/progress/` - Get user progress
- `GET /api/learning/chart-data/` - Get analytics data
- `POST /api/learning/reset-progress/` - Reset user progress

## Running the Tests

### Prerequisites

Make sure you have all dependencies installed:
```bash
cd backend
pip install -r requirements.txt
pip install -r test_requirements.txt
```

### Basic Test Execution

#### 1. Run All Learning Tests
```bash
cd backend
python -m pytest learning/test_views.py -v
```

#### 2. Run with Coverage Report
```bash
python -m pytest learning/test_views.py --cov=learning --cov-report=html --cov-report=term-missing
```

#### 3. Run Specific Test Class
```bash
python -m pytest learning/test_views.py::TestLearningViewSet -v
```

#### 4. Run Specific Test Method
```bash
python -m pytest learning/test_views.py::TestLearningViewSet::test_submit_quiz_success -v
```

### Using the Custom Test Runner

I've created a custom test runner script for convenience:

#### 1. Run All Tests
```bash
python run_learning_tests.py
```

#### 2. Run with Verbose Output
```bash
python run_learning_tests.py --verbose
```

#### 3. Run with Coverage
```bash
python run_learning_tests.py --coverage
```

#### 4. Run Specific Test Class
```bash
python run_learning_tests.py --specific TestLearningViewSet
```

#### 5. Run Specific Test Method
```bash
python run_learning_tests.py --specific TestLearningViewSet --method test_submit_quiz_success
```

### Advanced Options

#### Run Tests in Parallel (faster)
```bash
python -m pytest learning/test_views.py -n auto
```

#### Run Only Failed Tests
```bash
python -m pytest learning/test_views.py --lf
```

#### Run with Database Debugging
```bash
python -m pytest learning/test_views.py -v -s --create-db
```

#### Generate Detailed HTML Report
```bash
python -m pytest learning/test_views.py --html=learning_test_report.html --self-contained-html
```

## Test Fixtures Available

The tests use these fixtures (defined in `conftest.py`):

- **`test_user`** - A test user account
- **`sample_tutorial`** - Basic tutorial without questions
- **`sample_tutorial_with_questions`** - Tutorial with multiple questions
- **`sample_quiz_question`** - Individual quiz question
- **`api_client`** - DRF API test client

## Expected Test Results

When you run the tests, you should see output like:

```
========================= test session starts ==========================
collected 25 items

learning/test_views.py::TestLearningViewSet::test_list_tutorials PASSED
learning/test_views.py::TestLearningViewSet::test_retrieve_tutorial_detail PASSED
learning/test_views.py::TestLearningViewSet::test_submit_quiz_success PASSED
learning/test_views.py::TestLearningViewSet::test_submit_quiz_multiple_choice PASSED
learning/test_views.py::TestLearningViewSet::test_get_user_progress PASSED
...

========================= 25 passed in 4.23s ==========================
```

## Coverage Goals

The tests aim for high coverage of:
- ✅ All view methods and actions
- ✅ All serializer validation
- ✅ All business logic paths
- ✅ Error handling scenarios
- ✅ Authentication/permission checks

## Troubleshooting

### Common Issues:

1. **Database Errors**: Ensure you're using `--create-db` flag
2. **Import Errors**: Make sure you're in the backend directory
3. **Permission Errors**: Tests should work with anonymous users
4. **Fixture Errors**: Check that sample data is being created properly

### Debug Mode:
```bash
python -m pytest learning/test_views.py -v -s --pdb
```

### Check Test Database:
```bash
python -m pytest learning/test_views.py --create-db --reuse-db -v
```

## Integration with CI/CD

To integrate these tests with your CI/CD pipeline, use:

```bash
python -m pytest learning/test_views.py --junitxml=learning_test_results.xml --cov=learning --cov-report=xml
```

## Test Data Cleanup

Tests automatically clean up after themselves using the `cleanup_test_files` fixture. No manual cleanup needed.

---

## Quick Start Commands

```bash
# Navigate to backend
cd backend

# Run all learning tests
python -m pytest learning/test_views.py -v

# Run with coverage
python -m pytest learning/test_views.py --cov=learning --cov-report=term-missing

# Run specific test
python -m pytest learning/test_views.py::TestLearningViewSet::test_submit_quiz_success -v
```

The tests are designed to be comprehensive, fast, and reliable. They should help ensure your learning app functionality works correctly across all scenarios. 