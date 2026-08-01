import { createContext, useState, useEffect } from "react";
import { loginApi, superAdminLoginApi } from "../api/authApi";
import {
  setAccessToken,
  setRefreshToken,
  clearAccessToken,
  clearRefreshToken,
  getRefreshToken,
} from "../utils/tokenStorage";
import { decodeToken } from "../utils/decodeToken";
import api from "../api/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const initializeAuth = async () => {
    // 1. Check if it's a SUPER_ADMIN session (no refresh token involved)
    const currentAccess = localStorage.getItem("accessToken");
    if (currentAccess) {
      const decoded = decodeToken(currentAccess);
      if (decoded && decoded.role === "SUPER_ADMIN") {
        setUser({
          email: decoded.sub,
          role: decoded.role,
          tenantId: decoded.tenantId,
        });
        setLoading(false);
        return;
      }
    }

    // 2. Standard refresh token flow
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/api/auth/refresh", { refreshToken }, {
        params: { refreshToken },
      });

      const newAccessToken = res.data.accessToken;
      setAccessToken(newAccessToken);

      const decoded = decodeToken(newAccessToken);
      setUser({
        email: decoded.sub,
        role: decoded.role,
        tenantId: decoded.tenantId,
      });
    } catch {
      clearAccessToken();
      clearRefreshToken();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const login = async (data) => {
    const res = await loginApi(data);

    const { accessToken, refreshToken } = res.data;

    setAccessToken(accessToken);
    setRefreshToken(refreshToken);

    const decoded = decodeToken(accessToken);

    setUser({
      email: decoded.sub,
      role: decoded.role,
      tenantId: decoded.tenantId,
    });
  };

  const superAdminLogin = async (data) => {
    const res = await superAdminLoginApi(data);
    const { accessToken } = res.data;

    setAccessToken(accessToken);
    const decoded = decodeToken(accessToken);

    setUser({
      email: decoded.sub,
      role: decoded.role,
      tenantId: decoded.tenantId,
    });
  };

  const logout = () => {
    clearAccessToken();
    clearRefreshToken();
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{ user, login, superAdminLogin, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};