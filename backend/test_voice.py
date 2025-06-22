#!/usr/bin/env python3
"""
Test script for voice generation functionality
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the current directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from voice_service import generate_podcast_script, generate_podcast_audio

def test_voice_generation():
    """Test the voice generation functionality"""

    # Check if OpenAI API key is set
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ OPENAI_API_KEY not found in environment variables")
        print("Please set your OpenAI API key in the .env file")
        return False

    print("✅ OpenAI API key found")

    # Test data
    test_article = {
        "title": "AI Breakthrough in Medical Diagnosis",
        "summary": "Researchers have developed a new AI system that can diagnose diseases with 95% accuracy, potentially revolutionizing healthcare.",
        "content": "A team of researchers at Stanford University has developed an artificial intelligence system that can diagnose various diseases with unprecedented accuracy. The system, which uses deep learning algorithms trained on millions of medical images, has achieved a 95% accuracy rate in preliminary tests. This breakthrough could significantly reduce diagnostic errors and improve patient outcomes worldwide.",
        "user_additional_info": "I'm a healthcare worker interested in technology that can improve patient care."
    }

    print("\n🧪 Testing podcast script generation...")

    try:
        # Test script generation
        script = generate_podcast_script(
            article_title=test_article["title"],
            article_summary=test_article["summary"],
            article_content=test_article["content"],
            user_additional_info=test_article["user_additional_info"]
        )

        print("✅ Script generation successful!")
        print(f"📝 Generated script ({len(script.split())} words):")
        print(f"   '{script}'")

        # Test audio generation
        print("\n🎵 Testing audio generation...")
        audio_result = generate_podcast_audio(
            article_title=test_article["title"],
            article_summary=test_article["summary"],
            article_content=test_article["content"],
            user_additional_info=test_article["user_additional_info"]
        )

        if "error" in audio_result:
            print(f"❌ Audio generation failed: {audio_result['error']}")
            return False

        print("✅ Audio generation successful!")
        print(f"🎧 Audio data length: {len(audio_result['audio_data'])} characters")
        print(f"⏱️  Estimated duration: {audio_result['duration_estimate']:.1f} seconds")

        # Save test audio file
        import base64
        audio_data = base64.b64decode(audio_result['audio_data'])
        with open("test_audio.mp3", "wb") as f:
            f.write(audio_data)

        print("💾 Test audio saved as 'test_audio.mp3'")

        return True

    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False

if __name__ == "__main__":
    print("🎤 Testing Voice Generation System")
    print("=" * 40)

    success = test_voice_generation()

    if success:
        print("\n🎉 All tests passed! Voice generation is working correctly.")
    else:
        print("\n💥 Tests failed. Please check the error messages above.")
        sys.exit(1)