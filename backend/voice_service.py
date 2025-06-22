import os
import base64
import tempfile
from typing import Optional


def get_openai_client():
    """Get OpenAI client with proper error handling"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set")

    from openai import OpenAI
    return OpenAI(api_key=api_key)


def generate_podcast_audio(
    article_title: str,
    article_summary: str,
    article_content: str,
    user_additional_info: Optional[str] = None
) -> dict:
    """
    Generate a podcast-style audio clip using OpenAI's text-to-speech API.

    Args:
        article_title: The title of the article
        article_summary: The summary of the article
        article_content: The full content of the article
        user_additional_info: User's additional information from onboarding (optional)

    Returns:
        Dictionary containing audio data and transcript
    """

    # Generate the podcast script
    script = generate_podcast_script(
        article_title,
        article_summary,
        article_content,
        user_additional_info
    )

    try:
        # Get OpenAI client
        client = get_openai_client()

        # Generate audio using OpenAI TTS
        response = client.audio.speech.create(
            model="tts-1",
            voice="alloy",  # Choose from: alloy, echo, fable, onyx, nova, shimmer
            input=script,
            speed=1.0  # Adjust speed if needed (0.25 to 4.0)
        )

        # Convert audio to base64 for easy transmission
        audio_data = response.content
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')

        return {
            "audio_data": audio_base64,
            "transcript": script,
            # Rough estimate: 150 words per minute
            "duration_estimate": len(script.split()) / 150 * 60
        }

    except ValueError as e:
        print(f"Configuration error: {e}")
        return {
            "error": f"OpenAI API key not configured: {str(e)}",
            "transcript": script
        }
    except Exception as e:
        print(f"Error generating audio: {e}")
        return {
            "error": f"Failed to generate audio: {str(e)}",
            "transcript": script
        }


def generate_podcast_script(
    article_title: str,
    article_summary: str,
    article_content: str,
    user_additional_info: Optional[str] = None
) -> str:
    """
    Generate a podcast script in Daily Show style.

    Args:
        article_title: The title of the article
        article_summary: The summary of the article
        article_content: The full content of the article
        user_additional_info: User's additional information from onboarding (optional)

    Returns:
        A podcast script optimized for ~30 seconds of audio
    """

    # Create a prompt for generating the script
    prompt = f"""
    Create a 30-second podcast script in the style of The Daily Show with Jon Stewart/Trevor Noah.

    Article Title: {article_title}
    Article Summary: {article_summary}

    User Context: {user_additional_info if user_additional_info else "General audience"}

    Requirements:
    1. Keep it under 75 words (for ~30 seconds at normal speaking pace)
    2. Start with a witty hook or observation
    3. Use conversational, engaging language
    4. Include a touch of humor or satire
    5. Make it personal if user context is available
    6. End with a thought-provoking question or statement
    7. Use contractions and natural speech patterns
    8. Avoid complex jargon - keep it accessible

    Write only the script, no additional formatting or labels.
    """

    try:
        # Get OpenAI client
        client = get_openai_client()

        # Use OpenAI to generate the script
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a witty podcast host in the style of The Daily Show. Create engaging, conversational scripts that are perfect for audio delivery."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=200,
            temperature=0.8
        )

        script = response.choices[0].message.content.strip()

        # Ensure the script is not too long
        word_count = len(script.split())
        if word_count > 75:
            # Truncate if too long
            words = script.split()[:75]
            script = " ".join(words) + "..."

        return script

    except ValueError as e:
        print(f"Configuration error: {e}")
        # Fallback script
        return f"Breaking news: {article_title}. {article_summary[:100]}... This is the kind of story that makes you wonder what's really going on behind the scenes. Stay tuned for more updates."
    except Exception as e:
        print(f"Error generating script: {e}")
        # Fallback script
        return f"Breaking news: {article_title}. {article_summary[:100]}... This is the kind of story that makes you wonder what's really going on behind the scenes. Stay tuned for more updates."
