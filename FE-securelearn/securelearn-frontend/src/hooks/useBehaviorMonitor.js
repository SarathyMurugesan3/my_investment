import { useEffect, useState, useRef, useCallback } from "react";
import { reportScreenshot } from "../api/monitorApi";
import { useFingerprint } from "./useFingerprint";

export const useBehaviorMonitor = () => {
  const fingerprint = useFingerprint();
  const [isLocked, setIsLocked] = useState(false);
  const devtoolsOpen = useRef(false);

  const triggerSecurity = useCallback(async () => {
    setIsLocked(true);

    if (fingerprint) {
      try {
        await reportScreenshot(fingerprint);
      } catch { }
    }
  }, [fingerprint]);

  // 🔒 Heavy detection — production only
  useEffect(() => {
    if (!import.meta.env.PROD) return;

    const detectDevTools = () => {
      const threshold = 160;

      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        if (!devtoolsOpen.current) {
          devtoolsOpen.current = true;
          triggerSecurity();
        }
      }
    };

    const interval = setInterval(detectDevTools, 1000);

    const handleVisibility = () => {
      if (document.hidden) triggerSecurity();
    };

    const handleResize = () => {
      if (window.innerWidth < 500) triggerSecurity();
    };

    const blockKeys = (e) => {
      if (
        e.ctrlKey &&
        ["c", "s", "p"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        triggerSecurity();
      }
    };

    const blockRightClick = (e) => {
      e.preventDefault();
      triggerSecurity();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("resize", handleResize);
    document.addEventListener("keydown", blockKeys);
    document.addEventListener("contextmenu", blockRightClick);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("keydown", blockKeys);
      document.removeEventListener("contextmenu", blockRightClick);
    };
  }, [triggerSecurity]);

  // 📸 PrintScreen / Ins+PrtScr detection — always active (dev + prod)
  useEffect(() => {
    const screenshotLock = { current: false };

    const handlePrintScreen = (e) => {
      const isPrintScreen =
        e.key === "PrintScreen" ||
        e.key === "Print" ||
        (e.shiftKey && e.key === "PrintScreen") ||
        (e.altKey && e.key === "PrintScreen") ||
        (e.ctrlKey && e.key === "PrintScreen") ||
        (e.metaKey && e.shiftKey && e.key.toLowerCase() === "s") || // Win+Shift+S (Windows Snipping Tool) / Cmd+Shift+S
        (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key)) || // Cmd+Shift+3/4/5 (Mac Screenshot)
        (e.altKey && e.metaKey && e.key.toLowerCase() === "r") || // Win+Alt+R (Game Bar Screen Record)
        (e.metaKey && e.key.toLowerCase() === "g"); // Win+G (Game Bar)

      if (isPrintScreen) {
        e.preventDefault();
        if (!screenshotLock.current) {
          screenshotLock.current = true;
          triggerSecurity();
          setTimeout(() => { screenshotLock.current = false; }, 2000);
        }
      }
    };

    // Some browsers fire 'keydown', others only 'keyup' for PrtScr
    document.addEventListener("keydown", handlePrintScreen);
    document.addEventListener("keyup", handlePrintScreen);

    return () => {
      document.removeEventListener("keydown", handlePrintScreen);
      document.removeEventListener("keyup", handlePrintScreen);
    };
  }, [triggerSecurity]);

  return { isLocked };
};