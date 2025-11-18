# Google OAuth Setup Guide

## Error: redirect_uri_mismatch

This error occurs when the redirect URI configured in Google Cloud Console doesn't match what Supabase expects.

## Step-by-Step Setup

### 1. Find Your Supabase Project Reference

1. Go to your Supabase project dashboard
2. In the URL, you'll see something like: `https://supabase.com/dashboard/project/abcdefghijklmnop`
3. Or go to **Settings** > **API** in your Supabase dashboard
4. Your project URL will be: `https://abcdefghijklmnop.supabase.co`
5. Your callback URL will be: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`

**Important**: Replace `abcdefghijklmnop` with your actual project reference.

### 2. Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Go to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Choose **Web application**
6. In **Authorized redirect URIs**, add:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
   Replace `<your-project-ref>` with your Supabase project reference.

7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

### 3. Configure Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Google** and enable it
4. Enter your **Client ID** and **Client Secret** from Google Cloud Console
5. In **Redirect URL** field, you can add your app URL (optional):
   - For local development: `http://localhost:3000`
   - For production: `https://your-domain.vercel.app`

### 4. Configure Allowed Redirect URLs in Supabase

1. Go to **Authentication** > **URL Configuration**
2. Add your app URLs to **Redirect URLs**:
   - `http://localhost:3000/**` (for development)
   - `https://your-domain.vercel.app/**` (fonpr production)
   - The `/**` wildcard allows all paths under your domain

### 5. Verify Your Environment Variables

Make sure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Important Notes

- The redirect URI in Google Cloud Console **MUST** be Supabase's callback URL, not your app URL
- Supabase handles the OAuth callback and then redirects to your app
- The `redirectTo` parameter in the code tells Supabase where to redirect after authentication completes
- Make sure to add both development and production URLs in Supabase's URL Configuration

## Testing

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/login`
3. Click "Sign in with Google"
4. You should be redirected to Google for authentication
5. After authentication, you should be redirected back to your app

## Troubleshooting

If you still get redirect_uri_mismatch:
1. Verify the redirect URI in Google Cloud Console exactly matches: `https://<your-project-ref>.supabase.co/auth/v1/callback`
2. Check that your Supabase project reference is correct
3. Make sure there are no trailing slashes or extra characters
4. Wait a few minutes after making changes (Google can take time to propagate)
5. Clear your browser cache and cookies

