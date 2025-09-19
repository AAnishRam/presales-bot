import React from "react";

interface ScrollToBottomButtonProps {
  show: boolean;
  onClick: () => void;
}

const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({
  show,
  onClick,
}) => (
  <button
    className={`absolute bottom-5 right-5 w-10 h-10 bg-gradient-to-br from-[#a8d5ba] to-[#7fb069] border-none rounded-full cursor-pointer flex items-center justify-center shadow-[0_4px_12px_rgba(127,176,105,0.3)] transition-all duration-300 z-10 ${
      show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2.5"
    } hover:scale-110 hover:shadow-[0_6px_16px_rgba(127,176,105,0.4)]`}
    onClick={onClick}
    aria-label="Scroll to bottom"
  >
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
    </svg>
  </button>
);

export default ScrollToBottomButton;
