import api from "./axios";

/* ── Threads ──────────────────────────────────────────── */

/** GET /api/discussions/course/{courseId}/threads */
export const getThreads = (courseId) =>
  api.get(`/api/discussions/course/${courseId}/threads`);

/** POST /api/discussions/course/{courseId}/threads
 *  body: { title, content }
 */
export const createThread = (courseId, body) =>
  api.post(`/api/discussions/course/${courseId}/threads`, body);

/** DELETE /api/discussions/threads/{threadId} */
export const deleteThread = (threadId) =>
  api.delete(`/api/discussions/threads/${threadId}`);

/* ── Replies ──────────────────────────────────────────── */

/** GET /api/discussions/threads/{threadId}/replies */
export const getReplies = (threadId) =>
  api.get(`/api/discussions/threads/${threadId}/replies`);

/** POST /api/discussions/threads/{threadId}/replies
 *  body: { content, parentReplyId? }
 */
export const createReply = (threadId, body) =>
  api.post(`/api/discussions/threads/${threadId}/replies`, body);

/** DELETE /api/discussions/replies/{replyId} */
export const deleteReply = (replyId) =>
  api.delete(`/api/discussions/replies/${replyId}`);
