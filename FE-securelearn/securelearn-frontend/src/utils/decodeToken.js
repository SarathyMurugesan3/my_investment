import { jwtDecode } from "jwt-decode";

export const decodeToken = (token) => {
  if (!token) return null;
  return jwtDecode(token);
};