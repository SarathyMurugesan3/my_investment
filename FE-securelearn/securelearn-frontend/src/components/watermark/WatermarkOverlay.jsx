const WatermarkOverlay = ({ text }) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden select-none">
      <div className="absolute inset-0 opacity-20 animate-[spin_60s_linear_infinite]">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute text-gray-700 text-sm whitespace-pre rotate-[-30deg]"
            style={{
              top: `${(i % 10) * 10}%`,
              left: `${Math.floor(i / 10) * 30}%`,
            }}
          >
            {text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WatermarkOverlay;