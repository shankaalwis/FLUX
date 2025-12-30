# Supabase Migration Checklist

## Pre-Migration
- [ ] Create a new Supabase project at https://supabase.com/dashboard
- [ ] Save your database password securely
- [ ] Copy Project ID, URL, and Anon Key
- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Ensure Docker Desktop is running (for local development)

## Migration Steps
- [ ] Update `.env` with new credentials
- [ ] Update `supabase/config.toml` with new project ID
- [ ] Login to Supabase CLI: `supabase login`
- [ ] Link project: `supabase link --project-ref YOUR_PROJECT_ID`
- [ ] Push migrations: `supabase db push`
- [ ] Deploy Edge Function: `supabase functions deploy process-statement`

## Verification
- [ ] Check database tables in Supabase Dashboard → Table Editor
- [ ] Verify RLS policies are enabled
- [ ] Check storage bucket exists (Dashboard → Storage)
- [ ] Verify Edge Function deployed (Dashboard → Edge Functions)
- [ ] Test authentication (sign up/login)
- [ ] Test creating a bank profile
- [ ] Test uploading a statement
- [ ] Test viewing transactions

## Optional: Data Migration
- [ ] Export data from old project
- [ ] Import data to new project
- [ ] Verify data integrity
- [ ] Test with migrated data

## Post-Migration
- [ ] Test all application features
- [ ] Update team with new credentials (if applicable)
- [ ] Set up database backups in Supabase Dashboard
- [ ] Configure usage alerts
- [ ] Update documentation
- [ ] Delete old project (when ready)

## Credentials Reference

### Old Project
- Project ID: `ztfsgljiqjzkkrajhnce`
- URL: `https://ztfsgljiqjzkkrajhnce.supabase.co`

### New Project
- Project ID: `_________________`
- URL: `_________________`
- Anon Key: `_________________`
- Database Password: `_________________` (keep secure!)

## Notes
_Add any notes or issues encountered during migration:_

---

**Migration Date:** _______________
**Completed By:** _______________
