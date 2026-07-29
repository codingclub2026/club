/**
 * CodeVed API Client
 *
 * Auth strategy:
 * - Student routes → Clerk JWT Bearer token is obtained client-side via
 *   useAuth().getToken() and sent in Authorization header to backend.
 *   The BACKEND verifies the Clerk JWT using CLERK_SECRET_KEY.
 *   The frontend only needs NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.
 *
 * - Admin routes → HttpOnly cookies (cv_admin_at / cv_admin_rt) set by backend.
 *   cookies: 'include' is used so the browser automatically sends them.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, string[]>;
  requestId?: string;
}

// ─── Student API: sends Clerk Bearer token to backend for verification ────────

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  clerkToken?: string | null
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (clerkToken) {
    // Backend's requireClerkUser() verifies this via @clerk/backend
    headers["Authorization"] = `Bearer ${clerkToken}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (!res.ok && res.status === 0) {
    return { success: false, error: "Cannot connect to backend. Is the server running on port 4000?" };
  }

  return res.json();
}

// ─── Admin API: sends HttpOnly cookies (no Clerk token) ──────────────────────

export async function adminApiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include", // sends cv_admin_at + cv_admin_rt cookies automatically
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  });

  // Auto-refresh admin token on 401 (except on login endpoint itself)
  if (res.status === 401 && !endpoint.includes("/admin/auth/login")) {
    const refresh = await fetch(`${API_URL}/admin/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (refresh.ok) {
      // Retry with refreshed token
      const retry = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(options.headers as Record<string, string>),
        },
      });
      return retry.json();
    }

    // Refresh failed — redirect to admin login
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
    }
    return { success: false, error: "Session expired. Please log in again." };
  }

  return res.json();
}

// ─── API endpoint constants ────────────────────────────────────────────────────

export const API = {
  // Student (Clerk-protected) — backend verifies Clerk JWT
  authSync: "/auth/sync",
  authMe: "/auth/me",
  myRegistrations: "/registrations/my",
  register: "/registrations",
  soloRegister: "/registrations/solo",

  // Public (no auth)
  events: "/events",
  eventById: (id: string) => `/events/${id}`,
  bookmark: (id: string) => `/events/${id}/bookmark`,

  // Admin (HttpOnly cookie — NO Clerk)
  adminLogin: "/admin/auth/login",
  adminLogout: "/admin/auth/logout",
  adminMe: "/admin/auth/me",
  adminStats: "/admin/dashboard/stats",
  adminAdmins: "/admin/admins",
  deactivateAdmin: (id: string) => `/admin/admins/${id}/deactivate`,
  adminAuditLogs: "/admin/audit-logs",
  adminAnnouncements: "/admin/announcements",
  exportRegistrations: "/admin/export/registrations",
  markAttendance: (id: string) => `/registrations/${id}/attendance`,
};
