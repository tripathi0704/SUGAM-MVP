"use client";
import React, { Component, useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { api } from "@/lib/client";
import type { User } from "@/lib/types";
import { AuthScreen } from "@/components/sugam/auth-screen";
import { PublicCitizenPortal } from "@/components/sugam/public-portal";
import { AicteCommandCenter } from "@/components/sugam/aicte-command-center";
import { ComplaintDetail } from "@/components/sugam/complaint-detail";
import { Institution360 } from "@/components/sugam/institutions";
import { Card, EmptyState } from "@/components/sugam/ui-bits";
import { IndianFlagBadge } from "@/components/sugam/uidai-header";

// ─────────────── Error boundary ───────────────
class ViewErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <Card className="m-6 p-8">
          <EmptyState
            icon={<AlertTriangle className="h-10 w-10 text-red-500" />}
            title="An error occurred"
            hint={this.state.error.message}
          />
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => this.setState({ error: null })}
              className="rounded-lg bg-su-blue px-4 py-2 text-xs font-bold text-white"
            >
              Try Again
            </button>
          </div>
        </Card>
      );
    }
    return this.props.children;
  }
}

import type { SupportedLang } from "@/lib/i18n";

export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);
  const [portalMode, setPortalMode] = useState<"PUBLIC" | "AICTE_HQ">("PUBLIC");
  const [lang, setLang] = useState<SupportedLang>("EN");
  const [refreshKey, setRefreshKey] = useState(0);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [inst360Id, setInst360Id] = useState<string | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sugam_lang") as SupportedLang | null;
      if (saved === "EN" || saved === "HI") setLang(saved);
    } catch {}
  }, []);

  const handleToggleLang = (newLang: SupportedLang) => {
    setLang(newLang);
    try {
      localStorage.setItem("sugam_lang", newLang);
    } catch {}
  };

  useEffect(() => {
    // When localhost is opened in any fresh browser window or tab,
    // ensure the login page is always shown first!
    const isSessionActive = typeof window !== "undefined" && sessionStorage.getItem("sugam_session_active") === "true";
    
    if (!isSessionActive) {
      setUser(null);
      setBooting(false);
      return;
    }

    // If within an active browser session, restore session from cookie
    api<{ user: User }>("/api/v1/auth/me")
      .then((r) => {
        if (r.success && r.user) {
          setUser(r.user);
          setPortalMode(r.user.primaryRole === "COMPLAINANT" ? "PUBLIC" : "AICTE_HQ");
        } else {
          setUser(null);
          try { sessionStorage.removeItem("sugam_session_active"); } catch {}
        }
        setBooting(false);
      })
      .catch(() => {
        setUser(null);
        setBooting(false);
      });
  }, []);

  // Session guard
  useEffect(() => {
    const onUnauthorized = () => {
      try { sessionStorage.removeItem("sugam_session_active"); } catch {}
      setUser((u) => {
        if (u) setSessionNotice("Your session ended. Please sign in again.");
        return null;
      });
      setDetailId(null);
      setInst360Id(null);
    };
    window.addEventListener("sugam:unauthorized", onUnauthorized);
    return () => window.removeEventListener("sugam:unauthorized", onUnauthorized);
  }, []);

  const logout = async () => {
    try { sessionStorage.removeItem("sugam_session_active"); } catch {}
    await api("/api/v1/auth/logout", { json: {} });
    setUser(null);
    setDetailId(null);
    setInst360Id(null);
    setSessionNotice(null);
    refresh();
  };

  const openCase = (id: string) => setDetailId(id);
  const open360 = (id: string) => setInst360Id(id);

  // Instant seamless switch between the 2 dedicated portals
  const switchToPublic = async () => {
    if (user?.primaryRole !== "COMPLAINANT") {
      const res = await api<{ user: User }>("/api/v1/auth/login", {
        json: { email: "student@sugam.demo", password: "demo123" },
      });
      if (res.success && res.user) {
        setUser(res.user);
      }
    }
    setPortalMode("PUBLIC");
    setInst360Id(null);
    setDetailId(null);
    refresh();
  };

  const switchToAicte = async () => {
    if (user?.primaryRole === "COMPLAINANT") {
      const res = await api<{ user: User }>("/api/v1/auth/login", {
        json: { email: "rb@sugam.demo", password: "demo123" },
      });
      if (res.success && res.user) {
        setUser(res.user);
      }
    }
    setPortalMode("AICTE_HQ");
    setInst360Id(null);
    setDetailId(null);
    refresh();
  };

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-su-blue" />
          <div className="text-sm font-semibold text-su-navy">Loading AICTE Grievance Portal…</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        {sessionNotice && (
          <div className="fixed inset-x-0 top-0 z-50 bg-amber-100 px-4 py-2 text-center text-xs font-bold text-amber-800">
            {sessionNotice}
          </div>
        )}
        <AuthScreen
          notice={sessionNotice}
          lang={lang}
          onToggleLang={handleToggleLang}
          onAuth={(u) => {
            try { sessionStorage.setItem("sugam_session_active", "true"); } catch {}
            setUser(u);
            setSessionNotice(null);
            setPortalMode(u.primaryRole === "COMPLAINANT" ? "PUBLIC" : "AICTE_HQ");
            refresh();
          }}
        />
      </>
    );
  }

  return (
    <ViewErrorBoundary>
      <div className="min-h-screen bg-[#F4F6F9]">
        {/* ── Render Completely Separate Dashboards ── */}
        {portalMode === "PUBLIC" ? (
          <PublicCitizenPortal
            user={user}
            onOpenCase={openCase}
            onSwitchToAicte={switchToAicte}
            lang={lang}
            onToggleLang={handleToggleLang}
            onLogout={logout}
          />
        ) : (
          <AicteCommandCenter
            user={user}
            onOpenCase={openCase}
            onOpen360={open360}
            onSwitchToPublic={switchToPublic}
            lang={lang}
            onToggleLang={handleToggleLang}
            onLogout={logout}
          />
        )}

        {/* ── Case Detail Modal (Unified across both portals) ── */}
        {detailId && (
          <ComplaintDetail
            id={detailId}
            user={user}
            onClose={() => setDetailId(null)}
            onChanged={refresh}
          />
        )}

        {/* ── Institution 360° Modal (Focused Institution Profile) ── */}
        {inst360Id && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setInst360Id(null)}
          >
            <div
              className="w-full max-w-5xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Institution360
                id={inst360Id}
                onBack={() => setInst360Id(null)}
                onOpenCase={(cid) => {
                  setInst360Id(null);
                  openCase(cid);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </ViewErrorBoundary>
  );
}
