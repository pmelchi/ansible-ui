#!/bin/bash
# deploy.sh - Deployment script for Java Installation Wizard

set -e

echo "🚀 Starting Java Installation Wizard deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p java_updater/{installation,backup,log}

# Set permissions
echo "🔒 Setting permissions..."
chmod 755 java_updater
chmod 755 java_updater/installation
chmod 755 java_updater/backup  
chmod 755 java_updater/log

# Copy configuration file if it doesn't exist
if [ ! -f java_updater/java_updater.toml ]; then
    echo "📄 Creating configuration file..."
    cp java_updater.toml java_updater/java_updater.toml
fi

# Build and start the application
echo "🏗️ Building Docker image..."
docker-compose build

echo "🚀 Starting application..."
docker-compose up -d

# Wait for application to be ready
echo "⏳ Waiting for application to be ready..."
timeout=30
counter=0
while ! curl -f http://localhost:5000 > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        echo "❌ Application failed to start within $timeout seconds"
        docker-compose logs
        exit 1
    fi
    echo "   Waiting... ($counter/$timeout)"
    sleep 1
    ((counter++))
done

echo "✅ Java Installation Wizard is now running!"
echo "🌐 Open your browser to: http://localhost:5000"
echo ""
echo "📊 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
echo "🔄 To restart: docker-compose restart"
