# Frontend API Authentication Setup

This document explains how to set up bearer token authentication for the frontend API calls.

## Environment Variable Setup

The frontend requires an API key to authenticate with the backend. You need to set the following environment variable:

### For Development

Create a `.env.local` file in the `frontend` directory:

```bash
NEXT_PUBLIC_API_KEY=your_api_key_here
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

### For Production

Set the environment variables in your deployment platform:

```bash
NEXT_PUBLIC_API_KEY=your_api_key_here
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
NEXT_PUBLIC_API_BASE=https://your-backend-domain.com
```

## API Key Requirements

- The API key must match the `API_KEY` environment variable set in your backend
- The key should be a secure, randomly generated string
- Never commit the actual API key to version control

## Authentication Implementation

The frontend now includes bearer token authentication for all API calls:

1. **Shared Authentication Utilities** (`app/lib/auth.ts`):

   - `getApiKey()`: Retrieves the API key from environment variables
   - `createAuthHeaders()`: Creates headers with bearer token authentication
   - `createAuthHeadersWithAccept()`: Creates headers with custom Accept header
   - `createAuthHeadersWithContentType()`: Creates headers with custom Content-Type

2. **Updated API Calls**:
   - All fetch requests now include the `Authorization: Bearer <api_key>` header
   - Authentication is handled automatically by the shared utilities

## Files Updated

The following files have been updated to include bearer token authentication:

- `app/lib/api.ts` - User management API calls
- `app/lib/articles.ts` - Article fetching API calls
- `app/components/sections/Chatbox.tsx` - News generation API calls
- `app/components/ui/NewsletterForm.tsx` - Newsletter subscription API calls
- `app/components/ui/Header.tsx` - Page views metrics API calls

## Error Handling

If the `NEXT_PUBLIC_API_KEY` environment variable is not set, the application will throw an error:

```
Error: API_KEY environment variable is not set
```

Make sure to set the environment variable before running the application.
