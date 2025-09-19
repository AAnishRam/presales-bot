import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import AiMessageVisuals from "./AiMessageVisuals";

interface ChatMessageProps {
  message: any;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === "user";

  return (
    <div
      className={`w-full animate-[slideIn_0.3s_ease] ${
        isUser ? "flex justify-end" : "flex justify-start"
      }`}
    >
      <div
        className={`px-7 py-5 rounded-[20px] relative text-[15px] leading-relaxed ${
          isUser
            ? "min-w-[20%] max-w-[55%]  bg-gradient-to-br from-[#a8d5ba] to-[#7fb069] text-white rounded-br-[6px]"
            : "max-w-[75%] bg-gradient-to-br from-[#f8f9fa] to-white text-[#333] border border-[#e5e5e5] rounded-bl-[6px] shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
        }`}
      >
        <span
          className={`text-[11px] font-semibold uppercase tracking-wider mb-2 block opacity-80 ${
            isUser ? "text-white/90" : "text-[#666]"
          }`}
        >
          {isUser ? "ME" : "GoML's Scribe"}
        </span>

        <div className={` ${isUser ? "" : ""}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
              h1: ({ children, ...props }) => (
                <h1 className="text-2xl font-bold mb-4" {...props}>
                  {children}
                </h1>
              ),
              h2: ({ children, ...props }) => (
                <h2 className="text-xl font-semibold mt-6 mb-3" {...props}>
                  {children}
                </h2>
              ),
              h3: ({ children, ...props }) => (
                <h3 className="text-lg font-semibold mt-4 mb-2" {...props}>
                  {children}
                </h3>
              ),
              p: ({ children, ...props }) => (
                <p
                  className="mb-3 whitespace-pre-wrap leading-relaxed"
                  {...props}
                >
                  {children}
                </p>
              ),
              strong: ({ children, ...props }) => (
                <strong className="font-semibold" {...props}>
                  {children}
                </strong>
              ),
              ul: ({ children, ...props }) => (
                <ul
                  className="list-disc ml-6 marker:font-bold space-y-1"
                  {...props}
                >
                  {children}
                </ul>
              ),
              ol: ({ node, children, ...props }) => {
                const start = (node as any)?.start ?? 1;
                return (
                  <ol
                    start={start}
                    className="list-decimal ml-6 marker:font-bold space-y-1"
                    {...props}
                  >
                    {children}
                  </ol>
                );
              },
              li: ({ children, ...props }) => (
                <li className="pl-1" {...props}>
                  {children}
                </li>
              ),
              br: (props) => <br {...props} />,
              a: ({ href, children, ...props }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                  {...props}
                >
                  {children}
                </a>
              ),
            }}
          >
            {typeof message.text === "string"
              ? message.text.replace(/\\n/g, "\n")
              : message.text}
          </ReactMarkdown>
        </div>
        {!isUser && <AiMessageVisuals message={message} />}
      </div>
    </div>
  );
};

export default ChatMessage;
