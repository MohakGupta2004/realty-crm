// Use proxy through Next.js rewrites (avoids CORS)
const API_BASE_URL = "/api/v1";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Get token from localStorage
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: "include",
    };

    let response = await fetch(url, config);

    // If unauthorized, try to refresh token
    if (response.status === 401 && token) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry the original request with new token
        const newToken = localStorage.getItem("accessToken");
        headers["Authorization"] = `Bearer ${newToken}`;
        response = await fetch(url, { ...config, headers });
      }
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("accessToken", data.accessToken);
        return true;
      }

      // Clear auth state on refresh failure
      localStorage.removeItem("accessToken");
      return false;
    } catch (error) {
      localStorage.removeItem("accessToken");
      return false;
    }
  }

  get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T>(
    endpoint: string,
    body: unknown,
    options: RequestInit = {},
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  put<T>(
    endpoint: string,
    body: unknown,
    options: RequestInit = {},
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  patch<T>(
    endpoint: string,
    body: unknown,
    options: RequestInit = {},
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const api = new ApiClient(API_BASE_URL);

// Auth API helpers
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{
      accessToken: string;
      user: { id: string; name: string; email: string; role: string };
    }>("/auth/login", { email, password }),

  register: (name: string, email: string, password: string) =>
    api.post<{
      accessToken: string;
      user: { id: string; name: string; email: string; role: string };
    }>("/auth/register", { name, email, password }),

  logout: () => api.post<void>("/auth/logout", {}),

  getMe: () =>
    api.get<{
      user: { id: string; name: string; email: string; role: string };
    }>("/users/me"),

  googleAuth: () => {
    // Use full backend URL for Google OAuth (needs to redirect back)
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    window.location.href = `${backendUrl}/auth/google`;
  },
};

// User API helpers
export const userApi = {
  getMe: () =>
    api.get<{
      user: { id: string; name: string; email: string; role: string };
    }>("/users/me"),
};

// Workspace API helpers
export interface Workspace {
  _id: string;
  name: string;
  type: "SOLO" | "TEAM";
  createdAt: string;
  updatedAt: string;
}

export const workspaceApi = {
  create: (name: string) => api.post<Workspace>("/workspace/create", { name }),
  getWorkspaces: () =>
    api.get<{ memberships: Array<{ workspaceId: Workspace; role: string }> }>(
      "/memberships/workspace",
    ),
};
