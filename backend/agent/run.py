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
from backend.agent.graph import builder
from backend.agent.final_writer_prompts import form_final_writer_system_prompt, topic_generator_system_prompt
from backend.agent.formats import FinalNewsArticle
from backend.db import supabase
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


def generate_report(topic_query: str) -> FinalNewsArticle:
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
    return report


def topic_generator(user_id: int = -1):
    # Fetch the information about the user: political leaning
    if user_id == -1:
        political_leaning = "liberal"  # TODO: Add a default political leaning
    else:
        user_info = supabase.table("users").select("*").eq("id", user_id).execute()
        political_leaning = user_info.data[0].political_leaning

    messages = [
        SystemMessage(content=topic_generator_system_prompt(political_leaning)),
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

    report = generate_report(topic_content)

    final_writer = claude_3_7_sonnet.with_structured_output(FinalNewsArticle)

    if user_id == -1:
        # All eight permutations of writing styles
        # Preferred styles
        # Short summaries vs in-depth detailed analysis/report (“short” or “depth”)
        # Informal vs. formal (“informal” or “formal”)
        # Satirical / humorous vs. straight-laced (“satirical” or “straight”)

        all_possible_writing_styles = [
            ["short", "informal", "satirical"],
            ["short", "informal", "straight"],
            ["short", "formal", "satirical"],
            ["short", "formal", "straight"],
            ["depth", "informal", "satirical"],
            ["depth", "informal", "straight"],
            ["depth", "formal", "satirical"],
            ["depth", "formal", "straight"],
        ]

        for writing_style in all_possible_writing_styles:
            writing_style_str = ""
            if "short" in writing_style:
                writing_style_str += "short summary and concise\n"
            elif "depth" in writing_style:
                writing_style_str += "in-depth detailed analysis\n"
            elif "informal" in writing_style:
                writing_style_str += "informal\n"
            elif "formal" in writing_style:
                writing_style_str += "formal\n"
            elif "satirical" in writing_style:
                writing_style_str += "satirical\n"
            elif "straight" in writing_style:
                writing_style_str += "straight-laced\n"

            messages = [
                SystemMessage(content=form_final_writer_system_prompt(writing_style_str)),
                HumanMessage(
                    content=f"You are given with this report:\n{report}\n\nPlease write a news article based on the report.")
            ]
            news_article = final_writer.invoke(messages)
            supabase.table("articles_new").insert({
                "title": news_article.title,
                "summary": news_article.summary,
                "content": news_article.content,
                "opposite_view": news_article.opposite_view,
                "preferred_writing_style": writing_style,
                "bias": news_article.bias,
                "topic_bias": political_leaning,
                "relevant_topics": news_article.relevant_topics
            }).execute()

    else:
        # Get the user's preferred writing style
        preferred_writing_style = user_info.data[0].preferred_writing_style
        writing_style_str = ""
        if "short" in preferred_writing_style:
            writing_style_str += "short summary and concise\n"
        elif "depth" in preferred_writing_style:
            writing_style_str += "in-depth detailed analysis\n"
        elif "informal" in preferred_writing_style:
            writing_style_str += "informal\n"
        elif "formal" in preferred_writing_style:
            writing_style_str += "formal\n"
        elif "satirical" in preferred_writing_style:
            writing_style_str += "satirical\n"
        elif "straight" in preferred_writing_style:
            writing_style_str += "straight-laced\n"
        messages = [
            SystemMessage(content=form_final_writer_system_prompt(writing_style_str)),
            HumanMessage(content=f"You are given with this report:\n{report}\n\nPlease write a news article based on the report.")
        ]
        news_article = final_writer.invoke(messages)
        supabase.table("articles_new").insert({
            "title": news_article.title,
            "summary": news_article.summary,
            "content": news_article.content,
            "opposite_view": news_article.opposite_view,
            "preferred_writing_style": preferred_writing_style,
            "bias": news_article.bias,
            "topic_bias": political_leaning,
            "relevant_topics": news_article.relevant_topics
        }).execute()

    # Save the report to the database
    supabase.table("reports").insert({
        "content": report,
        "topic_bias": political_leaning
    }).execute()

    # Save the topic to the database
    supabase.table("existing_topics").insert(
        {"content": topic_content}).execute()


if __name__ == "__main__":
    for i in range(10):
        topic_generator()
