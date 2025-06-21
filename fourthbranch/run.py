import uuid
from langgraph.types import Command
from langgraph.checkpoint.memory import MemorySaver
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.prebuilt import create_react_agent
import asyncio
import os
import sys
from dotenv import load_dotenv
from langchain_community.tools.tavily_search import TavilySearchResults

# DO NOT move
# -------------------
# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fourthbranch.graph import builder
from fourthbranch.final_writer_prompts import FINAL_WRITER_SYSTEM_PROMPT, topic_generator_system_prompt
from fourthbranch.formats import FinalNewsArticle
from backend import supabase
# -------------------


load_dotenv()


claude_3_5_sonnet = ChatAnthropic(
    model="claude-3-5-sonnet-latest",
    api_key=os.getenv("ANTHROPIC_API_KEY")
)

claude_3_7_sonnet = ChatAnthropic(
    model="claude-3-7-sonnet-latest",
    api_key=os.getenv("ANTHROPIC_API_KEY"),
    max_tokens=64000
)


def generate_news(topic_query: str) -> FinalNewsArticle:
    # Checkpointer for the graph approach
    checkpointer = MemorySaver()
    graph = builder.compile(checkpointer=checkpointer)

    # Configuration for the graph agent with provided parameters
    thread = {"configurable": {
        "thread_id": str(uuid.uuid4()),
        "planner_provider": "anthropic",
        "planner_model": "claude-3-7-sonnet-latest",
        "writer_provider": "anthropic",
        "writer_model": "claude-3-7-sonnet-latest",
        "max_search_depth": 3,
        "number_of_queries": 4,
    }}

    async def run_graph_agent(thread):
        # Run the graph until the interruption
        async for event in graph.astream({"topic": topic_query}, thread, stream_mode="updates"):
            if '__interrupt__' in event:
                interrupt_value = event['__interrupt__'][0].value

        # Pass True to approve the report plan
        async for event in graph.astream(Command(resume=True), thread, stream_mode="updates"):
            print(event)
            print("\n")

        final_state = graph.get_state(thread)
        report = final_state.values.get('final_report', "No report generated")
        return report

    report = asyncio.run(run_graph_agent(thread))
    print(f"Report: {report}")

    final_writer = claude_3_7_sonnet.with_structured_output(FinalNewsArticle)

    messages = [
        SystemMessage(content=FINAL_WRITER_SYSTEM_PROMPT),
        HumanMessage(
            content=f"You are given with this report:\n{report}\n\nPlease write a news article based on the report.")
    ]

    news_article = final_writer.invoke(messages)
    return news_article


def topic_generator():
    messages = [
        SystemMessage(content=topic_generator_system_prompt()),
        HumanMessage(
            content="Generate a topic for a news article that will be written by the journalists.")
    ]
    agent = create_react_agent(
        model=claude_3_5_sonnet,
        tools=[TavilySearchResults()]
    )

    response = agent.invoke({"messages": messages})

    # Extract just the content from the AIMessage
    topic_content = response["messages"][-1].content
    print(f"Topic Content: {topic_content}")

    news_article = generate_news(topic_content)

    # Save the topic to the database
    supabase.table("existing_topics").insert(
        {"content": topic_content}).execute()

    # Save the article to the database
    supabase.table("articles").insert({
        "title": news_article.title,
        "summary": news_article.summary,
        "content": news_article.content,
        "relevant_topics": news_article.relevant_topics
    }).execute()


if __name__ == "__main__":
    for i in range(10):
        topic_generator()
