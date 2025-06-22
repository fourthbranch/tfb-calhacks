# **************************************************************************
#  * Copyright (c) 2025 The Fourth Branch
#  * All Rights Reserved.
#  *
#  * This software contains proprietary and confidential information of The Fourth Branch.
#  * By using this software you agree to the terms of the associated License Agreement.
#  * Third party components are distributed under their respective licenses.
#  **************************************************************************

"""
This module is the main entry point for the API.
"""

from fastapi import HTTPException, Depends
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from backend.agent import topic_generator
from backend.app import app
from backend.security import get_api_key
from backend.db import supabase


@app.get("/")
def root() -> Dict[str, Any]:
    """Root endpoint for the API"""
    return {"message": "Hello, World!"}


@app.options("/{full_path:path}")
async def options_handler():
    """Handle OPTIONS requests for CORS preflight"""
    return {"message": "OK"}


@app.get("/cors-test")
def cors_test() -> Dict[str, Any]:
    """Test endpoint for CORS configuration"""
    return {"message": "CORS is working!", "status": "success"}


class ArticleListItem(BaseModel):
    id: int
    title: str
    summary: Optional[str] = None
    created_at: Optional[str] = None
    relevant_topics: Optional[list[str]] = None


class ArticlesResponse(BaseModel):
    user_preferred: List[ArticleListItem]
    explore: List[ArticleListItem]


class ArticleDetail(BaseModel):
    id: int
    title: str
    summary: Optional[str] = None
    content: str
    created_at: Optional[str] = None
    metadata: Optional[dict] = None
    relevant_topics: Optional[list[str]] = None
    bias: Optional[str] = None
    opposite_view: Optional[str] = None


class SubscribeRequest(BaseModel):
    email: str


class GenNewsWithRequestRequest(BaseModel):
    user_request: str
    user_email: Optional[str] = None  # Add user email for personalization


class UserCheckRequest(BaseModel):
    email: str


class UserCreateRequest(BaseModel):
    email: str
    preferred_topics: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    political_leaning: Optional[str] = None
    additional_info: Optional[str] = None
    preferred_writing_style: Optional[List[str]] = None


class UserUpdateRequest(BaseModel):
    preferred_topics: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    political_leaning: Optional[str] = None
    additional_info: Optional[str] = None
    preferred_writing_style: Optional[List[str]] = None


@app.get("/articles", response_model=ArticlesResponse)
def list_articles_display(request: Request, api_key: str = Depends(get_api_key)):
    # Get user email from request headers
    user_email = request.headers.get("user_email")
    print("reached server side, user email is:", user_email)
    if not user_email:
        raise HTTPException(
            status_code=401, detail="Unauthorized: Missing user email in headers")


    # Fetch articles from articles_new
    articles_res = supabase.table("articles_new").select(
        "id, title, summary, relevant_topics, topic_bias, opposite_view, report_id, preferred_writing_style"
    ).execute()

    if not articles_res.data:
        return []

    # Fetch created_at for each article using report_id
    articles_with_created_at = []
    for article in articles_res.data:
        report_res = supabase.table("reports").select("created_at").eq(
            "id", article["report_id"]).single().execute()
        if report_res.data:
            article["created_at"] = report_res.data["created_at"]
        else:
            # Handle case where report is not found
            article["created_at"] = None
        articles_with_created_at.append(article)

    # Sort articles by created_at in descending order
    articles_with_created_at.sort(key=lambda x: x["created_at"], reverse=True)

    # Fetch user preferences from the "users" table
    user_res = supabase.table("users").select(
        "preferred_topics, political_leaning, preferred_writing_style"
    ).eq("email", user_email).single().execute()

    if not user_res.data:
        raise HTTPException(status_code=404, detail="User not found")

    # Extract user preferences
    preferred_topics = user_res.data.get("preferred_topics", [])
    political_leaning = user_res.data.get("political_leaning", None)
    preferred_writing_style = user_res.data.get("preferred_writing_style", [])

    print("preferred_topics: ", preferred_topics)
    print(" political_leaning", political_leaning)
    print("preferred_writing_style", preferred_writing_style)

    # Define mapping for topic_bias to political_leaning
    bias_to_leaning = {
        "liberal": "left",
        "neutral": "neutral",
        "conservative": "right"
    }

    # Filter articles into user_preferred and explore
    user_preferred = []
    explore = []

    for article in articles_with_created_at:
        print(article)

        # Translate topic_bias to political_leaning
        article_political_leaning = bias_to_leaning.get(article.get("topic_bias"))

        print("article writing style:",  article.get("preferred_writing_style"))

        # Check if the article matches user preferences
        matches_topics = any(
            topic in preferred_topics for topic in article.get("relevant_topics"))
        matches_political_leaning = article_political_leaning == political_leaning
        matches_writing_style = article.get(
            "preferred_writing_style") == preferred_writing_style

        if matches_topics and matches_political_leaning and matches_writing_style:
            user_preferred.append(article)
        else:
            explore.append(article)

    # print(articles_with_created_at)

    # Return the filtered lists
    return {"user_preferred": user_preferred, "explore": explore}


@app.get("/articles/{article_id}", response_model=ArticleDetail)
def get_article(article_id: int, api_key: str = Depends(get_api_key)):
    # Increment page view counter robustly
    res = supabase.table("global_metrics").select("value").eq(
        "key", "total_page_views").limit(1).execute()
    if not res.data or len(res.data) == 0:
        # Insert with value 1 if not exists
        supabase.table("global_metrics").insert(
            {"key": "total_page_views", "value": 1}).execute()
    else:
        current = res.data[0]["value"]
        supabase.table("global_metrics").update(
            {"value": current + 1}).eq("key", "total_page_views").execute()

    res = supabase.table("articles_new").select(
        "*", count="exact").eq("id", article_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Article not found")
    report_res = supabase.table("reports").select("created_at").eq(
        "id", res.data["report_id"]).single().execute()
    if report_res.data:
        res.data["created_at"] = report_res.data["created_at"]
    else:
        res.data["created_at"] = None  # Handle case where report is not found

   return res.data


@app.get("/metrics/page_views")
def get_page_views(api_key: str = Depends(get_api_key)):
    res = supabase.table("global_metrics").select("value").eq(
        "key", "total_page_views").limit(1).execute()
    if not res.data or len(res.data) == 0:
        return {"value": 0}
    return {"value": res.data[0]["value"]}


@app.post("/subscribe")
def subscribe(request: SubscribeRequest, api_key: str = Depends(get_api_key)):
    # Validate email format
    if not "@" in request.email or not "." in request.email:
        raise HTTPException(status_code=400, detail="Invalid email format")

    # Check if email already exists
    res = supabase.table("subscribers").select(
        "email").eq("email", request.email).execute()
    if res.data and len(res.data) > 0:
        raise HTTPException(status_code=400, detail="Email already subscribed")

    # Add new subscriber
    try:
        supabase.table("subscribers").insert({
            "email": request.email
        }).execute()
        return {"message": "Successfully subscribed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to subscribe")


@app.get("/gen_news")
def gen_news(api_key: str = Depends(get_api_key)) -> Dict[str, Any]:
    """Generate a topic for a news article"""
    for _ in range(3):
        topic_generator()
    return {"message": "Generated news article"}


@app.get("/gen_news_with_request")
def gen_news_with_request(request: GenNewsWithRequestRequest,
                          api_key: str = Depends(get_api_key)) -> Dict[str, Any]:
    """Generate a topic for a news article with a user request"""
    three_article_ids = []
    for _ in range(3):
        article_id = topic_generator(user_request=request.user_request)
        if article_id != -1:
            three_article_ids.append(article_id)
    return {"article_ids": three_article_ids}


@app.post("/users/check")
def check_user(request: UserCheckRequest, api_key: str = Depends(get_api_key)):
    """Check if a user exists by email"""
    try:
        res = supabase.table("users").select(
            "id, email").eq("email", request.email).execute()
        if res.data and len(res.data) > 0:
            user = res.data[0]
            return {
                "exists": True,
                "onboarding_completed": True,  # Assume completed if user exists
                "user_id": user["id"]
            }
        else:
            return {"exists": False, "onboarding_completed": False}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to check user: {str(e)}")


@app.post("/users/create")
def create_user(request: UserCreateRequest, api_key: str = Depends(get_api_key)):
    """Create a new user"""
    try:
        # Check if user already exists
        existing = supabase.table("users").select(
            "id").eq("email", request.email).execute()
        if existing.data and len(existing.data) > 0:
            raise HTTPException(status_code=400, detail="User already exists")

        # Create new user
        user_data = {
            "email": request.email,
            "preferred_topics": request.preferred_topics or [],
            "locations": request.locations,
            "political_leaning": request.political_leaning,
            "additional_info": request.additional_info,
            "preferred_writing_style": request.preferred_writing_style
        }

        res = supabase.table("users").insert(user_data).execute()
        if res.data and len(res.data) > 0:
            return {
                "message": "User created successfully",
                "user_id": res.data[0]["id"]
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create user")
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")


@app.put("/users/{user_id}")
def update_user(user_id: int, request: UserUpdateRequest, api_key: str = Depends(get_api_key)):
    """Update user preferences"""
    try:
        update_data = {}
        if request.preferred_topics is not None:
            update_data["preferred_topics"] = request.preferred_topics
        if request.locations is not None:
            update_data["locations"] = request.locations
        if request.political_leaning is not None:
            update_data["political_leaning"] = request.political_leaning
        if request.additional_info is not None:
            update_data["additional_info"] = request.additional_info
        if request.preferred_writing_style is not None:
            update_data["preferred_writing_style"] = request.preferred_writing_style

        res = supabase.table("users").update(update_data).eq("id", user_id).execute()
        if res.data and len(res.data) > 0:
            return {"message": "User updated successfully"}
        else:
            raise HTTPException(status_code=404, detail="User not found")

    except HTTPException:
        raise HTTPException(status_code=401, detail="Unauthorized")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")

