const TOKEN_KEY = "omnivision_token";
const USER_KEY = "omnivision_user";
export const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
};

export const saveAuth = (payload) => {
  localStorage.setItem(TOKEN_KEY, payload.token);
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  window.dispatchEvent(new Event("authchange"));
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("authchange"));
};

export const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Token ${token}` } : {};
};
