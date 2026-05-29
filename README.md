# Screenvault

Screenvault is a personal watch tracker and recommendation assistant built with Next.js, React, Tailwind CSS, and Supabase. It lets users log movies and series, rate them, and receive personalized recommendations powered by a Groq-compatible AI chat endpoint.

## Features

- User authentication with Supabase
- Personal diary of watched movies and TV shows
- Ratings: `Skip`, `Mid`, `Great`, `Masterpiece`
- Personalized recommendation and chat assistant using Supabase Edge Functions + Groq API
- Responsive Next.js app with Tailwind CSS styling
- TMDB image support for media artwork

## Getting Started

### Requirements

- Node.js 20+ or compatible version
- npm, pnpm, or yarn
- Supabase project with Auth and a `diary_entries` table
- Groq API key for AI chat

### Install dependencies

```bash
npm install
```

### Environment variables

Create a `.env.local` file in the project root and add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
NEXT_PUBLIC_TMDB_API_KEY=your-tmdb-api-key
```

For the Supabase Edge Function in `src/lib/supabase/functions/chat/index.ts`, add these environment variables in your Supabase function configuration:

```env
GROQ_API_KEY=your-groq-api-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Run locally

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Available Scripts

- `npm run dev` — start the Next.js development server
- `npm run build` — build the production app
- `npm run start` — start the production server after build
- `npm run lint` — run ESLint

## Project Structure

- `app/` — Next.js App Router pages and API routes
- `src/lib/supabase/` — Supabase client, auth helpers, and server functions
- `src/lib/tmdb.ts` — TMDB integration
- `src/components/` — UI components for chat, diary, search, profile, and layout
- `public/` — static assets
- `next.config.js` — Next.js config and remote image settings

## Supabase Notes

- Authentication uses Supabase auth tokens
- Diary entries are stored in `diary_entries`
- The chat function fetches the authenticated user’s diary entries and forwards them to the Groq AI endpoint

## Deployment

This app can deploy on Vercel or any platform that supports Next.js. If using Vercel, make sure to configure your environment variables in the project settings.

## Contributing

Feel free to open issues or create pull requests.

## License

This project does not include a license file by default. Add one if you want to share it publicly.
