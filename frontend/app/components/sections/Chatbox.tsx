"use client";
import React, { useState, FormEvent, useEffect, useRef } from "react";
import { createAuthHeaders } from "../../lib/auth";
import { Send, Bot, User, Loader, CheckCircle, ArrowRight } from 'lucide-react';

interface Message {
  text: string;
  isUser: boolean;
  articleId?: number;
}

const majorSteps = ["topic_generation", "report_planning", "research", "final_writing"];
const stepDisplayNames: { [key: string]: string } = {
  topic_generation: "Topic Generation",
  report_planning: "Report Planning",
  research: "Research & Section Writing",
  final_writing: "Final Article Generation",
};

interface MajorStepState {
  status: 'pending' | 'in_progress' | 'completed';
  message: string;
  data?: any;
}

const initialPipelineState: Record<string, MajorStepState> = {
  topic_generation: { status: 'pending', message: "Waiting to start..." },
  report_planning: { status: 'pending', message: "Waiting for topic..." },
  research: { status: 'pending', message: "Waiting for plan..." },
  final_writing: { status: 'pending', message: "Waiting for research..." },
};

export default function Chatbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pipelineState, setPipelineState] = useState(initialPipelineState);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleTopicClick = (topic: string) => {
    setInput(topic);
    // Directly submit the form
    const fakeEvent = { preventDefault: () => {} } as FormEvent;
    handleSubmit(fakeEvent, topic);
  };

  const handleSubmit = async (e: FormEvent, prefilledInput?: string) => {
    e.preventDefault();
    const currentInput = prefilledInput || input;
    if (!currentInput.trim()) return;

    const userMessage: Message = { text: currentInput, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setPipelineState(initialPipelineState);

    try {
      const headers = createAuthHeaders();
      const user_email = localStorage.getItem("user_email");
      const API_URL = (
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      ).replace(/\/$/, "");
      const response = await fetch(
        `${API_URL}/gen_news_stream`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ user_request: currentInput, user_email }),
        }
      );

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.replace('data: ', '');
            try {
              const eventData = JSON.parse(jsonStr);
              
              setPipelineState(prev => {
                const newState = { ...prev };
                const { step, status, message, data } = eventData;

                if (newState[step]) {
                  newState[step] = { ...newState[step], status, message, data: data || newState[step].data };
                  
                  // If a step is completed, mark next as in_progress
                  if (status === 'completed') {
                    const currentStepIndex = majorSteps.indexOf(step);
                    if (currentStepIndex < majorSteps.length - 1) {
                      const nextStep = majorSteps[currentStepIndex + 1];
                      newState[nextStep] = { ...newState[nextStep], status: 'in_progress', message: 'Starting...' };
                    }
                  }
                }
                return newState;
              });

              if (eventData.step === "final_writing" && eventData.status === "completed") {
                const botMessage: Message = { text: "I've finished generating your article! You can view it now.", isUser: false, articleId: eventData.data.article_id };
                setMessages((prev) => [...prev, botMessage]);
              }
            } catch (error) {
              console.error("Failed to parse JSON from stream:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching stream:", error);
      const errorMessage: Message = { text: "Sorry, something went wrong while generating the article.", isUser: false };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderPipeline = () => {
    return (
      <div className="border border-gray-200 bg-gray-50 p-4 rounded-lg my-2 text-sm text-gray-700">
        <h3 className="font-semibold mb-3 text-base text-black">Article Generation Progress</h3>
        <ul className="space-y-3">
          {majorSteps.map((step) => {
            const { status, message, data } = pipelineState[step];
            return (
              <li key={step} className="flex flex-col">
                <div className="flex items-center">
                  {status === 'completed' ? <CheckCircle className="w-4 h-4 text-green-500 mr-2" /> :
                   status === 'in_progress' ? <Loader className="w-4 h-4 animate-spin text-blue-500 mr-2" /> :
                   <div className="w-4 h-4 mr-2" />
                  }
                  <span className={`font-medium ${status !== 'pending' ? 'text-black' : 'text-gray-400'}`}>{stepDisplayNames[step]}</span>
                </div>
                <div className="pl-6 text-gray-500 text-xs italic mt-1">
                  {message}
                  {data && data.sections && (
                    <div className="text-xs mt-1 text-gray-600 flex flex-wrap gap-2">
                       {data.sections.map((section: string) => (
                          <span key={section} className="bg-gray-200 rounded-full px-2 py-0.5">{section}</span>
                       ))}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className="bg-white w-full mx-auto rounded-xl shadow-lg border border-gray-200 flex flex-col max-h-[80vh] h-[75vh]">
       <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">News Article Generator</h2>
        <p className="text-sm text-gray-500">
            What news are you interested in today? You can start with a topic below or type your own.
        </p>
      </div>
      <div className="flex-1 p-4 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        <div className="space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex gap-2 flex-wrap">
                <button onClick={() => handleTopicClick('israel-iran conflict')} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors">israel-iran conflict</button>
                <button onClick={() => handleTopicClick("trump's tariff policies")} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors">trump's tariff policies</button>
                <button onClick={() => handleTopicClick("US election 2024")} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors">US election 2024</button>
                <button onClick={() => handleTopicClick("AI's impact on the job market")} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors">AI's impact on the job market</button>
                <button onClick={() => handleTopicClick("Global climate change initiatives")} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors">Global climate change initiatives</button>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.isUser
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {message.isUser ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {message.isUser ? "You" : "AI Assistant"}
                  </span>
                </div>
                <p className="text-sm">{message.text}</p>
                
                {/* Show pipeline steps for AI messages */}
                {!message.isUser && pipelineState && Object.keys(pipelineState).length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="text-xs font-medium text-gray-600 mb-2">
                      Generation Progress:
                    </div>
                    {majorSteps.map((step) => {
                      const stepData = pipelineState[step];
                      const isCompleted = stepData?.status === "completed";
                      const isInProgress = stepData?.status === "in_progress";

                      const renderStepData = (stepId: string, data: any) => {
                        if (!data || Object.keys(data).length === 0) return null;
                      
                        switch (stepId) {
                          case 'report_planning':
                            if (data.sections && Array.isArray(data.sections)) {
                              return (
                                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded w-full">
                                  <p className="font-medium mb-1 text-gray-700">Planned Sections:</p>
                                  <ul className="list-disc list-inside text-gray-500">
                                    {data.sections.map((section: string, i: number) => <li key={i}>{section}</li>)}
                                  </ul>
                                </div>
                              );
                            }
                            return null;
                          case 'topic_generation':
                          case 'research':
                          case 'final_writing':
                          default:
                            return null;
                        }
                      };

                      const dataDisplay = isCompleted ? renderStepData(step, stepData.data) : null;

                      return (
                        <div key={step}>
                          <div className="flex items-center gap-3">
                            {isCompleted ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : isInProgress ? (
                              <Loader className="w-4 h-4 text-blue-500 animate-spin" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                            )}
                            <span className={`text-sm font-medium ${isCompleted ? "text-gray-800" : isInProgress ? "text-blue-600" : "text-gray-400"}`}>
                              {stepDisplayNames[step]}
                            </span>
                             {isInProgress && stepData.message && (
                              <span className="text-xs text-gray-500">
                                {stepData.message}
                              </span>
                            )}
                          </div>
                          {dataDisplay && <div className="pl-7 mt-1">{dataDisplay}</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Show article link if available */}
                {!message.isUser && message.articleId && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <a
                      href={`/articles/${message.articleId}`}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Read the full article
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && renderPipeline()}
        </div>
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me what to write about..."
            className="w-full bg-gray-100 border border-gray-300 text-gray-900 px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
