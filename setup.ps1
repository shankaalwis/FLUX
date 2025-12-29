# Setup script for BankStat application (Windows)

Write-Host "🚀 Setting up BankStat..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
}
catch {
    Write-Host "❌ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Copy environment file if it doesn't exist
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✅ .env file created. Please update it with your settings if needed." -ForegroundColor Green
}

# Start services
Write-Host "🐳 Starting Docker containers..." -ForegroundColor Yellow
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Run migrations
Write-Host "🔄 Running database migrations..." -ForegroundColor Yellow
docker-compose run --rm backend alembic upgrade head

# Seed database
Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
docker-compose run --rm backend python scripts/seed_data.py

# Start all services
Write-Host "🚀 Starting all services..." -ForegroundColor Yellow
docker-compose up -d

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access the application:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000"
Write-Host "   Backend API: http://localhost:8000"
Write-Host "   API Docs: http://localhost:8000/docs"
Write-Host ""
Write-Host "👤 Demo credentials:" -ForegroundColor Cyan
Write-Host "   Email: demo@bankstat.com"
Write-Host "   Password: demo123"
Write-Host ""
Write-Host "📝 To view logs:" -ForegroundColor Cyan
Write-Host "   docker-compose logs -f"
Write-Host ""
