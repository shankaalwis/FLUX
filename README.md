# BankStat - AI-Powered Bank Statement Analysis

A production-ready web application for analyzing bank statements using AI to extract transactions, generate insights, and visualize financial data.

## Features

- **Multi-Bank Support**: Create multiple bank profiles for different accounts
- **PDF Processing**: Upload PDF statements with automatic text extraction and OCR fallback
- **Smart Deduplication**: Automatically detects and prevents duplicate transactions
- **AI Analysis**:
  - Automatic transaction categorization with confidence scores
  - Merchant name normalization
  - Recurring transaction detection (subscriptions, bills)
  - Anomaly detection with explanations
- **Interactive Dashboard**: Visual charts and insights
- **Manual Controls**: Override AI decisions, edit transactions, full audit trail

## Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Database**: PostgreSQL 15
- **Job Queue**: Celery + Redis
- **PDF Processing**: PyPDF2 + Tesseract OCR
- **AI/ML**: Scikit-learn, NumPy

### Frontend
- **Framework**: Next.js 14 (React, TypeScript)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **HTTP Client**: Axios

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/bankstat.git
cd bankstat
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your settings (optional for local development)

4. Start all services:
```bash
docker-compose up -d
```

5. Run database migrations:
```bash
docker-compose exec backend alembic upgrade head
```

6. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Development

### Backend Development

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload

# Start Celery worker
celery -A app.workers.celery_app worker --loglevel=info
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Usage

### 1. Register an Account
Navigate to http://localhost:3000 and create an account.

### 2. Create a Bank Profile
- Click "Add Bank Profile"
- Enter bank name
- Select parser type (use "generic" for most banks)

### 3. Upload Statements
- Select a bank profile
- Upload one or more PDF statements
- Wait for processing (status updates automatically)

### 4. View Transactions
- Browse all transactions
- Filter by date, category, or search
- View AI-assigned categories and confidence scores
- Override categories manually

### 5. Analyze Insights
- View dashboard with charts
- See spending by category
- Identify recurring transactions
- Review anomaly flags

## API Documentation

Full API documentation is available at http://localhost:8000/docs

### Key Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/profiles` - List bank profiles
- `POST /api/profiles` - Create bank profile
- `POST /api/profiles/{id}/statements` - Upload statement
- `GET /api/profiles/{id}/transactions` - List transactions
- `PUT /api/transactions/{id}/category` - Override category

## Architecture

### Database Schema

- **users**: User accounts
- **bank_profiles**: Bank account profiles
- **statements**: Uploaded PDF statements
- **transactions**: Extracted transactions
- **transaction_ai_metadata**: AI analysis results
- **categories**: Reference categories

### PDF Processing Pipeline

1. User uploads PDF
2. Background worker extracts text (digital or OCR)
3. Parser extracts transactions using patterns
4. Deduplication checks prevent duplicates
5. Transactions saved to database
6. AI analysis triggered

### AI Analysis Pipeline

1. **Categorization**: Rule-based keyword matching
2. **Merchant Normalization**: Clean and standardize names
3. **Recurrence Detection**: Identify subscriptions
4. **Anomaly Detection**: Statistical outlier detection
5. **Confidence Scoring**: All decisions include scores

## Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Deployment

### Production Build

```bash
# Build backend
cd backend
docker build -t bankstat-backend .

# Build frontend
cd frontend
docker build -t bankstat-frontend .
```

### Environment Variables

See `.env.example` for all configuration options.

**Important for production**:
- Change `SECRET_KEY` to a secure random string
- Update `DATABASE_URL` with production database
- Set `ENVIRONMENT=production`
- Configure CORS origins
- Enable HTTPS

## Security

- Passwords hashed with bcrypt
- JWT-based authentication
- File upload validation (PDF only, size limits)
- SQL injection protection (parameterized queries)
- CORS configuration
- Rate limiting on auth endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/bankstat/issues
- Email: support@bankstat.com

## Roadmap

- [ ] Additional bank-specific parsers
- [ ] LLM integration for advanced insights
- [ ] Mobile app
- [ ] Budget planning features
- [ ] Export to CSV/Excel
- [ ] Multi-currency support
