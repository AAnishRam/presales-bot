"use client";

import React, { useState, useRef, useEffect } from "react";
import "@/app/globals.css";
import QuickActionButton from "@/app/components/QuickActionButton";
import Image from "next/image";
import top_right from "@/app/_assests/top-right-shade.png";
import bottom_left from "@/app/_assests/bottom-left-shade.png";
import logo from "@/app/_assests/center-logo.png";
import send from "@/app/_assests/Send-button.png";
import BackButton from "./components/BackButton";
import ChatMessagesContainer from "./components/ChatMessagesContainer";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  isLoading?: boolean;
  loadingStage?: number;
  visualization_url?: string;
  architecture_url?: string;
  flowchart_url?: string;
  has_architecture?: boolean;
  has_flowchart?: boolean;
  has_both_diagrams?: boolean;
}

const page = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadingMessages = [
    "🔍 Analyzing your requirements...",
    "🧠 Understanding the context...",
    "⚡ Processing technical specifications...",
    "🏗️ Generating solution architecture...",
    "📊 Creating visual diagrams...",
    "🔄 Optimizing the solution...",
    "✨ Finalizing recommendations...",
  ];

  const startLoadingSequence = () => {
    setLoadingMessageIndex(0);
    loadingIntervalRef.current = setInterval(() => {
      setLoadingMessageIndex((prev) => {
        const nextIndex = (prev + 1) % loadingMessages.length;
        return nextIndex;
      });
    }, 2000); // Change message every 2 seconds
  };

  const stopLoadingSequence = () => {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === "") return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsChatStarted(true);

    const loadingMessage: Message = {
      id: Date.now() + 1,
      text: loadingMessages[0],
      sender: "ai",
      timestamp: new Date(),
      isLoading: true,
      loadingStage: 0,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    // Start the loading sequence
    startLoadingSequence();

    try {
      const history = messages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          history: history,
          query: currentInput,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);

      // Stop loading sequence
      stopLoadingSequence();

      setMessages((prev) => {
        const filtered = prev.filter((msg) => !msg.isLoading);
        const aiResponse: Message = {
          id: Date.now() + 2,
          text:
            data.answer ||
            "I apologize, but I didn't receive a proper response.",
          sender: "ai",
          timestamp: new Date(),
          visualization_url: data.visualization_url,
          architecture_url: data.architecture_url,
          flowchart_url: data.flowchart_url,
          has_architecture: data.has_architecture,
          has_flowchart: data.has_flowchart,
          has_both_diagrams: data.has_both_diagrams,
        };
        return [...filtered, aiResponse];
      });
    } catch (error) {
      console.error("Error calling API:", error);

      // Stop loading sequence on error
      stopLoadingSequence();

      setMessages((prev) => {
        const filtered = prev.filter((msg) => !msg.isLoading);
        const errorResponse: Message = {
          id: Date.now() + 2,
          text: `I'm sorry, I encountered an error while processing your request. Please try again. Error: ${error}`,
          sender: "ai",
          timestamp: new Date(),
        };
        return [...filtered, errorResponse];
      });
    }
  };

  // Update loading messages in real-time
  useEffect(() => {
    if (loadingMessageIndex >= 0) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.isLoading
            ? { ...msg, text: loadingMessages[loadingMessageIndex] }
            : msg
        )
      );
    }
  }, [loadingMessageIndex]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      stopLoadingSequence();
    };
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  const handleBackToWelcome = () => {
    setIsChatStarted(false);
    setMessages([]);
    setInputValue("");
    stopLoadingSequence(); // Stop any running loading sequence
  };

  const handleImageClick = (imageUrl: string, title: string) => {
    setSelectedImage({ url: imageUrl, title });
    setShowImageModal(true);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollToBottom(isScrolledUp && messages.length > 3);
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [messages.length]);

  const predefinedPrompts = [
    "My customer in retail wants to reduce inventory waste using AI — what case studies can I show them?",
    "Can you give me 2–3 AI/ML solutions for a healthcare customer who needs faster patient insights from unstructured data?",
    "Do we have any examples where funding reduced the customer's upfront cost of AI adoption?",
    "Which partners have built AI solutions on top of Snowflake or Databricks that I can reference for a financial services customer?",
    "Show me examples of how we've accelerated time-to-market for AI products in manufacturing.",
    "What AI workloads have delivered measurable revenue growth for media & entertainment customers?",
    "Can you suggest a proposed solution for an insurance customer wanting to automate claims processing?",
    "Do we have case studies showing partner expertise with customer service chatbots?",
    "Give me a comparison of 2 case studies where different LLMs (Claude vs. ChatGPT) were used, and why.",
    "If my customer doesn't know what AI can do, can you suggest 3 industry-relevant workloads with business value proof points?",
  ];

  const handlePromptSelect = (prompt: string) => {
    setInputValue(prompt);
    setShowPromptModal(false);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  const handlePromptButtonClick = () => {
    setShowPromptModal(true);
  };

  return (
    <div className="relative bg-gradient-to-l from-[#fff9f5] to-white h-screen w-screen">
      {/* bg img */}
      <div className="fixed top-0 right-0 w-[749.27px] h-[592.41px] z-[1] pointer-events-none">
        <Image
          src={top_right}
          alt="top_right"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="fixed bottom-0 left-0 w-[749.27px] h-[592.41px] z-[1] pointer-events-none">
        <Image
          src={bottom_left}
          alt="bottom_left"
          className="w-full h-full object-cover"
        />
      </div>

      {isChatStarted && (
        <div className="fixed top-6 left-6 z-[100]">
          <BackButton onClick={handleBackToWelcome} />
        </div>
      )}

      <div
        className={`flex flex-col items-center ${
          isChatStarted ? "justify-start pt-4 px-8" : "justify-between"
        } h-screen p-8 z-10 relative transition-all duration-500`}
      >
        {/* logo & tit */}
        <div
          className={`flex flex-col items-center ${
            isChatStarted ? "flex-none py-4 mb-4" : "flex-1 justify-center"
          } max-w-[600px] w-full transition-all duration-500`}
        >
          {!isChatStarted && (
            <div
              className={`${
                isChatStarted ? "w-15 h-15 mb-2" : "w-32 h-32 mb-5"
              } flex items-center justify-center transition-all duration-500`}
            >
              <Image src={logo} alt="centre-section-logo" />
            </div>
          )}
          {!isChatStarted && (
            <>
              <div className="text-center text-[#130261] text-4xl font-semibold mb-2 max-w-[600px] w-full p-0">
                <p className="m-0 leading-tight">
                  Hey User! <br />
                  Can I help you with anything?
                </p>
              </div>
              <div className="text-center mb-8 max-w-[600px] w-full p-0">
                <p className="text-base text-[#888888] m-0 font-normal">
                  Ready to assist you with anything you need.
                </p>
              </div>
            </>
          )}
        </div>

        {/* msg area */}
        {isChatStarted && (
          <ChatMessagesContainer
            messages={messages}
            messagesEndRef={messagesEndRef}
            messagesContainerRef={messagesContainerRef}
            showScrollToBottom={showScrollToBottom}
            scrollToBottom={scrollToBottom}
          />
        )}

        {/* input area */}
        <div className="w-full max-w-[900px] mb-4 sm:mb-8">
          <div className="mb-4 sm:mb-6 relative bg-gradient-to-br from-[#e1d9d9] to-[#9ecbfb] p-[2px] sm:p-[3px] rounded-[12px] sm:rounded-[15px] w-full max-w-[900px]">
            <textarea
              ref={textareaRef}
              placeholder={
                isChatStarted
                  ? "Ask me anything about your projects..."
                  : "Ask anything you need"
              }
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              rows={1}
              className="w-full min-h-[45px] sm:min-h-[50px] max-h-[100px] sm:max-h-[120px] py-[12px] sm:py-[15px] px-4 sm:px-6 pr-[85px] sm:pr-[115px] border-none rounded-[10px] sm:rounded-xl text-sm sm:text-base outline-none bg-white text-[#333] font-inherit leading-normal resize-none overflow-y-auto placeholder:text-[#888] placeholder:font-normal scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[rgba(158,203,251,0.3)] hover:scrollbar-thumb-[rgba(158,203,251,0.5)]"
              style={{ resize: "none" }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="absolute right-1.5 sm:right-2 top-7 -translate-y-1/2 w-[75px] sm:w-[100px] h-[36px] sm:h-[42px] border-none rounded-[8px] sm:rounded-xl bg-gradient-to-br from-[#a8d5ba] to-[#7fb069] cursor-pointer flex items-center justify-center shadow-[0_2px_8px_rgba(127,176,105,0.3)] sm:shadow-[0_3px_10px_rgba(127,176,105,0.3)] transition-all duration-200 z-[2] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-95 enabled:hover:scale-105 enabled:hover:shadow-[0_4px_12px_rgba(127,176,105,0.4)] sm:enabled:hover:shadow-[0_5px_15px_rgba(127,176,105,0.4)] enabled:active:scale-95"
            >
              <Image src={send} alt="Send" />
            </button>
          </div>

          {!isChatStarted && (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-11 justify-center max-w-[900px] w-full px-2 sm:px-0">
              <div className="flex-1 w-full sm:w-[10px]">
                <QuickActionButton
                  url="https://www.goml.io/ai-glossary"
                  label="🌆 Glossary"
                />
              </div>
              <div className="flex-1 w-full">
                <button
                  onClick={handlePromptButtonClick}
                  className="w-full py-2.5 px-2 border border-[#e5e5e5] rounded-xl bg-gradient-to-br from-white to-[#f8f9fa] text-xs cursor-pointer transition-all duration-300 shadow-[0_2px_4px_rgba(0,0,0,0.05)] text-[#333] font-medium whitespace-nowrap h-[42px] flex items-center justify-center hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:border-[#9ecbfb] hover:bg-gradient-to-br hover:from-[#f0f8ff] hover:to-white"
                >
                  🍾 Prompt
                </button>
              </div>
              <div className="flex-1 w-full">
                <QuickActionButton
                  url="https://calculator.aws/#/"
                  label="🎓 Price Calculator"
                />
              </div>
              <div className="flex-1 w-full">
                <QuickActionButton
                  url="https://aws.amazon.com/about-aws/global-infrastructure/regional-product-services/"
                  label="🧠 Services"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Prompt Selection Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-[#130261]">
                  Select a Prompt
                </h2>
                <button
                  onClick={() => setShowPromptModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                Choose from these pre-written prompts to get started quickly
              </p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid gap-3">
                {predefinedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handlePromptSelect(prompt)}
                    className="text-left p-4 bg-gradient-to-br from-[#f8f9fa] to-white border border-[#e5e7eb] rounded-xl hover:border-[#9ecbfb] hover:shadow-md transition-all duration-200 group"
                  >
                    <p className="text-sm sm:text-base text-[#374151] group-hover:text-[#130261] transition-colors">
                      {prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default page;
