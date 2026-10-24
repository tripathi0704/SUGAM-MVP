"use client";
import React, { useState } from "react";
import {
  GitMerge, ShieldAlert, Building2, AlertTriangle, ArrowRight,
  FileText, CheckCircle2, Eye, ShieldCheck, Zap, Radio, Sparkles,
  Layers, RefreshCw, ChevronRight, Info, Scale, Clock
} from "lucide-react";
import { OfficialDirectiveModal } from "@/components/sugam/official-directive-modal";

export function CollisionRadarVisualizer({
  onOpenCase,
  onOpen360,
  onCoordinate,
  activeOverlap,
}: {
  onOpenCase: (id: string) => void;
  onOpen360: (id: string) => void;
  onCoordinate: () => void;
  activeOverlap?: any;
}) {
  const rbCaseId = activeOverlap?.cases?.find((c: any) => c.bureau === "REGULATION_BUREAU")?.id || activeOverlap?.cases?.[0]?.id;
  const pgrcCaseId = activeOverlap?.cases?.find((c: any) => c.bureau === "PGRC")?.id || activeOverlap?.cases?.[1]?.id;
  const instId = activeOverlap?.institutionId || "inst-1";

  const [showDirective, setShowDirective] = useState(false);
  const [activeTab, setActiveTab] = useState<"visual" | "matrix" | "simulation">("visual");
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [simulating, setSimulating] = useState<boolean>(false);

  const startSimulation = () => {
    setSimulating(true);
    setSimulationStep(1);
    setTimeout(() => setSimulationStep(2), 1200);
    setTimeout(() => setSimulationStep(3), 2400);
    setTimeout(() => {
      setSimulationStep(4);
      setSimulating(false);
    }, 3600);
  };

  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-[#DFDFE4] bg-white text-[#191636] shadow-sm relative">
        {/* Radar Header (UIDAI Deep Navy) */}
        <div className="border-b border-white/10 bg-[#191636] px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#FF9933] font-extrabold shadow-inner border border-white/15">
              <Radio className="h-6 w-6 animate-pulse text-[#FF9933]" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-wide text-white">
                  Multi-Bureau Collision Radar · Real-Time De-duplication Engine
                </span>
                <span className="rounded-full bg-amber-400/20 border border-amber-400/40 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-300 tracking-wider">
                  STATUTORY REGULATORY DIRECTIVE
                </span>
              </div>
              <p className="text-xs text-white/80">
                Automated multi-jurisdiction conflict interception across AICTE specialized bureaus &amp; regional cells.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowDirective(true)}
              className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/20 transition shadow-sm"
            >
              <FileText className="h-3.5 w-3.5 text-amber-300" />
              <span>Preview Official Notice</span>
            </button>
            <button
              onClick={onCoordinate}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ED6C02] to-[#FF9933] px-4 py-2 text-xs font-black text-slate-950 shadow-md hover:brightness-105 transition active:scale-98"
            >
              <GitMerge className="h-3.5 w-3.5 text-slate-950" />
              <span>Establish Joint Protocol</span>
            </button>
          </div>
        </div>

        {/* View Switcher Sub-Bar */}
        <div className="flex border-b border-[#DFDFE4] bg-[#F8FAFD] px-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab("visual")}
            className={`border-b-2 py-3 px-4 transition ${
              activeTab === "visual"
                ? "border-[#0565D2] text-[#0565D2] bg-white font-extrabold"
                : "border-transparent text-[#5A5971] hover:text-[#191636]"
            }`}
          >
            Topological Radar Canvas
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`border-b-2 py-3 px-4 transition ${
              activeTab === "matrix"
                ? "border-[#0565D2] text-[#0565D2] bg-white font-extrabold"
                : "border-transparent text-[#5A5971] hover:text-[#191636]"
            }`}
          >
            Conflict Matrix &amp; Notice Diff
          </button>
          <button
            onClick={() => setActiveTab("simulation")}
            className={`flex items-center gap-1.5 border-b-2 py-3 px-4 transition ${
              activeTab === "simulation"
                ? "border-[#0565D2] text-[#0565D2] bg-white font-extrabold"
                : "border-transparent text-[#5A5971] hover:text-[#191636]"
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-[#ED6C02]" />
            <span>Resolution Lifecycle Flow</span>
          </button>
        </div>

        {/* ── TAB 1: VISUAL TOPOLOGY RADAR CANVAS ── */}
        {activeTab === "visual" && (
          <div className="relative p-6 sm:p-8 overflow-hidden bg-[#F4F6F9]">
            {/* Background grid pattern */}
            <div className="pointer-events-none absolute inset-0 opacity-25 bg-[radial-gradient(#0565D2_1px,transparent_1px)] [background-size:24px_24px]" />

            {/* Alert Callout Header */}
            <div className="relative z-10 mb-8 rounded-2xl border border-red-200 bg-red-50/80 p-4.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-[#C72E07] border border-red-200">
                  <AlertTriangle className="h-5 w-5 animate-bounce" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-[#C72E07] flex items-center gap-1.5">
                    <span>⚡ Active Cross-Bureau Collision Intercepted</span>
                    <span className="h-2 w-2 rounded-full bg-[#C72E07] animate-ping" />
                  </div>
                  <div className="text-sm font-bold text-[#191636] mt-0.5">
                    Parallel independent proceedings detected against <span className="text-[#0565D2] font-black underline">Sunrise Institute of Technology</span>.
                  </div>
                  <p className="text-xs text-[#5A5971] mt-0.5">
                    Without S.U.G.A.M. collision prevention, contradictory directives would be dispatched. The system has locked isolated dispatch and synchronized the docket.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-red-100 border border-red-200 px-3 py-1 font-mono text-xs font-extrabold text-[#C72E07]">
                  COORDINATION_REQUIRED
                </span>
              </div>
            </div>

            {/* Graphic Node Network */}
            <div className="relative z-10 grid gap-6 md:grid-cols-3 items-center">
              {/* NODE 1: REGULATION BUREAU */}
              <div className="rounded-2xl border-2 border-red-200 bg-white p-5 shadow-sm hover:border-red-400 transition-all group">
                <div className="flex items-center justify-between border-b border-red-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-xs font-extrabold uppercase tracking-wide text-[#C72E07]">
                      BUREAU 1: REGULATION BUREAU (RB)
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#5A5971] font-bold">JURISDICTION A</span>
                </div>

                <div className="mt-3">
                  <div className="font-mono text-xs font-bold text-[#0565D2]">Case #SUGAM-2026-0002</div>
                  <h4 className="mt-1 text-sm font-bold text-[#191636] group-hover:text-[#0565D2] transition leading-snug">
                    Investigation into Unapproved Capitation Fee &amp; Excess Tuition Surcharge
                  </h4>
                  <div className="mt-3.5 space-y-1.5 text-xs text-[#5A5971]">
                    <div className="flex justify-between">
                      <span className="text-[#5A5971]">Presiding Officer:</span>
                      <span className="font-bold text-[#191636]">Dr. V. K. Saxena</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5A5971]">Notice Dispatched:</span>
                      <span className="font-bold text-[#C72E07]">Show-Cause (₹15L Refund)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5A5971]">Hearing Date:</span>
                      <span className="font-mono text-[#ED6C02] font-bold">28 Oct 2026, 11:00 AM</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#EFEEF8] flex justify-between items-center">
                    <span className="text-[10px] font-mono text-[#5A5971]">AICTE Central Cell</span>
                    <button
                      onClick={() => rbCaseId && onOpenCase(rbCaseId)}
                      className="text-xs font-bold text-[#0565D2] hover:underline flex items-center gap-1"
                    >
                      <span>Inspect Dossier</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* NODE 2: CENTER TARGET INSTITUTION */}
              <div className="relative rounded-3xl border-2 border-[#ED6C02] bg-white p-6 text-center shadow-md">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FCEBE3] text-[#ED6C02] font-black text-2xl shadow-inner border border-[#EAD3A2]">
                  🏛️
                </div>

                <div className="mt-3">
                  <span className="rounded-full bg-[#E2E1F3] border border-[#C5C3D8] px-3 py-0.5 font-mono text-[10px] font-extrabold text-[#0565D2]">
                    AICTE PID: 1-938210491
                  </span>
                  <h3 className="mt-2 text-base font-extrabold text-[#191636]">
                    Sunrise Institute of Technology
                  </h3>
                  <p className="text-xs text-[#5A5971]">Western Region · Pune, Maharashtra</p>

                  <div className="mt-4 rounded-xl border border-[#DFDFE4] bg-[#F8FAFD] p-3 text-left text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#5A5971]">Collision State:</span>
                      <span className="font-bold text-[#C72E07]">LOCKED &amp; MERGED</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5A5971]">Conflicting Files:</span>
                      <span className="font-bold text-[#ED6C02]">2 Independent Cells</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5A5971]">Single-Window Notice:</span>
                      <span className="font-bold text-[#316444]">Directive Ready</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      onClick={() => onOpen360(instId)}
                      className="w-full rounded-xl border border-[#DFDFE4] bg-white py-2 text-xs font-bold text-[#191636] hover:bg-[#F0F4F8] transition"
                    >
                      Institution 360° Profile
                    </button>
                    <button
                      onClick={onCoordinate}
                      className="w-full rounded-xl bg-gradient-to-r from-[#ED6C02] to-[#FF9933] py-2 text-xs font-black text-slate-950 shadow hover:brightness-105 transition"
                    >
                      Synchronize Directives
                    </button>
                  </div>
                </div>
              </div>

              {/* NODE 3: PGRC (STUDENT GRIEVANCE CELL) */}
              <div className="rounded-2xl border-2 border-blue-200 bg-white p-5 shadow-sm hover:border-blue-400 transition-all group">
                <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-ping" />
                    <span className="text-xs font-extrabold uppercase tracking-wide text-[#0565D2]">
                      BUREAU 2: PGRC CELL
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#5A5971] font-bold">JURISDICTION B</span>
                </div>

                <div className="mt-3">
                  <div className="font-mono text-xs font-bold text-[#0565D2]">Case #SUGAM-2026-0001</div>
                  <h4 className="mt-1 text-sm font-bold text-[#191636] group-hover:text-[#0565D2] transition leading-snug">
                    Withholding of B.Tech 8th Sem Degree Marksheets &amp; Migration Certificate
                  </h4>
                  <div className="mt-3.5 space-y-1.5 text-xs text-[#5A5971]">
                    <div className="flex justify-between">
                      <span className="text-[#5A5971]">Presiding Officer:</span>
                      <span className="font-bold text-[#191636]">Suresh Verma</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5A5971]">Complainant:</span>
                      <span className="font-bold text-[#316444] font-mono">🔒 Complaint ID: SUGAM-2026-0001</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5A5971]">Hearing Date:</span>
                      <span className="font-mono text-[#ED6C02] font-bold">30 Oct 2026, 02:00 PM</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#EFEEF8] flex justify-between items-center">
                    <span className="text-[10px] font-mono text-[#5A5971]">PGRC Grievance Desk</span>
                    <button
                      onClick={() => pgrcCaseId && onOpenCase(pgrcCaseId)}
                      className="text-xs font-bold text-[#0565D2] hover:underline flex items-center gap-1"
                    >
                      <span>Inspect Dossier</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Status Ribbon */}
            <div className="mt-8 rounded-2xl border border-[#DFDFE4] bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-[#316444] shrink-0" />
                <div>
                  <div className="text-xs font-bold text-[#191636]">
                    S.U.G.A.M. Single-Window Order Active
                  </div>
                  <div className="text-xs text-[#5A5971]">
                    Instead of 2 separate conflicting hearings, the system has scheduled a <b>Joint Inquiry on 28 Oct 2026 at 11:00 AM</b>. Contradictory college penalties prevented.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDirective(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[#E2E1F3] px-4 py-2 text-xs font-bold text-[#0565D2] hover:bg-[#0565D2] hover:text-white transition"
              >
                <span>Preview Single-Window Directive (PDF)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 2: INTER-BUREAU CONFLICT MATRIX ── */}
        {activeTab === "matrix" && (
          <div className="p-6 sm:p-8 space-y-6 bg-white">
            <div className="rounded-2xl border border-[#DFDFE4] bg-[#F8FAFD] p-4">
              <h4 className="text-sm font-extrabold text-[#191636]">Direct Bureau Proceeding Comparison</h4>
              <p className="text-xs text-[#5A5971] mt-0.5">
                Side-by-side analysis showing why uncoordinated handling fails and how S.U.G.A.M. harmonizes it.
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#DFDFE4] bg-white">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#DFDFE4] bg-[#F8FAFD] text-[#5A5971] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-bold text-[#191636]">Parameter</th>
                    <th className="px-4 py-3 font-bold text-[#C72E07]">Regulation Bureau (Isolated)</th>
                    <th className="px-4 py-3 font-bold text-[#0565D2]">PGRC Cell (Isolated)</th>
                    <th className="px-4 py-3 font-bold text-[#316444]">S.U.G.A.M. Harmonized Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEEF8] text-[#191636]">
                  <tr className="hover:bg-[#F8FAFD]">
                    <td className="px-4 py-3 font-bold text-[#191636]">Primary Allegation</td>
                    <td className="px-4 py-3 text-[#C72E07]">Capitation fee overcharge of ₹15,00,000</td>
                    <td className="px-4 py-3 text-[#0565D2]">Degree certificate &amp; marksheet withholding</td>
                    <td className="px-4 py-3 font-bold text-[#316444]">Comprehensive Inspection (Fees + Marksheet)</td>
                  </tr>
                  <tr className="hover:bg-[#F8FAFD]">
                    <td className="px-4 py-3 font-bold text-[#191636]">College Hearing Date</td>
                    <td className="px-4 py-3 font-mono text-[#ED6C02]">28 October 2026, 11:00 AM</td>
                    <td className="px-4 py-3 font-mono text-[#ED6C02]">30 October 2026, 02:00 PM</td>
                    <td className="px-4 py-3 font-mono font-bold text-[#316444]">Unified: 28 October 2026, 11:00 AM</td>
                  </tr>
                  <tr className="hover:bg-[#F8FAFD]">
                    <td className="px-4 py-3 font-bold text-[#191636]">Notice Dispatch Type</td>
                    <td className="px-4 py-3">Show Cause Notice F. No. AICTE/RB/094</td>
                    <td className="px-4 py-3">Grievance Summon F. No. AICTE/PGRC/112</td>
                    <td className="px-4 py-3 font-semibold text-[#316444]">Joint Statutory Directive F. No. AICTE/COORD/842</td>
                  </tr>
                  <tr className="hover:bg-[#F8FAFD]">
                    <td className="px-4 py-3 font-bold text-[#191636]">Statutory Authority</td>
                    <td className="px-4 py-3">AICTE Act 1987 Section 10(k)</td>
                    <td className="px-4 py-3">AICTE (Mechanism for Grievance Redressal) Reg. 2019</td>
                    <td className="px-4 py-3 font-semibold text-[#316444]">Section 10(k) + Reg. 2019 Combined Directive</td>
                  </tr>
                  <tr className="hover:bg-[#F8FAFD]">
                    <td className="px-4 py-3 font-bold text-[#191636]">Outcome Risk</td>
                    <td className="px-4 py-3 text-[#C72E07]">College claims duplicate inquiry in High Court</td>
                    <td className="px-4 py-3 text-[#C72E07]">College delays marksheet citing pending RB fee case</td>
                    <td className="px-4 py-3 font-bold text-[#316444]">Zero legal loopholes; immediate relief to student</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: RESOLUTION LIFECYCLE FLOW ── */}
        {activeTab === "simulation" && (
          <div className="p-6 sm:p-8 space-y-6 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#DFDFE4] bg-[#F8FAFD] p-5">
              <div>
                <h4 className="text-base font-extrabold text-[#191636]">Conflict Resolution Lifecycle Flow</h4>
                <p className="text-xs text-[#5A5971] mt-1 max-w-xl">
                  Simulate the automated regulatory pipeline when a student complaint is lodged while the Regulation Bureau is conducting an active financial audit.
                </p>
              </div>

              <button
                onClick={startSimulation}
                disabled={simulating}
                className="flex items-center gap-2 rounded-xl bg-[#0565D2] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-600 disabled:opacity-50 transition"
              >
                <Zap className={`h-4 w-4 ${simulating ? "animate-spin" : ""}`} />
                <span>{simulating ? "Executing Resolution Pipeline..." : "Execute Conflict Resolution Flow"}</span>
              </button>
            </div>

            {/* Stepper Display */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div
                className={`rounded-xl border p-4 transition-all ${
                  simulationStep >= 1
                    ? "border-emerald-300 bg-emerald-50 text-[#316444]"
                    : "border-[#DFDFE4] bg-[#F8FAFD] text-[#5A5971]"
                }`}
              >
                <div className="text-[10px] font-bold uppercase">Step 1</div>
                <div className="text-xs font-extrabold text-[#191636] mt-1">Complaint Received</div>
                <div className="text-xs mt-1 text-[#5A5971]">Student submits marksheet grievance on public portal.</div>
              </div>

              <div
                className={`rounded-xl border p-4 transition-all ${
                  simulationStep >= 2
                    ? "border-emerald-300 bg-emerald-50 text-[#316444]"
                    : "border-[#DFDFE4] bg-[#F8FAFD] text-[#5A5971]"
                }`}
              >
                <div className="text-[10px] font-bold uppercase">Step 2</div>
                <div className="text-xs font-extrabold text-[#191636] mt-1">PID Cross-Matching</div>
                <div className="text-xs mt-1 text-[#5A5971]">S.U.G.A.M. matches college name against AICTE PID 1-938210491.</div>
              </div>

              <div
                className={`rounded-xl border p-4 transition-all ${
                  simulationStep >= 3
                    ? "border-amber-300 bg-amber-50 text-[#ED6C02]"
                    : "border-[#DFDFE4] bg-[#F8FAFD] text-[#5A5971]"
                }`}
              >
                <div className="text-[10px] font-bold uppercase">Step 3</div>
                <div className="text-xs font-extrabold text-[#191636] mt-1">Collision Interception</div>
                <div className="text-xs mt-1 text-[#5A5971]">Active file in Regulation Bureau detected. Isolated notice halted.</div>
              </div>

              <div
                className={`rounded-xl border p-4 transition-all ${
                  simulationStep >= 4
                    ? "border-blue-300 bg-blue-50 text-[#0565D2] shadow-xs"
                    : "border-[#DFDFE4] bg-[#F8FAFD] text-[#5A5971]"
                }`}
              >
                <div className="text-[10px] font-bold uppercase">Step 4</div>
                <div className="text-xs font-extrabold text-[#191636] mt-1">Joint Directive Created</div>
                <div className="text-xs mt-1 text-[#5A5971]">Status set to COORDINATION_REQUIRED. Harmonized order drafted.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <OfficialDirectiveModal
        isOpen={showDirective}
        onClose={() => setShowDirective(false)}
        institutionName="Sunrise Institute of Technology"
        institutionPid="1-938210491"
        caseNumber="SUGAM-2026-0002"
        jointWith="PGRC / SUGAM-2026-0001"
      />
    </>
  );
}
