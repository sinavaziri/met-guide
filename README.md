# Met Guide

A lightweight, mobile-first web companion for the Met Museum.

## Milestone 0 - The Steel Thread ✅

This milestone establishes the basic scaffold:
- Health check API endpoint
- Random object API endpoint (fetches from Met Museum API)
- Home page displaying a random object
- Tailwind CSS with mobile-first design
- Next.js Image optimization configured for Met Museum images

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (optional - Met API works without a key for public endpoints):
```bash
cp .env.example .env
# Edit .env if needed
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

- `GET /api/health` - Returns health status
- `GET /api/object/random` - Returns a random object from the Met Museum collection (currently hardcoded to The Temple of Dendur)

## Testing

Run the test suite to verify Milestone 0 features:

```bash
npm test
```

Run tests in watch mode during development:

```bash
npm run test:watch
```

### Test Coverage

The test suite includes:
- **API Health Endpoint** (`__tests__/api/health.test.ts`) - ✅ Verifies health check returns correct status
- **API Random Object Endpoint** (`__tests__/api/object/random.test.ts`) - ✅ Verifies Met API connectivity and error handling
- **Home Page** (`__tests__/pages/home.test.tsx`) - ⚠️ Tests written but have known limitations (see below)
- **Next.js Configuration** (`__tests__/config/next.config.test.ts`) - ✅ Verifies image remotePatterns configuration
- **Integration Tests** (`__tests__/milestone0.test.ts`) - ✅ Comprehensive milestone verification

### Known Test Limitations

**Async Server Component Testing:**
The home page tests currently fail due to a limitation with testing Next.js 14+ async server components using React Testing Library. The async server component returns a Promise that React cannot directly render in the test environment.

**Verification Methods:**
- ✅ API endpoint tests verify data fetching works correctly
- ✅ Integration tests verify project structure and configuration
- ✅ Manual/E2E testing recommended for full page rendering verification

See `__tests__/README.md` for more details on test limitations and workarounds.

## Deployment

For production deployment (e.g., Vercel), set the `NEXT_PUBLIC_BASE_URL` environment variable to your production URL.





