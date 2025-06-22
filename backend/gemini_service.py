import os
import google.generativeai as genai
from typing import Optional

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


def generate_impact_analysis(
    article_title: str,
    article_summary: str,
    article_content: str,
    user_additional_info: str
) -> str:
    """
    Generate a personalized "How will this impact you" section using Gemini API.

    Args:
        article_title: The title of the article
        article_summary: The summary of the article
        article_content: The full content of the article
        user_additional_info: User's additional information from onboarding

    Returns:
        A personalized impact analysis string
    """

    # Create the Gemini model
    model = genai.GenerativeModel('gemini-1.5-flash')

    # Construct the prompt
    prompt = f"""
    You are a news analyst helping readers understand how current events might personally impact them.

    Article Title: {article_title}
    Article Summary: {article_summary}

    User's Personal Context: {user_additional_info}

    Based on the article content and the user's personal context, write a brief, personalized "How will this impact you" section.

    Guidelines:
    1. Keep it concise (2-3 sentences maximum)
    2. Make it personal and relevant to the user's context
    3. If the story is very generalized and doesn't have clear personal impact, say something like "This is a broad national/international story that may not have direct personal impact on your daily life, but it's important to stay informed about major developments."
    4. Use a conversational, helpful tone
    5. Focus on practical implications when possible

    Write only the impact analysis, no additional formatting or labels.
    """

    try:
        # Generate the response
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Error generating impact analysis: {e}")
        return "This story may have broader implications for society, but its direct personal impact depends on your specific circumstances and interests."
