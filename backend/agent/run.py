from backend.agent.formats import FinalNewsArticle
from backend.agent.final_writer_prompts import form_final_writer_system_prompt, topic_generator_system_prompt
from backend.agent.graph import builder
from backend.db import supabase

import uuid
from langgraph.types import Command
from langgraph.checkpoint.memory import MemorySaver
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.prebuilt import create_react_agent
import asyncio
import os
from dotenv import load_dotenv
from langchain_community.tools.tavily_search import TavilySearchResults


claude_3_5_sonnet = ChatAnthropic(
    model="claude-3-5-sonnet-latest",
    api_key=os.getenv("ANTHROPIC_API_KEY"),
)

claude_3_7_sonnet = ChatAnthropic(
    model="claude-3-7-sonnet-latest",
    api_key=os.getenv("ANTHROPIC_API_KEY"),
    max_tokens=64000
)


async def stream_report_generation(user_id: int, user_request: str):
    """
    Generates a news report and streams the process, yielding updates at each step.
    """
    yield {"step": "topic_generation", "status": "in_progress", "message": "Generating a relevant topic for you..."}

    # Agent 1: Topic Generator
    # Fetch user info
    if user_id == -1:
        political_leaning = "neutral"
    else:
        user_info_res = supabase.table("users").select("*").eq("id", user_id).execute()
        political_leaning = user_info_res.data[0]["political_leaning"] if user_info_res.data else "neutral"

    topic_agent = create_react_agent(model=claude_3_5_sonnet, tools=[TavilySearchResults()])
    topic_messages = [
        SystemMessage(content=topic_generator_system_prompt(political_leaning, user_request)),
        HumanMessage(content="Generate a topic for a news article.")
    ]
    topic_response = await topic_agent.ainvoke({"messages": topic_messages})
    topic_content = topic_response["messages"][-1].content

    yield {"step": "topic_generation", "status": "completed", "message": f"Topic chosen: '{topic_content}'"}

    # Agent 2: Report Generator (LangGraph)
    yield {"step": "report_planning", "status": "in_progress", "message": "Creating a detailed plan for the report..."}

    checkpointer = MemorySaver()
    graph = builder.compile(checkpointer=checkpointer)
    thread = {"configurable": {"thread_id": str(uuid.uuid4()), "planner_provider": "anthropic", "planner_model": "claude-3-7-sonnet-latest", "writer_provider": "anthropic", "writer_model": "claude-3-7-sonnet-latest", "max_search_depth": 1, "number_of_queries": 1}}

    async for event in graph.astream({"topic": topic_content}, thread, stream_mode="updates"):
        if 'generate_report_plan' in event:
            plan = event['generate_report_plan']['sections']
            section_names = [section.name for section in plan]
            yield {"step": "report_planning", "status": "completed", "message": "Report plan created.", "data": {"sections": section_names}}
            yield {"step": "research", "status": "in_progress", "message": "Researching sections..."}

        if '__interrupt__' in event:
            break # Move to the next step

    # Resume graph execution to perform research and writing
    async for event in graph.astream(Command(resume=True), thread, stream_mode="updates"):
        if 'write_section' in event:
             yield {"step": "research", "status": "in_progress", "message": "Writing researched sections..."}

    yield {"step": "research", "status": "completed", "message": "Finished researching and writing sections."}

    final_state = await graph.aget_state(thread)
    report = final_state.values.get('final_report', "No report generated")

    # Agent 3: Final Writer
    yield {"step": "final_writing", "status": "in_progress", "message": "Generating the final article in your preferred style..."}

    # ... (The logic for handling different writing styles and saving to DB will be here)
    # For now, let's just yield the final report for simplicity in this step.

    # This part is complex, for now, let's just simulate the end.
    # In a real implementation, we'd call the final writer and save to DB.
    # For this task, we will just return the final generated report id

    # Save the report to the database FIRST and get the id
    report_result = supabase.table("reports").insert({
        "content": report,
        "topic_bias": political_leaning
    }).execute()
    report_id = report_result.data[0]['id']

    final_writer = claude_3_7_sonnet.with_structured_output(FinalNewsArticle)

    if user_id == -1:
        preferred_writing_style = ["depth", "formal", "straight"]
    else:
        user_info = supabase.table("users").select("*").eq("id", user_id).execute()
        preferred_writing_style = user_info.data[0]["preferred_writing_style"]

    writing_style_str = ""
    if "short" in preferred_writing_style:
        writing_style_str += "short and concise summary that only cover the most important information\\n"
    if "depth" in preferred_writing_style:
        writing_style_str += "in-depth detailed analysis that includes every part of the report\\n"
    if "informal" in preferred_writing_style:
        writing_style_str += "informal and casual language written in a way that is easy to understand. Never use any jargon or technical terms. Never use formal words or phrases. Never use journalistic language. Never use any words that are not commonly used in everyday conversation.\\n"
    if "formal" in preferred_writing_style:
        writing_style_str += "formal and professional language written by a professional journalist\\n"
    if "satirical" in preferred_writing_style:
        writing_style_str += "all sentences should be satirical, witty and comedic language in the same style of the Daily Show by Jon Stewart and Trevor Noah. You should make the readers laugh and feel like they are watching a comedy show. You should start the article with a joke or a funny hook. You should end the article with a joke or a funny sentence.\\n"
    if "straight" in preferred_writing_style:
        writing_style_str += "straight-laced and objective language written by a professional journalist. Never use any witty or comedic language.\\n"

    messages = [
        SystemMessage(
            content=form_final_writer_system_prompt(writing_style_str)),
        HumanMessage(
            content=f"You are given with this report:\\n{report}\\n\\nPlease write a news article based on the report.")
    ]
    news_article = final_writer.invoke(messages)
    article_res = supabase.table("articles_new").insert({
        "report_id": report_id,
        "title": news_article.title,
        "summary": news_article.summary,
        "content": news_article.content,
        "opposite_view": news_article.opposite_view,
        "preferred_writing_style": preferred_writing_style,
        "bias": news_article.bias,
        "topic_bias": political_leaning,
        "relevant_topics": news_article.relevant_topics
    }).execute()

    article_id = article_res.data[0]['id']

    yield {"step": "final_writing", "status": "completed", "message": "Article generated successfully!", "data": {"article_id": article_id}}


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
        "max_search_depth": 2,
        "number_of_queries": 2,
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


def topic_generator(user_id: int = -1, user_request: str = "") -> int:
    # Fetch the information about the user: political leaning
    if user_id == -1:
        political_leaning = "neutral"  # TODO: Add a default political leaning
    else:
        user_info = supabase.table("users").select(
            "*").eq("id", user_id).execute()
        political_leaning = user_info.data[0]["political_leaning"]

    messages = [
        SystemMessage(
            content=topic_generator_system_prompt(political_leaning, user_request)),
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

    # Save the topic to the database
    supabase.table("existing_topics").insert(
        {"content": topic_content}).execute()

    # Save the report to the database FIRST and get the id
    report_result = supabase.table("reports").insert({
        "content": report,
        "topic_bias": political_leaning
    }).execute()

    # Get the report id for the foreign key relationship
    report_id = report_result.data[0]['id']

    final_writer = claude_3_7_sonnet.with_structured_output(FinalNewsArticle)

    if user_id == -1:
        # All eight permutations of writing styles
        # Preferred styles
        # Short summaries vs in-depth detailed analysis/report ("short" or "depth")
        # Informal vs. formal ("informal" or "formal")
        # Satirical / humorous vs. straight-laced ("satirical" or "straight")

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
                writing_style_str += "short and concise summary that only cover the most important information\n"
            if "depth" in writing_style:
                writing_style_str += "in-depth detailed analysis that includes every part of the report\n"
            if "informal" in writing_style:
                writing_style_str += "informal and casual language written in a way that is easy to understand. Never use any jargon or technical terms. Never use formal words or phrases. Never use journalistic language. Never use any words that are not commonly used in everyday conversation.\n"
            if "formal" in writing_style:
                writing_style_str += "formal and professional language written by a professional journalist\n"
            if "satirical" in writing_style:
                writing_style_str += "all sentences should be satirical, witty and comedic language in the same style of the Daily Show by Jon Stewart and Trevor Noah. You should make the readers laugh and feel like they are watching a comedy show. You should start the article with a joke or a funny hook. You should end the article with a joke or a funny sentence.\n"
            if "straight" in writing_style:
                writing_style_str += "straight-laced and objective language. Never use any witty or comedic language.\n"

            print(f"Writing style: {writing_style_str}")

            messages = [
                SystemMessage(
                    content=form_final_writer_system_prompt(writing_style_str)),
                HumanMessage(
                    content=f"You are given with this report:\n{report}\n\nPlease write a news article based on the report.")
            ]
            news_article = final_writer.invoke(messages)
            supabase.table("articles_new").insert({
                "report_id": report_id,
                "title": news_article.title,
                "summary": news_article.summary,
                "content": news_article.content,
                "opposite_view": news_article.opposite_view,
                "preferred_writing_style": writing_style,
                "bias": news_article.bias,
                "topic_bias": political_leaning,
                "relevant_topics": news_article.relevant_topics
            }).execute()

        return -1

    else:
        # Get the user's preferred writing style
        preferred_writing_style = user_info.data[0]["preferred_writing_style"]
        writing_style_str = ""
        if "short" in preferred_writing_style:
            writing_style_str += "short and concise summary that only cover the most important information\n"
        if "depth" in preferred_writing_style:
            writing_style_str += "in-depth detailed analysis that includes every part of the report\n"
        if "informal" in preferred_writing_style:
            writing_style_str += "informal and casual language written in a way that is easy to understand. Never use any jargon or technical terms. Never use formal words or phrases. Never use journalistic language. Never use any words that are not commonly used in everyday conversation.\n"
        if "formal" in preferred_writing_style:
            writing_style_str += "formal and professional language written by a professional journalist\n"
        if "satirical" in preferred_writing_style:
            writing_style_str += "all sentences should be satirical, witty and comedic language in the same style of the Daily Show by Jon Stewart and Trevor Noah. You should make the readers laugh and feel like they are watching a comedy show. You should start the article with a joke or a funny hook. You should end the article with a joke or a funny sentence.\n"
        if "straight" in preferred_writing_style:
            writing_style_str += "straight-laced and objective language written by a professional journalist. Never use any witty or comedic language.\n"

        print(f"Writing style: {writing_style_str}")

        messages = [
            SystemMessage(
                content=form_final_writer_system_prompt(writing_style_str)),
            HumanMessage(
                content=f"You are given with this report:\n{report}\n\nPlease write a news article based on the report.")
        ]
        news_article = final_writer.invoke(messages)
        supabase.table("articles_new").insert({
            "report_id": report_id,
            "title": news_article.title,
            "summary": news_article.summary,
            "content": news_article.content,
            "opposite_view": news_article.opposite_view,
            "preferred_writing_style": preferred_writing_style,
            "bias": news_article.bias,
            "topic_bias": political_leaning,
            "relevant_topics": news_article.relevant_topics
        }).execute()

        # Return the newly generated article id
        article_id = supabase.table("articles_new").select(
            "*").eq("report_id", report_id).execute()
        print(f"Article ID: {article_id.data[0]['id']}")
        return article_id.data[0]['id']
