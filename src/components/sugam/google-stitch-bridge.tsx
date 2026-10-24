"use client";
import React, { useState } from "react";
import {
  Sparkles, Layers, Cpu, Palette, Copy, Check, ExternalLink,
  Code2, RefreshCw, Zap, Shield, ArrowUpRight, Sliders, Eye
} from "lucide-react";

export type StitchTheme = "stitch-obsidian" | "stitch-titanium" | "aicte-sovereign";

export interface GoogleStitchBridgeProps {
  currentTheme: StitchTheme;
  onThemeChange: (theme: StitchTheme) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function GoogleStitchBridgeModal({
  currentTheme,
  onThemeChange,
  isOpen,
  onClose,
}: GoogleStitchBridgeProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tokens" | "prompt" | "schema" | "blueprint">("prompt");

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const stitchPrompt = `Create an ultra-advanced AICTE (All India Council for Technical Education) Multi-Bureau Command Center & Case Collision Prevention System for SIH Problem Statement 26264.

Key Design Directives:
1. Top-tier National Command Center aesthetic with live telemetry, server ping, and SHA-256 audit ledger pulse.
2. Interactive SVG Collision Radar Visualizer tracking parallel proceedings against colleges across Regulation Bureau (RB), PGRC, Approval Bureau, and Scholarship Cell.
3. Automated Inter-Bureau Joint Coordination protocol with unified show-cause notice synthesis.
4. Executive KPI matrix featuring animated trend sparklines, disposal velocity, and statutory 30-day SLA countdown.
5. Institution 360° profile directory with accreditation badges (NAAC A++, NIRF), risk indexing, and multi-bureau dispute history.
6. Responsive typography, frosted glassmorphism (backdrop-blur-xl), subtle border gradients, and high-contrast accessibility compliance.`;

  const designTokens = {
    system: "Google Stitch Design System · Material 3 Expressive",
    version: "2.4.0-Labs-Gemini",
    themes: {
      "stitch-obsidian": {
        name: "Google Stitch Obsidian Neon",
        background: "#030712",
        surface: "#0B132B",
        accent: "#06B6D4",
        accentSecondary: "#F59E0B",
        border: "rgba(255, 255, 255, 0.08)",
        glass: "backdrop-blur-xl bg-slate-950/80",
        vibe: "High-Tech Cybernetic Command",
      },
      "stitch-titanium": {
        name: "Google Stitch Hyper-Clean Titanium",
        background: "#F8FAFC",
        surface: "#FFFFFF",
        accent: "#2563EB",
        accentSecondary: "#D97706",
        border: "#E2E8F0",
        glass: "backdrop-blur-md bg-white/90",
        vibe: "Minimalist Modern Lab",
      },
      "aicte-sovereign": {
        name: "AICTE Sovereign Saffron & Navy",
        background: "#0F1E36",
        surface: "#17324D",
        accent: "#F59E0B",
        accentSecondary: "#10B981",
        border: "rgba(245, 158, 11, 0.25)",
        glass: "backdrop-blur-xl bg-[#17324D]/90",
        vibe: "Official Government High-Command",
      },
    },
    typography: {
      fontFamilySans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontFamilyMono: "JetBrains Mono, ui-monospace, Menlo, Monaco, monospace",
      headingScale: "1.25 (Major Third)",
    },
    telemetry: {
      refreshIntervalMs: 5000,
      radarSweepPeriodSec: 4,
      alertGlowDurationMs: 1500,
    },
  };

  const stitchBlueprintJson = JSON.stringify(
    {
      component: "AicteCommandCenter",
      stitchEngine: "Google Labs Stitch Studio",
      connectedModel: "Gemini 2.5 Flash Multimodal Design",
      problemStatement: "SIH-2026-PS26264",
      activeTheme: currentTheme,
      layoutNodes: [
        { id: "telemetry_banner", type: "live_hud", latencyMs: 14, status: "SYNCED" },
        { id: "collision_radar", type: "svg_orbital_network", activeCollisions: 1 },
        { id: "kpi_ribbon", type: "sparkline_metric_grid", metricCount: 6 },
        { id: "bureau_register", type: "triage_data_grid", defaultSort: "priority_desc" },
        { id: "institution_360", type: "risk_profile_explorer", pidLookup: true },
        { id: "joint_order_synth", type: "directive_generator", statutoryAuthority: "AICTE Act 1987" }
      ],
      tokens: designTokens
    },
    null,
    2
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-3xl border border-white/20 bg-slate-950 text-white shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header */}
        <div className="relative border-b border-white/10 bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-wide text-white">
                    Google Stitch AI Design Studio
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 px-2.5 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                    LIVE BRIDGE CONNECTED
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Google Labs Prototyping &amp; Design Architecture for AICTE National Command Center (PS 26264)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://stitch.withgoogle.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
                title="Launch Google Stitch in new tab"
              >
                <span>Launch Stitch Labs</span>
                <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
              </a>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Theme Quick Switcher in Header */}
          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/80 p-3 backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Palette className="h-4 w-4 text-cyan-400" />
                <span>Active Stitch Design Vibe:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onThemeChange("stitch-obsidian")}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    currentTheme === "stitch-obsidian"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 scale-102"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-white/10"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span>Stitch Obsidian Neon</span>
                </button>
                <button
                  onClick={() => onThemeChange("stitch-titanium")}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    currentTheme === "stitch-titanium"
                      ? "bg-white text-slate-900 shadow-md scale-102 font-extrabold"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-white/10"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>Stitch Titanium Light</span>
                </button>
                <button
                  onClick={() => onThemeChange("aicte-sovereign")}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    currentTheme === "aicte-sovereign"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/30 scale-102"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-white/10"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span>National Sovereign</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-slate-900/60 px-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab("prompt")}
            className={`border-b-2 py-3 px-4 transition ${
              activeTab === "prompt"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Generative Stitch Prompt
          </button>
          <button
            onClick={() => setActiveTab("tokens")}
            className={`border-b-2 py-3 px-4 transition ${
              activeTab === "tokens"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Design Tokens &amp; Palette
          </button>
          <button
            onClick={() => setActiveTab("blueprint")}
            className={`border-b-2 py-3 px-4 transition ${
              activeTab === "blueprint"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Stitch Export Blueprint (JSON)
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === "prompt" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Gemini Multimodal Stitch Prompt</h4>
                  <p className="text-xs text-slate-400">
                    The prompt used to synthesize this mission-critical AICTE command center interface.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(stitchPrompt, "prompt")}
                  className="flex items-center gap-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 transition"
                >
                  {copied === "prompt" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied === "prompt" ? "Copied Prompt!" : "Copy Prompt"}</span>
                </button>
              </div>

              <div className="relative rounded-2xl border border-white/10 bg-slate-900 p-4 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {stitchPrompt}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Visual Engine</div>
                  <div className="text-xs font-extrabold text-cyan-400 mt-0.5">Google Stitch Canvas 2.4</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Underlying Model</div>
                  <div className="text-xs font-extrabold text-indigo-400 mt-0.5">Gemini 2.5 Multimodal UI</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400">SIH Benchmark</div>
                  <div className="text-xs font-extrabold text-amber-400 mt-0.5">Problem Statement 26264</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tokens" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Stitch Design Tokens</h4>
                  <p className="text-xs text-slate-400">
                    Live variables configuring surfaces, radii, colors, and motion cadence.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(designTokens, null, 2), "tokens")}
                  className="flex items-center gap-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 transition"
                >
                  {copied === "tokens" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied === "tokens" ? "Copied Tokens!" : "Copy Tokens"}</span>
                </button>
              </div>

              {/* Swatches */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Object.entries(designTokens.themes).map(([key, t]) => (
                  <div
                    key={key}
                    onClick={() => onThemeChange(key as StitchTheme)}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                      currentTheme === key
                        ? "border-cyan-400 bg-slate-800/90 ring-2 ring-cyan-400/30 shadow-lg"
                        : "border-white/10 bg-slate-900/60 hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{t.name}</span>
                      {currentTheme === key && (
                        <span className="rounded-full bg-cyan-500 px-2 py-0.5 text-[9px] font-black text-slate-950 uppercase">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">{t.vibe}</div>

                    <div className="mt-4 flex items-center gap-2">
                      <div
                        className="h-6 w-6 rounded-lg border border-white/20 shadow-sm"
                        style={{ backgroundColor: t.background }}
                        title="Background"
                      />
                      <div
                        className="h-6 w-6 rounded-lg border border-white/20 shadow-sm"
                        style={{ backgroundColor: t.surface }}
                        title="Surface"
                      />
                      <div
                        className="h-6 w-6 rounded-lg border border-white/20 shadow-sm"
                        style={{ backgroundColor: t.accent }}
                        title="Primary Accent"
                      />
                      <div
                        className="h-6 w-6 rounded-lg border border-white/20 shadow-sm"
                        style={{ backgroundColor: t.accentSecondary }}
                        title="Secondary Accent"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900 p-4 font-mono text-xs text-cyan-300">
                <pre>{JSON.stringify(designTokens, null, 2)}</pre>
              </div>
            </div>
          )}

          {activeTab === "blueprint" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Stitch JSON Component Blueprint</h4>
                  <p className="text-xs text-slate-400">
                    Export schema ready for import into Google Stitch Labs or Google AI Studio.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(stitchBlueprintJson, "blueprint")}
                  className="flex items-center gap-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 transition"
                >
                  {copied === "blueprint" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied === "blueprint" ? "Copied Blueprint!" : "Copy Blueprint"}</span>
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900 p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[350px]">
                <pre>{stitchBlueprintJson}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-white/10 bg-slate-900/80 px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Cpu className="h-4 w-4 text-cyan-400" />
            <span>AICTE-SUGAM Engine synchronized with Google Stitch Canvas</span>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-white/10 px-5 py-2 font-bold text-white hover:bg-white/20 transition"
          >
            Close Stitch Studio
          </button>
        </div>
      </div>
    </div>
  );
}
