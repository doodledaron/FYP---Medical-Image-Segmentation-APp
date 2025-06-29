#!/usr/bin/env python
"""
Test runner script for the Learning app

Usage:
    python run_learning_tests.py                    # Run all learning tests
    python run_learning_tests.py --verbose          # Run with verbose output
    python run_learning_tests.py --coverage         # Run with coverage report
    python run_learning_tests.py --specific TEST    # Run specific test class/method
"""

import os
import sys
import django
from django.conf import settings
from django.test.utils import get_runner

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Run Learning App Tests')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    parser.add_argument('--coverage', '-c', action='store_true', help='Run with coverage')
    parser.add_argument('--specific', '-s', type=str, help='Run specific test (e.g., TestLearningViewSet)')
    parser.add_argument('--method', '-m', type=str, help='Run specific test method')
    
    args = parser.parse_args()
    
    # Set up Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medlearn.settings')
    django.setup()
    
    # Build pytest command
    cmd_parts = ['python', '-m', 'pytest']
    
    if args.verbose:
        cmd_parts.append('-v')
    
    if args.coverage:
        cmd_parts.extend(['--cov=learning', '--cov-report=html', '--cov-report=term-missing'])
    
    if args.specific:
        if args.method:
            test_path = f"learning/test_views.py::{args.specific}::{args.method}"
        else:
            test_path = f"learning/test_views.py::{args.specific}"
        cmd_parts.append(test_path)
    else:
        cmd_parts.append('learning/test_views.py')
    
    # Add common options
    cmd_parts.extend(['--tb=short', '--create-db', '--nomigrations'])
    
    print(f"Running command: {' '.join(cmd_parts)}")
    print("-" * 50)
    
    # Execute the command
    os.system(' '.join(cmd_parts)) 