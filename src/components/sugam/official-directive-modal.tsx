"use client";
import React from "react";
import { X, Printer, CheckCircle2, ShieldCheck, Download, ExternalLink } from "lucide-react";

export function OfficialDirectiveModal({
  isOpen,
  onClose,
  institutionName = "Sunrise Institute of Technology",
  institutionPid = "1-938210491",
  caseNumber = "SUGAM-2026-0002",
  jointWith = "PGRC / SUGAM-2026-0001",
}: {
  isOpen: boolean;
  onClose: () => void;
  institutionName?: string;
  institutionPid?: string;
  caseNumber?: string;
  jointWith?: string;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-3 text-white">
          <div className="flex items-center gap-2">
            <span className="rounded bg-su-saffron px-2 py-0.5 text-[10px] font-extrabold uppercase text-su-navy">
              AICTE Official Order Preview
            </span>
            <span className="text-xs text-slate-300">Statutory Notice Generated under AICTE Act 1987 Section 10(k)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition"
              title="Print official document"
            >
              <Printer className="h-3.5 w-3.5" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Government Letterhead */}
        <div className="p-8 sm:p-10 text-slate-800 bg-[#FCFDFE]">
          {/* Official AICTE Emblem & Header */}
          <div className="border-b-2 border-slate-900 pb-5 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-su-navy to-su-blue text-white shadow font-extrabold text-2xl">
              🏛️
            </div>
            <h2 className="text-lg font-black tracking-wide text-slate-950 uppercase sm:text-xl">
              अखिल भारतीय तकनीकी शिक्षा परिषद
            </h2>
            <h3 className="text-sm font-bold tracking-wider text-su-navy uppercase sm:text-base">
              ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
            </h3>
            <p className="text-[11px] font-medium text-slate-600">
              (A Statutory Body of the Government of India · Ministry of Education)
            </p>
            <p className="text-[11px] text-slate-500">
              Nelson Mandela Marg, Vasant Kunj, New Delhi-110070 · Website: www.aicte-india.org
            </p>
          </div>

          {/* Reference & Date */}
          <div className="mt-4 flex flex-wrap items-center justify-between text-xs font-mono text-slate-700">
            <div>
              <span className="font-bold">F. No. AICTE/RB-PGRC/COORD/2026/0842</span>
            </div>
            <div>
              <span className="font-bold">Date of Issue:</span> 24 October 2026
            </div>
          </div>

          {/* Recipient */}
          <div className="mt-5 text-xs leading-relaxed text-slate-800">
            <div className="font-bold uppercase tracking-wider text-slate-600">To,</div>
            <div className="font-bold text-sm text-su-navy">The Chairman / Director / Principal</div>
            <div className="font-semibold">{institutionName}</div>
            <div className="font-mono text-slate-600">AICTE Permanent Institute ID: {institutionPid}</div>
            <div className="text-slate-600">Western Regional Office Jurisdiction · Pune, Maharashtra</div>
          </div>

          {/* Subject */}
          <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50/70 p-3.5 text-xs">
            <span className="font-bold uppercase tracking-wide text-amber-900">SUBJECT: </span>
            <span className="font-extrabold text-slate-900">
              CONSOLIDATED SHOW-CAUSE DIRECTIVE &amp; JOINT INQUIRY NOTICE UNDER SECTION 10(k) OF THE AICTE ACT, 1987
            </span>
            <div className="mt-1 font-mono text-[11px] text-amber-800">
              Synchronized Multi-Bureau Proceedings: Case Ref {caseNumber} (Regulation Bureau) &amp; {jointWith}
            </div>
          </div>

          {/* Body */}
          <div className="mt-5 space-y-3.5 text-xs leading-relaxed text-slate-700">
            <p>
              <b>1. Preamble &amp; Automatic Collision Detection:</b> S.U.G.A.M. Flagship Overlap Detection Interceptor identified that multiple specialized bureaus of AICTE received concurrent complaints against the above-captioned institution. In compliance with <i>AICTE Integrated Grievance Norms 2026 (PS 26264)</i>, these parallel proceedings have been merged into this Single-Window Unified Directive to ensure coordinated enforcement without conflicting notices.
            </p>

            <p>
              <b>2. Summary of Verified Grievance Matters:</b>
            </p>

            <div className="ml-3 space-y-2 rounded-lg border border-slate-200 bg-white p-3.5">
              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-700">A</span>
                <div>
                  <b className="text-slate-900">Regulation Bureau Docket ({caseNumber}):</b>
                  <p className="text-[11px] text-slate-600">
                    Grievance regarding unauthorized demand of ₹3,50,000 as Capitation Fee for B.Tech admission in violation of AICTE Approval Process Handbook (APH) Chapter VI.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-su-blue">B</span>
                <div>
                  <b className="text-slate-900">Public Grievance Cell (PGRC) Docket ({jointWith}):</b>
                  <p className="text-[11px] text-slate-600">
                    Unlawful withholding of original secondary and higher secondary certificates/marksheets of student petitioner under <b>Complaint ID: SUGAM-2026-0001</b> upon withdrawal application.
                  </p>
                </div>
              </div>
            </div>

            <p>
              <b>3. Directive &amp; Compliance Requirement:</b> The college management is hereby directed to show cause in writing within <b>seven (7) working days</b> of receipt of this notice, failing which a Joint Hearing of the Regulation Bureau and PGRC Review Committee shall be convened for consideration of reduction of approved intake or withdrawal of approval.
            </p>
          </div>

          {/* Signatures & Hash Seal */}
          <div className="mt-8 pt-5 border-t border-slate-200 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="font-mono text-[10px] font-bold uppercase text-emerald-800">
                  DIGITALLY SIGNED &amp; HASH-SEALED
                </span>
              </div>
              <div className="font-mono text-[9px] text-slate-400">
                SHA-256: 7f8a3d42c91b8e4f509a23c78e916a04...
              </div>
              <div className="text-[10px] text-slate-500">
                Verified on S.U.G.A.M. Central AICTE Bureau Ledger
              </div>
            </div>

            <div className="text-right">
              <div className="font-serif italic text-su-navy font-bold text-sm tracking-wide">
                Dr. V. K. Saxena
              </div>
              <div className="font-bold text-xs text-slate-900">Dr. V. K. Saxena</div>
              <div className="text-[11px] font-medium text-slate-600">Director, Regulation Bureau</div>
              <div className="text-[10px] text-slate-500">All India Council for Technical Education</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs">
          <span className="text-slate-500">
            AICTE Central Regulatory Registry · Single Unified Gateway for AICTE Management
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-su-navy px-4 py-2 font-bold text-white hover:bg-slate-900 transition"
          >
            Close Document
          </button>
        </div>
      </div>
    </div>
  );
}
