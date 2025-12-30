# Backend Architecture Diagram

## Current vs New Setup

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MIGRATION OVERVIEW                               │
└─────────────────────────────────────────────────────────────────────────┘

BEFORE MIGRATION                          AFTER MIGRATION
═══════════════════                       ═══════════════════

┌──────────────────────────┐             ┌──────────────────────────┐
│   OLD SUPABASE PROJECT   │             │   YOUR SUPABASE PROJECT  │
│  ztfsgljiqjzkkrajhnce    │             │    (your-project-id)     │
├──────────────────────────┤             ├──────────────────────────┤
│                          │             │                          │
│  📊 DATABASE             │             │  📊 DATABASE             │
│  ├─ bank_profiles        │────────────▶│  ├─ bank_profiles        │
│  ├─ statements           │   Migrated  │  ├─ statements           │
│  ├─ transactions         │             │  ├─ transactions         │
│  ├─ ai_insights          │             │  ├─ ai_insights          │
│  └─ transaction_audit_log│             │  └─ transaction_audit_log│
│                          │             │                          │
│  🔐 SECURITY             │             │  🔐 SECURITY             │
│  ├─ RLS Policies         │────────────▶│  ├─ RLS Policies         │
│  └─ Auth Rules           │             │  └─ Auth Rules           │
│                          │             │                          │
│  💾 STORAGE              │             │  💾 STORAGE              │
│  └─ statements bucket    │────────────▶│  └─ statements bucket    │
│                          │             │                          │
│  ⚡ EDGE FUNCTIONS       │             │  ⚡ EDGE FUNCTIONS       │
│  └─ process-statement    │────────────▶│  └─ process-statement    │
│                          │             │                          │
└──────────────────────────┘             └──────────────────────────┘
           │                                        │
           │ ❌ Old Connection                      │ ✅ New Connection
           │    (will be removed)                   │    (active)
           │                                        │
           └────────────────┬───────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │   FRONTEND APPLICATION   │
              │   (React + Vite)         │
              ├──────────────────────────┤
              │  📝 .env file            │
              │  ├─ VITE_SUPABASE_URL    │
              │  ├─ VITE_SUPABASE_KEY    │
              │  └─ VITE_PROJECT_ID      │
              └──────────────────────────┘
```

---

## Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE STRUCTURE                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│ bank_profiles   │
├─────────────────┤
│ • id            │
│ • user_id       │◄────────┐
│ • name          │         │
│ • bank_name     │         │
│ • account_type  │         │
└─────────────────┘         │
        │                   │
        │ 1:N               │
        ▼                   │
┌─────────────────┐         │
│ statements      │         │
├─────────────────┤         │
│ • id            │         │
│ • bank_profile_id│        │
│ • user_id       │◄────────┤
│ • filename      │         │
│ • status        │         │
│ • file_path     │         │
└─────────────────┘         │
        │                   │
        │ 1:N               │
        ▼                   │
┌─────────────────┐         │
│ transactions    │         │
├─────────────────┤         │
│ • id            │         │
│ • user_id       │◄────────┤
│ • statement_id  │         │
│ • amount        │         │
│ • description   │         │
│ • category      │         │
│ • merchant_name │         │
└─────────────────┘         │
                            │
┌─────────────────┐         │
│ ai_insights     │         │
├─────────────────┤         │
│ • id            │         │
│ • user_id       │◄────────┤
│ • insight_type  │         │
│ • title         │         │
│ • description   │         │
└─────────────────┘         │
                            │
┌─────────────────┐         │
│ audit_log       │         │
├─────────────────┤         │
│ • id            │         │
│ • user_id       │◄────────┘
│ • transaction_id│
│ • field_changed │
│ • old_value     │
│ • new_value     │
└─────────────────┘

All tables have RLS enabled ✅
All user_id fields reference auth.users
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION DATA FLOW                         │
└─────────────────────────────────────────────────────────────────┘

1. USER AUTHENTICATION
   ┌──────┐
   │ User │──▶ Sign Up/Login ──▶ Supabase Auth ──▶ JWT Token
   └──────┘

2. UPLOAD STATEMENT
   ┌──────┐
   │ User │──▶ Upload PDF ──▶ Storage Bucket ──▶ Create Statement Record
   └──────┘                                              │
                                                         ▼
                                                   Trigger Edge Function

3. PROCESS STATEMENT
   ┌────────────────┐
   │ Edge Function  │──▶ Parse PDF ──▶ Extract Transactions ──▶ Save to DB
   └────────────────┘

4. VIEW INSIGHTS
   ┌──────┐
   │ User │──▶ Query Transactions ──▶ Generate Insights ──▶ Display
   └──────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                               │
└─────────────────────────────────────────────────────────────────┘

Layer 1: AUTHENTICATION
├─ Supabase Auth (JWT)
├─ Email/Password
└─ Session Management

Layer 2: ROW LEVEL SECURITY (RLS)
├─ Users can only see their own data
├─ Enforced at database level
└─ Cannot be bypassed

Layer 3: STORAGE POLICIES
├─ User-specific folders
├─ Private file access
└─ Secure upload/download

Layer 4: API SECURITY
├─ Anon key for frontend
├─ Service role key for backend
└─ CORS configuration

┌─────────────────────────────────────────────────────────┐
│  RLS Policy Example:                                    │
│                                                         │
│  CREATE POLICY "Users can view their own transactions" │
│  ON transactions FOR SELECT                            │
│  USING (auth.uid() = user_id);                         │
│                                                         │
│  Result: User A cannot see User B's transactions ✅    │
└─────────────────────────────────────────────────────────┘
```

---

## Migration Process Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    MIGRATION STEPS                               │
└─────────────────────────────────────────────────────────────────┘

Step 1: SETUP
   ┌──────────────────┐
   │ Create Supabase  │──▶ Get Credentials ──▶ Save Securely
   │ Project          │
   └──────────────────┘

Step 2: CONFIGURE
   ┌──────────────────┐
   │ Update .env      │──▶ Update config.toml
   └──────────────────┘

Step 3: LINK
   ┌──────────────────┐
   │ supabase login   │──▶ supabase link
   └──────────────────┘

Step 4: MIGRATE DATABASE
   ┌──────────────────┐
   │ supabase db push │──▶ Creates Tables ──▶ Applies RLS ──▶ Creates Indexes
   └──────────────────┘

Step 5: DEPLOY FUNCTIONS
   ┌──────────────────┐
   │ supabase         │──▶ Deploy to Edge ──▶ Test Function
   │ functions deploy │
   └──────────────────┘

Step 6: TEST
   ┌──────────────────┐
   │ npm run dev      │──▶ Test Features ──▶ Verify Data
   └──────────────────┘

Step 7: DONE! 🎉
```

---

## File Structure

```
statement-insights/
│
├── 📄 Migration Documentation
│   ├── MIGRATION_START_HERE.md      ← Start here!
│   ├── MIGRATION_SUMMARY.md         ← Overview
│   ├── MIGRATION_GUIDE.md           ← Detailed steps
│   ├── MIGRATION_CHECKLIST.md       ← Track progress
│   ├── QUICK_COMMANDS.md            ← Command reference
│   └── ARCHITECTURE.md              ← This file
│
├── 🔧 Configuration
│   ├── .env                         ← Update with new credentials
│   └── supabase/
│       └── config.toml              ← Update project ID
│
├── 🗄️ Database
│   └── supabase/
│       └── migrations/
│           └── *.sql                ← Database schema
│
├── ⚡ Edge Functions
│   └── supabase/
│       └── functions/
│           └── process-statement/
│               └── index.ts         ← Statement processor
│
├── 🎨 Frontend
│   └── src/
│       ├── integrations/supabase/
│       │   ├── client.ts            ← Supabase client
│       │   └── types.ts             ← TypeScript types
│       └── ...
│
└── 🚀 Scripts
    └── migrate-backend.ps1          ← Automated migration
```

---

## Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                    TECH STACK                                    │
└─────────────────────────────────────────────────────────────────┘

FRONTEND
├─ React 18
├─ TypeScript
├─ Vite
├─ TailwindCSS
└─ shadcn/ui

BACKEND (Supabase)
├─ PostgreSQL (Database)
├─ PostgREST (Auto API)
├─ GoTrue (Authentication)
├─ Deno (Edge Functions)
└─ Storage (File uploads)

DEVELOPMENT
├─ Supabase CLI
├─ Node.js
└─ npm
```

---

## API Endpoints

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE ENDPOINTS                            │
└─────────────────────────────────────────────────────────────────┘

Base URL: https://[project-id].supabase.co

REST API
├─ /rest/v1/bank_profiles          (GET, POST, PATCH, DELETE)
├─ /rest/v1/statements             (GET, POST, PATCH, DELETE)
├─ /rest/v1/transactions           (GET, POST, PATCH, DELETE)
├─ /rest/v1/ai_insights            (GET, POST, PATCH, DELETE)
└─ /rest/v1/transaction_audit_log  (GET, POST)

Authentication
├─ /auth/v1/signup                 (POST)
├─ /auth/v1/token                  (POST)
└─ /auth/v1/logout                 (POST)

Storage
├─ /storage/v1/object/statements   (GET, POST, DELETE)
└─ /storage/v1/bucket/statements   (GET)

Edge Functions
└─ /functions/v1/process-statement (POST)
```

---

## Performance Optimizations

```
┌─────────────────────────────────────────────────────────────────┐
│                    OPTIMIZATIONS                                 │
└─────────────────────────────────────────────────────────────────┘

DATABASE INDEXES
✅ idx_transactions_user_date       (Fast user queries)
✅ idx_transactions_bank_profile    (Fast profile queries)
✅ idx_transactions_category        (Fast category filtering)
✅ idx_transactions_hash            (Duplicate detection)
✅ idx_statements_bank_profile      (Fast statement lookup)
✅ idx_ai_insights_user             (Fast insights retrieval)

CACHING
✅ Browser caching for static assets
✅ Supabase connection pooling
✅ Edge function cold start optimization

SECURITY
✅ RLS at database level (no API bypass)
✅ JWT token validation
✅ Secure storage policies
```

---

This architecture ensures:
- 🔒 **Security**: Multi-layer protection
- ⚡ **Performance**: Optimized queries and indexes
- 📈 **Scalability**: Serverless architecture
- 🛠️ **Maintainability**: Clear separation of concerns
- 💰 **Cost-effective**: Free tier sufficient for personal use
