"use client";
import React, { useState } from "react";
import {
  Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Bot,
  FileCheck, Shield, ChevronDown, ChevronUp, Copy, Check, Zap
} from "lucide-react";

export function AiDirectiveCopilot({
  activeOverlap,
  onOpenDirectivePreview,
}: {
  activeOverlap?: {
    institutionName: string;
    institutionCode: string;
    cases: Array<{ id: string; caseNumber: string; bureau: string | null; subject: string }>;
  } | null;
  onOpenDirectivePreview: () => void;
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<"synthesis" | "sla" | "root-cause">("synthesis");
  const [copied, setCopied] = useState(false);

  const collegeName = activeOverlap?.institutionName ?? "Sunrise Institute of Technology";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-3xl border border-[#DFDFE4] bg-white p-6 text-[#191636] shadow-sm relative overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFEEF8] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E2E1F3] text-[#0565D2] font-black shadow-inner">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm uppercase tracking-wide text-[#191636]">
                AICTE Regulatory Intelligence Harmonizer
              </span>
              <span className="rounded-full bg-[#EDF7F2] border border-[#316444]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#316444]">
                AUTOMATED SYNTHESIS
              </span>
            </div>
            <p className="text-xs text-[#5A5971]">
              Automated multi-bureau de-duplication, inter-cell conflict analysis, and unified directive synthesis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setAnalyzing(true);
              setTimeout(() => setAnalyzing(false), 800);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-[#DFDFE4] bg-[#F8FAFD] px-3.5 py-2 text-xs font-bold text-[#0565D2] hover:bg-[#E2E1F3] transition shadow-xs"
          >
            <Zap className={`h-3.5 w-3.5 ${analyzing ? "animate-spin text-[#ED6C02]" : "text-[#0565D2]"}`} />
            <span>{analyzing ? "Synthesizing Directives..." : "Refresh Intelligence Analysis"}</span>
          </button>
        </div>
      </div>

      {/* Feature Selector Tabs */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 text-xs font-bold">
        <button
          onClick={() => setActiveAnalysis("synthesis")}
          className={`rounded-xl px-4 py-2 transition ${
            activeAnalysis === "synthesis"
              ? "bg-[#0565D2] text-white font-extrabold shadow-sm"
              : "bg-[#F4F6F9] text-[#5A5971] hover:bg-[#EFEEF8] hover:text-[#191636]"
          }`}
        >
          ⚡ Harmonized Directive Synthesis
        </button>
        <button
          onClick={() => setActiveAnalysis("sla")}
          className={`rounded-xl px-4 py-2 transition ${
            activeAnalysis === "sla"
              ? "bg-[#0565D2] text-white font-extrabold shadow-sm"
              : "bg-[#F4F6F9] text-[#5A5971] hover:bg-[#EFEEF8] hover:text-[#191636]"
          }`}
        >
          ⏱️ Statutory 30-Day SLA Timeline
        </button>
        <button
          onClick={() => setActiveAnalysis("root-cause")}
          className={`rounded-xl px-4 py-2 transition ${
            activeAnalysis === "root-cause"
              ? "bg-[#0565D2] text-white font-extrabold shadow-sm"
              : "bg-[#F4F6F9] text-[#5A5971] hover:bg-[#EFEEF8] hover:text-[#191636]"
          }`}
        >
          🔍 Systemic Institutional Analysis
        </button>
      </div>

      {/* Analysis Content Body */}
      <div className="mt-4 rounded-2xl border border-[#DFDFE4] bg-[#F8FAFD] p-5">
        {activeAnalysis === "synthesis" && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EDF7F2] text-[#316444] text-xs font-bold border border-[#BFE0D2]">
                  ✓
                </span>
                <span className="text-sm font-extrabold text-[#191636]">
                  Cross-Bureau Conflict Intercepted for {collegeName}
                </span>
              </div>
              <button
                onClick={() =>
                  handleCopy(
                    `AICTE Automated Joint Directive for ${collegeName}: Regulation Bureau and PGRC joint inquiry synthesized under Section 10(p) of the AICTE Act 1987.`
                  )
                }
                className="text-xs font-bold text-[#0565D2] hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-[#316444]" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied to Clipboard" : "Copy Directive Draft"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
                <div className="font-extrabold text-[#C72E07] uppercase text-[10px] tracking-wider">Regulation Bureau File (RB)</div>
                <div className="mt-1 font-bold text-[#191636]">Charge: Capitation fee overcharge of ₹15,00,000</div>
                <div className="text-[11px] text-[#5A5971] mt-1">Status: Notice Dispatched · Inspection scheduled 28 Oct</div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                <div className="font-extrabold text-[#0565D2] uppercase text-[10px] tracking-wider">Public Grievance Redressal Cell (PGRC)</div>
                <div className="mt-1 font-bold text-[#191636]">Charge: Original marksheet withholding by college registrar</div>
                <div className="text-[11px] text-[#5A5971] mt-1">Status: Student Redressal hearing scheduled 30 Oct</div>
              </div>
            </div>

            <div className="rounded-xl border border-[#C5C3D8] bg-white p-4 text-xs shadow-xs">
              <div className="flex items-center gap-2 font-bold text-[#0565D2]">
                <Sparkles className="h-4 w-4 text-[#ED6C02]" />
                <span className="font-extrabold text-[#191636]">Synthesized Joint AICTE Action Directive:</span>
              </div>
              <p className="mt-2 text-[#5A5971] leading-relaxed text-xs">
                <strong>Single-Window Order:</strong> Merged independent proceedings into a single joint regulatory committee hearing at the AICTE Regional Office on <strong>28 October 2026, 11:00 AM</strong>. College management is summoned to produce original student documents and fee reconciliation registers simultaneously. Conflicting orders eliminated.
              </p>
              <div className="mt-4 flex items-center justify-end">
                <button
                  onClick={onOpenDirectivePreview}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ED6C02] to-[#FF9933] px-4 py-2 text-xs font-black text-slate-950 shadow-sm hover:brightness-105 transition"
                >
                  <FileCheck className="h-4 w-4" />
                  <span>Preview &amp; Dispatch Joint Order Letterhead</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeAnalysis === "sla" && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm text-[#191636]">Statutory 30-Day SLA Horizon</span>
              <span className="font-mono text-xs text-[#316444] font-bold bg-[#EDF7F2] px-2.5 py-0.5 rounded-full border border-[#BFE0D2]">Zero Delays Policy</span>
            </div>
            <p className="text-[#5A5971] text-xs leading-relaxed">
              Under the AICTE Citizen Charter, all grievances must be resolved within 30 statutory days. Parallel uncoordinated cases historically take an average of 42.6 days due to inter-departmental transfers.
            </p>
            <div className="grid grid-cols-3 gap-3 text-center pt-1">
              <div className="rounded-xl bg-white p-3.5 border border-red-200 shadow-xs">
                <div className="text-[10px] text-[#C72E07] font-bold uppercase">Isolated Filing</div>
                <div className="text-xl font-black text-[#C72E07] mt-0.5">42 Days</div>
                <div className="text-[10px] text-[#C72E07]/80">Breaches SLA</div>
              </div>
              <div className="rounded-xl bg-white p-3.5 border border-[#BFE0D2] shadow-xs">
                <div className="text-[10px] text-[#316444] font-bold uppercase">With SUGAM Protocol</div>
                <div className="text-xl font-black text-[#316444] mt-0.5">14 Days</div>
                <div className="text-[10px] text-[#316444]">Statutory Compliant (66% faster)</div>
              </div>
              <div className="rounded-xl bg-white p-3.5 border border-[#EAD3A2] shadow-xs">
                <div className="text-[10px] text-[#ED6C02] font-bold uppercase">Time Conserved</div>
                <div className="text-xl font-black text-[#ED6C02] mt-0.5">18 Man-Hours</div>
                <div className="text-[10px] text-[#5A5971]">Zero duplicate hearings</div>
              </div>
            </div>
          </div>
        )}

        {activeAnalysis === "root-cause" && (
          <div className="space-y-3 text-xs">
            <div className="font-extrabold text-sm text-[#191636]">Systemic Institutional Pattern</div>
            <p className="text-xs text-[#5A5971] leading-relaxed">
              Cross-case analytics reveal that <strong>fee disputes and certificate withholding are causally linked in 78% of reported incidents</strong>. When parents dispute unexpected fee hikes, colleges retaliate by withholding degree certificates.
            </p>
            <div className="rounded-xl bg-[#FCEBE3] border border-[#EAD3A2] p-3 text-xs text-[#ED6C02]">
              💡 <strong>AICTE HQ Policy Directive:</strong> Mandatory integration of institution clearance with student digital certificate lockers (DigiLocker) to prevent certificate retention.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
