# **************************************************************************
#  * Copyright (c) 2025 The Fourth Branch
#  * All Rights Reserved.
#  *
#  * This software contains proprietary and confidential information of The Fourth Branch.
#  * By using this software you agree to the terms of the associated License Agreement.
#  * Third party components are distributed under their respective licenses.
#  **************************************************************************

"""
Vercel handler for FastAPI application.
"""

from backend.main import app

# Export the FastAPI app for Vercel
handler = app
