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
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from .agent.run import topic_generator
from .app import app
from .security import get_api_key
from .db import supabase


@app.get("/")
def root(api_key: str = Depends(get_api_key)) -> Dict[str, Any]:
    """Root endpoint for the API"""
    return {"message": "Hello, World!"}


class ArticleListItem(BaseModel):
    id: int
    title: str
    summary: Optional[str] = None
    created_at: Optional[str] = None
    relevant_topics: Optional[list[str]] = None


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


@app.get("/articles", response_model=List[ArticleListItem])
def list_articles(api_key: str = Depends(get_api_key)):
    # Fetch articles with created_at using a JOIN query
    try:
        articles_res = supabase.table("articles_new").select(
            "id, title, summary, relevant_topics, bias, opposite_view, report_id, reports!inner(created_at)"
        ).execute()

        if not articles_res.data:
            return []

        # Transform the data to flatten the nested reports structure
        articles_with_created_at = []
        for article in articles_res.data:
            # Extract created_at from the nested reports object
            created_at = article.get("reports", {}).get(
                "created_at") if article.get("reports") else None

            # Create the flattened article object
            article_item = {
                "id": article["id"],
                "title": article["title"],
                "summary": article.get("summary"),
                "relevant_topics": article.get("relevant_topics"),
                "bias": article.get("bias"),
                "opposite_view": article.get("opposite_view"),
                "created_at": created_at
            }
            articles_with_created_at.append(article_item)

        # Sort articles by created_at in descending order
        articles_with_created_at.sort(
            key=lambda x: x["created_at"] or "", reverse=True)

        # Print the first article for debugging
        if articles_with_created_at:
            print(
                f"First article with created_at: {articles_with_created_at[0]}")

        return articles_with_created_at

    except Exception as e:
        print(f"Error fetching articles: {e}")
        # Return empty list on error to prevent 500 errors
        return []


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

    try:
        # Fetch article with created_at using a JOIN query
        res = supabase.table("articles_new").select(
            "*, reports!inner(created_at)"
        ).eq("id", article_id).single().execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="Article not found")

        # Extract created_at from the nested reports object
        created_at = res.data.get("reports", {}).get(
            "created_at") if res.data.get("reports") else None

        # Create the article detail object
        article_detail = {
            "id": res.data["id"],
            "title": res.data["title"],
            "summary": res.data.get("summary"),
            "content": res.data["content"],
            "created_at": created_at,
            "metadata": res.data.get("metadata"),
            "relevant_topics": res.data.get("relevant_topics"),
            "bias": res.data.get("bias"),
            "opposite_view": res.data.get("opposite_view")
        }

        return article_detail

    except Exception as e:
        print(f"Error fetching article {article_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch article")


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


@app.post("/gen_news_with_request")
def gen_news_with_request(request: GenNewsWithRequestRequest, api_key: str = Depends(get_api_key)) -> Dict[str, Any]:
    """Generate a topic for a news article with a user request and preferences"""
    article_ids = []

    # Try to find user by email for personalization
    user_id = -1  # Default to anonymous
    if request.user_email:
        try:
            user_res = supabase.table("users").select(
                "id").eq("email", request.user_email).execute()
            if user_res.data and len(user_res.data) > 0:
                user_id = user_res.data[0]["id"]
                print(f"Found user {user_id} for email {request.user_email}")
            else:
                print(
                    f"No user found for email {request.user_email}, using anonymous mode")
        except Exception as e:
            print(f"Error looking up user: {e}, using anonymous mode")

    for _ in range(1):
        article_id = topic_generator(
            user_id=user_id, user_request=request.user_request)
        article_id = topic_generator(
            user_id=user_id, user_request=request.user_request)
        if article_id != -1:
            article_ids.append(article_id)

    return {"article_ids": article_ids}


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
            raise HTTPException(
                status_code=500, detail="Failed to create user")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create user: {str(e)}")


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

        res = supabase.table("users").update(
            update_data).eq("id", user_id).execute()
        if res.data and len(res.data) > 0:
            return {"message": "User updated successfully"}
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update user: {str(e)}")
