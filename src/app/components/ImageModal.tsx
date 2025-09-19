import React from "react";
import { saveAs } from "file-saver";

interface ImageModalProps {
  isOpen: boolean;
  image: { url: string; title: string } | null;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, image, onClose }) => {
  if (!isOpen || !image) return null;

  const handleDownload = async () => {
    console.log(image);
    if (image) {
      try {
        const response = await fetch(
          `/api/chat?url=${encodeURIComponent(
            image.url
          )}&filename=${encodeURIComponent(image.title)}`,
          {
            method: "GET",
          }
        );

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${image.title
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
        try {
          const response = await fetch(image.url);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${image.title
            .replace(/[^a-z0-9]/gi, "_")
            .toLowerCase()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (fallbackError) {
          console.error("Fallback download failed:", fallbackError);
          window.open(image.url, "_blank");
        }
      }
    }
  };

  const handleFullScreen = () => {
    window.open(image.url, "_blank");
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-[5px] flex items-center justify-center z-[1000] animate-[fadeIn_0.3s_ease]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-[90vw] max-h-[90vh] flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-[scaleIn_0.3s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="py-5 px-6 pb-4 border-b border-[#e5e7eb] flex justify-between items-center bg-[#f8f9fa]">
          <h3 className="m-0 text-lg font-semibold text-[#374151]">
            {image.title}
          </h3>
          <div className="flex gap-2">
            <button
              className="w-10 h-10 border-none rounded-lg bg-[#f3f4f6] text-[#374151] flex items-center justify-center hover:bg-[#e5e7eb]"
              onClick={handleDownload}
              title="Download"
            >
              ⬇️
            </button>
            <button
              className="w-10 h-10 border-none rounded-lg bg-[#f3f4f6] text-[#374151] flex items-center justify-center hover:bg-[#e5e7eb]"
              onClick={handleFullScreen}
              title="Open in new tab"
            >
              🔗
            </button>
            <button
              className="w-10 h-10 border-none rounded-lg bg-[#fee2e2] text-[#dc2626] flex items-center justify-center hover:bg-[#fecaca]"
              onClick={onClose}
              title="Close"
            >
              ❌
            </button>
          </div>
        </div>
        <div className="p-6 flex items-center justify-center min-h-[400px] max-h-[70vh] overflow-auto">
          <img
            src={image.url}
            alt={image.title}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
