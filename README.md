# Met Guide

A lightweight, mobile-first web companion for the Met Museum.

## Features

- **AI-Powered Narrations**: Get engaging audio guides for any artwork using GPT-4o-mini and OpenAI TTS
- **Artwork Identification**: Scan artworks with your camera to identify them using GPT-4o Vision
- **Curated Tours**: Browse pre-built tours through the museum's highlights
- **Mobile-First Design**: Optimized for use while walking through the museum

## Getting Started (Local Development)

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp env.example .env.local
```

Edit `.env.local` and add your API keys:
- `OPENAI_API_KEY` - Required for narrations and artwork identification
- Upstash Redis credentials are optional for local development (falls back to in-memory cache)

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Deployment (Vercel)

### Prerequisites

1. **OpenAI API Key**: Get one from [platform.openai.com](https://platform.openai.com/api-keys)
2. **Upstash Redis**: Create a free database at [upstash.com](https://upstash.com)
3. **GitHub Repository**: Push your code to GitHub

### Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project" and import your repository
3. Add the following environment variables in Vercel's dashboard:

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | Yes |
| `NEXT_PUBLIC_BASE_URL` | Your Vercel app URL (e.g., `https://met-guide.vercel.app`) | Yes |

4. Click "Deploy"

### Environment Variables

Copy `env.example` to `.env.local` for local development. See the file for detailed descriptions of each variable.

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Client App    │────▶│  Vercel Edge    │────▶│   OpenAI API    │
│   (Next.js)     │     │  (API Routes)   │     │  (GPT-4o, TTS)  │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  Upstash Redis  │     │  Met Museum API │
                        │  (Cache + Rate) │     │  (Collection)   │
                        └─────────────────┘     └─────────────────┘
```

### Cost Estimates

- **Vercel**: Free tier includes 100GB bandwidth and serverless functions
- **Upstash Redis**: Free tier includes 10K commands/day
- **OpenAI**: 
  - Narrations (GPT-4o-mini): ~$0.002 per narration
  - Text-to-Speech: ~$0.015 per audio generation
  - Image Identification (GPT-4o): ~$0.01 per scan

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/object/random` - Get a random artwork from Met highlights
- `GET /api/object/[id]` - Get specific artwork details
- `GET /api/narrate?id=<objectId>` - Generate AI narration for an artwork
- `GET /api/tts?id=<objectId>&text=<narration>` - Generate audio from narration
- `POST /api/identify` - Identify artwork from camera image
- `GET /api/tours` - Get available tours

## Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **AI**: OpenAI (GPT-4o-mini, GPT-4o Vision, TTS)
- **Cache**: Upstash Redis
- **Rate Limiting**: Upstash Ratelimit
- **Analytics**: Vercel Analytics
- **Deployment**: Vercel
