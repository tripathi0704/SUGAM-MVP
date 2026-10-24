// API client + formatting helpers (S.U.G.A.M. 2.0)
// api() unwraps the server envelope: {success, data:{...}, error} -> {...dataFields, success, error}

// A 401 from ANY endpoint means the session cookie is dead (expired, server
// restart, or DB reset). We broadcast it once so the app can return to the
// sign-in screen with a clear message instead of showing a broken workspace.
// The auth login/logout endpoints are exempt — login 401s are handled inline.
function notifyUnauthorized(path: string) {
  if (typeof window === "undefined") return;
  if (path.includes("/auth/login") || path.includes("/auth/logout")) return;
  window.dispatchEvent(new CustomEvent("sugam:unauthorized"));
}

export async function api<T = unknown>(path: string, opts?: RequestInit & { json?: unknown }): Promise<T & { success: boolean; error?: { message: string; fieldErrors?: Record<string, string> } }> {
  const res = await fetch(path, {
    method: opts?.json ? (opts.method ?? "POST") : opts?.method ?? "GET",
    headers: opts?.json ? { "Content-Type": "application/json" } : undefined,
    body: opts?.json ? JSON.stringify(opts.json) : undefined,
    credentials: "same-origin",
    cache: "no-store",
  });
  if (res.status === 401) notifyUnauthorized(path);
  const envelope = await res.json().catch(() => ({ success: false, error: { message: "Network error — is the server running?" } }));
  const e = envelope as { success?: boolean; data?: Record<string, unknown>; error?: { message: string; fieldErrors?: Record<string, string> } };
  return {
    ...(e?.data && typeof e.data === "object" ? e.data : {}),
    success: !!e?.success,
    error: e?.error,
  } as T & { success: boolean; error?: { message: string; fieldErrors?: Record<string, string> } };
}

// multipart upload helper (evidence)
export async function apiUpload<T = unknown>(path: string, form: FormData): Promise<T & { success: boolean; error?: { message: string } }> {
  const res = await fetch(path, { method: "POST", body: form, credentials: "same-origin", cache: "no-store" });
  if (res.status === 401) notifyUnauthorized(path);
  const envelope = await res.json().catch(() => ({ success: false, error: { message: "Upload failed." } }));
  const e = envelope as { success?: boolean; data?: Record<string, unknown>; error?: { message: string } };
  return { ...(e?.data ?? {}), success: !!e?.success, error: e?.error } as T & { success: boolean; error?: { message: string } };
}

import { STATUS_LABELS, CATEGORY_LABELS, BUREAU_LABELS, SOURCE_LABELS, ROLE_LABELS, AICTE_REGIONS, REGION_LABELS } from "@/lib/constants";
export { STATUS_LABELS, CATEGORY_LABELS, BUREAU_LABELS, SOURCE_LABELS, ROLE_LABELS, AICTE_REGIONS, REGION_LABELS };

export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

// SLA countdown / overdue label (demo policy windows)
export function slaLeft(dueAt: string | null | undefined): { label: string; state: "ok" | "soon" | "overdue" | "none" } {
  if (!dueAt) return { label: "No deadline", state: "none" };
  const ms = new Date(dueAt).getTime() - Date.now();
  if (ms <= 0) return { label: "Overdue", state: "overdue" };
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days <= 3) return { label: days > 0 ? `Due in ${days}d ${hours}h` : `Due in ${hours}h`, state: "soon" };
  return { label: `Due in ${days}d`, state: "ok" };
}

export function ageBucket(createdAt: string | Date): string {
  const d = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  if (d <= 3) return "0-3 days";
  if (d <= 7) return "4-7 days";
  if (d <= 15) return "8-15 days";
  if (d <= 30) return "16-30 days";
  return "30+ days";
}
