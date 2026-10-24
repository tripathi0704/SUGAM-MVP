// Content module B - Sections 5-9 of the SIH26264 Grievance360 readiness review.

const contentB = [

  // ===========================================================================
  // 5. TECHNICAL FEASIBILITY AND RECOMMENDED STACK
  // ===========================================================================
  { h1: "5. Technical Feasibility and Recommended Stack" },

  { h2: "5.1 Recommended Architecture in One Paragraph" },

  { p: "The automation suite fits a deliberately boring, highly demoable architecture: a React or Next.js dashboard for students, colleges and bureau officers; a Node.js or Django API layer; PostgreSQL as the single source of truth with an append-only audit table; a Redis-backed job queue (BullMQ or Celery) running the SLA timers, alert dispatch and nightly rating recomputation; and Python micro-services only where intelligence is needed - Tesseract for OCR, a Whisper-class model for voice, and a small classifier for urgency and spam. Every automation in Table 4 works within this shape, which means the team can present one architecture diagram and place all eleven automations on it, rather than explaining eleven systems. For the idea stage, the diagram plus the working prototype of the core loop is the credibility anchor that the technical-approach and prototype criteria (half the total weight) reward." },

  { h2: "5.2 Build Plan and Demo Trick per Automation" },

  { p: "Table 4 assigns each automation a recommended implementation, an effort class for a six-member student team (Low means roughly a day, Medium two to four days, High a week or more), and the demo trick that makes it visible in seconds. The demo tricks matter as much as the builds: pre-screening evaluators watch a short video, and the team should script the video to hit at least four of these tricks." },

  { table: {
    title: "Table 4: Recommended stack, effort and demo trick per automation",
    headers: ["Automation", "Recommended implementation", "Effort", "Demo trick"],
    widths: [20, 41, 12, 27],
    colBold: [0],
    rows: [
      ["Auto Complaint Routing", "Category-to-bureau mapping table in Postgres, applied in the API layer, with a fallback manual queue and one-click reassignment", "Low", "File a fee complaint, watch it land in the correct bureau queue."],
      ["Auto SLA Escalation", "Scheduled worker (node-cron or Celery beat) over SLA state columns; demo-mode clock that fast-forwards time", "Low", "Toggle demo clock, case ages 15 days and escalates live on screen."],
      ["Auto Audit Logging", "Append-only audit table with SHA-256 hash chaining; integrity-check endpoint and screen", "Low", "Open integrity checker; show chain validates; attempt an edit, show it fails."],
      ["Smart Urgency Detector", "Curated emergency lexicon plus classifier confidence; human confirm step for auto-escalation", "Medium", "Type \u201cragging\u201d in a draft; SLA badge flips 15 days to 24 hours instantly."],
      ["College Rating Engine", "SQL scoring over resolution time, outcome and SLA compliance with volume normalisation; nightly recompute", "Medium", "Show the institution league table and drill into one college's score breakdown."],
      ["Auto Alert System", "Nodemailer SMTP plus WhatsApp Business Cloud API sandbox; opt-in consent recorded per user", "Medium", "Trigger a status change; the judge's own inbox receives the mail live."],
      ["Duplicate Ticket Merger", "TF-IDF cosine similarity or rapidfuzz over new complaints; suggested clusters with human confirm and unmerge", "Medium", "Submit three similar tickets live; merger proposes one master ticket."],
      ["OCR Receipt Scanner", "pytesseract with OpenCV preprocessing; confidence threshold routing to manual verify queue", "Medium", "Upload a clean receipt (auto-verifies), then a blurred photo (lands in queue)."],
      ["AICTE Rule Suggestions", "Chunked corpus of 15-20 key grievance provisions; keyword plus embedding retrieval with clause citations", "High", "Start typing a reply; relevant clause cards appear with clause numbers."],
      ["Spam & Fake Filter", "Rate limiting plus TF-IDF naive Bayes; flag-not-delete, urgency terms bypass, human release queue", "Medium", "Fire 6 rapid duplicates; fifth is flagged; release it in one click."],
      ["Voice & Local Translator", "faster-whisper transcription for 2-3 languages, then formalisation; editable transcript confirm step", "High", "Play a pre-recorded Hindi clip; transcript appears; student confirms and submits."],
    ],
  }},

  { p: "The effort column adds up to more than one team can harden before 28 October, and that is expected: only the submission deck and a two-minute demo video are due this week. The correct sequencing is in Section 8 - four demo tricks (routing, SLA clock, urgency flip, duplicate merger) are enough to carry the video, and the remaining automations can be shown as interface states with seeded data until the finale." },

  { h2: "5.3 What to Harden Before the Finale Versus What to Mock" },

  { p: "If shortlisted, the team should spend November hardening exactly four automations to live-demo quality: routing, SLA escalation with the demo clock, the urgency detector, and the duplicate merger. These four form a single continuous story - a complaint arrives, is routed, is timed, escalates, and its duplicates collapse - and they cover the most evaluation weight per hour of build effort. The audit hash-chain integrity check is the fifth priority because it is one afternoon of work and anchors the trust narrative." },
  { p: "Everything else can be mocked honestly. The rating engine and bureau view should run on a seeded synthetic dataset of a few hundred labelled demo complaints - clearly announced as demo data in the deck - because live correctness of the score does not matter to evaluators, only the mechanism. The OCR scanner, voice translator and rule suggestions should each have one pre-prepared golden sample that always works, with the manual fallback queue shown as the primary path on failure. This split keeps the 36-hour finale build focused: the team arrives with the architecture already standing and spends the finale on polish and the bureau-view screens, not on infrastructure." },

  // ===========================================================================
  // 6. RISK REGISTER AND EDGE CASES
  // ===========================================================================
  { h1: "6. Risk Register and Edge Cases" },

  { p: "The register below collects the eight failure modes most likely to be attacked by evaluators or encountered in the demo, with a severity rating (the damage if it occurs unfixed) and the mitigation the team should be able to state in one sentence. The two highest-severity risks are expanded after the table because both deserve explicit design time this week." },

  { table: {
    title: "Table 5: Risk register for the qualifying round and finale demo",
    headers: ["Risk", "Severity", "Mitigation"],
    widths: [38, 14, 48],
    colBold: [],
    rows: [
      ["SLA escalation cannot be observed live (15-day window vs 10-minute pitch)", "High", "Demo-mode clock that fast-forwards SLA state on demand; rehearse the 8-second escalation moment."],
      ["Spam filter false positives block a genuine urgent complaint", "High", "Urgency lexicon bypasses the spam gate; blocks are flags with human release; every override is audit-logged."],
      ["Student complaint data privacy (ragging, harassment cases)", "High", "Role-based access, pseudonymised analytics, consent notice, DPDP Act 2023 alignment slide."],
      ["OCR misreads low-quality receipts and closes a ticket wrongly", "Medium", "Confidence threshold; low-confidence scans route to manual verification; OCR never closes a ticket autonomously."],
      ["Voice translation accuracy degrades on dialect and noise", "Medium", "Restrict to 2-3 supported languages; mandatory editable transcript confirmation before submission."],
      ["WhatsApp API approval delay and messaging cost", "Medium", "Email and in-app notifications as the working path; WhatsApp sandbox shown as the enhancement."],
      ["Duplicate merger over-groups distinct issues into one master ticket", "Medium", "Similarity threshold with human confirm; visible unmerge action; cluster preview before grouping."],
      ["Scope overload: 11 automations for 6 members in a 36-hour finale", "Medium", "Harden four live automations, seed the rest with demo data; module owners assigned in the build plan."],
    ],
  }},

  { p: "The demo-clock risk deserves its own engineering slot because it silently invalidates the team's best feature if left unfixed. Everything in the SLA story - the 15-day college window, the escalation to AICTE officials, the rating impact - is invisible at real time speed, and evaluators only score what they can see. A demo-mode toggle that shifts a case's created-at timestamp and recomputes state takes a day to build and converts the strongest narrative into a live moment; it is the highest-leverage day of engineering available before submission." },

  { p: "The spam-filter risk is the one most likely to be raised as a question, because evaluators of grievance systems habitually probe for censorship of genuine victims. The defensible position is architectural, not statistical: the filter never deletes anything, urgency keywords and safety-related categories always bypass it, and every flag is resolved by a human within the same console the bureau already uses. Rehearse that sentence until it is automatic, and add the one-click release screenshot to the deck so the answer is visible even if the question is never asked." },

  // ===========================================================================
  // 7. PITCH AND DEMO STRATEGY FOR THE QUALIFYING ROUND
  // ===========================================================================
  { h1: "7. Pitch and Demo Strategy for the Qualifying Round" },

  { h2: "7.1 Mapping the Automations onto the Official Idea Template" },

  { p: "The SIH 2026 idea presentation format is a fixed five-part structure - problem statement, proposed solution, technical approach, feasibility and viability, and impact and benefits - plus the team slide. The deck should follow that skeleton exactly, because evaluators skim dozens of submissions and a non-standard structure costs clarity points. Table 6 maps what goes on each slide and which automations carry the message." },

  { table: {
    title: "Table 6: Official template slide mapping for the Grievance360 submission",
    headers: ["Template slide", "What to show", "Automations featured"],
    widths: [22, 48, 30],
    colBold: [0],
    rows: [
      ["1. Problem statement", "Quote PS 26264 verbatim; show the bureau officer's blind spot across complaint cases in three pain bullets; state the 28 October context only if space allows", "None - keep this slide product-free"],
      ["2. Proposed solution", "One-line definition of Grievance360 as the integrated AICTE dashboard; the four-pillar automation map (Access, Accountability, Intelligence, Trust); bureau-view screenshot first", "All 11, grouped, not listed individually"],
      ["3. Technical approach", "Single architecture diagram with the 11 automations placed on it; the category-to-bureau mapping table as proof of domain study; stack strip", "Routing, SLA, Audit, Urgency, Merger"],
      ["4. Feasibility and viability", "Effort table (Table 4 condensed), the risk register top-4 with mitigations, and the harden-versus-mock build plan", "OCR, Voice, Spam presented with safeguards"],
      ["5. Impact and benefits", "Institution rating league table screenshot; scalability line (thousands of affiliated institutions); outcomes for students, colleges and AICTE in three columns", "Rating Engine, Alerts, Rule Suggestions"],
      ["Team slide", "Six members with roles mapped to modules; mentor if assigned; one line on prototype status", "-"],
    ],
  }},

  { p: "Two production notes: keep the four-pillar grouping (Access: voice, alerts; Accountability: SLA, audit; Intelligence: routing, urgency, merger, OCR, rules; Trust: rating, spam safeguards) because evaluators remember groups, not eleven names; and put exactly one screenshot or diagram per slide, chosen from the demo build with seeded data so nothing in the deck looks like a wireframe." },

  { h2: "7.2 The 90-Second Demo Flow" },

  { p: "The demo video or live walkthrough should follow one complaint end-to-end, because a single narrative thread demonstrates integration far better than feature-by-feature menus. The script below runs about ninety seconds and uses the four hardened automations plus one seeded view." },

  { numbered: [
    "Open on the bureau-view dashboard: case counts per bureau, aging buckets, one SLA breach highlighted (seeded data, 10 seconds).",
    "A student files a fee complaint with a receipt photo; the urgency badge stays normal and the case enters the pipeline (15 seconds).",
    "Auto-routing assigns it to the correct bureau queue; show the mapping suggestion and the one-click override control (10 seconds).",
    "Toggle the demo clock; the case ages past 15 days; the SLA escalation banner fires and the AICTE official notification appears (15 seconds).",
    "Submit two near-identical complaints from other students; the merger proposes a master ticket; accept in one click (15 seconds).",
    "Open the audit trail on the master ticket: hash-chained entries with timestamps and actors; run the integrity check green (10 seconds).",
    "Close on the college rating table updating after resolution, and the student receiving the resolution alert (15 seconds).",
  ], ref: "demo-flow" },

  { p: "Record the video with seeded data on a clean local build, narrate over the screen, and keep a second take of every step so editing can hide any slip. If the pre-screening allows a live call instead of a video, rehearse this exact order twice; the demo-clock moment in step four is the moment to slow down and let the evaluator watch." },

  { h2: "7.3 Likely Judge Questions and Model Answers" },

  { p: "Eight questions cover most of what evaluators ask idea-stage grievance teams. Each answer below is two to three sentences and should be memorised as a position, not a script, with the corresponding slide or screenshot ready to show." },

  { qa: { q: "How is this different from the existing AICTE grievance portal?", a: "The existing portal is an intake form; Grievance360 is the monitoring and tracking layer PS 26264 asks for. It ingests cases, routes them across bureaus automatically, enforces SLA clocks, keeps hash-chained audit evidence, and scores institutional responsiveness - none of which a form does. We position as an integration layer on top of existing channels, with APIs and CSV import, not as a replacement." } },
  { qa: { q: "What stops a college from disputing or manipulating the 15-day escalation?", a: "Every status change is written to an append-only, hash-chained audit log with actor and timestamp, so the case age is independently verifiable. Escalation is computed from those timestamps, not from anyone's claim, and bureau officers can grant documented extensions that are themselves audited. The integrity-check screen validates the chain on demand." } },
  { qa: { q: "How do you detect urgency words without false alarms?", a: "A curated emergency lexicon combined with a classifier confidence score proposes the priority upgrade, and a human confirmation step completes it before the 24-hour clock applies. Every confirmation or override is audit-logged, so misuse of the urgency path is itself traceable. Safety-related categories also bypass the spam gate so urgent complaints are never suppressed." } },
  { qa: { q: "Is WhatsApp messaging realistic for a student team at national scale?", a: "We use the WhatsApp Business Cloud API with template messages and per-user opt-in consent, and the system works fully on email and in-app notifications if the channel is unavailable. That is why WhatsApp is an enhancement layer, not a dependency. The sandbox demo shows the same alert content delivered on all three channels." } },
  { qa: { q: "Does the rating engine unfairly punish colleges with few complaints?", a: "Scores use volume normalisation over a rolling window, so institutions with very few complaints shrink toward the mean instead of swinging on one case. The score components - resolution time, outcome, SLA compliance - are shown in a breakdown per college so the number is explainable. Bureau officers see the confidence level alongside the score." } },
  { qa: { q: "How do you protect sensitive complaints like ragging or harassment?", a: "Role-based access separates student, college, bureau and admin views; analytics run on pseudonymised data; and consent is captured at submission in line with DPDP Act 2023 principles. Audit access to sensitive cases is itself logged. Urgency handling follows the statutory 24-hour expectation for such complaints." } },
  { qa: { q: "What if your OCR or voice features fail during evaluation?", a: "They are designed as assisted verification with human fallback, not autonomous decisions. Low-confidence OCR routes to a manual queue with fields pre-filled, and voice submissions always show an editable transcript for confirmation before filing. In the demo we show both the success path and the fallback path deliberately." } },
  { qa: { q: "Eleven automations for six people - what will you actually build at the finale?", a: "The architecture and core loop already exist, so the finale is hardening, not scaffolding. We arrive with routing, SLA clock, urgency, audit and merger at demo quality, and spend the 36 hours on the bureau-view screens, seeded-data polish and rehearsal. Module owners and the hour-by-hour plan are in the feasibility slide." } },

  // ===========================================================================
  // 8. PRIORITY ACTION ROADMAP
  // ===========================================================================
  { h1: "8. Priority Action Roadmap" },

  { h2: "8.1 Phase 0 - Before 28 October (Idea Submission, 5 Days)" },

  { p: "Phase 0 is about submitting a complete, template-compliant package while the idea counter is still light. The split of work assumes four members on the deck and video, one on the demo build, and the leader on process compliance." },

  { bullets: [
    "Rewrite the deck on the official template using the slide mapping in Table 6, leading with the AICTE bureau-view narrative; keep one screenshot or diagram per slide.",
    "Build the demo-mode SLA clock and record the 90-second demo from Section 7.2 on seeded data (routing, escalation, merger, audit are the four tricks to include).",
    "Add the bureau-wise monitoring screenshot and the DPDP data-protection slide - the two biggest gap-closers from Table 3.",
    "Verify team compliance today: exactly six members, at least one female member, same institution, SPOC nomination confirmed.",
    "Submit through the SPOC at least 24 hours before the deadline; confirm the upload renders and keep the submission receipt.",
  ]},

  { h2: "8.2 Phase 1 - November (Pre-Screening Period)" },

  { p: "Phase 1 assumes shortlisting is pending and prepares both outcomes: strengthening the prototype in case of a live-call evaluation, and being finale-ready the day results appear. The theme is demo integrity rather than new features." },

  { bullets: [
    "Harden the four lead automations to live-demo quality: routing, SLA clock, urgency flip, duplicate merger, plus the one-afternoon audit integrity check.",
    "Generate a labelled synthetic dataset of a few hundred demo complaints and rebuild the rating table and bureau view on it; mark it clearly as demo data.",
    "Add role-based access states and the bureau officer resolve path; take fresh screenshots and refresh the deck.",
    "Rehearse the eight judge questions from Section 7.3 with at least two members answering each; record one full mock pitch and review it.",
  ]},

  { h2: "8.3 Phase 2 - December (If Shortlisted for the Grand Finale)" },

  { p: "Phase 2 is the 36-hour build plan skeleton to bring to the nodal centre, so that the team spends finale hours on polish instead of decisions. Assign module owners now, while there is time to swap for gaps." },

  { bullets: [
    "Hour 0-6: environment up, seeded data loaded, bureau-view screens built (owners: two members).",
    "Hour 6-18: harden OCR golden samples, voice two-language demo, rule-suggestion cards (owners: two members).",
    "Hour 18-28: rating engine normalisation, exports (CSV/PDF), alert channels end-to-end (owners: two members).",
    "Hour 28-36: end-to-end rehearsal of the 90-second flow, screenshots for the jury deck, pitch rehearsal with mentor.",
  ]},

  // ===========================================================================
  // 9. FINAL VERDICT AND READINESS SCORES
  // ===========================================================================
  { h1: "9. Final Verdict and Readiness Scores" },

  { p: "Table 7 restates the readiness assessment against the five published evaluation parameters. The two feasibility-side parameters are the strong core of this submission; the prototype parameter is the weakest only because the demo clock and bureau view are not yet built, and both are days of work rather than weeks." },

  { table: {
    title: "Table 7: Readiness by evaluation parameter (reviewer assessment)",
    headers: ["Evaluation parameter", "Weight", "Readiness", "Basis"],
    widths: [30, 12, 16, 42],
    colBold: [0, 2],
    rows: [
      ["Problem understanding and innovation", "20%", "8/10", "Domain depth is real (mapping table, ratings); innovation framing must shift to the bureau dashboard view."],
      ["Technical approach and feasibility", "25%", "8/10", "Concrete stack per automation; risk register and mitigations ready; OCR and voice claims need bounding."],
      ["Prototype / implementation plan", "25%", "6/10", "Core loop exists, but the demo clock, bureau view and seeded dataset are pending - all scheduled in Phase 0/1."],
      ["Impact and scalability", "20%", "8/10", "Regulator-grade outcomes via rating engine and SLA; scalability story natural for thousands of institutions."],
      ["Presentation clarity", "10%", "7/10", "Template mapping defined in this review; execution discipline (one message per slide) decides the last points."],
    ],
  }},

  { p: [
    { t: "Overall readiness: 7.4 out of 10 - Conditional Go. ", b: true },
    { t: "The automation suite is a legitimate top-quartile foundation for SIH26264, and the competition window (roughly 25 of 500 idea slots used at the time of writing) rewards a fast, disciplined submission. Execute Phase 0 in full before 28 October: template-compliant deck on the bureau narrative, the 90-second demo with the demo-clock moment, the data-protection slide, and SPOC submission with a day to spare. If shortlisted, the November hardening list converts the submission's promises into live-demo proof, and the same proof carries into the 36-hour finale with the build plan already assigned." },
  ]},

  { p: "Treat this review as a working document: after Phase 0 submission, re-score the eleven automations against Table 2, update the gap register with anything the SPOC or faculty mentors add, and re-run the judge-question rehearsal until every answer is a reflex. The team's strongest asset is that the automations are concrete and demoable - protect that advantage by showing, not telling, at every gate from here to the finale." },

];

module.exports = { contentB };
