# Supabase Backend Migration Script
# This script helps automate the migration to your personal Supabase project

Write-Host "🚀 Statement Insights - Supabase Migration Script" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "Checking for Supabase CLI..." -ForegroundColor Yellow
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseInstalled) {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host "Installing Supabase CLI..." -ForegroundColor Yellow
    npm install -g supabase
    Write-Host "✅ Supabase CLI installed!" -ForegroundColor Green
} else {
    Write-Host "✅ Supabase CLI found!" -ForegroundColor Green
}

Write-Host ""
Write-Host "📝 Please provide your new Supabase project details:" -ForegroundColor Cyan
Write-Host ""

# Get new project details
$projectId = Read-Host "Enter your new Supabase Project ID (from dashboard)"
$projectUrl = Read-Host "Enter your new Supabase URL (e.g., https://xxxxx.supabase.co)"
$anonKey = Read-Host "Enter your new Supabase Anon Key"

Write-Host ""
Write-Host "Updating configuration files..." -ForegroundColor Yellow

# Update .env file
$envContent = @"
VITE_SUPABASE_PROJECT_ID="$projectId"
VITE_SUPABASE_PUBLISHABLE_KEY="$anonKey"
VITE_SUPABASE_URL="$projectUrl"
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "✅ Updated .env file" -ForegroundColor Green

# Update config.toml
$configContent = "project_id = `"$projectId`""
$configContent | Out-File -FilePath "supabase\config.toml" -Encoding UTF8
Write-Host "✅ Updated supabase/config.toml" -ForegroundColor Green

Write-Host ""
Write-Host "🔗 Linking to your Supabase project..." -ForegroundColor Yellow
supabase login

Write-Host ""
Write-Host "Linking project..." -ForegroundColor Yellow
supabase link --project-ref $projectId

Write-Host ""
Write-Host "📊 Pushing database migrations..." -ForegroundColor Yellow
supabase db push

Write-Host ""
Write-Host "⚡ Deploying Edge Functions..." -ForegroundColor Yellow
supabase functions deploy process-statement

Write-Host ""
Write-Host "✅ Migration Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Test your application: npm run dev" -ForegroundColor White
Write-Host "2. Try signing up a new user" -ForegroundColor White
Write-Host "3. Test creating a bank profile and uploading a statement" -ForegroundColor White
Write-Host ""
Write-Host "📚 For detailed information, see MIGRATION_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Happy coding!" -ForegroundColor Green
