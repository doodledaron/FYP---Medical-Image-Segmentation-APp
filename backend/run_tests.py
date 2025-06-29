#!/usr/bin/env python
"""
Simple test runner script for the Django backend.
This makes it easy to run tests without remembering complex pytest commands.
"""

import os
import sys
import subprocess
from pathlib import Path

def run_command(cmd, description):
    """Run a command and handle errors"""
    print(f"\n🚀 {description}")
    print(f"Command: {cmd}")
    print("-" * 50)
    
    result = subprocess.run(cmd, shell=True)
    if result.returncode != 0:
        print(f"❌ {description} failed!")
        return False
    print(f"✅ {description} completed successfully!")
    return True

def validate_test_files():
    """Validate that required test files exist"""
    required_files = [
        "learning/test_models.py",
        "learning/test_views.py", 
        "segmentation/test_models.py",
        "segmentation/test_views.py"
    ]
    
    missing_files = []
    for file_path in required_files:
        if not Path(file_path).exists():
            missing_files.append(file_path)
    
    if missing_files:
        print("❌ Missing test files:")
        for file_path in missing_files:
            print(f"   - {file_path}")
        return False
    
    print("✅ All required test files found:")
    for file_path in required_files:
        print(f"   - {file_path}")
    return True

def main():
    """Main test runner function"""
    # Change to the backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Set Django settings module environment variable
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medlearn.settings')
    
    print("🧪 Django Backend Test Runner")
    print("=" * 50)
    
    # Validate test files exist
    print("\n📋 Validating test files...")
    if not validate_test_files():
        print("\n❌ Cannot proceed with missing test files!")
        return
    
    # Check if virtual environment is activated
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("⚠️  Warning: No virtual environment detected!")
        print("Consider activating your virtual environment first.")
        print()
    
    # Install test dependencies
    if not run_command("pip install -r test_requirements.txt", "Installing test dependencies"):
        return
    
    # Run different types of tests based on command line arguments
    if len(sys.argv) > 1:
        test_type = sys.argv[1]
        
        if test_type == "models":
            # Test only models from both apps
            run_command("pytest learning/test_models.py segmentation/test_models.py -v", "Running model tests for learning & segmentation apps")
            
        elif test_type == "views":
            # Test only views/API endpoints from both apps
            run_command("pytest learning/test_views.py segmentation/test_views.py -v", "Running view tests for learning & segmentation apps")
            
        elif test_type == "unit":
            # Run all unit tests (marked with @pytest.mark.unit)
            run_command("pytest -m unit -v", "Running unit tests")
            
        elif test_type == "fast":
            # Run tests without coverage (faster)
            run_command("pytest --no-cov -v", "Running fast tests")
            
        elif test_type == "coverage":
            # Run with detailed coverage report for both apps
            run_command("pytest learning/ segmentation/ --cov=learning --cov=segmentation --cov-report=html --cov-report=term-missing -v", "Running tests with coverage for learning & segmentation apps")
            
        elif test_type == "discover":
            # Show what tests would be discovered without running them
            print("\n🔍 Discovering tests...")
            run_command("pytest --collect-only -q learning/ segmentation/", "Discovering tests in learning & segmentation apps")
            
        elif test_type == "specific":
            # Run specific test file or function
            if len(sys.argv) > 2:
                test_path = sys.argv[2]
                run_command(f"pytest {test_path} -v", f"Running specific test: {test_path}")
            else:
                print("❌ Please specify a test path after 'specific'")
                print("Example: python run_tests.py specific segmentation/test_models.py::TestSegmentationTask::test_create_segmentation_task")
                
        else:
            print(f"❌ Unknown test type: {test_type}")
            print_usage()
    else:
        # Run all tests from both apps with basic coverage
        run_command("pytest learning/ segmentation/ --cov=learning --cov=segmentation --cov-report=term-missing -v", "Running all tests for learning & segmentation apps")
    
    print("\n" + "=" * 50)
    print("🏁 Test run completed!")
    print("\n📊 To view detailed coverage report, open: htmlcov/index.html")

def print_usage():
    """Print usage information"""
    print("\n📖 Usage:")
    print("  python run_tests.py                    # Run all tests (learning + segmentation)")
    print("  python run_tests.py models             # Test only models (both apps)")
    print("  python run_tests.py views              # Test only views/API (both apps)")
    print("  python run_tests.py unit               # Test only unit tests")
    print("  python run_tests.py fast               # Run without coverage (faster)")
    print("  python run_tests.py coverage           # Run with detailed coverage")
    print("  python run_tests.py discover           # Show what tests will be discovered")
    print("  python run_tests.py specific <path>    # Run specific test")
    print("\n📝 Examples:")
    print("  python run_tests.py models")
    print("  python run_tests.py views")
    print("  python run_tests.py discover")
    print("  python run_tests.py specific learning/test_views.py::TestLearningViewSet")
    print("  python run_tests.py specific segmentation/test_models.py::TestSegmentationTask")

if __name__ == "__main__":
    main() 