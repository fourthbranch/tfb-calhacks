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

import os
from typing import Dict, Any
import sys

from .app import app


@app.get("/")
def root() -> Dict[str, Any]:
    """Root endpoint for the API"""
    return {"message": "Hello, World!"}


# Entry point for Vercel
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
