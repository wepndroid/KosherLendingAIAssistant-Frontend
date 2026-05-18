// Centralized API client for the KosherLending AI Content OS backend.

const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");
const TOKEN_KEY = "kl_token";
const USER_KEY = "kl_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getStoredUser<T = any>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setStoredUser(user: any | null) {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

class ApiError extends Error {
  constructor(public status: number, public body: any, message: string) {
    super(message);
  }
}

async function request<T = any>(
  path: string,
  init: RequestInit & { json?: any; auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token && init.auth !== false) headers.set("Authorization", `Bearer ${token}`);
  let body: any = init.body;
  if (init.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.json);
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers, body });
  const text = await res.text();
  let data: any = text;
  try { data = text ? JSON.parse(text) : null; } catch { /* keep as text */ }
  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || `HTTP ${res.status}`;
    throw new ApiError(res.status, data, msg);
  }
  return data as T;
}

// ─── Auth ───────────────────────────────────────────────
export const auth = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>("/api/auth/login", { method: "POST", json: { email, password } }),
  register: (email: string, password: string, name?: string) =>
    request<{ token: string; user: any }>("/api/auth/register", { method: "POST", json: { email, password, name } }),
  me: () => request<any>("/api/auth/me"),
};

// ─── Generate ──────────────────────────────────────────
export interface GenerateRequest {
  pillar: string;
  platform: string;
  duration?: string;
  topic?: string;
  goal?: string;
  source_strategy?: string;
  dm_keyword?: string;
  source_books?: string[];
  use_perplexity?: boolean;
  variations?: number;
}

export const generate = {
  one: (req: GenerateRequest) => request<{ results: any[] }>("/api/generate", { method: "POST", json: req }),
  batch: (days: number, videos_per_day = 12, duration = "45 seconds") =>
    request<any>("/api/batch", { method: "POST", json: { days, videos_per_day, duration } }),
  batchStatus: (jobId: string) => request<any>(`/api/batch/${jobId}`),
};

// ─── Knowledge ─────────────────────────────────────────
export const knowledge = {
  list: () => request<{ items: any[] }>("/api/knowledge"),
  get: (id: string) => request<any>(`/api/knowledge/${id}`),
  log: (limit = 100) => request<{ items: any[] }>(`/api/knowledge/log?limit=${limit}`),
  unexplored: (limit = 10) => request<{ items: UnexploredPair[] }>(`/api/knowledge/unexplored?limit=${limit}`),
  upload: async (file: File, category: string, pillars: string[]) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", category);
    fd.append("pillars", pillars.join(","));
    return request<any>("/api/knowledge/upload", { method: "POST", body: fd });
  },
  remove: (id: string) => request<any>(`/api/knowledge/${id}`, { method: "DELETE" }),
};

export interface UnexploredPair {
  a: { id: string; name: string; pillars: string[] };
  b: { id: string; name: string; pillars: string[] };
  shared_pillars: string[];
}

// ─── Content ───────────────────────────────────────────
export const content = {
  list: (params: { status?: string; pillar?: string; platform?: string; limit?: number } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && q.append(k, String(v)));
    return request<{ items: any[] }>(`/api/content?${q.toString()}`);
  },
  get: (id: string) => request<any>(`/api/content/${id}`),
  patch: (id: string, body: Record<string, any>) =>
    request<any>(`/api/content/${id}`, { method: "PATCH", json: body }),
  remove: (id: string) => request<any>(`/api/content/${id}`, { method: "DELETE" }),
};

// ─── Keywords ──────────────────────────────────────────
export const keywords = {
  list: () => request<{ items: any[] }>("/api/keywords"),
  create: (body: any) => request<any>("/api/keywords", { method: "POST", json: body }),
  patch: (kw: string, body: any) => request<any>(`/api/keywords/${kw}`, { method: "PATCH", json: body }),
  remove: (kw: string) => request<any>(`/api/keywords/${kw}`, { method: "DELETE" }),
};

// ─── Brand ─────────────────────────────────────────────
export const brand = {
  get: () => request<any>("/api/brand"),
  patch: (body: any) => request<any>("/api/brand", { method: "PATCH", json: body }),
};

// ─── Dashboard ─────────────────────────────────────────
export const dashboard = {
  get: () => request<any>("/api/dashboard"),
};

// ─── Calendar ─────────────────────────────────────────
export const calendar = {
  list: (start?: string, end?: string) => {
    const q = new URLSearchParams();
    if (start) q.set("start", start);
    if (end) q.set("end", end);
    return request<{ items: any[] }>(`/api/calendar?${q.toString()}`);
  },
  schedule: (content_id: string, scheduled_for: string, scheduled_time: string, platforms: string[]) =>
    request<any>("/api/calendar/schedule", {
      method: "POST",
      json: { content_id, scheduled_for, scheduled_time, platforms },
    }),
  queue: () => request<{ items: any[] }>("/api/calendar/queue"),
};

// ─── Export ────────────────────────────────────────────
export const exportApi = {
  list: () => request<{ items: any[] }>("/api/export"),
  create: (body: any) => request<any>("/api/export", { method: "POST", json: body }),
};

// ─── Integrations ──────────────────────────────────────
export interface ProbeResult {
  provider: "openai" | "anthropic";
  ok: boolean;
  configured: boolean;
  model?: string;
  status_code?: number;
  dimensions?: number;
  reply?: string;
  elapsed_ms?: number;
  exception_type?: string;
  error_type?: string;
  error_code?: string;
  error_message?: string;
  message?: string;
}

export interface ProbeResponse {
  openai: ProbeResult;
  anthropic: ProbeResult;
}

export const integrations = {
  list: () => request<{ items: any[] }>("/api/integrations"),
  probe: () => request<ProbeResponse>("/api/integrations/probe", { method: "POST" }),
};

// ─── Health ────────────────────────────────────────────
export const health = () => request<{ ok: boolean }>("/api/health", { auth: false });

export const api = {
  auth,
  generate,
  knowledge,
  content,
  keywords,
  brand,
  dashboard,
  calendar,
  export: exportApi,
  integrations,
  health,
};

export default api;
