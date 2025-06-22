# **************************************************************************
#  * Copyright (c) 2025 The Fourth Branch
#  * All Rights Reserved.
#  *
#  * This software contains proprietary and confidential information of The Fourth Branch.
#  * By using this software you agree to the terms of the associated License Agreement.
#  * Third party components are distributed under their respective licenses.
#  **************************************************************************

"""
This module handles FastAPI app initialization and configuration.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
from .db import supabase
from pydantic import BaseModel
from backend.agent import topic_generator


app = FastAPI(title="The Fourth Branch API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "https://fourthbranch.vercel.app",  # Production frontend
        "https://www.fourthbranch.vercel.app",  # Production frontend with www
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)


class ArticleListItem(BaseModel):
    id: int
    title: str
    summary: Optional[str] = None
    created_at: Optional[str] = None
    relevant_topics: Optional[list] = None


class ArticleDetail(BaseModel):
    id: int
    title: str
    summary: Optional[str] = None
    content: str
    created_at: Optional[str] = None
    metadata: Optional[dict] = None
    relevant_topics: Optional[list] = None


class SubscribeRequest(BaseModel):
    email: str


class GenNewsWithRequestRequest(BaseModel):
    user_request: str


@app.get("/articles", response_model=List[ArticleListItem])
def list_articles():
    res = supabase.table("articles").select(
        "id, title, summary, relevant_topics, created_at").order("created_at", desc=True).execute()
    if not res.data:
        return []
    # print the first article
    print(f"First article: {res.data[0]}")
    return res.data


@app.get("/articles/{article_id}", response_model=ArticleDetail)
def get_article(article_id: int):
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

    res = supabase.table("articles").select(
        "*", count="exact").eq("id", article_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Article not found")
    return res.data


@app.get("/metrics/page_views")
def get_page_views():
    res = supabase.table("global_metrics").select("value").eq(
        "key", "total_page_views").limit(1).execute()
    if not res.data or len(res.data) == 0:
        return {"value": 0}
    return {"value": res.data[0]["value"]}


@app.post("/subscribe")
def subscribe(request: SubscribeRequest):
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
def gen_news() -> Dict[str, Any]:
    """Generate a topic for a news article"""
    for _ in range(3):
        topic_generator()
    return {"message": "Generated news article"}


@app.get("/gen_news_with_request")
def gen_news_with_request(request: GenNewsWithRequestRequest) -> Dict[str, Any]:
    """Generate a topic for a news article with a user request"""
    for _ in range(3):
        topic_generator(user_request=request.user_request)
    return {"message": "Generated news article"}
