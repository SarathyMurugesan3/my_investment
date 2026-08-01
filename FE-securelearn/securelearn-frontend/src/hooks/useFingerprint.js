import { useEffect, useState } from "react";

const generateFingerprint = () => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.textBaseline = "top";
  ctx.font = "14px Arial";
  ctx.fillText(navigator.userAgent, 2, 2);

  return btoa(
    canvas.toDataURL() +
      navigator.userAgent +
      navigator.language +
      screen.width +
      screen.height
  );
};

export const useFingerprint = () => {
  const [fingerprint, setFingerprint] = useState(null);

  useEffect(() => {
    let stored = localStorage.getItem("deviceFingerprint");

    if (!stored) {
      stored = generateFingerprint();
      localStorage.setItem("deviceFingerprint", stored);
    }

    setFingerprint(stored);
  }, []);

  return fingerprint;
};