"use client";
import React from "react";
import {
  ShieldCheck, Phone, Mail, MapPin, ExternalLink,
  Lock, Globe, Award, CheckCircle2, Heart
} from "lucide-react";
import { NationalEmblemSvg, IndianFlagBadge } from "@/components/sugam/uidai-header";

export function UidaiFooter() {
  return (
    <footer className="w-full font-sans text-white">
      {/* ── Top Tricolor Accent Strip ── */}
      <div className="tricolor-strip" />

      {/* ── Main Government Portal Footer (UIDAI Dark Navy #191636 / #14122C) ── */}
      <div className="bg-[#191636] pt-12 pb-8 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Column 1: AICTE Official Identity & Mission */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <NationalEmblemSvg className="h-12 w-auto text-white/90" />
                <div className="leading-tight">
                  <div className="text-sm font-extrabold text-white">
                    अखिल भारतीय तकनीकी शिक्षा परिषद
                  </div>
                  <div className="text-xs font-bold text-white/80">
                    ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
                  </div>
                  <div className="text-[10px] text-amber-400 font-semibold mt-0.5">
                    Ministry of Education, Govt of India
                  </div>
                </div>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                SUGAM (Single Unified Gateway for AICTE Management) is the central regulatory intelligence and public grievance redressal portal of the All India Council for Technical Education.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-white/80">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>SHA-256 Hash-Linked Case Audit Ledger</span>
              </div>
            </div>

            {/* Column 2: Citizen & Student Self-Services */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-3.5 pb-1 border-b border-white/10 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Citizen &amp; Student Services
              </h4>
              <ul className="space-y-2 text-xs text-white/75">
                <li>
                  <a href="#" className="hover:text-white hover:underline flex items-center justify-between">
                    <span>Lodge Online Complaint / Grievance</span>
                    <span className="text-[10px] text-white/40">→</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline flex items-center justify-between">
                    <span>Track Complaint Status by Case ID</span>
                    <span className="text-[10px] text-white/40">→</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline flex items-center justify-between">
                    <span>Fee Refund &amp; Document Retention Rules</span>
                    <span className="text-[10px] text-white/40">→</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline flex items-center justify-between">
                    <span>Whistleblower &amp; Anti-Retaliation Charter</span>
                    <span className="text-[10px] text-white/40">→</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline flex items-center justify-between">
                    <span>Download AICTE Regulatory Directives</span>
                    <span className="text-[10px] text-white/40">→</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline flex items-center justify-between">
                    <span>National Scholarship Portal (PMSSS / Pragati)</span>
                    <span className="text-[10px] text-white/40">↗</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: AICTE Regulatory Bureaus & Collision Prevention */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-3.5 pb-1 border-b border-white/10 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Bureaus &amp; Statutory Cells
              </h4>
              <ul className="space-y-2 text-xs text-white/75">
                <li>
                  <a href="#" className="hover:text-white hover:underline flex items-center justify-between">
                    <span>Regulation Bureau (RB) — Central Oversight</span>
                    <span className="text-[10px] text-white/40">→</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline flex items-center justify-between">
                    <span>Public Grievance Redressal Cell (PGRC)</span>
                    <span className="text-[10px] text-white/40">→</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline flex items-center justify-between">
                    <span>Approval Bureau &amp; Annual Process Handbook</span>
                    <span className="text-[10px] text-white/40">→</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline flex items-center justify-between">
                    <span>Multi-Bureau Collision Radar Visualizer</span>
                    <span className="text-[10px] text-red-400 font-bold">LIVE</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline flex items-center justify-between">
                    <span>National Faculty Registry & Duplication Engine</span>
                    <span className="text-[10px] text-white/40">→</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline flex items-center justify-between">
                    <span>Statutory 30-Day Escalation Matrix</span>
                    <span className="text-[10px] text-white/40">→</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact, Address & Support Helpdesk */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-3.5 pb-1 border-b border-white/10 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Headquarters &amp; Helpdesk
              </h4>
              <div className="space-y-2.5 text-xs text-white/75">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    All India Council for Technical Education, Nelson Mandela Marg, Vasant Kunj, New Delhi-110070
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#0565D2] shrink-0" />
                  <span>Toll Free: <strong>1800-11-2246</strong> (09:30 AM - 05:30 PM)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Email: grievance@aicte-india.org</span>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="text-[10px] font-bold text-white/60 uppercase">
                    Portal Security &amp; Compliance
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-white/80">
                    <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">
                      TLS 1.3
                    </span>
                    <span>ISO 27001 Certified · GIGW Compliant</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Legal Links (UIDAI Standard) */}
          <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-white/60">
            <div className="flex flex-wrap items-center gap-4">
              <a href="#" className="hover:text-white transition">Terms of Use</a>
              <span>·</span>
              <a href="#" className="hover:text-white transition">Privacy Policy</a>
              <span>·</span>
              <a href="#" className="hover:text-white transition">Hyperlinking Policy</a>
              <span>·</span>
              <a href="#" className="hover:text-white transition">Copyright Policy</a>
              <span>·</span>
              <a href="#" className="hover:text-white transition">Accessibility Statement</a>
              <span>·</span>
              <a href="#" className="hover:text-white transition">Help &amp; FAQs</a>
            </div>

            <div className="flex items-center gap-2 text-white/70">
              <IndianFlagBadge />
              <span>Digital India · Atmanirbhar Bharat Initiative</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-Footer: NIC & Digital India Attribution (UIDAI #14122C) ── */}
      <div className="bg-[#14122C] py-4 text-[11px] text-white/60 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p>
              Website Content Owned &amp; Managed by <strong>All India Council for Technical Education (AICTE)</strong>, Ministry of Education, Government of India.
            </p>
            <p className="text-[10px] text-white/50 mt-0.5">
              Designed, Developed &amp; Maintained in collaboration with <strong>National Informatics Centre (NIC)</strong>, Government of India.
            </p>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="text-[10px] text-white/50">Total Portal Visitors</div>
              <div className="font-mono text-xs font-bold text-amber-300">2,841,920</div>
            </div>
            <div className="h-6 w-[1px] bg-white/20" />
            <div>
              <div className="text-[10px] text-white/50">Version &amp; Status</div>
              <div className="font-mono text-[10px] font-bold text-emerald-400">v2.4 Sovereign · OPERATIONAL</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
