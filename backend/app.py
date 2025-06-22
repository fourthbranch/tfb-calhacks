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

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

app = FastAPI(title="The Fourth Branch API")

# Add CORS middleware with specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "https://fourthbranch.vercel.app",  # Production frontend
        "https://fourthbranch-backend.vercel.app",  # Production backend
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.middleware("http")
async def handle_preflight(request: Request, call_next):
    """Handle OPTIONS preflight requests without authentication"""
    if request.method == "OPTIONS":
        return Response(
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
    return await call_next(request)
