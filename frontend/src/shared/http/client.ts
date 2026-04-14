import axios from "axios";

/**
 * Axios instance for TaskFlow API.
 *
 * - `baseURL: "/api"` so the frontend nginx can reverse-proxy to the backend in Docker.
 * - `withCredentials: true` so the HttpOnly auth cookie is sent automatically.
 */
export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // Keep this decoupled from React Router/AuthContext.
      // The app can rely on a hard redirect to reset protected state quickly.
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

