const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
}

export async function adminApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = typeof window !== "undefined" ? localStorage.getItem("cv_admin_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  // Auto refresh on 401
  if (res.status === 401 && !endpoint.includes("/admin/auth/login")) {
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("cv_admin_refresh_token") : null;
    const refreshHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (refreshToken) {
      refreshHeaders["Authorization"] = `Bearer ${refreshToken}`;
    }

    const refreshRes = await fetch(`${API_URL}/admin/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: refreshHeaders,
      body: JSON.stringify({ refreshToken }),
    });

    if (refreshRes.ok) {
      const refreshData = await refreshRes.json();
      const newAccessToken = refreshData?.data?.accessToken;
      const newRefreshToken = refreshData?.data?.refreshToken;
      if (typeof window !== "undefined") {
        if (newAccessToken) localStorage.setItem("cv_admin_token", newAccessToken);
        if (newRefreshToken) localStorage.setItem("cv_admin_refresh_token", newRefreshToken);
        document.cookie = "cv_admin_session=1; path=/; SameSite=Lax; max-age=2592000";
      }

      const retryHeaders = {
        ...headers,
        ...(newAccessToken ? { Authorization: `Bearer ${newAccessToken}` } : {}),
      };

      const retry = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        credentials: "include",
        headers: retryHeaders,
      });
      return retry.json();
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem("cv_admin_token");
      localStorage.removeItem("cv_admin_refresh_token");
      document.cookie = "cv_admin_session=; path=/; SameSite=Lax; max-age=0";
      window.location.href = "/login";
    }
  }

  return res.json();
}

export const ADMIN_API = {
  login: "/admin/auth/login",
  logout: "/admin/auth/logout",
  me: "/admin/auth/me",
  stats: "/admin/dashboard/stats",
  events: "/events",
  eventById: (id: string) => `/events/${id}`,
  registrations: "/registrations",
  adminsList: "/admin/admins",
  createAdmin: "/admin/admins",
  deactivateAdmin: (id: string) => `/admin/admins/${id}/deactivate`,
  auditLogs: "/admin/audit-logs",
  announcements: "/admin/announcements",
  exportRegistrations: "/admin/export/registrations",
  markAttendance: (id: string) => `/registrations/${id}/attendance`,
  upload: "/admin/upload",
};
