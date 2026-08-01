import api from "./axios";

/**
 * GET /api/student/content
 * Returns list of all videos and PDFs assigned to the student's tenant.
 */
export const getStudentContent = () => {
  return api.get("/api/student/content");
};

/**
 * GET /api/student/profile
 */
export const getStudentProfile = () => {
  return api.get("/api/student/profile");
};

/**
 * GET /api/student/pdf/url/{id}
 * Returns a signed URL for secure PDF viewing.
 */
export const getPdfSignedUrl = (id) => {
  return api.get(`/api/student/pdf/url/${id}`);
};

/**
 * GET /api/student/pdf/{id}
 * Returns PDF view data/metadata.
 */
export const getPdfData = (id) => {
  return api.get(`/api/student/pdf/${id}`);
};

/**
 * Upload content (PDF or Video) to the admin endpoint.
 * @param {FormData} formData  - Must include `title` and `file` fields.
 * @param {Function} onUploadProgress - Axios progress callback (event) => {}
 */
export const uploadContent = (formData, onUploadProgress) => {
  return api.post("/api/admin/content/upload", formData, {
    onUploadProgress,
  });
};