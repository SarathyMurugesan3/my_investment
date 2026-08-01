import api from "./axios";

export const registerAdmin = (data) => {
  return api.post("/api/auth/register", data);
};

export const loginApi = (data) => {
  return api.post("/api/auth/login", data);
};

export const superAdminLoginApi = (data) => {
  return api.post("/api/super-admin/login", data);
};

export const logoutApi = () => {
  return api.post("/api/auth/logout");
};