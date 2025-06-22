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

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="The Fourth Branch API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://fourthbranch.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
)
