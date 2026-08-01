import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";

const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 12);
};

const DynamicWatermark = ({ ip = "IP Tracked" }) => {
  const { user } = useAuth();
  const [timestamp, setTimestamp] = useState(new Date());
  const [sessionId] = useState(generateSessionId());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  const watermarkText = `
    ${user.email}
    ${ip}
    Session: ${sessionId}
    ${timestamp.toLocaleString()}
  `;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      <div className="absolute inset-0 flex flex-wrap items-center justify-center opacity-20 text-gray-700 text-sm select-none animate-pulse">
        {[...Array(20)].map((_, index) => (
          <div
            key={index}
            className="m-10 rotate-[-30deg] whitespace-pre text-center"
          >
            {watermarkText}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DynamicWatermark;