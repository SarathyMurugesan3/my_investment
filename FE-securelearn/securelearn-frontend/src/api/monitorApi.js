import api from "./axios";

export const reportScreenshot = (fingerprint) => {
  return api.post("/api/monitor/screenshot", null, {
    params: { fingerprint },
  });
};

/**
 * POST /api/monitor/tab-switch
 * Logs a tab-switch event for the given content ID and fingerprint.
 */
export const logTabSwitch = (payload) => {
  return api.post("/api/monitor/tab-switch", payload);
};