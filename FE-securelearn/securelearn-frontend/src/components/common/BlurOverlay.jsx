const BlurOverlay = () => {
  return (
    <div className="fixed inset-0 backdrop-blur-xl bg-black/30 z-50 flex items-center justify-center">
      <div className="text-white text-xl font-semibold">
        Suspicious Activity Detected
      </div>
    </div>
  );
};

export default BlurOverlay;