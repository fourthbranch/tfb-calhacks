from pydantic import BaseModel, Field
from typing import Literal

class FinalNewsArticle(BaseModel):
    title: str = Field(description="The title of the news article.")
    summary: str = Field(description="A summary of the news article.")
    content: str = Field(description="The content of the news article.")
    bias: Literal["neutral", "conservative", "liberal"] = Field(description="The potential bias of the news article you just wrote, neutral, conservative, or liberal.")
    opposite_view: str = Field(default="",
                               description="If the bias is conservative, write a detailed analysis of the opposite liberal view. If the bias is liberal, write a detailed analysis of the opposite conservative view. If the bias is neutral, leave this empty.")
    relevant_topics: list[str] = Field(description="A list of relevant topics to the news article.")
