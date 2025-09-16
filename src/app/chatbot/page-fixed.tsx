"use client";

import React, { useState, useRef, useEffect } from "react";
import "@/app/chatbot/page.css";
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

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

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
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
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

  // Fixed handleQuickAction to just set input value without auto-sending
  const handleQuickAction = (action: string) => {
    setInputValue(action);
    // Don't auto-send, let user review and send manually
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
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

  function formatMessageText(text: string): string {
    if (!text) return "";

    marked.setOptions({
      async: false,
      breaks: true,
      gfm: true,
      pedantic: false,
      silent: false,
      renderer: new marked.Renderer(),
      tokenizer: new marked.Tokenizer(),
      walkTokens: null,
    });

    try {
      const htmlContent = marked.parse(text) as string;
      return htmlContent;
    } catch (error) {
      console.error("Markdown parsing error:", error);
      return text.replace(/\n/g, "<br>");
    }
  }

  return (
    <div className="main-content">
      <div className="top-right-image">
        <Image src={top_right} alt="top_right"></Image>
      </div>
      <div className="bottom-left-image">
        <Image src={bottom_left} alt="bottom_left"></Image>
      </div>

      {isChatStarted && (
        <div className="back-button-container">
          <button className="back-button" onClick={handleBackToWelcome}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
        </div>
      )}

      {!isChatStarted && (
        <div className="hamburger-container">
          <Image src={hamburger} alt="hamburger"></Image>
        </div>
      )}

      <div className={`centre-section ${isChatStarted ? "chat-mode" : ""}`}>
        <div
          className={`centre-section-header ${
            isChatStarted ? "chat-header" : ""
          }`}
        >
          <div className="centre-section-logo">
            <Image src={logo} alt="centre-section-logo"></Image>
          </div>
          {!isChatStarted && (
            <>
              <div className="centre-section-text1">
                <p>
                  Hey User! <br></br>Can I help you with anything?
                </p>
              </div>
              <div className="centre-section-text2">
                <p>Ready to assist you with anything you need.</p>
              </div>
            </>
          )}
          {isChatStarted && (
            <div className="chat-title">
              <p>Ask our AI anything</p>
            </div>
          )}
        </div>

        {isChatStarted && (
          <div className="chat-messages-container" ref={messagesContainerRef}>
            <div className="chat-messages">
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.sender}`}>
                  <div className="message-content">
                    {message.sender === "user" && (
                      <span className="message-label">ME</span>
                    )}
                    {message.sender === "ai" && (
                      <span className="message-label">OUR AI</span>
                    )}
                    <div
                      className="message-text"
                      dangerouslySetInnerHTML={{
                        __html: formatMessageText(message.text),
                      }}
                    ></div>

                    {message.sender === "ai" && (
                      <>
                        {message.has_both_diagrams && (
                          <div className="visualizations-container">
                            <h4 className="viz-title">
                              📊 Visual Documentation
                            </h4>
                            <div className="dual-diagrams">
                              <div className="diagram-item">
                                <h5>🏗️ AWS Architecture Diagram</h5>
                                {message.architecture_url && (
                                  <img
                                    src={`http://13.220.115.202:8000${message.architecture_url}`}
                                    alt="Architecture Diagram"
                                    className="diagram-image"
                                    onClick={() =>
                                      handleImageClick(
                                        `http://13.220.115.202:8000${message.architecture_url}`,
                                        "AWS Architecture Diagram"
                                      )
                                    }
                                  />
                                )}
                              </div>
                              <div className="diagram-item">
                                <h5>📊 Process Flowchart</h5>
                                {message.flowchart_url && (
                                  <img
                                    src={`http://13.220.115.202:8000${message.flowchart_url}`}
                                    alt="Process Flowchart"
                                    className="diagram-image"
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
                            <div className="visualizations-container">
                              <h4 className="viz-title">
                                🏗️ AWS Architecture Diagram
                              </h4>
                              {message.architecture_url && (
                                <img
                                  src={`http://13.220.115.202:8000${message.architecture_url}`}
                                  alt="Architecture Diagram"
                                  className="diagram-image"
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
                            <div className="visualizations-container">
                              <h4 className="viz-title">
                                📊 Process Flowchart
                              </h4>
                              {message.flowchart_url && (
                                <img
                                  src={`http://13.220.115.202:8000${message.flowchart_url}`}
                                  alt="Process Flowchart"
                                  className="diagram-image"
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
                            <div className="visualizations-container">
                              <h4 className="viz-title">📊 Visualization</h4>
                              <img
                                src={`http://13.220.115.202:8000${message.visualization_url}`}
                                alt="Visualization"
                                className="diagram-image"
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

            <button
              className={`scroll-to-bottom ${
                showScrollToBottom ? "visible" : ""
              }`}
              onClick={scrollToBottom}
              aria-label="Scroll to bottom"
            >
              <svg viewBox="0 0 24 24">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
              </svg>
            </button>
          </div>
        )}

        <div className="centre-section-chat-area">
          <div className="centre-section-chat-area-textbox">
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
              style={{ resize: "none" }}
            />
            <button onClick={handleSendMessage} disabled={!inputValue.trim()}>
              <Image src={send} alt="Send"></Image>
            </button>
          </div>

          {!isChatStarted && (
            <div className="centre-section-chat-area-buttons">
              <div className="centre-section-chat-area-buttons-1">
                <button
                  onClick={() =>
                    handleQuickAction(
                      "I need help creating a comprehensive proposal for an AI/ML solution for my customer"
                    )
                  }
                >
                  🌆 Create Proposals
                </button>
              </div>
              <div className="centre-section-chat-area-buttons-2">
                <button
                  onClick={() =>
                    handleQuickAction(
                      "Can you help me create a process flow diagram for an AI/ML project workflow?"
                    )
                  }
                >
                  🍾 Flow Diagram
                </button>
              </div>
              <div className="centre-section-chat-area-buttons-3">
                <button
                  onClick={() =>
                    handleQuickAction(
                      "I need expert advice on AI/ML solution architecture and feasibility"
                    )
                  }
                >
                  🎓 Get Advice
                </button>
              </div>
              <div className="centre-section-chat-area-buttons-4">
                <button
                  onClick={() =>
                    handleQuickAction(
                      "Help me brainstorm AI/ML solutions for my customer's business requirements"
                    )
                  }
                >
                  🧠 Brainstorm
                </button>
              </div>
              <div className="centre-section-chat-area-buttons-5">
                <button
                  onClick={() =>
                    handleQuickAction(
                      "Generate an AWS architecture diagram for an AI/ML solution"
                    )
                  }
                >
                  📸 Architecture
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showImageModal && selectedImage && (
        <div
          className="image-modal-overlay"
          onClick={() => setShowImageModal(false)}
        >
          <div
            className="image-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="image-modal-header">
              <h3>{selectedImage.title}</h3>
              <div className="image-modal-controls">
                <button
                  className="modal-control-btn"
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
                  className="modal-control-btn"
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
                  className="modal-control-btn close-btn"
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
            <div className="image-modal-body">
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="modal-image"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default page;
