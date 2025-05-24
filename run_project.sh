#!/bin/bash

echo "🚀 Starting all services..."

# Open frontend
cd frontend
echo "🌐 Starting Next.js frontend..."
npm run dev &

# Open backend
cd ../backend
echo "🛠 Starting Django server..."
python3 manage.py runserver &

echo "📦 Starting Celery worker..."
python3 -m celery -A medlearn worker --loglevel=info --pool=threads &

echo "✅ All processes started. Use Ctrl+C to stop."
wait
