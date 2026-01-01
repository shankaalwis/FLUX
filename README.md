# Flux - Smart Bank Statement Analysis

Flux is a modern financial analysis platform that transforms generic bank statements into intelligent, actionable insights using AI.

## 🚀 Features

- **Multi-Bank Profile Support**: Manage accounts from different banks in one place
- **Intelligent PDF Parsing**: Upload generic bank statements (PDF) and automatically extract transactions
- **AI Categorization**: Automatically categorizes transactions with high accuracy
- **Visual Insights**: Interactive charts and graphs for spending analysis
- **Dark Mode**: Sleek UI with full light/dark mode supportcs
- 🔍 **Anomaly Detection** - Identify unusual transactions and spending patterns
- 🔄 **Recurring Payments** - Track subscriptions and recurring expenses
- 🔐 **Secure & Private** - Your data is protected with row-level security

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage, Edge Functions)
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works fine)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd statement-insights
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env` file in the root directory:
```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## Supabase Setup

### Database Migration

The database schema is located in `supabase/migrations/`. To apply migrations:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
npx supabase login

# Link your project
npx supabase link --project-ref your-project-id

# Push migrations
npx supabase db push
```

### Edge Functions

Deploy the statement processing function:

```bash
npx supabase functions deploy process-statement
```

## Database Schema

The application uses the following main tables:

- **bank_profiles** - User's bank account configurations
- **statements** - Uploaded bank statements
- **transactions** - Parsed transaction data
- **ai_insights** - AI-generated financial insights
- **transaction_audit_log** - Change tracking

All tables have Row Level Security (RLS) enabled for data protection.

## Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Project Structure

```
statement-insights/
├── src/
│   ├── components/        # React components
│   ├── integrations/      # Supabase client and types
│   ├── pages/            # Page components
│   └── lib/              # Utilities and helpers
├── supabase/
│   ├── functions/        # Edge Functions
│   └── migrations/       # Database migrations
└── public/               # Static assets
```

## Deployment

### Build the Application

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Deploy to Hosting

You can deploy to any static hosting service:

- **Vercel**: Connect your GitHub repo
- **Netlify**: Connect your GitHub repo
- **Cloudflare Pages**: Connect your GitHub repo

Make sure to set the environment variables in your hosting platform's settings.

## Security

- All user data is isolated using Row Level Security (RLS)
- Authentication is handled by Supabase Auth
- File uploads are stored securely in Supabase Storage
- API keys use the anon key (safe for client-side use)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.
