#!/bin/bash

# Setup script for BankStat application

echo "🚀 Setting up BankStat..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your settings if needed."
fi

# Start services
echo "🐳 Starting Docker containers..."
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Run migrations
echo "🔄 Running database migrations..."
docker-compose run --rm backend alembic upgrade head

# Seed database
echo "🌱 Seeding database..."
docker-compose run --rm backend python scripts/seed_data.py

# Start all services
echo "🚀 Starting all services..."
docker-compose up -d

echo ""
echo "✅ Setup complete!"
echo ""
echo "📍 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "👤 Demo credentials:"
echo "   Email: demo@bankstat.com"
echo "   Password: demo123"
echo ""
echo "📝 To view logs:"
echo "   docker-compose logs -f"
echo ""
