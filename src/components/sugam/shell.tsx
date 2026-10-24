"use client";
import React, { useState } from "react";
import {
  LayoutDashboard, Inbox, FileText, Building2, ShieldCheck, ClipboardList,
  Users, Plug, ScrollText, Bell, UserCog, Send, Gavel, Database, Menu, X, LogOut,
  GitMerge,
} from "lucide-react";
import { api, ROLE_LABELS } from "@/lib/client";
import { BrandMark } from "@/components/sugam/ui-bits";
import type { User } from "@/lib/types";

export type ViewKey =
  | "home" | "submit" | "cases" | "mywork" | "intake" | "institutions" | "overlaps" | "audit"
  | "users" | "integrations" | "policy" | "ranking" | "reports" | "demo" | "notifications" | "profile";

const NAV: { key: ViewKey; label: string; icon: React.ReactNode; roles: string[] }[] = [
  { key: "home", label: "My Complaints", icon: <LayoutDashboard className="h-4 w-4" />, roles: ["COMPLAINANT"] },
  { key: "submit", label: "Submit Complaint", icon: <Send className="h-4 w-4" />, roles: ["COMPLAINANT"] },
  { key: "home", label: "Institution Workspace", icon: <LayoutDashboard className="h-4 w-4" />, roles: ["INSTITUTION_OFFICER"] },
  { key: "home", label: "Overview Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, roles: ["INTAKE_OFFICER", "BUREAU_OFFICER", "REVIEWING_OFFICER", "PLATFORM_ADMIN"] },
  { key: "overlaps", label: "Cross-Bureau Overlaps", icon: <GitMerge className="h-4 w-4 text-su-saffron" />, roles: ["INTAKE_OFFICER", "BUREAU_OFFICER", "REVIEWING_OFFICER", "PLATFORM_ADMIN", "AUDITOR"] },
  { key: "intake", label: "Intake Queue", icon: <Inbox className="h-4 w-4" />, roles: ["INTAKE_OFFICER"] },
  { key: "mywork", label: "My Work", icon: <ClipboardList className="h-4 w-4" />, roles: ["BUREAU_OFFICER", "REVIEWING_OFFICER"] },
  { key: "cases", label: "Complaint Register", icon: <FileText className="h-4 w-4" />, roles: ["INTAKE_OFFICER", "BUREAU_OFFICER", "REVIEWING_OFFICER", "AUDITOR", "PLATFORM_ADMIN"] },
  { key: "institutions", label: "Institution Directory", icon: <Building2 className="h-4 w-4" />, roles: ["INTAKE_OFFICER", "BUREAU_OFFICER", "REVIEWING_OFFICER", "AUDITOR", "PLATFORM_ADMIN", "INSTITUTION_OFFICER"] },
  { key: "audit", label: "Audit & Integrity", icon: <ShieldCheck className="h-4 w-4" />, roles: ["AUDITOR", "REVIEWING_OFFICER", "PLATFORM_ADMIN"] },
  { key: "users", label: "Officer Directory & Roles", icon: <Users className="h-4 w-4" />, roles: ["PLATFORM_ADMIN"] },
  { key: "integrations", label: "Integrations & Imports", icon: <Plug className="h-4 w-4" />, roles: ["PLATFORM_ADMIN", "INTAKE_OFFICER"] },
  { key: "policy", label: "Policy Configuration", icon: <ScrollText className="h-4 w-4" />, roles: ["PLATFORM_ADMIN"] },
  { key: "ranking", label: "Institution Ranking", icon: <Gavel className="h-4 w-4" />, roles: ["PLATFORM_ADMIN", "REVIEWING_OFFICER", "AUDITOR"] },
  { key: "reports", label: "Accountability Reports", icon: <Send className="h-4 w-4" />, roles: ["PLATFORM_ADMIN", "REVIEWING_OFFICER", "INSTITUTION_OFFICER"] },
  { key: "demo", label: "System Data Controls", icon: <Database className="h-4 w-4" />, roles: ["PLATFORM_ADMIN"] },
  { key: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" />, roles: ["*"] },
  { key: "profile", label: "My Profile", icon: <UserCog className="h-4 w-4" />, roles: ["*"] },
];

export function Shell({ user, view, setView, unread, onLogout, children }: {
  user: User; view: ViewKey; setView: (v: ViewKey) => void; unread: number;
  onLogout: () => void; children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = NAV.filter((n) => n.roles.includes("*") || n.roles.includes(user.primaryRole));
  const roleLabel = ROLE_LABELS[user.primaryRole] ?? user.primaryRole;

  const sidebar = (
    <div className="flex h-full flex-col bg-su-navy text-white/85">
      <div className="border-b border-white/10 px-5 py-4">
        <BrandMark light small />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {items.map((n, i) => (
          <button
            key={`${n.key}-${i}`}
            onClick={() => { setView(n.key); setMobileOpen(false); }}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              view === n.key ? "bg-su-blue text-white shadow-inner" : "text-white/75 hover:bg-white/10 hover:text-white"
            }`}
          >
            {n.icon}
            {n.label}
            {n.key === "notifications" && unread > 0 && (
              <span className="ml-auto rounded-full bg-su-saffron px-1.5 py-px text-[10px] font-bold text-white">{unread}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-su-blue text-sm font-bold">{user.name.slice(0, 1)}</div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">{user.name}</div>
            <div className="truncate text-[11px] text-white/55">{roleLabel}</div>
          </div>
          <button onClick={onLogout} title="Sign out" className="ml-auto rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-su-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>
      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 shadow-2xl">
            <button onClick={() => setMobileOpen(false)} className="absolute -right-11 top-3 rounded-lg bg-white/10 p-2 text-white" aria-label="Close menu"><X className="h-5 w-5" /></button>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-su-border bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg border border-su-border p-2 text-su-navy lg:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <div className="flex items-center gap-2 lg:hidden"><BrandMark small /></div>
          <div className="ml-auto flex items-center gap-2">
            <span data-testid="demo-badge" className="hidden rounded-full border border-[#BFE0D2] bg-[#EDF7F2] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#316444] sm:inline-block">AICTE Central Registry</span>
            <span className="rounded-full bg-su-blue-soft px-2.5 py-1 text-xs font-semibold text-su-blue">{roleLabel}</span>
            <button onClick={() => setView("notifications")} className="relative rounded-lg border border-su-border p-2 text-su-navy hover:bg-su-canvas" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-su-red px-1 text-[10px] font-bold text-white">{unread}</span>}
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
