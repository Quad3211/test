# OmniCampus Deployment Guide

This guide walks you through deploying OmniCampus to production.

## Prerequisites

- [ ] GitHub account
- [ ] Vercel account (recommended) or other Next.js hosting
- [ ] Supabase account
- [ ] Domain name (optional but recommended)
- [ ] AI provider API key (OpenAI, Anthropic, or similar)

## Step 1: Set Up Supabase Project

### 1.1 Create New Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details:
   - **Name:** OmniCampus
   - **Database Password:** Generate a strong password
   - **Region:** Choose closest to Jamaica (US East recommended)

### 1.2 Run Database Migrations

1. Go to SQL Editor in Supabase Dashboard
2. Run migrations in this exact order:

**First:** `supabase/migrations/20240131_initial_schema.sql`
```sql
-- Copy and paste entire file contents
-- This creates all tables, indexes, and views
```

**Second:** `supabase/migrations/20240131_rls_policies.sql`
```sql
-- Copy and paste entire file contents
-- This sets up Row Level Security
```

**Third:** `supabase/migrations/20240131_seed_universities.sql`
```sql
-- Copy and paste entire file contents
-- This adds Jamaican universities
```

### 1.3 Configure Authentication

1. Go to Authentication > Settings
2. **Email Auth:**
   - Enable Email provider
   - Turn ON "Confirm email"
   - Set "Confirm email" template (customize if desired)

3. **URL Configuration:**
   - Add site URL: `https://your-domain.com`
   - Add redirect URLs:
     - `https://your-domain.com/auth/callback`
     - `http://localhost:3000/auth/callback` (for development)

### 1.4 Get API Keys

Go to Settings > API and note:
- **Project URL:** `https://xxxxx.supabase.co`
- **Anon/Public Key:** `eyJhbG...`
- **Service Role Key:** `eyJhbG...` (⚠️ Keep secret!)

## Step 2: Set Up Edge Functions (Optional but Recommended)

### 2.1 Install Supabase CLI

```bash
npm install -g supabase
supabase login
```

### 2.2 Link Project

```bash
cd omnicampus
supabase link --project-ref your-project-ref
```

### 2.3 Deploy Edge Functions

```bash
# Deploy moderation function
supabase functions deploy moderate_text --no-verify-jwt

# Deploy sentiment analysis
supabase functions deploy analyze_sentiment --no-verify-jwt

# Deploy trends updater
supabase functions deploy update_trends --no-verify-jwt

# Deploy support bot
supabase functions deploy support_bot --no-verify-jwt
```

### 2.4 Set Edge Function Secrets

```bash
supabase secrets set AI_PROVIDER_API_KEY=your_ai_api_key
```

## Step 3: Deploy to Vercel

### 3.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/omnicampus.git
git push -u origin main
```

### 3.2 Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repository
4. Configure project:
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### 3.3 Add Environment Variables

Add these in Vercel project settings:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
AI_PROVIDER_API_KEY=your_ai_key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

⚠️ **Security Note:** Service role key should ONLY be in server environment variables

### 3.4 Deploy

Click "Deploy" and wait for build to complete.

## Step 4: Configure Custom Domain (Optional)

### 4.1 In Vercel

1. Go to Project Settings > Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### 4.2 Update Environment Variables

Update `NEXT_PUBLIC_APP_URL` to your custom domain:
```env
NEXT_PUBLIC_APP_URL=https://omnicampus.edu.jm
```

### 4.3 Update Supabase Auth URLs

In Supabase Dashboard > Authentication > Settings:
- Update Site URL to your custom domain
- Update redirect URLs

## Step 5: Post-Deployment Configuration

### 5.1 Test Authentication Flow

1. Create a test account
2. Verify email confirmation works
3. Complete university onboarding
4. Test posting and voting

### 5.2 Create Initial Moderators

Run in Supabase SQL Editor:

```sql
-- Make a user a moderator (replace with actual user_id)
UPDATE public.profiles
SET role = 'moderator', is_verified = true
WHERE user_id = 'user-uuid-here';
```

### 5.3 Verify RLS Policies

Test that:
- [ ] Users can only see posts from their university
- [ ] Anonymous posts don't reveal author identity
- [ ] Moderators can access moderation dashboard
- [ ] Students cannot access moderation features

### 5.4 Set Up Monitoring

**Vercel:**
- Enable Error Tracking
- Set up deployment notifications

**Supabase:**
- Enable database backups (automatic on paid plans)
- Set up log retention
- Monitor API usage

## Step 6: AI Moderation Setup

### 6.1 Choose Provider

Options:
- **OpenAI** (GPT-4 for moderation)
- **Anthropic** (Claude for content analysis)
- **Google** (Perspective API for toxicity)
- **Open Source** (HuggingFace models)

### 6.2 Configure Edge Functions

Update edge function code with your provider's API:

```typescript
// In supabase/functions/moderate_text/index.ts
const response = await fetch('https://api.openai.com/v1/moderations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('AI_PROVIDER_API_KEY')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    input: content
  })
})
```

### 6.3 Test Moderation

1. Create a post with test harmful content
2. Verify it gets flagged
3. Check moderation logs
4. Test support bot triggers

## Step 7: Community Guidelines

### 7.1 Create Guidelines

Add to your app:
- Acceptable use policy
- Content guidelines
- Reporting procedures
- Appeals process

### 7.2 Set Up Moderation Team

1. Recruit trusted student moderators from each university
2. Provide moderation training
3. Set moderation SLAs (e.g., review reports within 24h)
4. Create moderator communication channel

## Step 8: Launch Checklist

Before public launch:

**Technical:**
- [ ] All migrations run successfully
- [ ] RLS policies tested and verified
- [ ] Authentication flow working
- [ ] Email confirmations sending
- [ ] Moderation queue functional
- [ ] Edge functions deployed
- [ ] Error tracking enabled
- [ ] Backups configured
- [ ] SSL certificate active
- [ ] Domain configured

**Content:**
- [ ] Community guidelines published
- [ ] FAQ page created
- [ ] Privacy policy posted
- [ ] Terms of service posted
- [ ] Support contact available

**Team:**
- [ ] Moderators trained
- [ ] Admin access configured
- [ ] Support process defined
- [ ] Escalation procedures documented

**Marketing:**
- [ ] Landing page ready
- [ ] Social media accounts created
- [ ] Launch announcement prepared
- [ ] University partnerships contacted

## Monitoring & Maintenance

### Daily Tasks
- Check moderation queue
- Monitor error logs
- Review user reports

### Weekly Tasks
- Review trends data
- Analyze user engagement
- Check system performance
- Update content guidelines if needed

### Monthly Tasks
- Review and update AI moderation rules
- Analyze growth metrics
- Plan feature improvements
- Backup database (in addition to automatic backups)

## Scaling Considerations

### Database
- Monitor connection pool usage
- Consider read replicas for high traffic
- Optimize slow queries

### Caching
- Implement Redis for hot data
- Cache university lists
- Cache user profiles

### CDN
- Use Vercel's Edge Network
- Cache static assets
- Optimize images

## Troubleshooting

### Users Can't Sign Up
- Check email provider configuration
- Verify redirect URLs
- Check Supabase logs

### RLS Errors
- Verify user has profile created
- Check university_id is set
- Test policies in SQL editor

### Moderation Not Working
- Check Edge Function logs
- Verify AI API key is set
- Test with manual moderation

### Performance Issues
- Enable database connection pooling
- Add database indexes
- Implement caching
- Use Vercel Analytics

## Support

- **Documentation:** Check README.md
- **Supabase:** [supabase.com/docs](https://supabase.com/docs)
- **Vercel:** [vercel.com/docs](https://vercel.com/docs)
- **Issues:** GitHub Issues

## Security Best Practices

1. **Never commit secrets to Git**
   - Use `.env.local` for development
   - Use Vercel/Supabase for production secrets

2. **Rotate keys regularly**
   - Service role key every 90 days
   - AI provider keys every 90 days

3. **Monitor for abuse**
   - Set up rate limit alerts
   - Review moderation logs
   - Track unusual activity

4. **Keep dependencies updated**
   ```bash
   npm audit
   npm update
   ```

5. **Regular security audits**
   - Review RLS policies
   - Test authentication flows
   - Penetration testing (when budget allows)

---

**Congratulations!** Your OmniCampus instance is now live. 🎉

For questions or issues, refer to the main README or open a GitHub issue.
