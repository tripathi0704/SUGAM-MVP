"use client";
import React, { useState, useEffect } from "react";
import {
  Eye, EyeOff, ShieldCheck, Lock, Loader2, ArrowRight, RefreshCw,
  UserCheck, Building2, HelpCircle, AlertCircle, CheckCircle2,
  Volume2, KeyRound, Smartphone, Landmark, GraduationCap, ShieldAlert
} from "lucide-react";
import { api } from "@/lib/client";
import { FieldError } from "@/components/sugam/ui-bits";
import { NationalEmblemSvg, IndianFlagBadge, AicteEmblemLogo } from "@/components/sugam/uidai-header";
import { UidaiFooter } from "@/components/sugam/uidai-footer";
import type { User } from "@/lib/types";
import { translations, SupportedLang } from "@/lib/i18n";

// Official Statutory Bureau Demo Sign-in Profiles
const STATUTORY_DEMO_PROFILES = [
  {
    roleType: "CITIZEN",
    name: "Aarav Sharma",
    roleLabel: "Student / Complainant",
    roleLabelHi: "छात्र / शिकायतकर्ता",
    email: "student@sugam.demo",
    rollNo: "SUN-STU-2026-0117",
    bureau: null,
    icon: "👤",
  },
  {
    roleType: "CITIZEN",
    name: "Dr. Meera Iyer",
    roleLabel: "Faculty Complainant",
    roleLabelHi: "संकाय शिकायतकर्ता",
    email: "faculty@sugam.demo",
    rollNo: "GV-FAC-0081",
    bureau: null,
    icon: "🎓",
  },
  {
    roleType: "OFFICIAL",
    name: "Dr. V. K. Saxena",
    roleLabel: "Director, Regulation Bureau (RB)",
    roleLabelHi: "निदेशक, विनियमन ब्यूरो (RB)",
    email: "rb@sugam.demo",
    bureau: "REGULATION_BUREAU",
    icon: "🏛️",
  },
  {
    roleType: "OFFICIAL",
    name: "Suresh Verma",
    roleLabel: "Section Officer, PGRC",
    roleLabelHi: "अनुभाग अधिकारी, पीजीआरसी",
    email: "pgrc@sugam.demo",
    bureau: "PGRC",
    icon: "📋",
  },
  {
    roleType: "OFFICIAL",
    name: "Dr. S. Nair",
    roleLabel: "Joint Director, Review Directorate",
    roleLabelHi: "संयुक्त निदेशक, समीक्षा निदेशालय",
    email: "reviewer@sugam.demo",
    bureau: "REGULATION_BUREAU",
    icon: "🔍",
  },
  {
    roleType: "OFFICIAL",
    name: "Prof. Anil Deshmukh",
    roleLabel: "Nodal Officer, College Desk",
    roleLabelHi: "नोडल अधिकारी, कॉलेज डेस्क",
    email: "college@sugam.demo",
    bureau: null,
    icon: "🏫",
  },
  {
    roleType: "OFFICIAL",
    name: "Kavita Rao",
    roleLabel: "Intake Registry Officer",
    roleLabelHi: "रजिस्ट्री अधिकारी, केंद्रीय कक्ष",
    email: "intake@sugam.demo",
    bureau: "PGRC",
    icon: "📥",
  },
  {
    roleType: "OFFICIAL",
    name: "System Admin",
    roleLabel: "Central Platform Admin",
    roleLabelHi: "केंद्रीय प्लेटफॉर्म प्रशासक",
    email: "admin@sugam.demo",
    bureau: null,
    icon: "⚙️",
  },
];

// Helper to generate a realistic 6-character captcha code
function generateCaptchaCode() {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function AuthScreen({
  notice,
  onAuth,
  lang = "EN",
  onToggleLang,
}: {
  notice?: string | null;
  onAuth: (u: User) => void;
  lang?: SupportedLang;
  onToggleLang?: (l: SupportedLang) => void;
}) {
  const currentLang = lang || "EN";
  const t = translations[currentLang];

  // Active Login Mode: CITIZEN vs OFFICIAL
  const [mode, setMode] = useState<"CITIZEN" | "OFFICIAL">("CITIZEN");

  // Form Fields
  const [citizenId, setCitizenId] = useState("student@sugam.demo");
  const [officialEmail, setOfficialEmail] = useState("rb@sugam.demo");
  const [bureau, setBureau] = useState("REGULATION_BUREAU");
  const [password, setPassword] = useState("demo123");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Security Captcha
  const [captchaCode, setCaptchaCode] = useState("8K4M9P");
  const [captchaInput, setCaptchaInput] = useState("");

  // States
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Regenerate captcha on mount
  useEffect(() => {
    setCaptchaCode(generateCaptchaCode());
  }, []);

  const handleRefreshCaptcha = () => {
    const next = generateCaptchaCode();
    setCaptchaCode(next);
    setCaptchaInput("");
  };

  const handleSpeakCaptcha = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const spelled = captchaCode.split("").join(" ");
      const utterance = new SpeechSynthesisUtterance(spelled);
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Perform Authentication
  const handleLogin = async (e?: React.FormEvent, directEmail?: string, directPw?: string) => {
    e?.preventDefault();
    setError(null);
    setFieldErrors({});

    const emailToUse = (directEmail || (mode === "CITIZEN" ? citizenId : officialEmail)).trim().toLowerCase();
    const pwToUse = directPw || password;

    // Validate Captcha (only if not a direct 1-click test bypass)
    if (!directEmail) {
      if (!captchaInput.trim()) {
        setError(currentLang === "HI" ? "कृपया सुरक्षा कैप्चा कोड दर्ज करें।" : "Please enter the security captcha code.");
        return;
      }
      if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
        setError(t.loginInvalidCaptcha);
        return;
      }
    }

    setBusy(true);
    try {
      const r = await api<{ user: User }>("/api/v1/auth/login", {
        json: { email: emailToUse, password: pwToUse },
      });

      if (!r.success || !r.user) {
        setBusy(false);
        setError(r.error?.message ?? t.loginInvalidCreds);
        setFieldErrors(r.error?.fieldErrors ?? {});
        handleRefreshCaptcha();
        return;
      }

      // Mark session as explicitly logged in
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("sugam_session_active", "true");
        } catch {}
      }

      setSuccessNotice(currentLang === "HI" ? "प्रमाणीकरण सफल। पोर्टल में प्रवेश किया जा रहा है..." : "Authentication verified. Entering portal...");

      // Small delay for clean visual confirmation
      setTimeout(() => {
        setBusy(false);
        onAuth(r.user);
      }, 400);
    } catch {
      setBusy(false);
      setError(t.loginInvalidCreds);
      handleRefreshCaptcha();
    }
  };

  // 1-Click Fast Profile Selection
  const handleSelectDemoProfile = (profile: typeof STATUTORY_DEMO_PROFILES[0]) => {
    if (profile.roleType === "CITIZEN") {
      setMode("CITIZEN");
      setCitizenId(profile.email);
    } else {
      setMode("OFFICIAL");
      setOfficialEmail(profile.email);
      if (profile.bureau) setBureau(profile.bureau);
    }
    setPassword("demo123");
    setCaptchaInput(captchaCode);
    handleLogin(undefined, profile.email, "demo123");
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#191636] flex flex-col font-sans">
      {/* ── 1. Top Government of India Accessibility & Identity Strip ── */}
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

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px] sm:text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t.securedBadge}</span>
            </div>

            <span className="text-white/30 hidden sm:inline">|</span>

            {/* Top Right Corner Language Selector: English | हिन्दी */}
            <div className="flex items-center rounded-lg bg-white/15 border border-white/20 p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => onToggleLang?.("EN")}
                className={`px-2.5 py-0.5 rounded transition ${
                  currentLang === "EN"
                    ? "bg-white text-[#191636] font-extrabold shadow-xs"
                    : "text-white/80 hover:text-white"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => onToggleLang?.("HI")}
                className={`px-2.5 py-0.5 rounded transition ${
                  currentLang === "HI"
                    ? "bg-[#FF9933] text-[#191636] font-extrabold shadow-xs"
                    : "text-white/80 hover:text-white"
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Official AICTE Brand Header ── */}
      <div className="bg-white border-b border-[#EFEEF8] py-3.5 px-4 sm:px-6 shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="hidden sm:block text-[#191636] shrink-0">
              <NationalEmblemSvg className="h-12 w-auto" />
            </div>
            <div className="h-10 w-[1px] bg-[#DFDFE4] hidden sm:block" />
            <AicteEmblemLogo className="h-12 w-12 shrink-0" />
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-[#191636] leading-tight font-serif">
                {currentLang === "HI" ? "अखिल भारतीय तकनीकी शिक्षा परिषद" : "ALL INDIA COUNCIL FOR TECHNICAL EDUCATION"}
              </h1>
              <div className="text-xs sm:text-sm font-bold text-[#2F2B69] leading-tight">
                {currentLang === "HI" ? "शिक्षा मंत्रालय, भारत सरकार का सांविधिक निकाय" : "A Statutory Body Under Ministry of Education, Govt. of India"}
              </div>
              <div className="text-[10px] text-[#ED6C02] font-semibold mt-0.5">
                {currentLang === "HI" ? "सुगम (SUGAM 2.0) · एकल एकीकृत विनियामक कमान एवं शिकायत निवारण पोर्टल" : "SUGAM 2.0 · Single Unified Gateway for AICTE Management & Grievance Radar"}
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 rounded-xl bg-[#EDF7F2] border border-[#316444]/20 px-3 py-1.5 text-xs font-bold text-[#316444]">
            <ShieldCheck className="h-4 w-4" />
            <span>Digital India · National SSO Portal</span>
          </div>
        </div>
      </div>

      {/* ── Tricolor Strip ── */}
      <div className="tricolor-strip" />

      {/* ── 3. Main Government Login Form Section ── */}
      <main className="flex-1 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6">
        <div className="w-full max-w-xl">
          {notice && (
            <div className="mb-5 rounded-2xl border border-[#EAD3A2] bg-[#FFFBF7] px-4 py-3 text-xs font-bold text-[#ED6C02] shadow-xs flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{notice}</span>
            </div>
          )}

          {/* Elevated Official Login Card */}
          <div className="rounded-3xl border-2 border-[#DFDFE4] bg-white shadow-xl overflow-hidden">
            {/* Card Top Official Header Strip */}
            <div className="bg-[#191636] text-white p-5 text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />
              
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-amber-300 mb-2">
                <Lock className="h-3 w-3" />
                <span>{t.authSsoBadge}</span>
              </div>
              
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {t.loginHeading}
              </h2>
              <p className="mt-1 text-xs text-white/80 max-w-md mx-auto">
                {t.loginSubheading}
              </p>
            </div>

            {/* Login Role Tabs (Citizen / Student vs AICTE Official) */}
            <div className="grid grid-cols-2 border-b border-[#DFDFE4] bg-[#F8FAFD]">
              <button
                type="button"
                onClick={() => { setMode("CITIZEN"); setError(null); }}
                className={`flex items-center justify-center gap-2 py-3.5 px-4 text-xs font-bold transition-all relative ${
                  mode === "CITIZEN"
                    ? "bg-white text-[#0565D2] font-black border-t-2 border-t-[#0565D2] shadow-xs"
                    : "text-[#5A5971] hover:text-[#191636] hover:bg-slate-100/60"
                }`}
              >
                <GraduationCap className={`h-4 w-4 ${mode === "CITIZEN" ? "text-[#0565D2]" : "text-[#5A5971]"}`} />
                <span>{t.loginTabCitizen}</span>
              </button>

              <button
                type="button"
                onClick={() => { setMode("OFFICIAL"); setError(null); }}
                className={`flex items-center justify-center gap-2 py-3.5 px-4 text-xs font-bold transition-all relative ${
                  mode === "OFFICIAL"
                    ? "bg-white text-[#ED6C02] font-black border-t-2 border-t-[#ED6C02] shadow-xs"
                    : "text-[#5A5971] hover:text-[#191636] hover:bg-slate-100/60"
                }`}
              >
                <Landmark className={`h-4 w-4 ${mode === "OFFICIAL" ? "text-[#ED6C02]" : "text-[#5A5971]"}`} />
                <span>{t.loginTabOfficial}</span>
              </button>
            </div>

            {/* Login Form Body */}
            <form onSubmit={(e) => handleLogin(e)} className="p-6 sm:p-8 space-y-4">
              {/* Citizen & Student Credentials */}
              {mode === "CITIZEN" ? (
                <div>
                  <label htmlFor="citizen-id" className="block text-xs font-bold uppercase tracking-wider text-[#191636] mb-1.5">
                    {t.loginCitizenIdLabel} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="citizen-id"
                      type="text"
                      value={citizenId}
                      onChange={(e) => setCitizenId(e.target.value)}
                      placeholder={t.loginCitizenIdPlaceholder}
                      className="w-full rounded-xl border border-[#DFDFE4] px-3.5 py-2.5 text-sm font-medium text-[#191636] bg-white placeholder-[#8A899C] focus:border-[#0565D2] focus:ring-2 focus:ring-[#0565D2]/15 outline-none transition"
                      required
                    />
                  </div>
                  <FieldError msg={fieldErrors.email} />
                </div>
              ) : (
                /* AICTE Bureau Official Credentials */
                <div className="space-y-4">
                  <div>
                    <label htmlFor="official-email" className="block text-xs font-bold uppercase tracking-wider text-[#191636] mb-1.5">
                      {t.loginOfficialEmailLabel} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="official-email"
                      type="email"
                      value={officialEmail}
                      onChange={(e) => setOfficialEmail(e.target.value)}
                      placeholder={t.loginOfficialEmailPlaceholder}
                      className="w-full rounded-xl border border-[#DFDFE4] px-3.5 py-2.5 text-sm font-medium text-[#191636] bg-white placeholder-[#8A899C] focus:border-[#ED6C02] focus:ring-2 focus:ring-[#ED6C02]/15 outline-none transition"
                      required
                    />
                    <FieldError msg={fieldErrors.email} />
                  </div>

                  <div>
                    <label htmlFor="bureau-select" className="block text-xs font-bold uppercase tracking-wider text-[#191636] mb-1.5">
                      {t.loginBureauSelectLabel}
                    </label>
                    <select
                      id="bureau-select"
                      value={bureau}
                      onChange={(e) => setBureau(e.target.value)}
                      className="w-full rounded-xl border border-[#DFDFE4] px-3.5 py-2.5 text-sm font-semibold text-[#191636] bg-white focus:border-[#ED6C02] focus:ring-2 focus:ring-[#ED6C02]/15 outline-none transition"
                    >
                      <option value="REGULATION_BUREAU">Regulation Bureau (RB) — विनियामक ब्यूरो</option>
                      <option value="PGRC">Public Grievance Redressal Cell (PGRC) — पीजीआरसी</option>
                      <option value="APPROVAL_BUREAU">Approval Bureau (AB) — अनुमोदन ब्यूरो</option>
                      <option value="POLICY_ACADEMIC_BUREAU">Policy &amp; Academic Planning Bureau — नीति ब्यूरो</option>
                      <option value="SCHOLARSHIP_CELL">Scholarship &amp; Fee Regulatory Cell — छात्रवृत्ति प्रकोष्ठ</option>
                      <option value="FACULTY_DEVELOPMENT_CELL">Faculty Development Cell — संकाय विकास</option>
                      <option value="LEGAL_CELL">Legal Directorate — विधिक प्रकोष्ठ</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-[#191636]">
                    {t.loginPasswordLabel} <span className="text-red-500">*</span>
                  </label>
                  <a
                    href="#help"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(currentLang === "HI" ? "डिफ़ॉल्ट परीक्षण पासवर्ड 'demo123' है या नीचे दिए गए त्वरित परीक्षण बटनों का उपयोग करें।" : "Default test password is 'demo123' or use the 1-Click Quick Demo Sign-in buttons below.");
                    }}
                    className="text-[11px] font-semibold text-[#0565D2] hover:underline"
                  >
                    {t.loginForgotPassword}
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.loginPasswordPlaceholder}
                    className="w-full rounded-xl border border-[#DFDFE4] px-3.5 py-2.5 pr-11 text-sm font-medium text-[#191636] bg-white placeholder-[#8A899C] focus:border-[#0565D2] focus:ring-2 focus:ring-[#0565D2]/15 outline-none transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A5971] hover:text-[#191636] p-1"
                    title={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FieldError msg={fieldErrors.password} />
              </div>

              {/* Security Captcha Section (Authentic Govt Style) */}
              <div className="rounded-2xl border border-[#DFDFE4] bg-[#F8FAFD] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="captcha-input" className="text-xs font-bold uppercase tracking-wider text-[#191636] flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-[#ED6C02]" />
                    <span>{t.loginCaptchaLabel}</span> <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-[#5A5971]">{currentLang === "HI" ? "अक्षरों का मिलान करें" : "Case-insensitive"}</span>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                  {/* Captcha Display Canvas/Card */}
                  <div className="relative flex items-center justify-center rounded-xl bg-gradient-to-r from-[#FFF5EB] via-[#F4F6F9] to-[#E8F0FE] border-2 border-dashed border-[#DFDFE4] px-4 py-2 select-none shadow-inner shrink-0 min-w-[150px]">
                    <div className="font-mono text-xl sm:text-2xl font-black tracking-widest text-[#191636] line-through decoration-[#ED6C02] decoration-2">
                      {captchaCode}
                    </div>
                    {/* Noise lines */}
                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#191636_1px,transparent_1px)] [background-size:6px_6px]" />
                  </div>

                  {/* Audio & Refresh Captcha Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleRefreshCaptcha}
                      className="p-2 rounded-xl border border-[#DFDFE4] bg-white text-[#5A5971] hover:text-[#191636] hover:bg-slate-100 transition shadow-xs"
                      title={t.loginCaptchaRefresh}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleSpeakCaptcha}
                      className="p-2 rounded-xl border border-[#DFDFE4] bg-white text-[#5A5971] hover:text-[#191636] hover:bg-slate-100 transition shadow-xs"
                      title="Audio Captcha"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Captcha Input */}
                  <div className="flex-1 min-w-[120px]">
                    <input
                      id="captcha-input"
                      type="text"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                      placeholder={t.loginCaptchaPlaceholder}
                      maxLength={6}
                      className="w-full rounded-xl border border-[#DFDFE4] px-3 py-2 text-sm font-bold uppercase tracking-widest text-[#191636] bg-white text-center focus:border-[#0565D2] focus:ring-2 focus:ring-[#0565D2]/15 outline-none transition"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[#5A5971]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-[#DFDFE4] text-[#0565D2] focus:ring-[#0565D2]"
                  />
                  <span>{t.loginRememberMe}</span>
                </label>
              </div>

              {/* Status and Error Messages */}
              {error && (
                <div className="rounded-xl bg-[#FDECEC] border border-[#F0C5C0] p-3 text-xs font-semibold text-[#C72E07] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successNotice && (
                <div className="rounded-xl bg-[#EDF7F2] border border-[#316444]/30 p-3 text-xs font-bold text-[#316444] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successNotice}</span>
                </div>
              )}

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={busy}
                className={`w-full rounded-xl py-3 px-6 text-sm font-extrabold text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                  mode === "CITIZEN"
                    ? "bg-[#0565D2] hover:bg-[#191636]"
                    : "bg-[#ED6C02] hover:bg-[#c95800]"
                }`}
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t.loginSubmitting}</span>
                  </>
                ) : (
                  <>
                    <span>{t.loginSubmitBtn}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Sign-in Profiles (1-Click Test Pills) */}
            <div className="border-t border-[#DFDFE4] bg-[#F8FAFD] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#191636] flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-[#0565D2]" />
                  <span>{t.loginDemoProfilesTitle}</span>
                </span>
                <span className="rounded bg-[#EDF7F2] px-2 py-0.5 text-[10px] font-bold text-[#316444]">
                  1-Click Instant
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STATUTORY_DEMO_PROFILES.map((p) => (
                  <button
                    key={p.email}
                    type="button"
                    onClick={() => handleSelectDemoProfile(p)}
                    className="flex items-center gap-2.5 rounded-xl border border-[#DFDFE4] bg-white p-2.5 text-left transition hover:border-[#0565D2] hover:shadow-xs group"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F4F6F9] text-base group-hover:scale-105 transition-transform shrink-0">
                      {p.icon}
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-bold text-[#191636] truncate group-hover:text-[#0565D2]">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-[#5A5971] truncate">
                        {currentLang === "HI" ? p.roleLabelHi : p.roleLabel}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Statutory Legal Warning Notice */}
          <div className="mt-6 rounded-2xl border border-[#DFDFE4] bg-white p-4 shadow-xs text-center space-y-1.5">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#191636]">
              <ShieldCheck className="h-4 w-4 text-[#316444]" />
              <span>National Informatics Centre (NIC) · Cyber Security Protected</span>
            </div>
            <p className="text-[11px] text-[#5A5971] leading-relaxed">
              {t.loginLegalNotice}
            </p>
            <p className="text-[10px] font-semibold text-[#0565D2]">
              {t.loginHelplineNotice}
            </p>
          </div>
        </div>
      </main>

      {/* ── Official Government Footer ── */}
      <UidaiFooter />
    </div>
  );
}
