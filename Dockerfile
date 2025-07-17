# Multi-stage Docker build for Java Installation Wizard
# Stage 1: Build stage with Python dependencies
FROM python:3.11-slim AS builder

# Set working directory
WORKDIR /app

# Install system dependencies needed for building Python packages
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    openssh-client \
    sshpass \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Production stage with distroless image
FROM gcr.io/distroless/python3-debian12 AS runtime

# Copy Python packages from builder stage
COPY --from=builder /root/.local /root/.local

# Copy application code
COPY --from=builder /app /app
COPY . /app

# Set working directory
WORKDIR /app

# Set Python path
ENV PYTHONPATH=/root/.local/lib/python3.11/site-packages

# Create volume mount points
VOLUME ["/app/java_updater"]

# Expose port 5000 for Flask
EXPOSE 5000

# Run the Flask application
ENTRYPOINT ["python", "app.py"]
