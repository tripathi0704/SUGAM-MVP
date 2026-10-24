// Content module A - Sections 1-4 of the SIH26264 Grievance360 readiness review.
// Block DSL: {h1|h2|h3|p: string | runs[]} | {bullets: []} | {table: {...}} | {figure: {...}}
// English text only. Straight apostrophes only; quoted terms use \u201c \u201d escapes.

const contentA = [

  // ===========================================================================
  // 1. EXECUTIVE SUMMARY
  // ===========================================================================
  { h1: "1. Executive Summary" },

  { p: "This report reviews the eleven smart automations of the Grievance360 Complaint Dashboard against the qualifying pipeline of Smart India Hackathon (SIH) 2026, for Problem Statement SIH26264 - Integrated Dashboard for Monitoring and Tracking Institution-Related Complaint Cases Across AICTE Bureaus/Cells. The review covers three angles agreed with the team: fit with the published evaluation parameters, technical feasibility of building and demoing each automation, and gaps between what the problem statement asks for and what the current automation set covers. The overall verdict is a Conditional Go, with a readiness score of 7.4 out of 10: the automation set is genuinely strong for a national shortlisting round, but three specific gaps need fixing before the idea submission locks." },

  { p: [
    { t: "Time is the most important constraint in this review. ", b: true },
    { t: "The idea submission deadline for SIH26264 is 28 October 2026, five days after the date of this report, and the tracker shows only about 25 of the 500 idea slots used at the time of writing. That combination is actually favourable: competition on this problem statement is still light, so a disciplined, complete submission in the next five days has a realistic chance of reaching the national pre-screening shortlist." },
  ]},

  { p: "The automations split cleanly into three tiers. Five automations - Auto Complaint Routing, Auto SLA Escalation, Auto Audit Logging, the Smart Urgency Detector and the College Rating Engine - are strong qualifying assets that map directly to what SIH evaluators reward under technical approach, feasibility and impact. Four automations (Alerts, Duplicate Merger, OCR Receipt Scanner, AICTE Rule Suggestions) are good but need sharper framing and a hardened demo. Two automations - the Spam Filter and the Voice Translator - are risky unless presented with explicit safeguards, because judges reliably attack false positives and language accuracy." },

  { p: [
    { t: "Three priority actions follow from this review. ", b: true },
    { t: "First, reframe the pitch from a student complaint app to a regulator-grade integrated dashboard for AICTE bureaus and cells, because that is literally what the problem statement title asks for. Second, build a demo-mode SLA clock so that the 15-day escalation can be shown live instead of described. Third, add a bureau-wise analytics and monitoring view with role-based access, which is the single biggest missing piece against the problem statement." },
  ]},

  // ===========================================================================
  // 2. QUALIFYING ROUND CONTEXT AND EVALUATION CRITERIA
  // ===========================================================================
  { h1: "2. Qualifying Round Context and Evaluation Criteria" },

  { h2: "2.1 Where Grievance360 Stands in the SIH 2026 Pipeline" },

  { p: "SIH 2026 is the ninth edition of the hackathon, organised by the Ministry of Education Innovation Cell together with AICTE, with 226 problem statements released at launch (172 software and 54 hardware). Team rules are strict and worth re-checking today: exactly six members including the team leader, at least one female member, all members from the same institution, and nomination routed through the college SPOC. Colleges ran their internal hackathons through September, and nominated teams then submit their idea presentations on the sih.gov.in portal." },

  { p: "For SIH26264 the idea submission window closes on 28 October 2026. After that, October to November is the national online evaluation phase, where expert evaluators pre-screen idea presentations and roughly four to five teams per problem statement are shortlisted for the Grand Finale in December 2026 - a 36-hour, non-stop build at nodal centres. This means the next gate for Grievance360 is a document-and-video gate, not a coding gate: evaluators will judge the idea presentation, the credibility of the technical approach, and the evidence of a working prototype. Every recommendation in this report is calibrated to that gate." },

  { h2: "2.2 The Five Scoring Parameters and What Evaluators Reward" },

  { p: "The idea presentation template and pre-screening guidance published for SIH 2026 converge on five evaluation parameters. The weights below are summarised from the SIH 2026 idea presentation format guidance circulating for this cycle; the team should confirm the latest percentages against the official template on sih.gov.in before finalising the deck, because internal college rounds and nodal centres sometimes apply modified weightings. The structure of the criteria, however, is stable across sources: understanding and innovation, technical approach and feasibility, prototype or implementation plan, impact and scalability, and presentation clarity." },

  { table: {
    title: "Table 1: SIH 2026 idea pre-screening - evaluation parameters and weights",
    headers: ["Evaluation parameter", "Weight", "What evaluators look for in Grievance360"],
    widths: [28, 12, 60],
    colBold: [],
    rows: [
      ["Problem understanding and innovation", "20%", "Restate PS 26264 in AICTE bureau language; show which part is novel (rating engine, audit trail, merger) versus standard ticketing."],
      ["Technical approach and feasibility", "25%", "Concrete stack per automation, realistic effort estimates, an architecture diagram, and honest treatment of hard parts (OCR, voice, NLP)."],
      ["Prototype / implementation plan", "25%", "Evidence of a working build: screenshots, a 60-90 second demo video, seeded demo data, and a 36-hour finale build plan."],
      ["Impact and scalability", "20%", "Regulator-level benefits for AICTE bureaus; scalability to thousands of affiliated institutions; alignment with digital governance goals."],
      ["Presentation clarity", "10%", "Clean template compliance, one message per slide, readable diagrams, and a demo that runs without internet risk."],
    ],
  }},

  { p: "Two observations follow from this weighting. Fifty percent of the score (technical approach plus prototype) is decided by how believable and how demonstrably real the build is, which favours Grievance360 because the automation suite is unusually concrete. The remaining thirty percent outside clarity is impact-driven, which is exactly where the current pitch is weakest - the automations are mostly described from the student and college point of view, while the paying customer of PS 26264 is AICTE itself. Figure 1 visualises the published weights." },

  { figure: { path: "/home/z/my-project/scripts/assets/fig2_weights.png", caption: "Figure 1: Published SIH 2026 idea pre-screening evaluation weights (confirm against the official template before submission).", width: 340 } },

  { h2: "2.3 What PS 26264 Actually Asks For" },

  { p: "The problem statement title is precise and the team should quote it verbatim in the deck: an Integrated Dashboard for Monitoring and Tracking Institution-Related Complaint Cases Across AICTE Bureaus/Cells. Read carefully, the customer is AICTE - specifically its bureaus and cells such as the approval bureau, the grievance redressal cell, the anti-ragging cell and other functional units - and the deliverable is a monitoring and tracking dashboard that integrates complaint cases across those units. Students and colleges are participants in the workflow, but the primary user sitting in front of this dashboard is an AICTE officer who needs visibility, accountability and decision support." },

  { p: "This reading matters because eleven of the strongest Grievance360 automations are currently pitched in student-journey language: a student files a complaint, a college responds late, the case escalates. That story is compelling and should be kept, but it is the mechanism, not the product. The product PS 26264 wants is the pan-bureau command centre: every institution-related complaint case, across every bureau, tracked on one screen, with aging analysis, escalation status, compliance scores and audit evidence. Section 4 of this report turns this gap into a concrete checklist, and Section 7 shows how to re-word the pitch slides without discarding any of the work already done on the automations." },

  // ===========================================================================
  // 3. AUTOMATION-BY-AUTOMATION REVIEW
  // ===========================================================================
  { h1: "3. Automation-by-Automation Review" },

  { p: "Each of the eleven automations was scored on three dimensions aligned to the SIH parameters: judging fit (does it strengthen the idea story against the published criteria), feasibility (can a six-member student team realistically build and demo it), and impact (does it produce an outcome an AICTE evaluator would care about). Scores are the reviewer's structured assessment on a 0-10 scale, not measured facts, and the overall score is the simple average. Table 2 summarises the scorecard; Figure 2 shows the same data ranked, coloured by tier." },

  { table: {
    title: "Table 2: Automation scorecard (reviewer assessment, 0-10 per dimension)",
    headers: ["#", "Automation", "Fit", "Feasibility", "Impact", "Overall", "Verdict"],
    widths: [5, 24, 9, 16, 11, 13, 22],
    colBold: [0, 5],
    rows: [
      ["1", "Auto Complaint Routing", "9", "9", "9", "9.0", "Tier A - lead feature"],
      ["2", "Auto SLA Escalation", "9", "8", "9", "9.0", "Tier A - lead feature"],
      ["3", "Auto Audit Logging", "8", "9", "8", "8.0", "Tier A - trust anchor"],
      ["4", "Smart Urgency Detector", "8", "8", "8", "8.0", "Tier A - safety story"],
      ["5", "College Rating Engine", "8", "8", "9", "8.0", "Tier A - differentiator"],
      ["6", "Auto Alert System", "7", "8", "7", "7.0", "Tier B - sharpen"],
      ["7", "Duplicate Ticket Merger", "8", "7", "7", "7.0", "Tier B - sharpen"],
      ["8", "OCR Receipt Scanner", "7", "7", "6", "7.0", "Tier B - bound the claim"],
      ["9", "AICTE Rule Suggestions", "7", "6", "6", "6.0", "Tier B - narrow scope"],
      ["10", "Spam & Fake Filter", "6", "7", "6", "6.0", "Tier C - add safeguards"],
      ["11", "Voice & Local Translator", "6", "6", "6", "6.0", "Tier C - add safeguards"],
    ],
  }},

  { figure: { path: "/home/z/my-project/scripts/assets/fig1_scores.png", caption: "Figure 2: Overall readiness score per automation, coloured by tier (reviewer self-assessment).", width: 470 } },

  { h2: "3.1 Tier A - Strong Qualifying Assets" },

  { h3: "3.1.1 Auto Complaint Routing (9/10)" },
  { p: "Routing is the most directly relevant automation to the problem statement, because PS 26264 is fundamentally about complaint cases moving to the correct bureau or cell without manual sorting. Evaluators will immediately recognise that a category-to-bureau mapping engine removes the exact manual forwarding pain that motivated the problem statement in the first place. It is also cheap to build convincingly: a maintained mapping table from complaint categories (affiliation, fee excess, harassment, examination, infrastructure) to AICTE bureaus and cells, with a fallback queue for unmatched cases, is a few days of work and demos beautifully." },
  { p: [
    { t: "The weakness to pre-empt is the edge case question: what happens when a complaint spans two bureaus or when the category is wrong. ", b: false },
    { t: "The fix is to show a routing confidence and correction loop in the demo - the system suggests a bureau, the officer can reassign in one click, and the correction feeds back into the mapping table. Presenting routing as assistive-with-human-override, rather than fully autonomous, is both more honest and more credible to government evaluators." },
  ]},

  { h3: "3.1.2 Auto SLA Escalation (9/10)" },
  { p: "The 15-day escalation ladder is the strongest accountability story in the suite and it matches the regulatory mindset of AICTE evaluators: complaints have deadlines, deadlines have consequences, and inaction becomes visible automatically. It also demonstrates system thinking - timers, status states, escalation targets - which scores well under technical approach. The feature is technically simple (a scheduled job over a complaints table), so feasibility is high." },
  { p: [
    { t: "The one big weakness is demo physics: a 15-day timer cannot be shown live in a 36-hour finale or a 10-minute pitch. ", b: false },
    { t: "Build a demo-mode clock that can fast-forward time on demand - a time-travel toggle that recomputes all SLA states instantly. With it, a judge watches a case age from day 1 to day 16 and escalate to AICTE officials in eight seconds; without it, the team can only narrate the feature and loses the fifty-percent-of-score credibility that a working prototype carries. This is the single highest-leverage engineering task before the pre-screening." },
  ]},

  { h3: "3.1.3 Auto Audit Logging (8/10)" },
  { p: "Audit logging is the automation that answers the government evaluator's deepest question: can this system be trusted and can its history be verified. Recording every status change with user identity, timestamp and old-to-new value creates tamper-evident evidence, and the summary table describes it as unchangeable history - which is the right framing for a regulator context. Feasibility is excellent because it is an append-only database design rather than a machine learning component, and it doubles as the data source for the compliance analytics described in Section 4." },
  { p: "The improvement is to make the tamper-evidence visible rather than asserted. Hash-chain each audit record (each record includes the hash of the previous one) and add a small integrity-check screen that validates the chain live in the demo. The cost is one afternoon of work, and in exchange the pitch can claim verifiably tamper-evident logging instead of simply logging - a meaningful differentiator when judges ask what stops a college administrator from editing history." },

  { h3: "3.1.4 Smart Urgency Detector (8/10)" },
  { p: "The urgency detector carries the human story of the pitch: a complaint containing the word \u201cragging\u201d compresses the response clock from fifteen days to twenty-four hours. Evaluators consistently reward features that show the system protects students in danger, and this is the automation that produces that moment in the narrative. It is also reasonably feasible - a curated lexicon of emergency terms plus a lightweight classifier is a bounded engineering task." },
  { p: "The attack vector is false positives and gaming: if keyword matching alone decides urgency, a complaint that merely mentions ragging in passing could hijack the priority queue, and a cautious college could instruct students to avoid trigger words. Fix both in the design story: combine the lexicon with a classifier confidence score, require a quick human confirmation step for any auto-escalated case, and log every urgency override in the audit trail so misuse is itself auditable. This turns the weakest objection into evidence of maturity." },

  { h3: "3.1.5 College Rating Engine (8/10)" },
  { p: "The 0-100 responsiveness score is the clearest differentiator in the suite, because no basic ticketing system produces a regulator-usable performance index. It converts raw complaint outcomes into an AICTE decision aid - which institutions resolve fairly and fast, and which ones systematically delay - which is precisely the monitoring insight PS 26264 exists to enable. Impact scores highest here (9) for that reason, and the engine also generates the most presentable artefact in the product: a league-table view of institutions that fits naturally on the bureau dashboard." },
  { p: "The improvement to make before pre-screening is fairness under volume differences. A college with three complaints and a college with three hundred cannot be scored by the same raw average, so add volume normalisation - for example confidence-weighted scores that shrink toward the mean when complaint counts are small, over a rolling window. Being able to answer the fairness question in one sentence protects the feature during Q&A, and the normalisation formula itself demonstrates analytical depth under the technical approach criterion." },

  { h2: "3.2 Tier B - Good Automations That Need Sharpening" },

  { h3: "3.2.1 Auto Alert System (7/10)" },
  { p: "Email and WhatsApp notifications on status change are expected hygiene in any modern ticketing product, and they support the pitch by showing students are never left wondering about their case. They are highly feasible - transactional email is trivial and the WhatsApp Business Cloud API has a well-documented sandbox - but alerts alone rarely move an evaluator's score because every competing team will claim them. Treat alerts as supporting cast: one slide line and one live email ping in the demo, not a headline feature." },
  { p: "The sharpening work is in the escalation-content, not the channel: tie the alert content to the SLA state so that a deadline warning mail to a college carries the case age, the rating impact and the audit reference. That converts a generic notification into an accountability instrument. Also add consent and fallback logic to the story - opt-in WhatsApp with email and in-app fallback - because evaluators ask about message deliverability and user consent more often than teams expect." },

  { h3: "3.2.2 Duplicate Ticket Merger (7/10)" },
  { p: "The master-ticket merger is a genuinely smart feature for the AICTE use case, because institution-related grievances arrive in bursts - a fee dispute or an exam issue at one college can generate dozens of near-identical complaints in a day. Collapsing them into one master case with all complainants attached is exactly the kind of operational efficiency a bureau officer wants, and it demonstrates text-similarity engineering that scores well on technical approach." },
  { p: "The risk is over-grouping: two complaints about the same college that mention the same department are not necessarily the same issue. Present the merger as similarity-suggested clustering with a threshold, where the system proposes a master ticket and a human confirms, and show an unmerge action in the demo. Feasibility is moderate - fuzzy matching or TF-IDF cosine similarity is sufficient for the demo - and the human-in-the-loop framing defuses the accuracy objection entirely." },

  { h3: "3.2.3 OCR Receipt Scanner (7/10)" },
  { p: "The receipt scanner attacks a real closing-loophole: complaints being marked resolved with blank or fabricated payment proof. Extracting the student name and amount from an uploaded receipt and cross-checking it against the ticket before closure is a concrete, verifiable automation that evaluators can understand in one sentence. Feasibility is moderate - Tesseract with basic image preprocessing handles printed receipts well - and the demo of scanning a real fee receipt is visually convincing." },
  { p: "Bound the claim before a judge does. OCR on crumpled phone photos, low contrast thermal paper or handwritten receipts is unreliable, so present the scanner as an assisted-verification gate: high-confidence matches auto-verify, low-confidence scans route to a manual verification queue with the extracted fields pre-filled. Demo both paths - a clean receipt passing automatically and a degraded photo landing in the queue - because showing the fallback is more impressive than pretending perfection." },

  { h3: "3.2.4 AICTE Rule Suggestions (6/10)" },
  { p: "Suggesting the relevant AICTE regulation or circular while a college administrator drafts a reply is a thoughtful feature that shows domain depth, and it directly improves the quality and legality of institutional responses. The concept aligns well with the Smart Automation theme of the problem statement. It is, however, the most content-heavy automation in the suite: it requires a curated, chunked corpus of AICTE rules and a retrieval mechanism, and the corpus maintenance burden is real." },
  { p: "Narrow the scope for the hackathon cycle. Restrict the first version to the fifteen to twenty most-cited provisions in grievance handling - response timelines, fee refund clauses, anti-ragging obligations - retrieved by keyword and embedding search, with the exact clause number shown so it can be checked manually. Presenting it as a draft-assist with citation rather than legal advice is the correct framing, and honestly labelling the corpus as a seeded sample keeps the feasibility claim credible under questioning." },

  { h2: "3.3 Tier C - Risky Without Careful Framing" },

  { h3: "3.3.1 Spam and Fake Filter (6/10)" },
  { p: "Rate-limiting identical submissions within a window is easy to build and protects the platform from coordinated flooding aimed at damaging a college's rating. The concept is legitimate and evaluators will accept the need for it. The danger is asymmetry of errors: a false negative costs a moderator a minute, but a false positive can silence a genuine urgent complaint - including a harassment case - and that failure mode is exactly the kind of scenario judges probe hardest in grievance systems." },
  { p: [
    { t: "Keep the automation but lead the presentation with the safeguards, not the blocking. ", b: true },
    { t: "Design the story as: rate-limit flags rather than deletes, urgency lexicon terms always bypass the spam gate, every block lands in a human review queue with a one-click release, and repeated bad actors are throttled progressively rather than banned outright. With those four safeguards on one slide, the filter becomes a maturity signal instead of a liability." },
  ]},

  { h3: "3.3.2 Voice and Local Translator (6/10)" },
  { p: "Voice-to-formal-English complaint filing is the most socially resonant feature in the suite - it opens the system to students who cannot draft formal English - and it photographs well in a pitch video. It is also the most technically exposed: speech recognition for regional Indian languages, followed by translation, followed by formalisation, is a three-model pipeline in which each stage can inject errors, and accuracy degrades quickly on noisy recordings and dialectal speech." },
  { p: "De-scope for credibility. Restrict the pre-screening claim to two or three well-supported languages using an open speech model such as Whisper-class transcription, and always show the editable transcript step where the student confirms what was understood before submission - accuracy responsibility shared with the user is an acceptable design pattern, silent mis-transcription is not. In the demo, use a pre-recorded clean clip rather than live microphone input, because a live failure in front of evaluators costs more than the feature earns." },

  // ===========================================================================
  // 4. GAP ANALYSIS VS PS 26264 REQUIREMENTS
  // ===========================================================================
  { h1: "4. Gap Analysis: PS 26264 Expectations Versus the Current Automation Set" },

  { h2: "4.1 What the Automations Already Cover Well" },

  { p: "Measured against the verbs in the problem statement title - integrated, dashboard, monitoring, tracking, across bureaus and cells - the automation suite already covers more than the team may realise. Tracking is served by routing plus SLA escalation plus audit logging, which together move and time-stamp every case through its lifecycle. Monitoring is partly served by the rating engine, which aggregates institutional behaviour into a comparable score. Integration is implied by the unified data model that lets an urgency flag, an alert, an audit entry and a rating all reference one complaint case. This is a strong base, and the pitch should say so explicitly rather than presenting the automations as disconnected features." },

  { h2: "4.2 The Gaps That Evaluators Will Notice" },

  { p: "The gaps are concentrated on the AICTE-officer side of the product. The automation suite optimises the complaint journey, but the problem statement awards the dashboard to whoever gives bureau officers the command-centre view. Table 3 lists the six gaps worth closing, ordered by how likely they are to cost points during pre-screening, together with the action that closes each one." },

  { table: {
    title: "Table 3: Gap register - what PS 26264 expects versus what the automations currently cover",
    headers: ["Expectation from PS 26264", "Current status", "Action before submission"],
    widths: [34, 22, 44],
    colBold: [],
    rows: [
      ["Bureau/cell-wise monitoring view (cases per bureau, aging, escalation status)", "Missing - dashboard is student/college-oriented", "Add a bureau-view dashboard screen with per-bureau case counts, aging buckets and SLA breach list; one screen is enough for the idea stage."],
      ["Integrated intake across channels and bureaus", "Partially covered - single web intake", "State the API/CSV integration approach for existing AICTE portals and email intake; commit to connectors, show the contract, no live integration needed."],
      ["Officer workflow for bureaus (assign, remark, resolve, oversight)", "Partially covered - routing exists, officer workspace unclear", "Add role-based access concept: student, college admin, bureau officer, AICTE admin; show the officer resolve path in one screenshot."],
      ["Exportable reports and MIS analytics for decision support", "Missing", "Add one CSV/PDF export and a monthly compliance summary mock; trivial effort, closes a visible gap."],
      ["Data protection posture for sensitive student complaints", "Not addressed in current materials", "One slide: role-based access, pseudonymised analytics, consent notice, alignment with the DPDP Act 2023 principles."],
      ["Complaint taxonomy aligned to AICTE bureau structure", "Generic categories assumed", "Publish the category-to-bureau mapping table as an annexure slide; it doubles as proof of domain study."],
    ],
  }},

  { p: "None of these gaps requires new machine learning or heavy engineering; all six are interface, workflow and governance surfaces that a six-member team can cover in the presentation within two days. The highest-priority item is the bureau-wise view because it is visible in the problem statement title - an evaluator who does not see it in the deck will conclude the team solved a different problem. The data protection slide is the second priority, since grievance data about minors, ragging and harassment is exactly where government evaluators apply scrutiny." },

  { h2: "4.3 Repositioning the Pitch Without Discarding Existing Work" },

  { p: "The repositioning is a messaging operation, not a rebuild. Keep the eleven automations and the student journey as the mechanism, but invert the narrative order: open with the AICTE bureau officer who cannot see institution-related complaint cases across units in one place; then introduce Grievance360 as the integrated dashboard that ingests cases, routes them, times them, audits them and scores the institutions; then present the student journey as the data-capture layer that makes the dashboard honest. Every automation already built survives this inversion untouched - what changes is slide one, the demo entry screen, and which screenshot leads the deck. Section 7 maps this narrative onto the official presentation template slide by slide." },

];

module.exports = { contentA };
