import React, { useState } from "react";
import ImageModal from "./ImageModal";

interface AiMessageVisualsProps {
  message: any;
}

interface SelectedImage {
  url: string;
  title: string;
}

const AiMessageVisuals: React.FC<AiMessageVisualsProps> = ({ message }) => {
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(
    null
  );
  const [showImageModal, setShowImageModal] = useState(false);

  const handleImageClick = (url: string, title: string) => {
    setSelectedImage({ url, title });
    setShowImageModal(true);
  };

  const renderSingleVisual = (title: string, url: string) => (
    <div className="mt-6 p-5 bg-gradient-to-br from-[#f8f9fa] to-white rounded-2xl border border-[#e5e7eb] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
      <h4 className="text-[#374151] text-base font-semibold mb-4 flex items-center gap-2">
        {title}
      </h4>
      <img
        src={`http://13.220.115.202:8000${url}`}
        alt={title}
        className="w-full h-auto rounded-lg cursor-pointer transition-all hover:scale-[1.02]"
        onClick={() =>
          handleImageClick(`http://13.220.115.202:8000${url}`, title)
        }
      />
    </div>
  );

  return (
    <>
      {message.has_both_diagrams ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
          {message.architecture_url &&
            renderSingleVisual(
              "🏗️ AWS Architecture Diagram",
              message.architecture_url
            )}
          {message.flowchart_url &&
            renderSingleVisual("📊 Process Flowchart", message.flowchart_url)}
        </div>
      ) : message.has_architecture ? (
        renderSingleVisual(
          "🏗️ AWS Architecture Diagram",
          message.architecture_url
        )
      ) : message.has_flowchart ? (
        renderSingleVisual("📊 Process Flowchart", message.flowchart_url)
      ) : message.visualization_url ? (
        renderSingleVisual("📊 Visualization", message.visualization_url)
      ) : null}

      <ImageModal
        isOpen={showImageModal}
        image={selectedImage}
        onClose={() => setShowImageModal(false)}
      />
    </>
  );
};

export default AiMessageVisuals;
