import api from "./axios";

export const getDashboardStats = () => {
  return api.get("/api/admin/dashboard/stats");
};

export const getUsers = (page = 0, size = 10, sortBy = "id") => {
  return api.get("/api/admin/manage-users", {
    params: { page, size, sortBy },
  });
};

export const blockUser = (id) => {
  return api.post(`/api/admin/manage-users/${id}/block`);
};

export const unblockUser = (id) => {
  return api.post(`/api/admin/manage-users/${id}/unblock`);
};

export const uploadContent = (formData) => {
  return api.post("/api/admin/content/upload", formData);
};

export const createUser = (userData) => {
  return api.post("/api/auth/admin/create-user", userData);
};

export const deleteUser = (id) => {
  return api.delete(`/api/admin/manage-users/${id}`);
};

export const updateUserRole = (id, role) => {
  // API uses query param: PUT /api/admin/manage-users/{id}/role?role=ADMIN
  return api.put(`/api/admin/manage-users/${id}/role`, null, {
    params: { role },
  });
};

export const getAllContent = () => {
  return api.get("/api/admin/content");
};

export const deleteContent = (id) => {
  return api.delete(`/api/admin/content/${id}`);
};