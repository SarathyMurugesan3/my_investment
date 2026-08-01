import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";

const generateSession = () =>
  Math.random().toString(36).substring(2, 12);

export const useWatermark = () => {
  const { user } = useAuth();
  const [timestamp, setTimestamp] = useState(new Date());
  const [sessionId] = useState(generateSession());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  return {
    text: `
${user.email}
IP Tracked
Session: ${sessionId}
${timestamp.toLocaleString()}
    `,
  };
};