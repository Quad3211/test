# OmniCampus - Quick Start Guide

Get OmniCampus running locally in 10 minutes!

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works fine)

## 1. Install Dependencies (2 minutes)

```bash
cd omnicampus
npm install
```

## 2. Set Up Supabase (3 minutes)

### Create Project
1. Go to [supabase.com](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose a name and generate a password
4. Wait for project to initialize (~2 minutes)

### Run Migrations
1. Click "SQL Editor" in sidebar
2. Copy and paste each migration file:
   - First: `supabase/migrations/20240131_initial_schema.sql`
   - Second: `supabase/migrations/20240131_rls_policies.sql`
   - Third: `supabase/migrations/20240131_seed_universities.sql`
3. Click "Run" after pasting each one

### Configure Auth
1. Go to "Authentication" > "Settings"
2. Under "Email Auth Settings":
   - Enable "Confirm email"
3. Under "URL Configuration":
   - Site URL: `http://localhost:3000`
   - Add redirect URL: `http://localhost:3000/auth/callback`

### Get Your Keys
1. Go to "Settings" > "API"
2. Note down:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key

## 3. Configure Environment (2 minutes)

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
AI_PROVIDER_API_KEY=optional_for_now
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4. Start the App (1 minute)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 5. Create Your First Account (2 minutes)

1. Click "Sign up"
2. Enter:
   - Name: Your name
   - Email: your.email@university.edu
   - Password: Choose a secure password
3. Check your email for confirmation link
4. Click the link to verify
5. Select your university
6. You're in! 🎉

## Testing the Features

### Create a Post
1. Click "New" in bottom navigation
2. Toggle anonymity ON
3. Write some content
4. Post!

### Try Voting
- Click up/down arrows on posts
- Your vote is saved

### Test Reporting
- Click the flag icon on any post
- Select a reason
- Submit report

### Moderation (Admin Only)
To make yourself a moderator:

```sql
-- Run in Supabase SQL Editor
UPDATE public.profiles
SET role = 'moderator'
WHERE user_id = 'your-user-id-from-auth-users-table';
```

Then refresh and visit `/moderation`

## Troubleshooting

### "Failed to sign up"
- Check Supabase migrations ran successfully
- Verify email confirmation is enabled
- Check environment variables are set

### "Cannot create post"
- Make sure you confirmed your email
- Verify you selected a university in onboarding
- Check `is_verified` is `true` in your profile

### "University not found"
- Run the seed migration: `20240131_seed_universities.sql`
- Check universities table has data

### Database Connection Errors
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- Restart the dev server

## Next Steps

### Add AI Moderation
1. Get an API key from OpenAI or Anthropic
2. Add to `.env.local`: `AI_PROVIDER_API_KEY=xxx`
3. Deploy Edge Function: `supabase functions deploy moderate_text`
4. See `DEPLOYMENT.md` for details

### Customize Universities
Edit `supabase/migrations/20240131_seed_universities.sql` and re-run

### Deploy to Production
See `DEPLOYMENT.md` for full deployment guide

## Common Tasks

### Reset Database
```sql
-- In Supabase SQL Editor
-- WARNING: This deletes all data!
TRUNCATE public.posts CASCADE;
TRUNCATE public.comments CASCADE;
TRUNCATE public.profiles CASCADE;
-- Universities will remain
```

### Make User an Admin
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE user_id = 'user-uuid';
```

### Check RLS Policies
```sql
-- See all policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

## Development Tips

### Hot Reload
The app hot-reloads when you edit files. No need to restart!

### TypeScript Errors
```bash
npm run build
# Fix any type errors shown
```

### Database Schema Changes
1. Create new migration file in `supabase/migrations/`
2. Run it in Supabase SQL Editor
3. Update `types/database.ts` if needed

## Support

- **README:** Full documentation
- **DEPLOYMENT:** Production deployment guide
- **Issues:** [GitHub Issues](https://github.com/yourusername/omnicampus/issues)

---

**You're all set!** Start building the voice for Jamaican universities. 🎓
