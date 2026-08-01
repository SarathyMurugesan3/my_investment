import { useEffect, useRef, useState } from "react";
import { reportScreenshot } from "../api/monitorApi";
import { useFingerprint } from "./useFingerprint";

export const useMonitoring = () => {
  const fingerprint = useFingerprint();
  const [isBlurred, setIsBlurred] = useState(false);
  const devtoolsOpenRef = useRef(false);
  const rightClickCount = useRef(0);
  const tabSwitchCount = useRef(0);

  const triggerRisk = async () => {
    if (!fingerprint) return;
    try {
      await reportScreenshot(fingerprint);
    } catch (err) {
      console.error("Monitoring error:", err);
    }
  };

  useEffect(() => {
    // 🔍 DEVTOOLS Detection (heuristic)
    const detectDevTools = () => {
      const threshold = 160;
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        if (!devtoolsOpenRef.current) {
          devtoolsOpenRef.current = true;
          setIsBlurred(true);
          triggerRisk();
        }
      } else {
        devtoolsOpenRef.current = false;
        setIsBlurred(false);
      }
    };

    const interval = setInterval(detectDevTools, 1000);

    // 🖱 Right Click Detection
    const handleContextMenu = (e) => {
      e.preventDefault();
      rightClickCount.current += 1;

      if (rightClickCount.current >= 3) {
        setIsBlurred(true);
        triggerRisk();
      }
    };

    // 👁 Tab Visibility Detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchCount.current += 1;
        setIsBlurred(true);
        triggerRisk();
      } else {
        setIsBlurred(false);
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [fingerprint]);

  return { isBlurred };
};