"use client";
import React from "react";
import {
  FileText, Search, Download, Building2, Radio, Users,
  Send, ShieldAlert, Award, Clock, ArrowRight, CheckCircle2,
  AlertTriangle, ShieldCheck, Scale, Cpu, Sparkles, Eye
} from "lucide-react";
import { translations, SupportedLang } from "@/lib/i18n";

export interface ServiceItem {
  id: string;
  category: "CITIZEN" | "RADAR" | "INSTITUTION";
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  badge?: string;
  badgeTone?: "blue" | "green" | "saffron" | "red" | "purple";
  actionText: string;
  onClick: () => void;
}

export function UidaiServiceGrid({
  onLodgeGrievance,
  onTrackCase,
  onOpenInstitutions,
  onOpenRadar,
  onOpenAnalytics,
  onOpenDirectives,
  lang = "EN",
}: {
  onLodgeGrievance: () => void;
  onTrackCase: () => void;
  onOpenInstitutions: () => void;
  onOpenRadar: () => void;
  onOpenAnalytics: () => void;
  onOpenDirectives: () => void;
  lang?: SupportedLang;
}) {
  const currentLang = lang || "EN";
  const t = translations[currentLang];

  const citizenServices: ServiceItem[] = [
    {
      id: "file-grievance",
      category: "CITIZEN",
      title: t.cardFileGrievanceTitle,
      description: t.cardFileGrievanceDesc,
      icon: <Send className="h-6 w-6 text-[#0565D2]" />,
      iconBg: "bg-[#E2E1F3]",
      badge: currentLang === "HI" ? "नागरिक एवं छात्र सेवा" : "Citizen & Student Service",
      badgeTone: "blue",
      actionText: t.cardFileGrievanceBtn,
      onClick: onLodgeGrievance,
    },
    {
      id: "track-grievance",
      category: "CITIZEN",
      title: t.cardTrackStatusTitle,
      description: t.cardTrackStatusDesc,
      icon: <Search className="h-6 w-6 text-[#ED6C02]" />,
      iconBg: "bg-[#FCEBE3]",
      badge: currentLang === "HI" ? "वास्तविक समय स्थिति" : "Real-Time Tracking",
      badgeTone: "saffron",
      actionText: t.cardTrackStatusBtn,
      onClick: onTrackCase,
    },
    {
      id: "institution-360",
      category: "CITIZEN",
      title: t.cardInstDirectoryTitle,
      description: t.cardInstDirectoryDesc,
      icon: <Building2 className="h-6 w-6 text-[#316444]" />,
      iconBg: "bg-[#EDF7F2]",
      badge: currentLang === "HI" ? "सार्वजनिक पारदर्शिता" : "Public Transparency",
      badgeTone: "green",
      actionText: t.cardInstDirectoryBtn,
      onClick: onOpenInstitutions,
    },
    {
      id: "download-orders",
      category: "CITIZEN",
      title: t.cardDirectivesTitle,
      description: t.cardDirectivesDesc,
      icon: <Download className="h-6 w-6 text-[#7158A9]" />,
      iconBg: "bg-[#EFEEF8]",
      badge: currentLang === "HI" ? "आधिकारिक अभिलेख" : "Official Records",
      badgeTone: "purple",
      actionText: t.cardDirectivesBtn,
      onClick: onOpenDirectives,
    },
  ];

  const radarServices: ServiceItem[] = [
    {
      id: "multi-bureau-radar",
      category: "RADAR",
      title: t.cardRadarTitle,
      description: t.cardRadarDesc,
      icon: <Radio className="h-6 w-6 text-[#C72E07] animate-pulse" />,
      iconBg: "bg-[#FDECEC]",
      badge: currentLang === "HI" ? "विनियामक नियंत्रण" : "Regulatory Intelligence",
      badgeTone: "red",
      actionText: t.cardRadarBtn,
      onClick: onOpenRadar,
    },
    {
      id: "ai-notice-copilot",
      category: "RADAR",
      title: t.cardCopilotTitle,
      description: t.cardCopilotDesc,
      icon: <Sparkles className="h-6 w-6 text-[#0565D2]" />,
      iconBg: "bg-[#E2E1F3]",
      badge: currentLang === "HI" ? "एआई प्रारूप सहायक" : "AI Copilot",
      badgeTone: "blue",
      actionText: t.cardCopilotBtn,
      onClick: onOpenDirectives,
    },
    {
      id: "joint-directives",
      category: "RADAR",
      title: t.cardJointProtocolTitle,
      description: t.cardJointProtocolDesc,
      icon: <Scale className="h-6 w-6 text-[#ED6C02]" />,
      iconBg: "bg-[#FCEBE3]",
      badge: currentLang === "HI" ? "संयुक्त समन्वय" : "Statutory Authority",
      badgeTone: "saffron",
      actionText: t.cardJointProtocolBtn,
      onClick: onOpenRadar,
    },
    {
      id: "sla-analytics",
      category: "RADAR",
      title: t.cardAuditLedgerTitle,
      description: t.cardAuditLedgerDesc,
      icon: <ShieldCheck className="h-6 w-6 text-[#316444]" />,
      iconBg: "bg-[#EDF7F2]",
      badge: currentLang === "HI" ? "सुरक्षित एवं सत्यापित" : "Zero Tamper",
      badgeTone: "green",
      actionText: t.cardAuditLedgerBtn,
      onClick: onOpenAnalytics,
    },
  ];

  const renderBadge = (item: ServiceItem) => {
    if (!item.badge) return null;
    const toneMap = {
      blue: "bg-[#E2E1F3] text-[#0565D2] border-[#C5C3D8]",
      green: "bg-[#EDF7F2] text-[#316444] border-[#BFE0D2]",
      saffron: "bg-[#FCEBE3] text-[#ED6C02] border-[#EAD3A2]",
      red: "bg-[#FDECEC] text-[#C72E07] border-[#F0C5C0]",
      purple: "bg-[#EFEEF8] text-[#7158A9] border-[#C5C3D8]",
    };
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${toneMap[item.badgeTone || "blue"]}`}>
        {item.badge}
      </span>
    );
  };

  return (
    <div className="w-full space-y-10 font-sans">
      {/* ── Section 1: Citizen & Student Self-Services (UIDAI Card Grid) ── */}
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-[#DFDFE4] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-5 w-1.5 rounded-full bg-[#ED6C02]" />
              <h3 className="text-lg font-bold text-[#191636]">
                {t.servicesHubTitle}
              </h3>
            </div>
            <p className="mt-1 text-xs text-[#5A5971]">
              {t.servicesHubSubtitle}
            </p>
          </div>
          <span className="text-xs font-semibold text-[#0565D2] bg-[#E2E1F3] px-2.5 py-1 rounded-full border border-[#C5C3D8]">
            {t.instantSelfServiceBadge}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {citizenServices.map((item) => (
            <div
              key={item.id}
              onClick={item.onClick}
              className="group flex flex-col justify-between rounded-2xl border border-[#DFDFE4] bg-white p-5 shadow-sm hover:border-[#0565D2] hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden"
            >
              {/* Top border colored bar on hover */}
              <div className="absolute top-0 inset-x-0 h-1 bg-[#0565D2] opacity-0 group-hover:opacity-100 transition-opacity" />

              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.iconBg} shadow-inner shrink-0 group-hover:scale-105 transition-transform`}>
                    {item.icon}
                  </div>
                  {renderBadge(item)}
                </div>

                <h4 className="text-base font-extrabold text-[#191636] group-hover:text-[#0565D2] transition-colors leading-snug mb-2">
                  {item.title}
                </h4>
                <p className="text-xs text-[#5A5971] leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#EFEEF8] flex items-center justify-between">
                <span className="text-xs font-bold text-[#0565D2] group-hover:underline">
                  {item.actionText}
                </span>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E2E1F3] text-[#0565D2] group-hover:bg-[#0565D2] group-hover:text-white transition-colors">
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 2: Flagship Collision Radar & AI Intelligence (PS 26264) ── */}
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-[#DFDFE4] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-5 w-1.5 rounded-full bg-[#C72E07]" />
              <h3 className="text-lg font-bold text-[#191636]">
                {t.radarSectionTitle}
              </h3>
            </div>
            <p className="mt-1 text-xs text-[#5A5971]">
              {t.radarSectionSubtitle}
            </p>
          </div>
          <span className="text-xs font-black text-[#C72E07] bg-[#FDECEC] px-2.5 py-1 rounded-full border border-[#F0C5C0] flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#C72E07] animate-ping" />
            {t.radarSectionBadge}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {radarServices.map((item) => (
            <div
              key={item.id}
              onClick={item.onClick}
              className="group flex flex-col justify-between rounded-2xl border border-[#DFDFE4] bg-white p-5 shadow-sm hover:border-[#ED6C02] hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden"
            >
              {/* Top border colored bar on hover */}
              <div className="absolute top-0 inset-x-0 h-1 bg-[#ED6C02] opacity-0 group-hover:opacity-100 transition-opacity" />

              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.iconBg} shadow-inner shrink-0 group-hover:scale-105 transition-transform`}>
                    {item.icon}
                  </div>
                  {renderBadge(item)}
                </div>

                <h4 className="text-base font-extrabold text-[#191636] group-hover:text-[#ED6C02] transition-colors leading-snug mb-2">
                  {item.title}
                </h4>
                <p className="text-xs text-[#5A5971] leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#EFEEF8] flex items-center justify-between">
                <span className="text-xs font-bold text-[#ED6C02] group-hover:underline">
                  {item.actionText}
                </span>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FCEBE3] text-[#ED6C02] group-hover:bg-[#ED6C02] group-hover:text-white transition-colors">
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 3: National Ecosystem Saturation Metrics (UIDAI Official Style) ── */}
      <div className="rounded-3xl border border-[#DFDFE4] bg-white text-[#191636] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[#DFDFE4]">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#ED6C02] px-2.5 py-0.5 text-[10px] font-extrabold text-white uppercase tracking-wider">
                {currentLang === "HI" ? "पारदर्शिता लेजर" : "TRANSPARENCY LEDGER"}
              </span>
              <h4 className="text-lg font-bold text-[#191636]">
                {t.transparencyTitle}
              </h4>
            </div>
            <p className="text-xs text-[#5A5971] mt-0.5">
              {t.transparencySubtitle}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#316444] bg-[#EDF7F2] border border-[#316444]/25 px-3 py-1 rounded-full">
            <span className="h-2 w-2 rounded-full bg-[#316444]" />
            <span>{t.serverStatusBadge}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
          <div className="rounded-2xl bg-[#F8FAFD] p-3.5 border border-[#DFDFE4]">
            <div className="text-2xl font-black text-[#191636] font-mono">10,480+</div>
            <div className="text-[11px] font-bold text-[#191636] mt-1">{t.metricCollegesTitle}</div>
            <div className="text-[10px] text-[#5A5971]">{t.metricCollegesSub}</div>
          </div>

          <div className="rounded-2xl bg-[#F8FAFD] p-3.5 border border-[#DFDFE4]">
            <div className="text-2xl font-black text-[#0565D2] font-mono">6.85M+</div>
            <div className="text-[11px] font-bold text-[#191636] mt-1">{t.metricStudentsTitle}</div>
            <div className="text-[10px] text-[#5A5971]">{t.metricStudentsSub}</div>
          </div>

          <div className="rounded-2xl bg-[#F8FAFD] p-3.5 border border-[#DFDFE4]">
            <div className="text-2xl font-black text-[#316444] font-mono">94.8%</div>
            <div className="text-[11px] font-bold text-[#191636] mt-1">{t.metricRedressalTitle}</div>
            <div className="text-[10px] text-[#5A5971]">{t.metricRedressalSub}</div>
          </div>

          <div className="rounded-2xl bg-[#F8FAFD] p-3.5 border border-[#DFDFE4]">
            <div className="text-2xl font-black text-[#ED6C02] font-mono">7.4 Days</div>
            <div className="text-[11px] font-bold text-[#191636] mt-1">{t.metricAvgTimeTitle}</div>
            <div className="text-[10px] text-[#5A5971]">{t.metricAvgTimeSub}</div>
          </div>

          <div className="rounded-2xl bg-[#F8FAFD] p-3.5 border border-[#DFDFE4]">
            <div className="text-2xl font-black text-[#191636] font-mono">100%</div>
            <div className="text-[11px] font-bold text-[#191636] mt-1">{t.metricCollisionsTitle}</div>
            <div className="text-[10px] text-[#5A5971]">{t.metricCollisionsSub}</div>
          </div>

          <div className="rounded-2xl bg-[#F8FAFD] p-3.5 border border-[#DFDFE4]">
            <div className="text-2xl font-black text-[#2F2B69] font-mono">SHA-256</div>
            <div className="text-[11px] font-bold text-[#191636] mt-1">{t.metricAuditTitle}</div>
            <div className="text-[10px] text-[#5A5971]">{t.metricAuditSub}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
