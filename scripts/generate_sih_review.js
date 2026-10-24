// =============================================================================
// SIH26264 Grievance360 - Qualifying Round Readiness Review (.docx generator)
// Skill compliance: R1 cover recipe (DM-1 palette), Profile A formal English
// (Times New Roman, black body, left-aligned, line 312), 3-section page
// numbering (cover / Roman front matter / Arabic body), horizontal-only tables
// with DM-1 tokens, TOC field + refresh hint, no trailing PageBreak before
// NEXT_PAGE sections.
// =============================================================================
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, Header, Footer, PageNumber, NumberFormat, AlignmentType,
  HeadingLevel, WidthType, BorderStyle, ShadingType, SectionType,
  TableLayoutType, LevelFormat, TableOfContents, PageOrientation,
} = require("docx");
const fs = require("fs");
const { contentA } = require("./review_content_a");
const { contentB } = require("./review_content_b");

const OUT = "/home/z/my-project/download/SIH26264_Grievance360_Qualifying_Round_Readiness_Review.docx";

// ── DM-1 Deep Cyan palette (design-system.md coverPalettes) ──────────────────
const P = {
  bg: "162235", titleColor: "FFFFFF", subtitleColor: "B0B8C0",
  metaColor: "90989F", footerColor: "687078", accent: "37DCF2",
  headingColor: "0F3D46",
  table: { headerBg: "1B6B7A", headerText: "FFFFFF", accentLine: "1B6B7A", innerLine: "C8DDE2", surface: "EDF3F5" },
};

const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

const FONT = "Times New Roman";
const pgSize = { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT };
const pgMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };

// ── PNG dimensions straight from IHDR (aspect-ratio safety, no deps) ─────────
function pngDims(buf) {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

// ── Width-aware English title layout (design-system calcTitleLayout, Latin) ──
function estimateTextWidth(text, pt) {
  let w = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0);
    const isCJK = (code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3000 && code <= 0x303F) || (code >= 0xFF00 && code <= 0xFFEF);
    w += isCJK ? pt * 20 : pt * 11.5;
  }
  return w;
}
function wrapWords(title, maxWidth, pt) {
  const words = title.split(/\s+/);
  const lines = [];
  let cur = "";
  for (const wd of words) {
    const cand = cur ? cur + " " + wd : wd;
    if (!cur || estimateTextWidth(cand, pt) <= maxWidth) cur = cand;
    else { lines.push(cur); cur = wd; }
  }
  if (cur) lines.push(cur);
  // orphan prevention: merge a very short last line into the previous one
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop();
    lines[lines.length - 1] += " " + last;
  }
  return lines;
}
function calcTitleLayout(title, maxWidth, preferredPt = 40, minPt = 24) {
  for (let pt = preferredPt; pt >= minPt; pt -= 2) {
    const lines = wrapWords(title, maxWidth, pt);
    if (lines.length <= 2) return { titlePt: pt, titleLines: lines };
  }
  for (let pt = preferredPt; pt >= minPt; pt -= 2) {
    const lines = wrapWords(title, maxWidth, pt);
    if (lines.length <= 3) return { titlePt: pt, titleLines: lines };
  }
  return { titlePt: minPt, titleLines: wrapWords(title, maxWidth, minPt) };
}

// ── calcCoverSpacing (design-system.md, verbatim logic) ──────────────────────
function calcCoverSpacing(params) {
  const {
    titleLineCount = 1, titlePt = 36, hasSubtitle = false,
    hasEnglishLabel = false, metaLineCount = 0,
    fixedHeight = 800, pageHeight = 16838,
    marginTop = 0, marginBottom = 0,
  } = params;
  const SAFETY = 1200;
  const usableHeight = pageHeight - marginTop - marginBottom - SAFETY;
  const titleHeight = titleLineCount * (titlePt * 23 + 200);
  const subtitleHeight = hasSubtitle ? (12 * 23 + 600) : 0;
  const englishLabelHeight = hasEnglishLabel ? (9 * 23 + 600) : 0;
  const metaHeight = metaLineCount * (10 * 23 + 100);
  const implicitParaHeight = 3 * 300;
  const contentHeight = titleHeight + subtitleHeight + englishLabelHeight +
    metaHeight + fixedHeight + implicitParaHeight;
  const remainingSpace = usableHeight - contentHeight;
  const safeRemaining = Math.max(remainingSpace, 400);
  const FOOTER_MIN = 800;
  const rawTop = Math.floor(safeRemaining * 0.45);
  const rawBottom = Math.floor(safeRemaining * 0.45);
  const bottomSpacing = Math.max(rawBottom, FOOTER_MIN);
  const topSpacing = Math.max(rawTop - Math.max(0, FOOTER_MIN - rawBottom), 400);
  const midSpacing = Math.max(safeRemaining - topSpacing - bottomSpacing, 0);
  return { topSpacing, midSpacing, bottomSpacing };
}

// ── Recipe R1: Pure Paragraph Cover (design-system.md, adapted for EN) ───────
function buildCoverR1(config) {
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR - 300;
  const { titlePt, titleLines } = calcTitleLayout(config.title, availableWidth, 40, 24);
  const titleSize = titlePt * 2;

  const spacing = calcCoverSpacing({
    titleLineCount: titleLines.length, titlePt,
    hasSubtitle: !!config.subtitle, hasEnglishLabel: !!config.englishLabel,
    metaLineCount: (config.metaLines || []).length,
    fixedHeight: 400,
  });

  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: P.accent, space: 12 };
  const children = [];

  // 1. Top whitespace (dynamic)
  children.push(new Paragraph({ spacing: { before: spacing.topSpacing } }));

  // 2. English label with accent bottom border (single-space letterspreading for long labels)
  if (config.englishLabel) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 500 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: P.accent, space: 8 } },
      children: [new TextRun({
        text: config.englishLabel.split("").join(" "),
        size: 18, color: P.accent, font: { ascii: "Calibri", eastAsia: "SimHei" }, characterSpacing: 40,
      })],
    }));
  }

  // 3. Main title (dynamic size + explicit line spacing to avoid clipping)
  for (let i = 0; i < titleLines.length; i++) {
    children.push(new Paragraph({
      indent: { left: padL },
      spacing: { after: i < titleLines.length - 1 ? 100 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [new TextRun({
        text: titleLines[i], size: titleSize, bold: true,
        color: P.titleColor, font: { eastAsia: "SimHei", ascii: "Arial" },
      })],
    }));
  }

  // 4. Subtitle
  if (config.subtitle) {
    children.push(new Paragraph({
      indent: { left: padL }, spacing: { after: 800 },
      children: [new TextRun({
        text: config.subtitle, size: 24, color: P.subtitleColor,
        font: { eastAsia: "Microsoft YaHei", ascii: "Arial" },
      })],
    }));
  }

  // 5. Meta info lines with left accent border
  for (const line of (config.metaLines || [])) {
    children.push(new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80 },
      border: { left: accentLeft },
      children: [new TextRun({
        text: line, size: 24, color: P.metaColor,
        font: { eastAsia: "Microsoft YaHei", ascii: "Arial" },
      })],
    }));
  }

  // 6. Bottom whitespace (dynamic)
  children.push(new Paragraph({ spacing: { before: spacing.bottomSpacing } }));

  // 7. Footer with top accent separator
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: P.accent, space: 8 } },
    spacing: { before: 200 },
    children: [
      new TextRun({ text: config.footerLeft || "", size: 16, color: P.footerColor, font: { ascii: "Arial" } }),
      new TextRun({ text: "                                        ", size: 16, color: P.footerColor, font: { ascii: "Arial" } }),
      new TextRun({ text: config.footerRight || "", size: 16, color: P.footerColor, font: { ascii: "Arial" } }),
    ],
  }));

  // Single 16838 wrapper — the ONLY table, allNoBorders, exact height
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: P.bg }, borders: noBorders,
        verticalAlign: "top",
        children,
      })],
    })],
  })];
}

// ── Body block builders ───────────────────────────────────────────────────────
function runsOf(textOrRuns) {
  const arr = typeof textOrRuns === "string" ? [{ t: textOrRuns }] : textOrRuns;
  return arr.map(r => new TextRun({ text: r.t, bold: !!r.b, size: 24, color: "000000", font: FONT }));
}
function para(textOrRuns, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, before: opts.before || 0, after: opts.after !== undefined ? opts.after : 120 },
    keepNext: opts.keepNext || undefined,
    children: runsOf(textOrRuns),
  });
}
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER,
    spacing: { before: 360, after: 160, line: 312 },
    children: [new TextRun({ text, bold: true, size: 32, color: P.headingColor, font: FONT })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2, alignment: AlignmentType.LEFT,
    spacing: { before: 240, after: 120, line: 312 },
    children: [new TextRun({ text, bold: true, size: 30, color: P.headingColor, font: FONT })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3, alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 100, line: 312 },
    children: [new TextRun({ text, bold: true, size: 28, color: P.headingColor, font: FONT })],
  });
}
function bullet(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT, bullet: { level: 0 },
    spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, size: 24, color: "000000", font: FONT })],
  });
}
function numbered(text, ref) {
  return new Paragraph({
    alignment: AlignmentType.LEFT, numbering: { reference: ref, level: 0 },
    spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, size: 24, color: "000000", font: FONT })],
  });
}
function cellPara(text, bold, color) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    children: [new TextRun({ text, bold: !!bold, size: 21, color: color || "000000", font: FONT })],
  });
}
function buildTable(cfg) {
  const out = [];
  out.push(new Paragraph({
    keepNext: true, alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 100, line: 312 },
    children: [new TextRun({ text: cfg.title, bold: true, size: 21, color: "000000", font: FONT })],
  }));
  const headerRow = new TableRow({
    tableHeader: true, cantSplit: true,
    children: cfg.headers.map((htext, i) => new TableCell({
      width: { size: cfg.widths[i], type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: P.table.headerBg },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [cellPara(htext, true, P.table.headerText)],
    })),
  });
  const dataRows = cfg.rows.map(r => new TableRow({
    cantSplit: true,
    children: r.map((cell, ci) => new TableCell({
      width: { size: cfg.widths[ci], type: WidthType.PERCENTAGE },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [cellPara(cell, (cfg.colBold || []).includes(ci))],
    })),
  }));
  out.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: P.table.accentLine },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: P.table.accentLine },
      left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
      insideVertical: NB,
    },
    rows: [headerRow, ...dataRows],
  }));
  out.push(new Paragraph({ spacing: { after: 160, line: 312 }, children: [] }));
  return out;
}
function figureBlock(fig) {
  const buf = fs.readFileSync(fig.path);
  const dims = pngDims(buf);
  const w = fig.width;
  const h = Math.round(w * (dims.height / dims.width));
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 200, after: 60 },
      children: [new ImageRun({ data: buf, transformation: { width: w, height: h }, type: "png" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 200, line: 312 },
      children: [new TextRun({ text: fig.caption, size: 21, color: "404040", font: FONT })],
    }),
  ];
}

// ── Render content blocks ─────────────────────────────────────────────────────
function renderBlocks(blocks) {
  const out = [];
  let qaCounter = 0;
  for (const b of blocks) {
    if (b.h1 !== undefined) out.push(h1(b.h1));
    else if (b.h2 !== undefined) out.push(h2(b.h2));
    else if (b.h3 !== undefined) out.push(h3(b.h3));
    else if (b.p !== undefined) out.push(para(b.p));
    else if (b.bullets !== undefined) { for (const it of b.bullets) out.push(bullet(it)); }
    else if (b.numbered !== undefined) { for (const it of b.numbered) out.push(numbered(it, b.ref)); }
    else if (b.table !== undefined) out.push(...buildTable(b.table));
    else if (b.figure !== undefined) out.push(...figureBlock(b.figure));
    else if (b.qa !== undefined) {
      qaCounter += 1;
      out.push(new Paragraph({
        alignment: AlignmentType.LEFT, keepNext: true,
        spacing: { before: 160, after: 60, line: 312 },
        children: [new TextRun({ text: "Q" + qaCounter + ". " + b.qa.q, bold: true, size: 24, color: "000000", font: FONT })],
      }));
      out.push(new Paragraph({
        alignment: AlignmentType.LEFT, spacing: { after: 140, line: 312 },
        children: [new TextRun({ text: "Model answer: " + b.qa.a, size: 24, color: "000000", font: FONT })],
      }));
    }
  }
  return out;
}

// ── Header / footer factories (fresh instances per section) ──────────────────
function pageHeader() {
  return new Header({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 0, line: 240 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "C8DDE2" } },
      children: [new TextRun({
        text: "Grievance360 - SIH26264 Qualifying Round Readiness Review",
        size: 18, color: "808080", font: FONT,
      })],
    })],
  });
}
function pageFooter() {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080", font: FONT })],
    })],
  });
}

// ── Assembly ─────────────────────────────────────────────────────────────────
const coverConfig = {
  englishLabel: "SMART INDIA HACKATHON 2026",
  title: "Grievance360 Automation Readiness Review",
  subtitle: "SIH 2026 · PS 26264 (AICTE) · Software · Smart Automation Theme",
  metaLines: [
    "Problem Statement: Integrated Dashboard for Complaint Case Monitoring",
    "Project: Grievance360 Dashboard - 11 Smart Automations",
    "Review Focus: SIH Judging Fit · Feasibility · Gap Analysis",
    "Idea Submission Deadline: 28 October 2026",
    "Report Date: 23 October 2026",
  ],
  footerLeft: "SIH 2026 | 9th Edition | Software Track",
  footerRight: "Team Internal Review",
  palette: P,
};

const frontMatterChildren = [
  // TOC title — MUST NOT use Heading style (prevents self-indexing)
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 480, after: 360 },
    children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, color: "000000", font: FONT })],
  }),
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
  // Mandatory refresh hint (stays on the TOC page; no trailing PageBreak —
  // the next section is NEXT_PAGE and a trailing break would create a blank page)
  new Paragraph({
    spacing: { before: 200 },
    children: [new TextRun({
      text: "Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-click the TOC and select \u201cUpdate Field.\u201d",
      italics: true, size: 18, color: "888888", font: FONT,
    })],
  }),
];

const bodyChildren = renderBlocks([...contentA, ...contentB]);

const doc = new Document({
  creator: "Grievance360 Team",
  title: "SIH26264 Grievance360 Qualifying Round Readiness Review",
  styles: {
    default: {
      document: {
        run: { font: FONT, size: 24, color: "000000" },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: FONT, size: 32, bold: true, color: P.headingColor },
        paragraph: { spacing: { before: 360, after: 160, line: 312 }, alignment: AlignmentType.CENTER, outlineLevel: 0 },
      },
      heading2: {
        run: { font: FONT, size: 30, bold: true, color: P.headingColor },
        paragraph: { spacing: { before: 240, after: 120, line: 312 }, outlineLevel: 1 },
      },
      heading3: {
        run: { font: FONT, size: 28, bold: true, color: P.headingColor },
        paragraph: { spacing: { before: 200, after: 100, line: 312 }, outlineLevel: 2 },
      },
    },
  },
  numbering: {
    config: [
      {
        reference: "demo-flow",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  sections: [
    { // Section 1: Cover — margin 0, no header/footer, no pageNumbers
      properties: {
        page: { size: pgSize, margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      },
      children: buildCoverR1(coverConfig),
    },
    { // Section 2: Front matter (TOC) — Roman numerals from i
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { size: pgSize, margin: pgMargin, pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN } },
      },
      headers: { default: pageHeader() },
      footers: { default: pageFooter() },
      children: frontMatterChildren,
    },
    { // Section 3: Body — Arabic numerals reset to 1
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { size: pgSize, margin: pgMargin, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } },
      },
      headers: { default: pageHeader() },
      footers: { default: pageFooter() },
      children: bodyChildren,
    },
  ],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log("WROTE " + OUT + " (" + buf.length + " bytes)");
});
