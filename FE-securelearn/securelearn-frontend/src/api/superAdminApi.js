import api from "./axios";

export const getTenants = () => {
  return api.get("/api/super-admin/tenants");
};

export const createTenant = (data) => {
  return api.post("/api/super-admin/tenant", data);
};

export const blockTenant = (id) => {
  return api.put(`/api/super-admin/block/${id}`);
};

export const unblockTenant = (id) => {
  return api.put(`/api/super-admin/unblock/${id}`);
};

export const deleteTenant = (id) => {
  return api.delete(`/api/super-admin/tenant/${id}`);
};

export const getAllUsers = (page = 0, size = 20) => {
  return api.get("/api/super-admin/users", {
    params: { page, size },
  });
};
