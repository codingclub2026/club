const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
}

export async function adminApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  });

  // Auto refresh on 401
  if (res.status === 401 && !endpoint.includes("/admin/auth/login")) {
    const refresh = await fetch(`${API_URL}/admin/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (refresh.ok) {
      const retry = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(options.headers as Record<string, string>) },
      });
      return retry.json();
    }
    if (typeof window !== "undefined") {
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
