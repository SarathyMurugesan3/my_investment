import api from "./axios";

/**
 * GET /api/video/stream/{id}
 * Fetches a secure streamable video URL or blob from the backend.
 * The Bearer token in the request header enforces tenant isolation.
 */
export const getVideoStream = (id) => {
  return api.get(`/api/video/stream/${id}`);
};

/**
 * GET /api/student/video/url/{id}
 * Returns a signed URL string for secure video streaming (legacy).
 */
export const getVideoSignedUrl = (id) => {
  return api.get(`/api/student/video/url/${id}`);
};

/**
 * GET /api/student/video/{id}
 * Returns video playback metadata (title, description, etc.).
 */
export const getVideoData = (id) => {
  return api.get(`/api/student/video/${id}`);
};