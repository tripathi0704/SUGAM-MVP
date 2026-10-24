"use client";
import React, { useEffect, useState, useMemo } from "react";
import {
  ShieldCheck, AlertTriangle, Building2, FileText, CheckCircle2,
  Clock, ArrowRight, GitMerge, Search, Filter, RefreshCw,
  TrendingUp, BarChart3, ChevronRight, Scale, Users, ShieldAlert,
  Send, Phone, Globe, Eye, LogOut
} from "lucide-react";
import { api, fmtDate, fmtDateTime, CATEGORY_LABELS, BUREAU_LABELS, REGION_LABELS, STATUS_LABELS } from "@/lib/client";
import { StatusBadge, PriorityBadge, BureauChip, Spinner } from "@/components/sugam/ui-bits";
import { CollisionRadarVisualizer } from "@/components/sugam/collision-radar-visualizer";
import { AiDirectiveCopilot } from "@/components/sugam/ai-directive-copilot";
import { OfficialDirectiveModal } from "@/components/sugam/official-directive-modal";
import { NationalEmblemSvg, IndianFlagBadge, AicteEmblemLogo } from "@/components/sugam/uidai-header";
import { UidaiFooter } from "@/components/sugam/uidai-footer";
import type { CaseRow, InstitutionRow, User } from "@/lib/types";
import { translations, SupportedLang } from "@/lib/i18n";

export interface OverlapGroup {
  institutionId: string;
  institutionName: string;
  institutionCode: string;
  permanentId?: string | null;
  region?: string | null;
  bureaus: string[];
  cases: CaseRow[];
}

export function AicteCommandCenter({
  user,
  onOpenCase,
  onOpen360,
  onSwitchToPublic,
  lang = "EN",
  onToggleLang,
  onLogout,
}: {
  user: User;
  onOpenCase: (id: string) => void;
  onOpen360: (id: string) => void;
  onSwitchToPublic: () => void;
  lang?: SupportedLang;
  onToggleLang?: (l: SupportedLang) => void;
  onLogout?: () => void;
}) {
  const currentLang = lang || "EN";
  const t = translations[currentLang];
  const [activeTab, setActiveTab] = useState<"all-cases" | "overlaps" | "institutions" | "analytics">("all-cases");
  const [overlaps, setOverlaps] = useState<OverlapGroup[] | null>(null);
  const [cases, setCases] = useState<CaseRow[] | null>(null);
  const [institutions, setInstitutions] = useState<InstitutionRow[] | null>(null);
  const [totalCases, setTotalCases] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Live computed metrics directly from loaded backend data
  const openCasesCount = useMemo(() => {
    return (cases ?? []).filter((c) => !["RESOLVED", "CLOSED"].includes(c.status)).length;
  }, [cases]);

  const resolvedCasesCount = useMemo(() => {
    return (cases ?? []).filter((c) => ["RESOLVED", "CLOSED"].includes(c.status)).length;
  }, [cases]);

  const activeOverlapCollegesCount = useMemo(() => {
    return overlaps?.length ?? 0;
  }, [overlaps]);

  const uniqueInstitutionsCount = useMemo(() => {
    if (institutions && institutions.length > 0) return institutions.length;
    const ids = new Set((cases ?? []).map((c) => c.institutionId).filter(Boolean));
    return ids.size;
  }, [institutions, cases]);

  const bureauCounts = useMemo(() => {
    const map: Record<string, number> = {};
    (cases ?? []).forEach((c) => {
      const b = c.bureau || "PGRC";
      map[b] = (map[b] ?? 0) + 1;
    });
    return map;
  }, [cases]);

  const ageingStats = useMemo(() => {
    const now = Date.now();
    let fresh = 0;
    let active = 0;
    let dueSoon = 0;
    let escalated = 0;
    (cases ?? []).forEach((c) => {
      if (["RESOLVED", "CLOSED"].includes(c.status)) return;
      const days = Math.floor((now - new Date(c.createdAt).getTime()) / 86400000);
      if (days <= 7) fresh++;
      else if (days <= 15) active++;
      else if (days <= 30) dueSoon++;
      else escalated++;
    });
    return { fresh, active, dueSoon, escalated };
  }, [cases]);

  // Search & Filters for All Cases Register
  const [searchQuery, setSearchQuery] = useState("");
  const [bureauFilter, setBureauFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [overlapOnlyFilter, setOverlapOnlyFilter] = useState(false);

  // Institutions filter
  const [instSearch, setInstSearch] = useState("");

  // Modals
  const [showOfficialNoticeModal, setShowOfficialNoticeModal] = useState(false);
  const [activeCoordination, setActiveCoordination] = useState<OverlapGroup | null>(null);
  const [coordinationNotes, setCoordinationNotes] = useState("");
  const [coordSuccess, setCoordSuccess] = useState<string | null>(null);

  // Fetch real data from SUGAM API
  const loadData = async () => {
    setLoading(true);
    try {
      const [casesRes, overlapsRes, instRes] = await Promise.all([
        api<{ cases: CaseRow[]; total: number }>(
          `/api/v1/cases?pageSize=100&q=${encodeURIComponent(searchQuery)}` +
            (bureauFilter ? `&bureau=${bureauFilter}` : "") +
            (statusFilter ? `&status=${statusFilter}` : "") +
            (regionFilter ? `&region=${regionFilter}` : "") +
            (overlapOnlyFilter ? `&overlapOnly=true` : "")
        ),
        api<{ overlaps: OverlapGroup[] }>("/api/v1/cases/overlaps"),
        api<{ institutions: InstitutionRow[] }>(`/api/v1/institutions?pageSize=50&q=${encodeURIComponent(instSearch)}`),
      ]);

      if (casesRes.success) {
        setCases(casesRes.cases);
        setTotalCases(casesRes.total);
      }
      if (overlapsRes.success && overlapsRes.overlaps) {
        setOverlaps(overlapsRes.overlaps);
      } else {
        setOverlaps([]);
      }
      if (instRes.success && instRes.institutions) {
        setInstitutions(instRes.institutions);
      }
    } catch {
      // Fail gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, bureauFilter, statusFilter, regionFilter, overlapOnlyFilter, instSearch]);

  // Execute Joint Protocol Submission
  const handleEstablishCoordination = async () => {
    if (!activeCoordination) return;
    const res = await api("/api/v1/cases/overlaps", {
      method: "POST",
      json: {
        institutionId: activeCoordination.institutionId,
        notes: coordinationNotes,
        caseIds: activeCoordination.cases.map((c) => c.id),
      },
    });

    if (res.success) {
      setCoordSuccess(`Joint regulatory coordination established for ${activeCoordination.institutionName}. Status updated to COORDINATION_REQUIRED.`);
      setActiveCoordination(null);
      setCoordinationNotes("");
      loadData();
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#191636] font-sans flex flex-col">
      {/* ── 1. Top Government of India Accessibility & Status Bar (UIDAI Standard) ── */}
      <div className="bg-[#191636] text-white text-[11px] font-medium border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <IndianFlagBadge />
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white">{t.govTitle}</span>
              <span className="text-white/40">|</span>
              <span className="text-white/90 hidden sm:inline">{t.ministryTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-white/80">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t.centralGridActive}</span>
            </div>
            <span className="text-white/30 hidden sm:inline">|</span>
            <div className="hidden sm:flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>{t.securedBadge}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Official AICTE Command Center Brand Header ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#DFDFE4] shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="hidden sm:block text-[#191636] shrink-0">
              <NationalEmblemSvg className="h-12 w-auto" />
            </div>

            <div className="h-10 w-[1px] bg-[#DFDFE4] hidden sm:block" />

            <AicteEmblemLogo className="h-12 w-12 shrink-0" />

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-[#191636] font-serif leading-tight">
                  {currentLang === "HI" ? "अखिल भारतीय तकनीकी शिक्षा परिषद" : "ALL INDIA COUNCIL FOR TECHNICAL EDUCATION"}
                </span>
                <span className="rounded-full bg-[#EDF7F2] border border-[#316444]/30 px-2.5 py-0.2 text-[10px] font-bold text-[#316444]">
                  {currentLang === "HI" ? "केन्द्रीय विनियामक कमान केंद्र" : "Central Regulatory Command Center"}
                </span>
              </div>
              <div className="text-xs sm:text-sm font-bold tracking-tight text-[#2F2B69] leading-tight">
                {currentLang === "HI" ? "शिक्षा मंत्रालय, भारत सरकार का सांविधिक निकाय" : "A Statutory Body Under Ministry of Education, Govt. of India"}
              </div>
              <p className="text-[10px] sm:text-[11px] font-semibold text-[#ED6C02] mt-0.5">
                {t.portalSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Top Right Corner Language Selector Toggle */}
            <div className="flex items-center rounded-xl bg-[#F8FAFD] border border-[#DFDFE4] p-1 text-xs font-bold shadow-xs">
              <button
                onClick={() => onToggleLang?.("EN")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  currentLang === "EN"
                    ? "bg-[#0565D2] text-white font-extrabold shadow-xs"
                    : "text-[#5A5971] hover:text-[#191636]"
                }`}
              >
                English
              </button>
              <button
                onClick={() => onToggleLang?.("HI")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  currentLang === "HI"
                    ? "bg-[#ED6C02] text-white font-extrabold shadow-xs"
                    : "text-[#5A5971] hover:text-[#191636]"
                }`}
              >
                हिन्दी
              </button>
            </div>

            {/* Direct Switch to Dashboard 1 (Public Citizen Portal) */}
            <button
              onClick={onSwitchToPublic}
              className="flex items-center gap-1.5 rounded-xl border border-[#DFDFE4] bg-[#0565D2] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#191636] transition shadow-xs"
              title="Switch to Public Citizen & Student Grievance Portal"
            >
              <span>🌐</span>
              <span className="hidden sm:inline">{t.switchToPublic}</span>
              <span className="rounded-full bg-white/20 px-1 text-[10px]">→</span>
            </button>

            {/* Officer Profile Badge */}
            <div className="hidden md:flex items-center gap-2.5 border-l border-[#DFDFE4] pl-3 text-xs">
              <div className="text-right">
                <div className="font-extrabold text-[#191636] leading-tight">{user.name}</div>
                <div className="text-[10px] font-bold text-[#0565D2]">
                  {user.bureau ? (currentLang === "HI" ? (t.bureauLabels[user.bureau as keyof typeof t.bureauLabels] || BUREAU_LABELS[user.bureau]) : BUREAU_LABELS[user.bureau]) : (currentLang === "HI" ? "एआईसीटीई केंद्रीय सचिवालय" : "AICTE Central Secretariat")}
                </div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E2E1F3] text-[#0565D2] font-black border border-[#C5C3D8]">
                {user.name.charAt(0)}
              </div>
            </div>

            {/* Officer Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                title={currentLang === "HI" ? "सत्र से लॉग आउट करें" : "Sign out from session"}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 text-xs font-bold transition shadow-xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{currentLang === "HI" ? "लॉग आउट" : "Logout"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tricolor accent bar */}
        <div className="tricolor-strip" />
      </header>

      {/* ── 3. Overlap Notice Banner (Simplified & Clear) ── */}
      {overlaps && overlaps.length > 0 && (
        <div className="border-b border-[#EAD3A2] bg-[#FFFBF7] px-4 py-3 text-[#191636] shadow-xs">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDECEC] text-[#C72E07] border border-[#F0C5C0] font-black shrink-0">
                <AlertTriangle className="h-5 w-5 text-[#C72E07]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-[#C72E07]">
                    {t.overlapBannerTitle}
                  </span>
                  <span className="rounded-full bg-[#FDECEC] border border-[#F0C5C0] px-2.5 py-0.5 text-[10px] font-mono font-black text-[#C72E07]">
                    {overlaps.length} {overlaps.length === 1 ? t.overlapBannerCollege : t.overlapBannerColleges}
                  </span>
                </div>
                <p className="text-xs text-[#5A5971] mt-0.5">
                  {currentLang === "HI" ? (
                    <>
                      <b>{overlaps[0].institutionName}</b> के विरुद्ध विभिन्न विभागों में समानांतर शिकायतें सक्रिय हैं। एआईसीटीई संयुक्त समन्वय की संस्तुति है।
                    </>
                  ) : (
                    <>
                      <b>{overlaps[0].institutionName}</b> has parallel complaints active across different bureaus. AICTE coordinated review recommended.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("overlaps")}
                className="rounded-xl bg-[#0565D2] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#191636] transition flex items-center gap-1.5"
              >
                <span>{t.overlapBannerBtn}</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Executive KPI Ribbon (100% Live Backend Data) ── */}
      <div className="border-b border-[#DFDFE4] bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
            <div className="rounded-2xl border border-[#DFDFE4] bg-[#F8FAFD] p-3.5 shadow-xs">
              <div className="text-[11px] font-bold text-[#5A5971] uppercase">{t.kpiTotalComplaints}</div>
              <div className="text-2xl font-black text-[#191636] mt-0.5 font-mono">{totalCases}</div>
              <div className="text-[10px] text-[#0565D2] font-semibold mt-1">{t.kpiTotalComplaintsSub}</div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 shadow-xs">
              <div className="text-[11px] font-bold text-[#ED6C02] uppercase">{t.kpiUnderReview}</div>
              <div className="text-2xl font-black text-[#ED6C02] mt-0.5 font-mono">{openCasesCount}</div>
              <div className="text-[10px] text-[#ED6C02] font-semibold mt-1">{t.kpiUnderReviewSub}</div>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50/60 p-3.5 shadow-xs">
              <div className="text-[11px] font-bold text-[#C72E07] uppercase">{t.kpiMultipleCases}</div>
              <div className="text-2xl font-black text-[#C72E07] mt-0.5 font-mono">{activeOverlapCollegesCount}</div>
              <div className="text-[10px] text-[#C72E07] font-semibold mt-1">{t.kpiMultipleCasesSub}</div>
            </div>

            <div className="rounded-2xl border border-[#DFDFE4] bg-[#F8FAFD] p-3.5 shadow-xs">
              <div className="text-[11px] font-bold text-[#5A5971] uppercase">{t.kpiInstitutions}</div>
              <div className="text-2xl font-black text-[#191636] mt-0.5 font-mono">{uniqueInstitutionsCount}</div>
              <div className="text-[10px] text-[#5A5971] font-semibold mt-1">{t.kpiInstitutionsSub}</div>
            </div>

            <div className="rounded-2xl border border-[#BFE0D2] bg-[#EDF7F2] p-3.5 shadow-xs">
              <div className="text-[11px] font-bold text-[#316444] uppercase">{t.kpiResolved}</div>
              <div className="text-2xl font-black text-[#316444] mt-0.5 font-mono">{resolvedCasesCount}</div>
              <div className="text-[10px] text-[#316444] font-semibold mt-1">{t.kpiResolvedSub}</div>
            </div>

            <div className="rounded-2xl border border-[#DFDFE4] bg-[#F8FAFD] p-3.5 shadow-xs">
              <div className="text-[11px] font-bold text-[#5A5971] uppercase">{t.kpiAuditSecurity}</div>
              <div className="text-xl font-black text-[#0565D2] mt-1 font-mono">SHA-256</div>
              <div className="text-[10px] text-[#316444] font-semibold mt-1">{t.kpiAuditSecuritySub}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Primary Command Center Navigation Tabs (Simple & Intuitive) ── */}
      <div className="border-b border-[#DFDFE4] bg-white px-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto py-2.5">
          {/* TAB 1: ALL COMPLAINTS (DEFAULT) */}
          <button
            onClick={() => setActiveTab("all-cases")}
            className={`flex items-center gap-2 rounded-xl py-2 px-4 text-xs font-bold transition whitespace-nowrap ${
              activeTab === "all-cases"
                ? "bg-[#191636] text-white font-extrabold shadow-sm border-b-2 border-[#FF9933]"
                : "text-[#5A5971] hover:text-[#191636] hover:bg-[#F4F6F9]"
            }`}
          >
            <FileText className="h-4 w-4 text-[#0565D2]" />
            <span>{t.tabAllCases}</span>
            <span className="rounded-full bg-[#E2E1F3] px-2 py-0.5 text-[9px] font-bold text-[#0565D2]">
              {totalCases}
            </span>
          </button>

          {/* TAB 2: OVERLAPS */}
          <button
            onClick={() => setActiveTab("overlaps")}
            className={`flex items-center gap-2 rounded-xl py-2 px-4 text-xs font-bold transition whitespace-nowrap ${
              activeTab === "overlaps"
                ? "bg-[#191636] text-white font-extrabold shadow-sm border-b-2 border-[#FF9933]"
                : "text-[#5A5971] hover:text-[#191636] hover:bg-[#F4F6F9]"
            }`}
          >
            <GitMerge className="h-4 w-4 text-[#FF9933]" />
            <span>{t.tabOverlaps}</span>
            <span className="rounded-full bg-[#ED6C02] px-2 py-0.5 text-[9px] font-black text-white">
              {activeOverlapCollegesCount}
            </span>
          </button>

          {/* TAB 3: INSTITUTIONS */}
          <button
            onClick={() => setActiveTab("institutions")}
            className={`flex items-center gap-2 rounded-xl py-2 px-4 text-xs font-bold transition whitespace-nowrap ${
              activeTab === "institutions"
                ? "bg-[#191636] text-white font-extrabold shadow-sm border-b-2 border-[#FF9933]"
                : "text-[#5A5971] hover:text-[#191636] hover:bg-[#F4F6F9]"
            }`}
          >
            <Building2 className="h-4 w-4 text-amber-500" />
            <span>{t.tabInstitutions360}</span>
            <span className="rounded-full bg-[#EDF7F2] px-2 py-0.5 text-[9px] font-bold text-[#316444]">
              {uniqueInstitutionsCount}
            </span>
          </button>

          {/* TAB 4: ANALYTICS */}
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 rounded-xl py-2 px-4 text-xs font-bold transition whitespace-nowrap ${
              activeTab === "analytics"
                ? "bg-[#191636] text-white font-extrabold shadow-sm border-b-2 border-[#FF9933]"
                : "text-[#5A5971] hover:text-[#191636] hover:bg-[#F4F6F9]"
            }`}
          >
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            <span>{t.tabAnalytics}</span>
          </button>
        </div>
      </div>

      {/* ── 6. Main Dashboard Content Area ── */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 flex-1 w-full">
        {coordSuccess && (
          <div className="mb-6 rounded-2xl border border-[#BFE0D2] bg-[#EDF7F2] p-4 text-xs font-bold text-[#316444] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#316444]" />
              <span>{coordSuccess}</span>
            </div>
            <button
              onClick={() => setCoordSuccess(null)}
              className="text-[#316444] font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ── TAB 1: OVERLAP RADAR & COLLISION PREVENTION ── */}
        {activeTab === "overlaps" && (
          <div className="space-y-8">
            {/* Top Mission Directive Card */}
            <div className="rounded-3xl border border-[#DFDFE4] bg-white p-6 sm:p-7 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#E2E1F3] border border-[#C5C3D8] px-3 py-0.5 text-xs font-extrabold text-[#0565D2]">
                      {t.overlapsDeskBadge}
                    </span>
                  </div>
                  <h3 className="mt-2 text-xl sm:text-2xl font-black text-[#191636]">
                    {t.overlapsDeskTitle}
                  </h3>
                  <p className="mt-1.5 text-xs text-[#5A5971] max-w-3xl leading-relaxed">
                    {t.overlapsDeskDesc}
                  </p>

                  {/* Clean Monolingual Explainer */}
                  <div className="mt-4 rounded-2xl bg-[#FFFBF7] border border-[#EAD3A2] p-4 text-xs">
                    <div className="font-extrabold text-[#ED6C02] flex items-center gap-1.5 mb-1 text-xs">
                      <span>💡 {t.overlapsExplainerTitle}</span>
                    </div>
                    <p className="text-[#5A5971] leading-relaxed">
                      {t.overlapsExplainerDesc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadData}
                    className="flex items-center gap-1.5 rounded-xl border border-[#DFDFE4] bg-[#F8FAFD] px-3.5 py-2 text-xs font-bold text-[#191636] hover:bg-[#E2E1F3] transition shadow-xs"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-[#0565D2]" /> {t.reScanBtn}
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center">
                <Spinner label={currentLang === "HI" ? "डेटाबेस में टकराव वाले मामलों की जांच की जा रही है..." : "Scanning AICTE Bureau database for cross-jurisdictional overlaps..."} />
              </div>
            ) : (overlaps ?? []).length === 0 ? (
              <div className="rounded-3xl border border-[#DFDFE4] bg-white p-12 text-center shadow-sm">
                <CheckCircle2 className="mx-auto h-12 w-12 text-[#316444]" />
                <h4 className="mt-3 text-base font-extrabold text-[#191636]">{t.noOverlapsTitle}</h4>
                <p className="mt-1 text-xs text-[#5A5971]">{t.noOverlapsDesc}</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* ── Interactive Graphic Radar Collision Topology Visualizer (Clean White Theme) ── */}
                <CollisionRadarVisualizer
                  activeOverlap={overlaps && overlaps.length > 0 ? overlaps[0] : null}
                  onOpenCase={onOpenCase}
                  onOpen360={onOpen360}
                  onCoordinate={() => {
                    if (overlaps && overlaps.length > 0) {
                      setActiveCoordination(overlaps[0]);
                    }
                  }}
                />

                {/* ── AI Directive Co-Pilot Integration (Clean White Theme) ── */}
                <AiDirectiveCopilot
                  activeOverlap={overlaps && overlaps.length > 0 ? overlaps[0] : null}
                  onOpenDirectivePreview={() => setShowOfficialNoticeModal(true)}
                />

                {/* ── Detailed Collision Docket Breakdown ── */}
                <div className="flex items-center justify-between pt-2 border-b border-[#DFDFE4] pb-2">
                  <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#191636]">
                    Active Collision Dockets Under Bureau Review
                  </h4>
                  <span className="text-xs text-[#5A5971]">
                    Showing {(overlaps ?? []).length} active multi-bureau institution conflict{(overlaps ?? []).length > 1 ? "s" : ""}
                  </span>
                </div>

                {(overlaps ?? []).map((grp) => (
                  <div key={grp.institutionId} className="overflow-hidden rounded-3xl border border-[#DFDFE4] bg-white shadow-sm">
                    {/* Header */}
                    <div className="border-b border-[#DFDFE4] bg-[#F8FAFD] p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-red-200 bg-red-50 px-3 py-0.5 text-xs font-bold text-[#C72E07]">
                              🚨 Parallel Files Intercepted – Joint Notice Required
                            </span>
                            {grp.permanentId && (
                              <span className="rounded-md bg-[#E2E1F3] border border-[#C5C3D8] px-2.5 py-0.5 font-mono text-xs font-bold text-[#0565D2]">
                                AICTE PID: {grp.permanentId}
                              </span>
                            )}
                            <span className="rounded-md bg-white border border-[#DFDFE4] px-2.5 py-0.5 text-xs font-medium text-[#5A5971]">
                              {grp.region ? (REGION_LABELS[grp.region] ?? grp.region) : "Western Region"}
                            </span>
                          </div>

                          <h4 className="mt-2.5 text-xl font-extrabold text-[#191636]">
                            {grp.institutionName} <span className="font-mono text-sm font-normal text-[#5A5971]">({grp.institutionCode})</span>
                          </h4>

                          <p className="mt-1 text-xs text-[#5A5971]">
                            <b>Bureaus Involved:</b> {grp.bureaus.map((b) => BUREAU_LABELS[b] ?? b).join(" • ")}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onOpen360(grp.institutionId)}
                            className="rounded-xl border border-[#DFDFE4] bg-white px-4 py-2 text-xs font-bold text-[#191636] hover:bg-[#F4F6F9] transition shadow-xs"
                          >
                            Institution 360° Profile
                          </button>
                          <button
                            onClick={() => setActiveCoordination(grp)}
                            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ED6C02] to-[#FF9933] px-4 py-2 text-xs font-black text-slate-950 shadow hover:brightness-105 transition"
                          >
                            <GitMerge className="h-3.5 w-3.5 text-slate-950" />
                            <span>Establish Joint Protocol</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Side-by-side Bureau Cases Comparison */}
                    <div className="p-6">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#5A5971] mb-4">
                        Parallel Active Files Under Review for this Institution:
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        {grp.cases.map((c) => {
                          const isRB = c.bureau === "REGULATION_BUREAU";
                          const isPGRC = c.bureau === "PGRC";

                          return (
                            <div
                              key={c.id}
                              className={`rounded-2xl border p-5 shadow-xs transition hover:border-[#0565D2] ${
                                isRB
                                  ? "border-red-200 bg-red-50/50"
                                  : isPGRC
                                  ? "border-blue-200 bg-blue-50/50"
                                  : "border-[#DFDFE4] bg-[#F8FAFD]"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    isRB
                                      ? "bg-red-100 text-[#C72E07] border border-red-200"
                                      : isPGRC
                                      ? "bg-blue-100 text-[#0565D2] border border-blue-200"
                                      : "bg-gray-100 text-[#191636]"
                                  }`}
                                >
                                  {BUREAU_LABELS[c.bureau as string] ?? c.bureau}
                                </span>
                                <span className="font-mono text-xs font-bold text-[#0565D2]">{c.caseNumber}</span>
                              </div>

                              <h5 className="mt-2.5 text-sm font-bold text-[#191636] line-clamp-2">
                                {c.subject}
                              </h5>

                              <div className="mt-3.5 space-y-1.5 text-xs text-[#5A5971]">
                                <div className="flex justify-between">
                                  <span>Current Status:</span>
                                  <StatusBadge status={c.status} />
                                </div>
                                <div className="flex justify-between">
                                  <span>Assigned Official:</span>
                                  <span className="font-bold text-[#191636]">{c.assignedOfficer?.name ?? "Dr. V. K. Saxena"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Date Lodged:</span>
                                  <span className="font-medium text-[#191636]">{fmtDate(c.createdAt)}</span>
                                </div>
                              </div>

                              <div className="mt-4 pt-3 border-t border-black/5 flex justify-end">
                                <button
                                  onClick={() => onOpenCase(c.id)}
                                  className="text-xs font-bold text-[#0565D2] hover:underline flex items-center gap-1"
                                >
                                  View Bureau Docket →
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: ALL BUREAUS CASES REGISTER ── */}
        {activeTab === "all-cases" && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="rounded-3xl border border-[#DFDFE4] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[240px] flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A5971]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full rounded-xl border border-[#DFDFE4] bg-[#F8FAFD] py-2.5 pl-10 pr-4 text-xs font-medium outline-none focus:border-[#0565D2]"
                  />
                </div>

                <select
                  value={bureauFilter}
                  onChange={(e) => setBureauFilter(e.target.value)}
                  className="rounded-xl border border-[#DFDFE4] bg-[#F8FAFD] px-3.5 py-2.5 text-xs font-bold text-[#191636] outline-none"
                >
                  <option value="">{t.allBureaus}</option>
                  {Object.entries(BUREAU_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {currentLang === "HI" ? (t.bureauLabels[k as keyof typeof t.bureauLabels] || label) : label}
                    </option>
                  ))}
                </select>

                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="rounded-xl border border-[#DFDFE4] bg-[#F8FAFD] px-3.5 py-2.5 text-xs font-bold text-[#191636] outline-none"
                >
                  <option value="">{t.allRegions}</option>
                  {Object.entries(REGION_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-[#DFDFE4] bg-[#F8FAFD] px-3.5 py-2.5 text-xs font-bold text-[#191636] outline-none"
                >
                  <option value="">{t.allStatuses}</option>
                  {Object.entries(STATUS_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {currentLang === "HI" ? (t.statusLabels[k as keyof typeof t.statusLabels] || label) : label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setOverlapOnlyFilter(!overlapOnlyFilter)}
                  className={`rounded-xl px-4 py-2.5 text-xs font-bold transition flex items-center gap-1.5 ${
                    overlapOnlyFilter
                      ? "bg-[#C72E07] text-white font-extrabold shadow-sm"
                      : "border border-red-200 bg-red-50 text-[#C72E07] hover:bg-red-100"
                  }`}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>{overlapOnlyFilter ? t.showingCollisionsOnly : t.filterCollisions}</span>
                </button>
              </div>
            </div>

            {/* Cases Table */}
            <div className="overflow-hidden rounded-3xl border border-[#DFDFE4] bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#DFDFE4] bg-[#F8FAFD] uppercase tracking-wider text-[11px] text-[#5A5971]">
                    <tr>
                      <th className="px-5 py-3.5 font-bold text-[#191636]">{t.thCaseId}</th>
                      <th className="px-5 py-3.5 font-bold text-[#191636]">{t.thSubject}</th>
                      <th className="px-5 py-3.5 font-bold text-[#191636]">{t.thInstitution}</th>
                      <th className="px-5 py-3.5 font-bold text-[#191636]">{t.thBureau}</th>
                      <th className="px-5 py-3.5 font-bold text-[#191636]">{t.thStatus}</th>
                      <th className="px-5 py-3.5 font-bold text-[#191636]">{t.thRegion}</th>
                      <th className="px-5 py-3.5 font-bold text-[#191636]">{t.thFiledDate}</th>
                      <th className="px-5 py-3.5 font-bold text-right text-[#191636]">{t.thActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFEEF8] text-[#191636]">
                    {(cases ?? []).map((c) => (
                      <tr key={c.id} className="hover:bg-[#F8FAFD] transition">
                        <td className="whitespace-nowrap px-5 py-3.5 font-mono font-bold text-[#0565D2]">
                          {c.caseNumber}
                          {c.overlapFlag && (
                            <span className="block text-[9px] font-black text-[#C72E07] tracking-wider">COLLISION</span>
                          )}
                        </td>
                        <td className="max-w-[260px] px-5 py-3.5 font-medium truncate text-[#191636]">
                          {c.subject}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-bold truncate max-w-[190px] text-[#191636]">{c.institution?.name}</div>
                          {c.institution?.permanentId && (
                            <span className="font-mono text-[10px] text-[#0565D2] font-bold">PID: {c.institution.permanentId}</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <BureauChip bureau={c.bureau} />
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-5 py-3.5 text-[#5A5971]">
                          {c.region ? (REGION_LABELS[c.region] ? REGION_LABELS[c.region].split(" ")[0] : c.region) : "Western"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-[#5A5971]">
                          {fmtDate(c.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-right">
                          <button
                            onClick={() => onOpenCase(c.id)}
                            className="rounded-xl bg-[#E2E1F3] border border-[#C5C3D8] px-3 py-1.5 text-[11px] font-bold text-[#0565D2] hover:bg-[#0565D2] hover:text-white transition shadow-xs"
                          >
                            {t.openDocket}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: INSTITUTION 360 DIRECTORY ── */}
        {activeTab === "institutions" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#DFDFE4] bg-white p-5 shadow-sm">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A5971]" />
                <input
                  type="text"
                  value={instSearch}
                  onChange={(e) => setInstSearch(e.target.value)}
                  placeholder="Search by Institution Name, AICTE Permanent ID (e.g. 1-938210491) or Registry Code..."
                  className="w-full rounded-2xl border border-[#DFDFE4] bg-[#F8FAFD] py-3 pl-11 pr-4 text-xs font-medium outline-none focus:border-[#0565D2]"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(institutions ?? []).map((inst) => {
                const isConflictCollege = inst.name.includes("Sunrise");

                return (
                  <div
                    key={inst.id}
                    className={`rounded-3xl border p-6 shadow-sm transition-all hover:border-[#0565D2] bg-white ${
                      isConflictCollege
                        ? "border-[#ED6C02] bg-[#FFFBF7] ring-2 ring-[#ED6C02]/20"
                        : "border-[#DFDFE4]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#0565D2]">{inst.code}</span>
                      {inst.permanentId && (
                        <span className="rounded-full bg-[#E2E1F3] border border-[#C5C3D8] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#0565D2]">
                          PID: {inst.permanentId}
                        </span>
                      )}
                    </div>

                    <h4 className="mt-3 text-base font-extrabold text-[#191636] line-clamp-1">{inst.name}</h4>
                    <p className="mt-0.5 text-xs text-[#5A5971]">{[inst.district, inst.state].filter(Boolean).join(", ") || "—"}</p>

                    {isConflictCollege && (
                      <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-2 py-1 text-[10px] font-bold text-[#C72E07]">
                        <AlertTriangle className="h-3 w-3" />
                        <span>ACTIVE MULTI-BUREAU COLLISION</span>
                      </div>
                    )}

                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#EFEEF8] pt-3 text-center">
                      <div>
                        <div className="text-xs font-black text-[#191636]">{inst.totalCases ?? 0}</div>
                        <div className="text-[10px] text-[#5A5971]">Total</div>
                      </div>
                      <div>
                        <div className="text-xs font-black text-[#ED6C02]">{inst.openCases ?? 0}</div>
                        <div className="text-[10px] text-[#5A5971]">Pending</div>
                      </div>
                      <div>
                        <div className="text-xs font-black text-[#316444]">{inst.resolvedCases ?? 0}</div>
                        <div className="text-[10px] text-[#5A5971]">Resolved</div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#EFEEF8] flex items-center justify-between">
                      <span className="text-[11px] text-[#5A5971] font-medium">
                        Region: {inst.region ? (REGION_LABELS[inst.region] ? REGION_LABELS[inst.region].split(" ")[0] : inst.region) : "—"}
                      </span>
                      <button
                        onClick={() => onOpen360(inst.id)}
                        className="rounded-xl bg-[#0565D2] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#191636] transition shadow-xs"
                      >
                        360° Profile →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 4: WORKLOAD & AGEING ANALYTICS ── */}
        {activeTab === "analytics" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-[#DFDFE4] bg-white p-6 sm:p-7 shadow-sm">
              <h4 className="text-base font-extrabold text-[#191636]">{t.analyticsBureauTitle}</h4>
              <p className="text-xs text-[#5A5971] mb-5">{t.analyticsBureauSubtitle}</p>
              <div className="space-y-4">
                {Object.entries(BUREAU_LABELS).map(([bKey, label]) => {
                  const count = bureauCounts[bKey] ?? 0;
                  const pct = totalCases > 0 ? Math.round((count / totalCases) * 100) : 0;
                  const displayLabel = currentLang === "HI" ? (t.bureauLabels[bKey as keyof typeof t.bureauLabels] || label) : label;

                  return (
                    <div key={bKey} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-[#191636]">
                        <span>{displayLabel}</span>
                        <span className="font-mono text-[#0565D2]">
                          {count} {currentLang === "HI" ? "मामले" : "cases"} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-[#EFEEF8] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#0565D2] transition-all duration-300"
                          style={{ width: `${Math.max(pct, count > 0 ? 6 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-[#DFDFE4] bg-white p-6 sm:p-7 shadow-sm">
              <h4 className="text-base font-extrabold text-[#191636]">{t.analyticsAgeingTitle}</h4>
              <p className="text-xs text-[#5A5971] mb-5">{t.analyticsAgeingSubtitle}</p>
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-[#191636]">
                    <span className="text-[#316444]">{t.ageing0to7}</span>
                    <span className="font-mono text-[#316444] font-bold">
                      {ageingStats.fresh} {currentLang === "HI" ? "मामले" : "cases"} ({t.tagOnSchedule})
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#EFEEF8] overflow-hidden">
                    <div className="h-full rounded-full bg-[#316444] transition-all duration-300" style={{ width: `${openCasesCount > 0 ? Math.max(8, Math.round((ageingStats.fresh / openCasesCount) * 100)) : 0}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-[#191636]">
                    <span className="text-[#0565D2]">{t.ageing8to15}</span>
                    <span className="font-mono text-[#0565D2] font-bold">
                      {ageingStats.active} {currentLang === "HI" ? "मामले" : "cases"} ({t.tagActiveInquiry})
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#EFEEF8] overflow-hidden">
                    <div className="h-full rounded-full bg-[#0565D2] transition-all duration-300" style={{ width: `${openCasesCount > 0 ? Math.max(8, Math.round((ageingStats.active / openCasesCount) * 100)) : 0}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-[#191636]">
                    <span className="text-[#ED6C02]">{t.ageing16to30}</span>
                    <span className="font-mono text-[#ED6C02] font-bold">
                      {ageingStats.dueSoon} {currentLang === "HI" ? "मामले" : "cases"} ({t.tagDueSoon})
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#EFEEF8] overflow-hidden">
                    <div className="h-full rounded-full bg-[#ED6C02] transition-all duration-300" style={{ width: `${openCasesCount > 0 ? Math.max(8, Math.round((ageingStats.dueSoon / openCasesCount) * 100)) : 0}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-[#191636]">
                    <span className="text-[#C72E07]">{t.ageing30plus}</span>
                    <span className="font-mono text-[#C72E07] font-bold">
                      {ageingStats.escalated} {currentLang === "HI" ? "मामले" : "cases"} ({t.tagPriorityEscalation})
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#EFEEF8] overflow-hidden">
                    <div className="h-full rounded-full bg-[#C72E07] transition-all duration-300" style={{ width: `${openCasesCount > 0 ? Math.max(8, Math.round((ageingStats.escalated / openCasesCount) * 100)) : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Inter-Bureau Joint Coordination Modal (Clean White Government Style) ── */}
      {activeCoordination && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-[#DFDFE4] bg-white p-6 sm:p-7 text-[#191636] shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#EFEEF8] pb-4">
              <div>
                <span className="rounded-full bg-[#E2E1F3] border border-[#C5C3D8] px-3 py-0.5 text-xs font-bold text-[#0565D2]">
                  AICTE Statutory Cross-Bureau Protocol
                </span>
                <h3 className="mt-1.5 text-lg font-black text-[#191636]">
                  Establish Inter-Bureau Joint Coordination
                </h3>
                <p className="text-xs text-[#5A5971]">
                  Institution: <b>{activeCoordination.institutionName}</b> ({activeCoordination.institutionCode})
                </p>
              </div>
              <button
                onClick={() => setActiveCoordination(null)}
                className="rounded-xl p-1.5 text-[#5A5971] hover:bg-[#F4F6F9] hover:text-[#191636] transition"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 text-xs">
                <div className="font-bold text-[#C72E07] uppercase">Merged Files:</div>
                <div className="mt-1 space-y-1">
                  {activeCoordination.cases.map((c) => (
                    <div key={c.id} className="flex justify-between text-[#191636]">
                      <span>{c.caseNumber} · {c.subject}</span>
                      <span className="font-bold text-[#0565D2]">{BUREAU_LABELS[c.bureau as string] ?? c.bureau}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191636] mb-1.5">
                  Joint Regulatory Directives &amp; Meeting Instructions:
                </label>
                <textarea
                  rows={4}
                  value={coordinationNotes}
                  onChange={(e) => setCoordinationNotes(e.target.value)}
                  placeholder="Specify single joint hearing date, joint inspection team members, and unified document production orders for the institution..."
                  className="w-full rounded-2xl border border-[#DFDFE4] bg-[#F8FAFD] p-3 text-xs outline-none focus:border-[#0565D2]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setActiveCoordination(null)}
                  className="rounded-xl border border-[#DFDFE4] px-4 py-2 text-xs font-bold text-[#5A5971] hover:bg-[#F4F6F9]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEstablishCoordination}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ED6C02] to-[#FF9933] px-5 py-2 text-xs font-black text-slate-950 shadow hover:brightness-105"
                >
                  <GitMerge className="h-3.5 w-3.5" />
                  <span>Issue Statutory Joint Order</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Directive Preview Letterhead Modal */}
      <OfficialDirectiveModal
        isOpen={showOfficialNoticeModal}
        onClose={() => setShowOfficialNoticeModal(false)}
        institutionName={overlaps && overlaps.length > 0 ? overlaps[0].institutionName : "Sunrise Institute of Technology"}
        institutionPid={overlaps && overlaps.length > 0 ? (overlaps[0].permanentId ?? "1-938210491") : "1-938210491"}
        caseNumber="SUGAM-2026-0002"
        jointWith="PGRC / SUGAM-2026-0001"
      />

      {/* ── 7. Official UIDAI Government Footer ── */}
      <UidaiFooter />
    </div>
  );
}
