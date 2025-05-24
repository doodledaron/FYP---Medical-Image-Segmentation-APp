FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Create necessary directories
RUN mkdir -p media/uploads media/segmentations static models/nnUNet

# Expose the port
EXPOSE 8000

# Default command
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]