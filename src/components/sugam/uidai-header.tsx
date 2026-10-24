"use client";
import React, { useState, useEffect } from "react";
import {
  Globe, Eye, Volume2, ShieldCheck, Phone, Mail,
  LayoutDashboard, FileText, Building2, Radio, CheckCircle,
  HelpCircle, ChevronDown, User, LogOut, ArrowRightLeft, Search, Send
} from "lucide-react";
import type { User as UserType } from "@/lib/types";
import { translations, SupportedLang } from "@/lib/i18n";

interface UidaiHeaderProps {
  user: UserType | null;
  portalMode: "PUBLIC" | "AICTE_HQ";
  onSwitchPortal: (mode: "PUBLIC" | "AICTE_HQ") => void;
  onLogout?: () => void;
  activeNav?: string;
  onNavClick?: (navKey: string) => void;
  lang?: SupportedLang;
  onToggleLang?: (l: SupportedLang) => void;
}

export function NationalEmblemSvg({ className = "h-12 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 140" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="National Emblem of India">
      <g fill="currentColor">
        {/* Ashoka Lion Capital Vector Silhouette */}
        <path d="M60 5 C52 5 46 11 46 19 C46 25 50 30 55 32 C50 35 44 42 44 50 C44 56 47 61 51 64 C42 66 34 74 34 85 C34 94 40 101 49 104 C46 107 45 111 45 115 L75 115 C75 111 74 107 71 104 C80 101 86 94 86 85 C86 74 78 66 69 64 C73 61 76 56 76 50 C76 42 70 35 65 32 C70 30 74 25 74 19 C74 11 68 5 60 5 Z" opacity="0.9" />
        {/* Central Ashoka Chakra on abacus */}
        <circle cx="60" cy="115" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="60" cy="115" r="2.5" fill="currentColor" />
        {/* Chakra 8 spoke points */}
        <line x1="60" y1="106" x2="60" y2="124" stroke="currentColor" strokeWidth="1.2" />
        <line x1="51" y1="115" x2="69" y2="115" stroke="currentColor" strokeWidth="1.2" />
        <line x1="53.6" y1="108.6" x2="66.4" y2="121.4" stroke="currentColor" strokeWidth="1.2" />
        <line x1="53.6" y1="121.4" x2="66.4" y2="108.6" stroke="currentColor" strokeWidth="1.2" />
        {/* Pedestal base */}
        <rect x="25" y="125" width="70" height="4" rx="2" fill="currentColor" />
        <rect x="35" y="130" width="50" height="2" rx="1" fill="currentColor" />
        {/* Satyameva Jayate Devnagari text representation */}
        <text x="60" y="138" fontSize="7" fontWeight="bold" textAnchor="middle" fill="currentColor" letterSpacing="0.8">
          सत्यमेव जयते
        </text>
      </g>
    </svg>
  );
}

export function IndianFlagBadge() {
  return (
    <div className="flex h-3.5 w-5 overflow-hidden rounded-[2px] shadow-sm border border-white/20 shrink-0">
      <div className="h-full w-1/3 bg-[#FF9933]" />
      <div className="relative flex h-full w-1/3 items-center justify-center bg-white">
        <div className="h-2 w-2 rounded-full border-[0.8px] border-[#000080]" />
      </div>
      <div className="h-full w-1/3 bg-[#138808]" />
    </div>
  );
}

export function AicteEmblemLogo({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/aicte-logo.svg"
        alt="All India Council for Technical Education Official Seal"
        className="h-full w-full object-contain filter drop-shadow-sm"
      />
    </div>
  );
}

export function UidaiHeader({
  user,
  portalMode,
  onSwitchPortal,
  onLogout,
  activeNav = "home",
  onNavClick,
  lang = "EN",
  onToggleLang,
}: UidaiHeaderProps) {
  const [zoomLevel, setZoomLevel] = useState<"sm" | "md" | "lg">("md");
  const [highContrast, setHighContrast] = useState(false);
  const currentLang = lang || "EN";
  const t = translations[currentLang];

  const changeZoom = (level: "sm" | "md" | "lg") => {
    setZoomLevel(level);
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("text-zoom-sm", "text-zoom-md", "text-zoom-lg");
      document.documentElement.classList.add(`text-zoom-${level}`);
    }
  };

  const toggleContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    if (typeof document !== "undefined") {
      if (next) document.documentElement.classList.add("high-contrast");
      else document.documentElement.classList.remove("high-contrast");
    }
  };

  return (
    <header className="w-full font-sans shadow-md border-b border-[#DFDFE4]">
      {/* ── 1. Top Government of India & Accessibility Strip ── */}
      <div className="bg-[#191636] text-white text-[11px] font-medium border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-1.5 sm:px-6">
          {/* Left: Indian flag & Official Ministry attribution */}
          <div className="flex items-center gap-2 sm:gap-3">
            <IndianFlagBadge />
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white">{t.govTitle}</span>
              <span className="text-white/40">|</span>
              <span className="text-white/90 hidden sm:inline">{t.ministryTitle}</span>
            </div>
          </div>

          {/* Right: Accessibility Controls & Language Toggle */}
          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href="#main-content"
              className="hidden lg:inline text-white/80 hover:text-white transition focus:outline-none focus:underline"
            >
              {t.skipToMain}
            </a>

            <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded px-1.5 py-0.5 border border-white/10">
              <span className="text-[10px] text-white/60 pr-1">{t.fontSize}</span>
              <button
                onClick={() => changeZoom("sm")}
                title="Decrease font size"
                className={`px-1 rounded font-bold transition ${zoomLevel === "sm" ? "bg-[#0565D2] text-white" : "text-white/80 hover:text-white"}`}
              >
                A-
              </button>
              <button
                onClick={() => changeZoom("md")}
                title="Normal font size"
                className={`px-1 rounded font-bold transition ${zoomLevel === "md" ? "bg-[#0565D2] text-white" : "text-white/80 hover:text-white"}`}
              >
                A
              </button>
              <button
                onClick={() => changeZoom("lg")}
                title="Increase font size"
                className={`px-1 rounded font-bold transition ${zoomLevel === "lg" ? "bg-[#0565D2] text-white" : "text-white/80 hover:text-white"}`}
              >
                A+
              </button>
            </div>

            <button
              onClick={toggleContrast}
              title="Toggle High Contrast"
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition ${
                highContrast
                  ? "bg-amber-400 text-slate-950 border-amber-300"
                  : "bg-white/10 text-white border-white/15 hover:bg-white/20"
              }`}
            >
              <Eye className="h-3 w-3" />
              <span className="hidden sm:inline">{t.contrast}</span>
            </button>

            {/* Language Toggle: English | हिन्दी */}
            <div className="flex items-center rounded-lg bg-white/15 border border-white/20 p-0.5 text-xs font-bold">
              <button
                onClick={() => onToggleLang?.("EN")}
                className={`px-2 py-0.5 rounded transition ${currentLang === "EN" ? "bg-white text-[#191636] font-extrabold shadow-xs" : "text-white/80 hover:text-white"}`}
              >
                English
              </button>
              <button
                onClick={() => onToggleLang?.("HI")}
                className={`px-2 py-0.5 rounded transition ${currentLang === "HI" ? "bg-[#FF9933] text-[#191636] font-extrabold shadow-xs" : "text-white/80 hover:text-white"}`}
              >
                हिन्दी
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Official Brand Bar (Crisp White Header) ── */}
      <div className="bg-white border-b border-[#EFEEF8] py-3 px-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Left: Lion Capital + AICTE Logo + Monolingual Name based on currentLang */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-[#191636] hidden sm:block shrink-0">
              <NationalEmblemSvg className="h-12 w-auto" />
            </div>

            <div className="h-10 w-[1px] bg-[#DFDFE4] hidden sm:block" />

            <AicteEmblemLogo className="h-11 w-11 shrink-0" />

            <div className="flex flex-col">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-[#191636] leading-tight font-serif">
                {currentLang === "HI" ? "अखिल भारतीय तकनीकी शिक्षा परिषद" : "ALL INDIA COUNCIL FOR TECHNICAL EDUCATION"}
              </h1>
              <span className="text-xs font-bold tracking-tight text-[#2F2B69] leading-tight">
                {currentLang === "HI" ? "शिक्षा मंत्रालय, भारत सरकार का सांविधिक निकाय" : "A Statutory Body Under Ministry of Education, Govt. of India"}
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-[#ED6C02] tracking-wide mt-0.5 flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#ED6C02]" />
                {currentLang === "HI" ? "सुगम (SUGAM 2.0) — शिकायत निवारण एवं निगरानी प्रणाली" : "SUGAM 2.0 — Single Unified Gateway for AICTE Management"}
              </span>
            </div>
          </div>

          {/* Right: Prominent Language Toggle & National Helplines */}
          <div className="flex items-center gap-4">
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

            <div className="hidden lg:flex flex-col text-right border-l border-[#DFDFE4] pl-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A5971]">
                {t.tollFree}
              </span>
              <a
                href="tel:1800112246"
                className="text-sm font-extrabold text-[#0565D2] hover:underline flex items-center justify-end gap-1.5"
              >
                <Phone className="h-3.5 w-3.5" />
                1800-11-2246
              </a>
              <span className="text-[10px] text-[#5A5971]">
                {t.tollFreeTiming}
              </span>
            </div>

            <div className="h-9 w-[1px] bg-[#DFDFE4] hidden lg:block" />

            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-[#F8FAFD] border border-[#DFDFE4] px-3 py-1.5 shadow-sm">
              <ShieldCheck className="h-5 w-5 text-[#316444]" />
              <div className="text-left leading-tight">
                <div className="text-[10px] font-extrabold text-[#191636]">DIGITAL INDIA · NIC</div>
                <div className="text-[9px] font-semibold text-[#316444]">SSL 256-Bit Secured</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Primary Navigation Bar (UIDAI Dark Navy #191636 / #231E59) ── */}
      <nav className="bg-[#191636] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6">
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 scrollbar-none">
            {portalMode === "PUBLIC" ? (
              <>
                <button
                  onClick={() => onNavClick?.("home")}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                    activeNav === "home"
                      ? "bg-[#2F2B69] text-white shadow-inner border-b-2 border-[#FF9933]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-[#FF9933]" />
                  <span>{t.navCitizenServices}</span>
                </button>

                <button
                  onClick={() => onNavClick?.("file")}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                    activeNav === "file"
                      ? "bg-[#2F2B69] text-white shadow-inner border-b-2 border-[#FF9933]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Send className="h-3.5 w-3.5 text-amber-300" />
                  <span>{t.navFileGrievance}</span>
                </button>

                <button
                  onClick={() => onNavClick?.("track")}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                    activeNav === "track"
                      ? "bg-[#2F2B69] text-white shadow-inner border-b-2 border-[#FF9933]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Search className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{t.navTrackStatus}</span>
                </button>

                <button
                  onClick={() => onNavClick?.("cases")}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                    activeNav === "cases"
                      ? "bg-[#2F2B69] text-white shadow-inner border-b-2 border-[#FF9933]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 text-blue-300" />
                  <span>{t.navMyGrievances}</span>
                </button>

                <button
                  onClick={() => onNavClick?.("institutions")}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                    activeNav === "institutions"
                      ? "bg-[#2F2B69] text-white shadow-inner border-b-2 border-[#FF9933]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5 text-amber-300" />
                  <span>{t.navApprovedColleges}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavClick?.("home")}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                    activeNav === "home"
                      ? "bg-[#2F2B69] text-white shadow-inner border-b-2 border-[#FF9933]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-[#FF9933]" />
                  <span>{t.navHqCommand}</span>
                </button>

                <button
                  onClick={() => onNavClick?.("radar")}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                    activeNav === "radar"
                      ? "bg-[#2F2B69] text-white shadow-inner border-b-2 border-[#FF9933]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Radio className="h-3.5 w-3.5 text-red-400" />
                  <span>{t.navCollisionRadar}</span>
                </button>

                <button
                  onClick={() => onNavClick?.("cases")}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                    activeNav === "cases"
                      ? "bg-[#2F2B69] text-white shadow-inner border-b-2 border-[#FF9933]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 text-blue-300" />
                  <span>{t.navCasesRegister}</span>
                </button>

                <button
                  onClick={() => onNavClick?.("institutions")}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                    activeNav === "institutions"
                      ? "bg-[#2F2B69] text-white shadow-inner border-b-2 border-[#FF9933]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5 text-amber-300" />
                  <span>{t.navInstitutions360}</span>
                </button>
              </>
            )}
          </div>

          {/* Right: Portal Switcher Pill & User Controls */}
          <div className="flex items-center gap-2 shrink-0 py-1 pl-2">
            {portalMode === "PUBLIC" ? (
              <button
                onClick={() => onSwitchPortal("AICTE_HQ")}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ED6C02] to-[#FF9933] px-3.5 py-1.5 text-xs font-extrabold text-slate-950 shadow-sm hover:brightness-105 transition"
                title="Switch to Internal AICTE Bureau Command Center"
              >
                <span>🏛️</span>
                <span className="hidden sm:inline">{t.switchToAicte}</span>
                <span className="rounded-full bg-slate-950/20 px-1 text-[10px] font-black">→</span>
              </button>
            ) : (
              <button
                onClick={() => onSwitchPortal("PUBLIC")}
                className="flex items-center gap-1.5 rounded-xl bg-[#0565D2] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-600 transition"
                title="Switch to Public Citizen & Student Dashboard"
              >
                <span>🌐</span>
                <span className="hidden sm:inline">{t.switchToPublic}</span>
                <span className="rounded-full bg-white/20 px-1 text-[10px]">→</span>
              </button>
            )}

            {user && (
              <div className="flex items-center gap-2 border-l border-white/20 pl-2">
                <div className="hidden md:flex flex-col text-right leading-tight">
                  <span className="text-[11px] font-bold text-white truncate max-w-[120px]">{user.name}</span>
                  <span className="text-[9px] text-white/60">{user.primaryRole === "COMPLAINANT" ? (currentLang === "HI" ? "नागरिक / छात्र" : "Citizen / Student") : (currentLang === "HI" ? "एआईसीटीई अधिकारी" : "AICTE Officer")}</span>
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-[11px] font-black text-white shrink-0">
                  {user.name.slice(0, 1)}
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    title={currentLang === "HI" ? "लॉग आउट करें" : "Sign out from session"}
                    className="flex items-center gap-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 px-2.5 py-1 text-xs font-bold text-white transition shadow-xs"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>{currentLang === "HI" ? "लॉग आउट" : "Logout"}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Tricolor Accent Strip ── */}
      <div className="tricolor-strip" />
    </header>
  );
}
