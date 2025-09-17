const QuickActionButton = ({ url, label }) => {
  const handleOnClick = (url) => {
    window.open(url, "_blank");
  };

  return (
    <button
      onClick={() => handleOnClick(url)}
      className="w-full py-2.5 px-2 border border-[#e5e5e5] rounded-xl bg-gradient-to-br from-white to-[#f8f9fa] text-xs cursor-pointer transition-all duration-300 shadow-[0_2px_4px_rgba(0,0,0,0.05)] text-[#333] font-medium whitespace-nowrap h-[42px] flex items-center justify-center hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:border-[#9ecbfb] hover:bg-gradient-to-br hover:from-[#f0f8ff] hover:to-white"
    >
      {label}
    </button>
  );
};

export default QuickActionButton;
