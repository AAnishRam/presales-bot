"use client";

import React, { useState, useRef, useEffect } from "react";
import "@/app/globals.css";
import Image from "next/image";
import top_right from "@/app/_assests/top-right-shade.png";
import bottom_left from "@/app/_assests/bottom-left-shade.png";
import hamburger from "@/app/_assests/hamburger.png";
import logo from "@/app/_assests/center-logo.png";
import send from "@/app/_assests/Send-button.png";
import { marked } from "marked";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  isLoading?: boolean;
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
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      text: "Analyzing requirement and generating solution architecture...",
      sender: "ai",
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

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

      // Remove loading message and add error response
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  const handleBackToWelcome = () => {
    setIsChatStarted(false);
    setMessages([]);
    setInputValue("");
  };

  const handleImageClick = (imageUrl: string, title: string) => {
    setSelectedImage({ url: imageUrl, title });
    setShowImageModal(true);
  };

  const handleDownloadImage = async () => {
    if (selectedImage) {
      try {
        // Use CORS-enabled fetch to handle cross-origin images
        const response = await fetch(
          `/api/chat?url=${encodeURIComponent(
            selectedImage.url
          )}&filename=${encodeURIComponent(selectedImage.title)}`,
          {
            method: "GET",
          }
        );

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${selectedImage.title
            .replace(/[^a-z0-9]/gi, "_")
            .toLowerCase()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } else {
          throw new Error("Download failed");
        }
      } catch (error) {
        console.error("Download failed:", error);
        // Fallback: try direct download
        try {
          const response = await fetch(selectedImage.url);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${selectedImage.title
            .replace(/[^a-z0-9]/gi, "_")
            .toLowerCase()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (fallbackError) {
          console.error("Fallback download failed:", fallbackError);
          // Last resort: open in new tab
          window.open(selectedImage.url, "_blank");
        }
      }
    }
  };

  const handleFullScreen = () => {
    if (selectedImage) {
      window.open(selectedImage.url, "_blank");
    }
  };

  const handleQuickAction = (action: string) => {
    setInputValue(action);
    // Don't auto-send, let user review and send manually
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize textarea to fit content
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height =
            Math.min(textareaRef.current.scrollHeight, 120) + "px";
        }
      }, 0);
    }
  };

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle scroll events to show/hide scroll-to-bottom button
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollToBottom(isScrolledUp && messages.length > 3);
  };

  // Auto scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages]);

  // Add scroll listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [messages.length]);

  function formatMessageText(text: string): string {
    if (!text) return "";

    // Configure marked options for optimal rendering
    marked.setOptions({
      async: false, // Synchronous parsing
      breaks: true, // Add <br> on single line breaks
      gfm: true, // Use GitHub Flavored Markdown
      pedantic: false, // Don't conform to original markdown.pl behavior
      silent: false, // Throw errors if any
      renderer: new marked.Renderer(), // Custom renderer (you can customize it later)
      tokenizer: new marked.Tokenizer(), // Use default tokenizer (can customize later)
      walkTokens: null, // No custom walkTokens function for now
    });

    try {
      // Parse markdown and return HTML (forced to be synchronous)
      const htmlContent = marked.parse(text) as string;
      return htmlContent;
    } catch (error) {
      console.error("Markdown parsing error:", error);
      // Fallback to plain text with line breaks preserved
      return text.replace(/\n/g, "<br>");
    }
  }

  return (
    <div className="relative bg-gradient-to-l from-[#fff9f5] to-white h-screen w-screen">
      {/* Background Images */}
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

      {/* Back Button (only in chat mode) */}
      {isChatStarted && (
        <div className="fixed top-6 left-6 z-[100]">
          <button
            className="w-11 h-11 border-none rounded-full bg-white/90 backdrop-blur-[10px] flex items-center justify-center cursor-pointer transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-[#374151] hover:bg-white hover:scale-105 hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)]"
            onClick={handleBackToWelcome}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
        </div>
      )}

      {/* Hamburger (only in welcome mode) */}
      {/* {!isChatStarted && (
        <div className="absolute left-6 top-6 cursor-pointer h-max w-11">
          <Image src={hamburger} alt="hamburger" />
        </div>
      )} */}

      {/* Chat Interface */}
      <div
        className={`flex flex-col items-center ${
          isChatStarted ? "justify-start pt-4 px-8" : "justify-between"
        } h-screen p-8 z-10 relative transition-all duration-500`}
      >
        {/* Header - Logo and Title */}
        <div
          className={`flex flex-col items-center ${
            isChatStarted ? "flex-none py-4 mb-4" : "flex-1 justify-center"
          } max-w-[600px] w-full transition-all duration-500`}
        >
          <div
            className={`${
              isChatStarted ? "w-15 h-15 mb-2" : "w-32 h-32 mb-5"
            } flex items-center justify-center transition-all duration-500`}
          >
            <Image src={logo} alt="centre-section-logo" />
          </div>
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
          {isChatStarted && (
            <div className="text-center text-[#130261] text-2xl font-semibold m-0">
              <p className="m-0">Ask our AI anything</p>
            </div>
          )}
        </div>

        {/* Chat Messages Area */}
        {isChatStarted && (
          <div
            className="flex-1 w-full max-w-[900px] overflow-y-auto mb-4 relative scroll-smooth scrollbar-none"
            ref={messagesContainerRef}
          >
            <div className="flex flex-col gap-6 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`w-full animate-[slideIn_0.3s_ease] ${
                    message.sender === "user"
                      ? "flex justify-end"
                      : "flex justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] px-7 py-5 rounded-[20px] relative text-[15px] leading-relaxed ${
                      message.sender === "user"
                        ? "bg-gradient-to-br from-[#a8d5ba] to-[#7fb069] text-white rounded-br-[6px]"
                        : "bg-gradient-to-br from-[#f8f9fa] to-white text-[#333] border border-[#e5e5e5] rounded-bl-[6px] shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
                    }`}
                  >
                    {message.sender === "user" && (
                      <span className="text-[11px] font-semibold uppercase tracking-wider mb-2 block opacity-80 text-white/90">
                        ME
                      </span>
                    )}
                    {message.sender === "ai" && (
                      <span className="text-[11px] font-semibold uppercase tracking-wider mb-2 block opacity-80 text-[#666]">
                        OUR AI
                      </span>
                    )}
                    <div
                      className="leading-relaxed font-inherit m-0 p-0 text-inherit block w-full break-words"
                      dangerouslySetInnerHTML={{
                        __html: formatMessageText(message.text),
                      }}
                    ></div>

                    {/* Display visualizations if available */}
                    {message.sender === "ai" && (
                      <>
                        {message.has_both_diagrams && (
                          <div className="mt-6 p-5 bg-gradient-to-br from-[#f8f9fa] to-white rounded-2xl border border-[#e5e7eb] shadow-[0_4px_12px_rgba(0,0,0,0.05)] animate-[fadeInUp_0.5s_ease-out]">
                            <h4 className="text-[#374151] text-base font-semibold mb-4 flex items-center gap-2">
                              📊 Visual Documentation
                            </h4>
                            <div className="grid grid-cols-2 gap-5 mobile-single-col">
                              <div className="bg-white rounded-xl p-4 border border-[#e5e7eb] shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                                <h5 className="text-[#374151] text-sm font-semibold mb-3 flex items-center gap-1.5">
                                  🏗️ AWS Architecture Diagram
                                </h5>
                                {message.architecture_url && (
                                  <img
                                    src={`http://13.220.115.202:8000${message.architecture_url}`}
                                    alt="Architecture Diagram"
                                    className="w-full h-auto rounded-lg border border-[#e5e7eb] shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:border-[#9ecbfb]"
                                    onClick={() =>
                                      handleImageClick(
                                        `http://13.220.115.202:8000${message.architecture_url}`,
                                        "AWS Architecture Diagram"
                                      )
                                    }
                                  />
                                )}
                              </div>
                              <div className="bg-white rounded-xl p-4 border border-[#e5e7eb] shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                                <h5 className="text-[#374151] text-sm font-semibold mb-3 flex items-center gap-1.5">
                                  📊 Process Flowchart
                                </h5>
                                {message.flowchart_url && (
                                  <img
                                    src={`http://13.220.115.202:8000${message.flowchart_url}`}
                                    alt="Process Flowchart"
                                    className="w-full h-auto rounded-lg border border-[#e5e7eb] shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:border-[#9ecbfb]"
                                    onClick={() =>
                                      handleImageClick(
                                        `http://13.220.115.202:8000${message.flowchart_url}`,
                                        "Process Flowchart"
                                      )
                                    }
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {!message.has_both_diagrams &&
                          message.has_architecture && (
                            <div className="mt-6 p-5 bg-gradient-to-br from-[#f8f9fa] to-white rounded-2xl border border-[#e5e7eb] shadow-[0_4px_12px_rgba(0,0,0,0.05)] animate-[fadeInUp_0.5s_ease-out]">
                              <h4 className="text-[#374151] text-base font-semibold mb-4 flex items-center gap-2">
                                🏗️ AWS Architecture Diagram
                              </h4>
                              {message.architecture_url && (
                                <img
                                  src={`http://13.220.115.202:8000${message.architecture_url}`}
                                  alt="Architecture Diagram"
                                  className="w-full h-auto rounded-lg border border-[#e5e7eb] shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:border-[#9ecbfb]"
                                  onClick={() =>
                                    handleImageClick(
                                      `http://13.220.115.202:8000${message.architecture_url}`,
                                      "AWS Architecture Diagram"
                                    )
                                  }
                                />
                              )}
                            </div>
                          )}

                        {!message.has_both_diagrams &&
                          message.has_flowchart && (
                            <div className="mt-6 p-5 bg-gradient-to-br from-[#f8f9fa] to-white rounded-2xl border border-[#e5e7eb] shadow-[0_4px_12px_rgba(0,0,0,0.05)] animate-[fadeInUp_0.5s_ease-out]">
                              <h4 className="text-[#374151] text-base font-semibold mb-4 flex items-center gap-2">
                                📊 Process Flowchart
                              </h4>
                              {message.flowchart_url && (
                                <img
                                  src={`http://13.220.115.202:8000${message.flowchart_url}`}
                                  alt="Process Flowchart"
                                  className="w-full h-auto rounded-lg border border-[#e5e7eb] shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:border-[#9ecbfb]"
                                  onClick={() =>
                                    handleImageClick(
                                      `http://13.220.115.202:8000${message.flowchart_url}`,
                                      "Process Flowchart"
                                    )
                                  }
                                />
                              )}
                            </div>
                          )}

                        {!message.has_both_diagrams &&
                          !message.has_architecture &&
                          !message.has_flowchart &&
                          message.visualization_url && (
                            <div className="mt-6 p-5 bg-gradient-to-br from-[#f8f9fa] to-white rounded-2xl border border-[#e5e7eb] shadow-[0_4px_12px_rgba(0,0,0,0.05)] animate-[fadeInUp_0.5s_ease-out]">
                              <h4 className="text-[#374151] text-base font-semibold mb-4 flex items-center gap-2">
                                📊 Visualization
                              </h4>
                              <img
                                src={`http://13.220.115.202:8000${message.visualization_url}`}
                                alt="Visualization"
                                className="w-full h-auto rounded-lg border border-[#e5e7eb] shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:border-[#9ecbfb]"
                                onClick={() =>
                                  handleImageClick(
                                    `http://13.220.115.202:8000${message.visualization_url}`,
                                    "Visualization"
                                  )
                                }
                              />
                            </div>
                          )}
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to Bottom Button */}
            <button
              className={`absolute bottom-5 right-5 w-10 h-10 bg-gradient-to-br from-[#a8d5ba] to-[#7fb069] border-none rounded-full cursor-pointer flex items-center justify-center shadow-[0_4px_12px_rgba(127,176,105,0.3)] transition-all duration-300 z-10 ${
                showScrollToBottom
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2.5"
              } hover:scale-110 hover:shadow-[0_6px_16px_rgba(127,176,105,0.4)]`}
              onClick={scrollToBottom}
              aria-label="Scroll to bottom"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
              </svg>
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="w-full max-w-[900px] mb-8">
          <div className="mb-6 relative bg-gradient-to-br from-[#e1d9d9] to-[#9ecbfb] p-[3px] rounded-[15px] w-full max-w-[900px]">
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
              className="w-full min-h-[50px] max-h-[120px] py-[15px] px-6 pr-[115px] border-none rounded-xl text-base outline-none bg-white text-[#333] font-inherit leading-normal resize-none overflow-y-auto placeholder:text-[#888] placeholder:font-normal scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[rgba(158,203,251,0.3)] hover:scrollbar-thumb-[rgba(158,203,251,0.5)]"
              style={{ resize: "none" }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="absolute right-2 top-7.5 -translate-y-1/2 w-[100px] h-[42px] border-none rounded-xl bg-gradient-to-br from-[#a8d5ba] to-[#7fb069] cursor-pointer flex items-center justify-center shadow-[0_3px_10px_rgba(127,176,105,0.3)] transition-all duration-200 z-[2] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-95 enabled:hover:scale-105 enabled:hover:shadow-[0_5px_15px_rgba(127,176,105,0.4)] enabled:active:scale-95"
            >
              <Image src={send} alt="Send" />
            </button>
          </div>

          {!isChatStarted && (
            <div className="flex flex-nowrap gap-3 justify-center max-w-[900px] w-full">
              <div className="flex-1 min-w-[140px] max-w-[180px]">
                <button
                  onClick={() =>
                    handleQuickAction(
                      "I need help creating a comprehensive proposal for an AI/ML solution for my customer"
                    )
                  }
                  className="w-full py-2.5 px-2 border border-[#e5e5e5] rounded-xl bg-gradient-to-br from-white to-[#f8f9fa] text-xs cursor-pointer transition-all duration-300 shadow-[0_2px_4px_rgba(0,0,0,0.05)] text-[#333] font-medium whitespace-nowrap h-[42px] flex items-center justify-center hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:border-[#9ecbfb] hover:bg-gradient-to-br hover:from-[#f0f8ff] hover:to-white"
                >
                  🌆 Create Proposals
                </button>
              </div>
              <div className="flex-1 min-w-[140px] max-w-[180px]">
                <button
                  onClick={() =>
                    handleQuickAction(
                      "Can you help me create a process flow diagram for an AI/ML project workflow?"
                    )
                  }
                  className="w-full py-2.5 px-2 border border-[#e5e5e5] rounded-xl bg-gradient-to-br from-white to-[#f8f9fa] text-xs cursor-pointer transition-all duration-300 shadow-[0_2px_4px_rgba(0,0,0,0.05)] text-[#333] font-medium whitespace-nowrap h-[42px] flex items-center justify-center hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:border-[#9ecbfb] hover:bg-gradient-to-br hover:from-[#f0f8ff] hover:to-white"
                >
                  🍾 Flow Diagram
                </button>
              </div>
              <div className="flex-1 min-w-[140px] max-w-[180px]">
                <button
                  onClick={() =>
                    handleQuickAction(
                      "I need expert advice on AI/ML solution architecture and feasibility"
                    )
                  }
                  className="w-full py-2.5 px-2 border border-[#e5e5e5] rounded-xl bg-gradient-to-br from-white to-[#f8f9fa] text-xs cursor-pointer transition-all duration-300 shadow-[0_2px_4px_rgba(0,0,0,0.05)] text-[#333] font-medium whitespace-nowrap h-[42px] flex items-center justify-center hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:border-[#9ecbfb] hover:bg-gradient-to-br hover:from-[#f0f8ff] hover:to-white"
                >
                  🎓 Get Advice
                </button>
              </div>
              <div className="flex-1 min-w-[140px] max-w-[180px]">
                <button
                  onClick={() =>
                    handleQuickAction(
                      "Help me brainstorm AI/ML solutions for my customer's business requirements"
                    )
                  }
                  className="w-full py-2.5 px-2 border border-[#e5e5e5] rounded-xl bg-gradient-to-br from-white to-[#f8f9fa] text-xs cursor-pointer transition-all duration-300 shadow-[0_2px_4px_rgba(0,0,0,0.05)] text-[#333] font-medium whitespace-nowrap h-[42px] flex items-center justify-center hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:border-[#9ecbfb] hover:bg-gradient-to-br hover:from-[#f0f8ff] hover:to-white"
                >
                  🧠 Brainstorm
                </button>
              </div>
              <div className="flex-1 min-w-[140px] max-w-[180px]">
                <button
                  onClick={() =>
                    handleQuickAction(
                      "Generate an AWS architecture diagram for an AI/ML solution"
                    )
                  }
                  className="w-full py-2.5 px-2 border border-[#e5e5e5] rounded-xl bg-gradient-to-br from-white to-[#f8f9fa] text-xs cursor-pointer transition-all duration-300 shadow-[0_2px_4px_rgba(0,0,0,0.05)] text-[#333] font-medium whitespace-nowrap h-[42px] flex items-center justify-center hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:border-[#9ecbfb] hover:bg-gradient-to-br hover:from-[#f0f8ff] hover:to-white"
                >
                  📸 Architecture
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-[5px] flex items-center justify-center z-[1000] animate-[fadeIn_0.3s_ease]"
          onClick={() => setShowImageModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-[90vw] max-h-[90vh] flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-[scaleIn_0.3s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-5 px-6 pb-4 border-b border-[#e5e7eb] flex justify-between items-center bg-[#f8f9fa]">
              <h3 className="m-0 text-lg font-semibold text-[#374151]">
                {selectedImage.title}
              </h3>
              <div className="flex gap-2">
                <button
                  className="w-10 h-10 border-none rounded-lg bg-[#f3f4f6] text-[#374151] cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-[#e5e7eb] hover:scale-105"
                  onClick={handleDownloadImage}
                  title="Download"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="currentColor"
                  >
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                  </svg>
                </button>
                <button
                  className="w-10 h-10 border-none rounded-lg bg-[#f3f4f6] text-[#374151] cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-[#e5e7eb] hover:scale-105"
                  onClick={handleFullScreen}
                  title="Open in new tab"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="currentColor"
                  >
                    <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
                  </svg>
                </button>
                <button
                  className="w-10 h-10 border-none rounded-lg bg-[#fee2e2] text-[#dc2626] cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-[#fecaca] hover:scale-105"
                  onClick={() => setShowImageModal(false)}
                  title="Close"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="currentColor"
                  >
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 flex items-center justify-center min-h-[400px] max-h-[70vh] overflow-auto">
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="max-w-full max-h-full object-contain rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default page;
