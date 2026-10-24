"use client";
import React, { useEffect, useState, useMemo } from "react";
import {
  FileText, Send, CheckCircle2, Clock, Search, AlertCircle, Building2,
  ChevronRight, ArrowRight, ShieldCheck, Upload, Star, Eye, RefreshCw,
  HelpCircle, UserCheck, Check, MessageSquare
} from "lucide-react";
import { api, fmtDate, fmtDateTime, CATEGORY_LABELS, BUREAU_LABELS, STATUS_LABELS } from "@/lib/client";
import { PriorityBadge, StatusBadge, Spinner } from "@/components/sugam/ui-bits";
import { OfficialDirectiveModal } from "@/components/sugam/official-directive-modal";
import { UidaiHeader } from "@/components/sugam/uidai-header";
import { UidaiFooter } from "@/components/sugam/uidai-footer";
import { UidaiServiceGrid } from "@/components/sugam/uidai-service-grid";
import { InstitutionDirectory } from "@/components/sugam/institutions";
import type { CaseRow, InstitutionRow, User } from "@/lib/types";
import { translations, SupportedLang } from "@/lib/i18n";

export function PublicCitizenPortal({
  user,
  onOpenCase,
  onSwitchToAicte,
  lang = "EN",
  onToggleLang,
  onLogout,
}: {
  user: User;
  onOpenCase: (id: string) => void;
  onSwitchToAicte: () => void;
  lang?: SupportedLang;
  onToggleLang?: (l: SupportedLang) => void;
  onLogout?: () => void;
}) {
  const currentLang = lang || "EN";
  const t = translations[currentLang];
  const [activeTab, setActiveTab] = useState<"services" | "my-cases" | "file-complaint" | "track-id" | "institutions">("services");
  const [cases, setCases] = useState<CaseRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackQuery, setTrackQuery] = useState("");
  const [trackedCase, setTrackedCase] = useState<CaseRow | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [searchingCase, setSearchingCase] = useState(false);
  const [heroSearch, setHeroSearch] = useState("");

  // Load user's complaints
  const loadMyCases = () => {
    setLoading(true);
    api<{ cases: CaseRow[] }>("/api/v1/cases?pageSize=50")
      .then((res) => {
        setCases(res.success ? res.cases : []);
        setLoading(false);
      })
      .catch(() => {
        setCases([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadMyCases();
  }, []);

  const openCases = (cases ?? []).filter((c) => !["RESOLVED", "CLOSED"].includes(c.status));
  const resolvedCases = (cases ?? []).filter((c) => ["RESOLVED", "CLOSED"].includes(c.status));
  const actionInitiated = (cases ?? []).filter((c) => ["ACTION_INITIATED", "COORDINATION_REQUIRED", "IN_REVIEW"].includes(c.status));

  // Quick track handler
  const handleTrackCase = async (e?: React.FormEvent, customId?: string) => {
    e?.preventDefault();
    const query = customId || trackQuery;
    if (!query.trim()) return;
    setSearchingCase(true);
    setTrackError(null);
    setTrackedCase(null);

    const res = await api<{ cases: CaseRow[] }>(`/api/v1/cases?q=${encodeURIComponent(query.trim())}`);
    setSearchingCase(false);
    if (res.success && res.cases && res.cases.length > 0) {
      setTrackedCase(res.cases[0]);
    } else {
      setTrackError(`No complaint found with Case ID "${query}". Please verify the number (e.g. SUGAM-2026-0002).`);
    }
  };

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroSearch.trim()) return;
    setTrackQuery(heroSearch);
    setActiveTab("track-id");
    handleTrackCase(undefined, heroSearch);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#191636] flex flex-col font-sans">
      {/* ── Official UIDAI Indian Government Header ── */}
      <UidaiHeader
        user={user}
        portalMode="PUBLIC"
        onSwitchPortal={(mode) => {
          if (mode === "AICTE_HQ") onSwitchToAicte();
        }}
        lang={currentLang}
        onToggleLang={onToggleLang}
        onLogout={onLogout}
        activeNav={
          activeTab === "services"
            ? "home"
            : activeTab === "file-complaint"
            ? "file"
            : activeTab === "my-cases"
            ? "cases"
            : activeTab === "institutions"
            ? "institutions"
            : "track"
        }
        onNavClick={(navKey) => {
          if (navKey === "home") setActiveTab("services");
          else if (navKey === "file") setActiveTab("file-complaint");
          else if (navKey === "track") setActiveTab("track-id");
          else if (navKey === "cases") setActiveTab("my-cases");
          else if (navKey === "institutions") setActiveTab("institutions");
        }}
      />

      {/* ── UIDAI "My Aadhaar" Hero Banner & Universal Search Strip ── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#EFEEF8] via-[#F8FAFD] to-[#F4F6F9] border-b border-[#DFDFE4] py-8 px-4 sm:px-6">
        {/* Subtle geometric national motif */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#E2E1F3]/50 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[#FCEBE3]/60 blur-3xl" />

        <div className="mx-auto max-w-7xl relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#EDF7F2] border border-[#316444]/25 px-3 py-1 text-xs font-bold text-[#316444] mb-3">
                <span className="h-2 w-2 rounded-full bg-[#316444] animate-pulse" />
                <span>{t.citizenWelcomeBadge}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#191636] leading-tight">
                {t.citizenWelcomeTitle}
              </h2>
              <div className="text-sm font-semibold text-[#2F2B69] mt-0.5">
                {currentLang === "HI"
                  ? "अखिल भारतीय तकनीकी शिक्षा परिषद — शिकायत निवारण एवं निगरानी प्रणाली"
                  : "All India Council for Technical Education — Grievance Redressal & Redressal System"}
              </div>
              <p className="mt-2 text-xs sm:text-sm text-[#5A5971] leading-relaxed">
                {t.citizenWelcomeDesc}
              </p>
            </div>

            {/* Quick Stats Pill Strip (UIDAI Aadhaar Saturation Style) */}
            <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-2xl border border-[#DFDFE4] shadow-sm shrink-0">
              <div className="px-3 py-1.5 text-center border-r border-[#EFEEF8]">
                <div className="text-xl font-black text-[#191636] font-mono">{cases?.length ?? 0}</div>
                <div className="text-[10px] font-bold text-[#5A5971] uppercase">{t.myLodgedPill}</div>
              </div>
              <div className="px-3 py-1.5 text-center border-r border-[#EFEEF8]">
                <div className="text-xl font-black text-[#ED6C02] font-mono">{openCases.length}</div>
                <div className="text-[10px] font-bold text-[#5A5971] uppercase">{t.inProcessPill}</div>
              </div>
              <div className="px-3 py-1.5 text-center">
                <div className="text-xl font-black text-[#316444] font-mono">{resolvedCases.length}</div>
                <div className="text-[10px] font-bold text-[#5A5971] uppercase">{t.resolvedPill}</div>
              </div>
            </div>
          </div>

          {/* UIDAI High-Contrast Search Box */}
          <form onSubmit={handleHeroSearchSubmit} className="mt-6">
            <div className="relative flex flex-col sm:flex-row items-center gap-2 rounded-2xl bg-white p-2 border-2 border-[#C5C3D8] shadow-md focus-within:border-[#0565D2] transition">
              <div className="relative flex-1 w-full flex items-center">
                <Search className="absolute left-4 h-5 w-5 text-[#5A5971]" />
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder={t.searchBoxPlaceholder}
                  className="w-full rounded-xl bg-transparent py-2.5 pl-12 pr-4 text-sm font-medium text-[#191636] placeholder-[#5A5971]/70 outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto rounded-xl bg-[#0565D2] px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-[#191636] transition flex items-center justify-center gap-2 shrink-0"
              >
                <span>{t.searchButton}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Quick Search Chips */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-bold text-[#5A5971]">{t.popularLabel}</span>
            {[
              { label: currentLang === "HI" ? "शुल्क वापसी नियम" : "Fee Refund Rules", q: "Fee Refund" },
              { label: "SUGAM-2026-0002", q: "SUGAM-2026-0002" },
              { label: "Sunrise Institute", q: "Sunrise Institute" },
              { label: currentLang === "HI" ? "काशन मनी वापसी" : "Caution Money Delayed", q: "Caution Money" },
              { label: currentLang === "HI" ? "टकराव रडार" : "Multi-Bureau Radar", q: "Collision Radar" },
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={() => {
                  setHeroSearch(chip.q);
                  setTrackQuery(chip.q);
                  setActiveTab("track-id");
                  handleTrackCase(undefined, chip.q);
                }}
                className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#191636] border border-[#DFDFE4] hover:border-[#0565D2] hover:bg-[#EFEEF8] transition shadow-2xs"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Secondary Navigation Tabs Strip (UIDAI Standard) ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-[#DFDFE4] shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto py-1 scrollbar-none">
            <button
              onClick={() => setActiveTab("services")}
              className={`flex items-center gap-2 border-b-2 py-3 px-3.5 text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === "services"
                  ? "border-[#0565D2] text-[#0565D2]"
                  : "border-transparent text-[#5A5971] hover:text-[#191636]"
              }`}
            >
              <span>🏛️ {t.tabServicesHub}</span>
            </button>

            <button
              onClick={() => setActiveTab("my-cases")}
              className={`flex items-center gap-2 border-b-2 py-3 px-3.5 text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === "my-cases"
                  ? "border-[#0565D2] text-[#0565D2]"
                  : "border-transparent text-[#5A5971] hover:text-[#191636]"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>{t.tabMyComplaints} ({cases?.length ?? 0})</span>
            </button>

            <button
              onClick={() => setActiveTab("file-complaint")}
              className={`flex items-center gap-2 border-b-2 py-3 px-3.5 text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === "file-complaint"
                  ? "border-[#0565D2] text-[#0565D2]"
                  : "border-transparent text-[#5A5971] hover:text-[#191636]"
              }`}
            >
              <Send className="h-4 w-4 text-[#ED6C02]" />
              <span>{t.tabLodgeGrievance}</span>
            </button>

            <button
              onClick={() => setActiveTab("track-id")}
              className={`flex items-center gap-2 border-b-2 py-3 px-3.5 text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === "track-id"
                  ? "border-[#0565D2] text-[#0565D2]"
                  : "border-transparent text-[#5A5971] hover:text-[#191636]"
              }`}
            >
              <Search className="h-4 w-4" />
              <span>{t.tabTrackCase}</span>
            </button>

            <button
              onClick={() => setActiveTab("institutions")}
              className={`flex items-center gap-2 border-b-2 py-3 px-3.5 text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === "institutions"
                  ? "border-[#0565D2] text-[#0565D2]"
                  : "border-transparent text-[#5A5971] hover:text-[#191636]"
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>{t.tabInstitutionsDirectory}</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-[#5A5971]">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-[#191636]">Citizen Redressal Grid</span>
          </div>
        </div>
      </div>

      {/* ── Main Workspace Body ── */}
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 flex-1 w-full">
        {/* TAB 0: UIDAI MY AADHAAR STYLE SERVICES GRID (DEFAULT) */}
        {activeTab === "services" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <UidaiServiceGrid
              onLodgeGrievance={() => setActiveTab("file-complaint")}
              onTrackCase={() => setActiveTab("track-id")}
              onOpenInstitutions={() => setActiveTab("institutions")}
              onOpenRadar={onSwitchToAicte}
              onOpenAnalytics={onSwitchToAicte}
              onOpenDirectives={() => {
                if (cases && cases.length > 0) onOpenCase(cases[0].id);
                else setActiveTab("my-cases");
              }}
              lang={currentLang}
            />
          </div>
        )}

        {/* TAB 1: MY COMPLAINTS WITH ACTION PROGRESS STEPPER */}
        {activeTab === "my-cases" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DFDFE4] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-5 w-1.5 rounded-full bg-[#0565D2]" />
                  <h3 className="text-xl font-bold text-[#191636]">Your Registered Complaints</h3>
                </div>
                <p className="mt-1 text-xs text-[#5A5971]">
                  Every complaint is assigned directly to an AICTE Bureau with transparent milestone tracking and statutory SLA monitor.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("file-complaint")}
                  className="flex items-center gap-1.5 rounded-xl bg-[#0565D2] px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-[#191636] transition"
                >
                  <Send className="h-3.5 w-3.5" /> Lodge New
                </button>
                <button
                  onClick={loadMyCases}
                  className="flex items-center gap-1.5 rounded-xl border border-[#DFDFE4] bg-white px-3 py-1.5 text-xs font-semibold text-[#191636] shadow-sm hover:bg-[#EFEEF8] transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center">
                <Spinner label="Loading your complaints..." />
              </div>
            ) : (cases ?? []).length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#DFDFE4] bg-white p-12 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EFEEF8] text-[#0565D2]">
                  <FileText className="h-8 w-8" />
                </div>
                <h4 className="mt-4 text-lg font-bold text-[#191636]">No complaints registered yet</h4>
                <p className="mt-1 text-xs text-[#5A5971] max-w-md mx-auto">
                  You have not submitted any grievance yet. Click below to file a formal complaint with AICTE regarding any technical institution.
                </p>
                <button
                  onClick={() => setActiveTab("file-complaint")}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0565D2] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#191636] transition"
                >
                  <Send className="h-4 w-4" /> File Your First Complaint
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {(cases ?? []).map((c) => (
                  <ComplaintCard key={c.id} c={c} onOpenCase={onOpenCase} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LODGE NEW COMPLAINT FORM */}
        {activeTab === "file-complaint" && (
          <div className="animate-in fade-in duration-200">
            <LodgeGrievanceForm
              user={user}
              onSuccess={(newId) => {
                loadMyCases();
                setActiveTab("my-cases");
                onOpenCase(newId);
              }}
            />
          </div>
        )}

        {/* TAB 3: QUICK TRACK COMPLAINT BY ID */}
        {activeTab === "track-id" && (
          <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in duration-200">
            <div className="rounded-3xl border border-[#DFDFE4] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-5 w-1.5 rounded-full bg-[#ED6C02]" />
                <h3 className="text-lg font-bold text-[#191636]">Track Complaint Status Online (URN)</h3>
              </div>
              <p className="text-xs text-[#5A5971]">
                Enter your Unique Case ID (e.g. <b>SUGAM-2026-0002</b> or <b>SUGAM-2026-0001</b>) to check live actions taken.
              </p>

              <form onSubmit={handleTrackCase} className="mt-5 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A5971]" />
                  <input
                    type="text"
                    value={trackQuery}
                    onChange={(e) => setTrackQuery(e.target.value)}
                    placeholder="e.g. SUGAM-2026-0002"
                    className="w-full rounded-xl border border-[#DFDFE4] bg-[#F8FAFD] py-2.5 pl-10 pr-4 text-sm font-semibold text-[#191636] outline-none focus:border-[#0565D2] focus:bg-white focus:ring-2 focus:ring-[#0565D2]/10 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searchingCase}
                  className="rounded-xl bg-[#0565D2] px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-[#191636] disabled:opacity-50 transition shrink-0"
                >
                  {searchingCase ? "Checking..." : "Verify & Track Status"}
                </button>
              </form>

              {trackError && (
                <div className="mt-4 rounded-xl border border-[#F0C5C0] bg-[#FDECEC] p-3 text-xs font-semibold text-[#C72E07] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{trackError}</span>
                </div>
              )}
            </div>

            {trackedCase && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-[#5A5971] px-1">
                  <span>Match Result for Case #{trackedCase.caseNumber}:</span>
                  <span className="text-[#316444] flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Case Record Verified
                  </span>
                </div>
                <ComplaintCard c={trackedCase} onOpenCase={onOpenCase} />
              </div>
            )}
          </div>
        )}

        {/* TAB 4: INSTITUTIONS 360° DIRECTORY */}
        {activeTab === "institutions" && (
          <div className="animate-in fade-in duration-200">
            <InstitutionDirectory
              user={user}
              onOpen360={(instId) => {
                // If callback is provided or handled via modal
                if (cases && cases.length > 0) onOpenCase(cases[0].id);
              }}
              refreshKey={0}
            />
          </div>
        )}
      </main>

      {/* ── Official UIDAI Indian Government Footer ── */}
      <UidaiFooter />
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// COMPLAINT CARD WITH VISUAL STATUS STEPPER & ACTIONS TAKEN LOG
// ─────────────────────────────────────────────────────────────────────────────
function ComplaintCard({
  c,
  onOpenCase,
}: {
  c: CaseRow;
  onOpenCase: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showDirective, setShowDirective] = useState(false);

  // Stepper milestones
  // 1: Submitted -> 2: Bureau Assigned -> 3: Notice Sent -> 4: Action/Coordination -> 5: Resolved
  const status = c.status;
  const isResolved = ["RESOLVED", "CLOSED"].includes(status);
  const isActionInitiated = ["ACTION_INITIATED", "COORDINATION_REQUIRED", "IN_REVIEW"].includes(status);
  const isAssigned = isActionInitiated || isResolved || ["ASSIGNED", "UNDER_PROCESS", "WAITING_FOR_INFORMATION"].includes(status);

  // Simulated live action history based on case milestones
  const actionsTaken = useMemo(() => {
    const list: { date: string; title: string; desc: string; tone: "blue" | "amber" | "green" }[] = [
      {
        date: fmtDate(c.createdAt),
        title: "Complaint Received & Registered",
        desc: `Grievance officially lodged under Case ID ${c.caseNumber}. Automated system triage completed.`,
        tone: "blue",
      },
    ];

    if (c.bureau) {
      list.push({
        date: fmtDate(c.createdAt),
        title: `Routed to ${BUREAU_LABELS[c.bureau] ?? c.bureau}`,
        desc: "Allocated to specialized AICTE cell for regulatory investigation and college compliance.",
        tone: "blue",
      });
    }

    if (c.status === "UNDER_PROCESS" || c.status === "WAITING_FOR_INFORMATION") {
      list.push({
        date: "Recent",
        title: "Show-Cause Notice Issued to College",
        desc: `AICTE dispatched a formal explanation request to ${c.institution?.name}. Response awaited.`,
        tone: "amber",
      });
    }

    if (c.status === "COORDINATION_REQUIRED" || c.overlapFlag) {
      list.push({
        date: "Active Coordination",
        title: "Inter-Bureau Coordination Triggered (PS 26264)",
        desc: "AICTE identified concurrent proceedings from Regulation Bureau & PGRC. Joint synchronized inspection initiated.",
        tone: "amber",
      });
    }

    if (c.status === "ACTION_INITIATED") {
      list.push({
        date: "Active Action",
        title: "Formal Action Initiated",
        desc: "College management summoned for hearing / regulatory penalty proceeding under process.",
        tone: "amber",
      });
    }

    if (isResolved) {
      list.push({
        date: fmtDate(c.updatedAt),
        title: "Grievance Disposed & Resolution Order Dispatched",
        desc: "College has complied with AICTE directives. Resolution documentation recorded on the permanent register.",
        tone: "green",
      });
    }

    return list;
  }, [c, isResolved]);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#DFDFE4] bg-white shadow-xs transition hover:shadow-md hover:border-[#0565D2]">
      {/* Top Card Info Bar */}
      <div className="border-b border-[#EFEEF8] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-black text-[#0565D2] bg-[#E2E1F3] px-2.5 py-0.5 rounded-md border border-[#C5C3D8]">
                {c.caseNumber}
              </span>
              <StatusBadge status={c.status} />
              <PriorityBadge priority={c.priority} />
              {c.overlapFlag && (
                <span className="rounded-md border border-[#EAD3A2] bg-[#FCEBE3] px-2.5 py-0.5 text-[10px] font-black text-[#ED6C02]">
                  ⚠️ AICTE Inter-Bureau Coordination Active
                </span>
              )}
            </div>

            <h4 className="mt-2.5 text-base font-extrabold text-[#191636]">
              {c.subject}
            </h4>

            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#5A5971]">
              <span className="flex items-center gap-1 font-bold text-[#191636]">
                <Building2 className="h-3.5 w-3.5 text-[#0565D2]" />
                {c.institution?.name}
              </span>
              {c.institution?.permanentId && (
                <span className="rounded bg-[#EFEEF8] px-1.5 py-0.2 font-mono text-[11px] text-[#2F2B69] font-bold">
                  PID: {c.institution.permanentId}
                </span>
              )}
              <span>•</span>
              <span>Category: <strong className="text-[#191636]">{CATEGORY_LABELS[c.category] ?? c.category}</strong></span>
              <span>•</span>
              <span>Lodged on {fmtDate(c.createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDirective(true)}
              className="flex items-center gap-1 rounded-xl border border-[#EAD3A2] bg-[#FCEBE3] px-3 py-1.5 text-xs font-bold text-[#ED6C02] hover:bg-amber-100 transition shadow-xs"
              title="Preview official AICTE statutory show-cause notice"
            >
              <FileText className="h-3.5 w-3.5 text-[#ED6C02]" />
              <span>Notice Preview</span>
            </button>
            <button
              onClick={() => onOpenCase(c.id)}
              className="flex items-center gap-1 rounded-xl bg-[#0565D2] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#191636] transition"
            >
              <Eye className="h-3.5 w-3.5" /> View Official File
            </button>
          </div>
        </div>

        {/* ── Visual 4-Step Milestone Progress Bar ── */}
        <div className="mt-6 border-t border-[#EFEEF8] pt-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#5A5971] mb-3">
            Investigation &amp; Action Progress
          </div>

          <div className="grid grid-cols-4 gap-2">
            {/* Step 1 */}
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#316444] text-white text-xs font-bold shadow-sm">
                ✓
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#191636]">1. Received</div>
                <div className="text-[10px] text-[#5A5971]">Registered in system</div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm ${
                isAssigned ? "bg-[#316444] text-white" : "bg-[#DFDFE4] text-[#5A5971]"
              }`}>
                {isAssigned ? "✓" : "2"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#191636]">2. Bureau Assigned</div>
                <div className="text-[10px] text-[#5A5971]">{c.bureau ? BUREAU_LABELS[c.bureau]?.split(" ")[0] : "Triage"}</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm ${
                isActionInitiated || isResolved ? "bg-[#316444] text-white" : "bg-[#DFDFE4] text-[#5A5971]"
              }`}>
                {isActionInitiated || isResolved ? "✓" : "3"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#191636]">3. Action Underway</div>
                <div className="text-[10px] text-[#5A5971]">Notice &amp; Verification</div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm ${
                isResolved ? "bg-[#316444] text-white" : "bg-[#DFDFE4] text-[#5A5971]"
              }`}>
                {isResolved ? "✓" : "4"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#191636]">4. Disposed</div>
                <div className="text-[10px] text-[#5A5971]">{isResolved ? "Order Issued" : "Pending final order"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Taken Details Toggle */}
      <div className="bg-slate-50/70 px-5 py-3 flex items-center justify-between border-t border-slate-100">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs font-bold text-su-blue hover:underline"
        >
          <span>{expanded ? "Hide Action Taken History" : "View Live Actions Taken by AICTE"}</span>
          <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </button>

        <span className="text-[11px] text-slate-500 font-medium">
          Assigned Official: <b>{c.assignedOfficer?.name ?? "AICTE Central Registry"}</b>
        </span>
      </div>

      {/* Expanded Action Taken Timeline */}
      {expanded && (
        <div className="border-t border-slate-200 bg-white p-5">
          <h5 className="text-xs font-bold uppercase tracking-wider text-su-navy mb-3">
            Chronological Log of Actions Taken by AICTE Authorities:
          </h5>
          <div className="space-y-3 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {actionsTaken.map((act, i) => (
              <div key={i} className="relative">
                <div className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white ${
                  act.tone === "green" ? "bg-emerald-500" : act.tone === "amber" ? "bg-amber-500" : "bg-su-blue"
                }`} />
                <div className="text-xs font-bold text-su-navy flex items-center gap-2">
                  <span>{act.title}</span>
                  <span className="text-[10px] font-normal text-slate-400">({act.date})</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{act.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">
              Statutory Communication dispatched under AICTE Act &amp; Redressal Regulations
            </span>
            <button
              onClick={() => setShowDirective(true)}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Preview Dispatched Directive Notice →</span>
            </button>
          </div>
        </div>
      )}

      {/* Official AICTE Directive Preview Modal */}
      <OfficialDirectiveModal
        isOpen={showDirective}
        onClose={() => setShowDirective(false)}
        institutionName={c.institution?.name ?? "Sunrise Institute of Technology"}
        institutionPid={c.institution?.permanentId ?? "1-938210491"}
        caseNumber={c.caseNumber}
        jointWith={c.overlapFlag ? "PGRC Docket SUGAM-2026-0001" : "AICTE Central Registry"}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIMPLE 3-STEP LODGE GRIEVANCE FORM
// ─────────────────────────────────────────────────────────────────────────────
function LodgeGrievanceForm({
  user,
  onSuccess,
}: {
  user: User;
  onSuccess: (id: string) => void;
}) {
  const [institutions, setInstitutions] = useState<InstitutionRow[]>([]);
  const [institutionId, setInstitutionId] = useState("");
  const [category, setCategory] = useState("FEE_REFUND");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ institutions: InstitutionRow[] }>("/api/v1/institutions?pageSize=50").then((r) => {
      if (r.success && r.institutions && r.institutions.length > 0) {
        setInstitutions(r.institutions);
        setInstitutionId((prev) => prev || r.institutions[0].id);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveInstId = institutionId || (institutions.length > 0 ? institutions[0].id : "");
    if (!effectiveInstId) {
      setError("Please select the target institution.");
      return;
    }
    if (!subject.trim()) {
      setError("Please provide a concise subject for your complaint.");
      return;
    }
    if (!description.trim()) {
      setError("Please describe your grievance in detail.");
      return;
    }

    setBusy(true);
    setError(null);
    const res = await api<{ case: { id: string } }>("/api/v1/cases", {
      json: {
        institutionId: effectiveInstId,
        category,
        subject,
        description,
        sourceSystem: "PUBLIC_PORTAL",
        priority: category === "RAGGING" ? "CRITICAL" : "NORMAL",
      },
    });
    setBusy(false);

    if (res.success && res.case) {
      onSuccess(res.case.id);
    } else {
      const fieldMsg = res.error?.fieldErrors ? Object.values(res.error.fieldErrors).join(" ") : null;
      setError(fieldMsg || res.error?.message || "Failed to lodge grievance.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-3xl border border-[#DFDFE4] bg-white p-6 sm:p-8 shadow-sm">
        <div className="border-b border-[#EFEEF8] pb-4">
          <span className="rounded-full bg-[#E2E1F3] border border-[#C5C3D8] px-3 py-1 text-xs font-bold text-[#0565D2]">
            Citizen Grievance Submission · नागरिक शिकायत प्रपत्र
          </span>
          <h3 className="mt-2.5 text-xl font-extrabold text-[#191636]">
            Lodge a Formal Grievance with AICTE
          </h3>
          <p className="mt-1 text-xs text-[#5A5971]">
            Complaints are cryptographically sealed, assigned a permanent tracking Case ID, and routed to the designated AICTE Bureau.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-[#F0C5C0] bg-[#FDECEC] p-4 text-xs font-semibold text-[#C72E07] flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Institution Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#191636] mb-1.5">
              1. Select Institution (College / University) *
            </label>
            <select
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
              className="w-full rounded-xl border border-[#DFDFE4] bg-white px-3.5 py-2.5 text-sm font-medium text-[#191636] outline-none focus:border-[#0565D2] focus:ring-2 focus:ring-[#0565D2]/10"
              required
            >
              <option value="">-- Choose AICTE Institution --</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.code}) {i.permanentId ? `· PID: ${i.permanentId}` : ""} {i.state ? `[${i.state}]` : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-[#5A5971]">
              Only AICTE-approved institutions in the National Registry are listed.
            </p>
          </div>

          {/* Grievance Category */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#191636] mb-1.5">
                2. Grievance Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-[#DFDFE4] bg-white px-3.5 py-2.5 text-sm font-medium text-[#191636] outline-none focus:border-[#0565D2] focus:ring-2 focus:ring-[#0565D2]/10"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#191636] mb-1.5">
                Target AICTE Bureau
              </label>
              <div className="rounded-xl border border-[#DFDFE4] bg-[#F8FAFD] px-3.5 py-2.5 text-xs font-bold text-[#191636]">
                {category === "FEE_REFUND" && "Public Grievance Redressal Cell (PGRC) / Regulation Bureau"}
                {category === "RAGGING" && "Anti-Ragging Cell (Mandatory 24h SLA)"}
                {category === "SCHOLARSHIP" && "Scholarship & Fee Cell"}
                {category === "FACULTY_SALARY" && "Faculty & Staff Grievance Cell"}
                {category === "APPROVAL_DOC" && "Approval & Policy Bureau"}
                {category === "HOSTEL" && "Public Grievance Redressal Cell (PGRC)"}
                {category === "EXAM_CELL" && "Examination & Evaluation Cell"}
                {category === "INFRASTRUCTURE" && "Regulation Bureau (Infrastructure Norms)"}
              </div>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#191636] mb-1.5">
              3. Subject / Summary *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Withholding of original marksheet and caution deposit after course completion"
              className="w-full rounded-xl border border-[#DFDFE4] py-2.5 px-3.5 text-sm font-medium text-[#191636] outline-none focus:border-[#0565D2] focus:ring-2 focus:ring-[#0565D2]/10"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#191636] mb-1.5">
              4. Detailed Explanation of Grievance *
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State what happened, dates, fees involved, college department contacted, and what relief you are seeking from AICTE..."
              className="w-full rounded-xl border border-[#DFDFE4] p-3.5 text-sm font-medium text-[#191636] outline-none focus:border-[#0565D2] focus:ring-2 focus:ring-[#0565D2]/10"
              required
            />
          </div>

          {/* Proof Upload Hint */}
          <div className="rounded-2xl border border-[#DFDFE4] bg-[#F8FAFD] p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#191636]">
              <Upload className="h-4 w-4 text-[#0565D2]" />
              Supporting Evidence / Documents
            </div>
            <p className="mt-1 text-[11px] text-[#5A5971]">
              You can upload receipts, fee chalans, marksheets, or emails directly in your case workspace after lodging this complaint.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="submit"
              disabled={busy}
              className="flex items-center gap-2 rounded-xl bg-[#0565D2] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#191636] disabled:opacity-50 transition"
            >
              {busy ? "Submitting to AICTE..." : "Submit Grievance to AICTE →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
