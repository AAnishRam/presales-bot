import React from "react";

interface BackButtonProps {
  onClick: () => void;
}

const BackButton: React.FC<BackButtonProps> = ({ onClick }) => {
  return (
    <div>
      <button
        className="w-11 h-11 border-none rounded-full bg-white/90 backdrop-blur-[10px] flex items-center justify-center cursor-pointer transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-[#374151] hover:bg-white hover:scale-105 hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)]"
        onClick={onClick}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
      </button>
    </div>
  );
};

export default BackButton;
