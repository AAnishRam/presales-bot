import React from "react";
import ChatMessage from "./ChatMessage";
import ScrollToBottomButton from "./ScrollToBottomButton";
import LoadingMessage from "./LoadingMessage";

interface ChatMessagesContainerProps {
  messages: any[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  showScrollToBottom: boolean;
  scrollToBottom: () => void;
}

const ChatMessagesContainer: React.FC<ChatMessagesContainerProps> = ({
  messages,
  messagesEndRef,
  messagesContainerRef,
  showScrollToBottom,
  scrollToBottom,
}) => {
  return (
    <div
      className="flex-1 w-full max-w-[900px] overflow-y-auto mb-4 relative scroll-smooth scrollbar-none"
      ref={messagesContainerRef}
    >
      <div className="flex flex-col gap-6 py-4">
        {messages.map((message) =>
          message.isLoading ? (
            <LoadingMessage
              key={message.id}
              message={message.text}
              isVisible={true}
            />
          ) : (
            <ChatMessage key={message.id} message={message} />
          )
        )}
        <div ref={messagesEndRef} />
      </div>

      <ScrollToBottomButton
        show={showScrollToBottom}
        onClick={scrollToBottom}
      />
    </div>
  );
};

export default ChatMessagesContainer;
