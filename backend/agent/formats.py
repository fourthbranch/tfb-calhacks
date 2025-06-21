from pydantic import BaseModel, Field

class FinalNewsArticle(BaseModel):
    title: str = Field(description="The title of the news article.")
    summary: str = Field(description="A summary of the news article.")
    content: str = Field(description="The content of the news article.")
    relevant_topics: list[str] = Field(description="A list of relevant topics to the news article.")
