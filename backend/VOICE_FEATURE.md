# Voice AI Podcast Feature

This feature generates personalized podcast-style audio clips for news articles using OpenAI's text-to-speech API.

## Overview

The voice AI feature creates short (under 30 seconds) podcast clips that:

- Generate on-the-fly based on article content and user preferences
- Use a Daily Show-style conversational tone
- Include personalized context when user has `additional_info`
- Provide both audio playback and transcript display

## Components

### Backend

1. **`voice_service.py`** - Core voice generation service

   - `generate_podcast_script()` - Creates conversational scripts
   - `generate_podcast_audio()` - Generates audio using OpenAI TTS

2. **`main.py`** - API endpoint

   - `POST /articles/{article_id}/podcast-audio` - Generates podcast audio

3. **`test_voice.py`** - Test script to verify functionality

### Frontend

1. **`PodcastPlayer.tsx`** - Audio player component with:

   - Play/pause controls
   - Progress bar with seeking
   - Transcript display
   - Loading states

2. **`articles.ts`** - API client function

   - `getPodcastAudio()` - Fetches podcast audio from backend

3. **Article page** - Integrated podcast player display

## Setup

### Environment Variables

Add to your `.env` file:

```
OPENAI_API_KEY=your_openai_api_key_here
```

### Dependencies

The feature requires:

- `openai==1.52.0` - OpenAI API client
- `python-dotenv` - Environment variable loading

## Usage

### Testing

Run the test script to verify setup:

```bash
cd backend
python test_voice.py
```

This will:

- Check for OpenAI API key
- Generate a test script and audio
- Save test audio as `test_audio.mp3`

### API Usage

```javascript
// Frontend example
const audio = await getPodcastAudio(articleId, userEmail);
if (audio) {
  // audio.audio_data - Base64 encoded MP3
  // audio.transcript - Generated script
  // audio.duration_estimate - Estimated duration in seconds
}
```

### Backend API

```bash
POST /articles/{article_id}/podcast-audio
Content-Type: application/json
Authorization: Bearer {api_key}

{
  "user_email": "user@example.com"
}
```

Response:

```json
{
  "audio_data": "base64_encoded_mp3_data",
  "transcript": "Generated podcast script",
  "duration_estimate": 25.5
}
```

## Features

### Script Generation

- Uses GPT-4o-mini to create conversational scripts
- Optimized for ~30 seconds (under 75 words)
- Daily Show-style humor and engagement
- Personalized based on user's `additional_info`

### Audio Generation

- Uses OpenAI's TTS-1 model with "alloy" voice
- MP3 format with base64 encoding for easy transmission
- Configurable speed and voice options

### User Experience

- Automatic generation when viewing articles
- Loading states and error handling
- Full audio controls (play, pause, seek)
- Transcript display for accessibility

## Customization

### Voice Options

Available OpenAI TTS voices:

- `alloy` (default) - Balanced, professional
- `echo` - Warm, friendly
- `fable` - Storytelling
- `onyx` - Deep, authoritative
- `nova` - Bright, energetic
- `shimmer` - Soft, gentle

### Script Style

Modify the prompt in `generate_podcast_script()` to change:

- Tone and style
- Length and structure
- Personalization approach

### Audio Settings

Adjust in `generate_podcast_audio()`:

- Voice selection
- Speed (0.25 to 4.0)
- Output format

## Error Handling

The system gracefully handles:

- Missing OpenAI API key
- API rate limits
- Network failures
- Invalid article IDs
- Missing user data

Fallback behavior:

- Returns error messages in response
- Shows loading states in UI
- Logs errors for debugging

## Performance

- Audio generation: ~2-5 seconds
- Script generation: ~1-2 seconds
- Total response time: ~3-7 seconds
- Audio file size: ~50-100KB per clip

## Security

- API key stored in environment variables
- User authentication required
- Rate limiting recommended
- Audio data transmitted securely

## Future Enhancements

Potential improvements:

- Audio caching to reduce API calls
- Multiple voice options per user
- Background music/sound effects
- Audio download functionality
- Voice cloning for personalization
