# Band Calendar Application

A calendar application specifically designed for bands to manage their availability and collaborate with other bands.

## Features

- **Band Management**: Band leaders can create and manage multiple bands
- **Availability Calendar**: Manage availability for the next 6 months (all days of the week)
- **Bandmate Collaboration**: Share calendar links with bandmates who can mark their unavailability
- **Calendar Submission**: Submit calendars to make them visible to other band leaders
- **Bill Requests**: Request to join other bands on their bills and accept/reject requests
- **Main Calendar View**: View all submitted band calendars in one place

## Tech Stack

- **Frontend**: Next.js 14+ with App Router, React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL database, Auth, Storage)
- **Authentication**: Google OAuth via Supabase Auth
- **Deployment**: Vercel

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- A Supabase account
- A Google OAuth application (for authentication)
- A Vercel account (for deployment)

### 2. Clone and Install

```bash
npm install
```

### 3. Supabase Setup

1. Create a new Supabase project
2. Run the SQL migrations in `supabase/migrations/`:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_functions.sql`
3. Enable Google OAuth in Supabase:
   - Go to Authentication > Providers
   - Enable Google provider
   - Add your Google OAuth credentials

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Deployment

### Vercel Deployment

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Add environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (your Vercel deployment URL)
4. Update Supabase OAuth redirect URL to include your Vercel URL
5. Deploy

## Database Schema

The application uses the following main tables:

- `bands`: Stores band information
- `band_calendars`: Stores band availability for specific dates
- `bandmates`: Stores bandmate token information
- `bandmate_availability`: Stores bandmate unavailability
- `bill_requests`: Stores bill requests between bands

## Usage

1. **Band Leaders**: Sign in with Google OAuth to create and manage bands
2. **Create Band**: Create a band and manage its calendar
3. **Share with Bandmates**: Generate shareable links for bandmates
4. **Submit Calendar**: Submit your calendar to make it visible to other bands
5. **Request Bills**: View other bands' calendars and request to join their bills
6. **Manage Requests**: Accept or reject bill requests

## License

MIT

