#!/usr/bin/env python3
"""Charts for SIH26264 Grievance360 Qualifying Round Readiness Review (English labels).

Layout hygiene: constrained_layout=True manages all spacing; no tight_layout,
no subplots_adjust, no bbox_inches='tight' (single layout engine per figure).
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import os

OUT_DIR = "/home/z/my-project/scripts/assets"
os.makedirs(OUT_DIR, exist_ok=True)

plt.rcParams["axes.unicode_minus"] = False
plt.rcParams["font.sans-serif"] = ["DejaVu Sans"]

TEXT = "#333333"
GRID = "#E0E0E0"

# DM-1 derived table accent + Morandi support colors (low saturation)
TIER_A = "#1B6B7A"   # dark teal accent (document palette accentLine)
TIER_B = "#6B9DAD"   # Morandi blue
TIER_C = "#B0B0B0"   # neutral grey for emphasis-off items

# ----------------------------------------------------------------------------
# Figure 1 - Automation readiness scores (horizontal bar, colored by tier)
# ----------------------------------------------------------------------------
# (name, score, tier) -- review self-assessment, 0-10
data = [
    ("Auto Complaint Routing",   9.0, "A"),
    ("Auto SLA Escalation",      9.0, "A"),
    ("Auto Audit Logging",       8.0, "A"),
    ("Smart Urgency Detector",   8.0, "A"),
    ("College Rating Engine",    8.0, "A"),
    ("Auto Alert System",        7.0, "B"),
    ("Duplicate Ticket Merger",  7.0, "B"),
    ("OCR Receipt Scanner",      7.0, "B"),
    ("AICTE Rule Suggestions",   6.0, "B"),
    ("Spam & Fake Filter",       6.0, "C"),
    ("Voice & Local Translator", 6.0, "C"),
]
tier_color = {"A": TIER_A, "B": TIER_B, "C": TIER_C}

# barh plots bottom-up -> reverse so the strongest sits on top
data_sorted = sorted(data, key=lambda r: r[1])          # ascending
names = [d[0] for d in data_sorted]
scores = [d[1] for d in data_sorted]
colors = [tier_color[d[2]] for d in data_sorted]

fig, ax = plt.subplots(figsize=(10, 6), constrained_layout=True)
bars = ax.barh(names, scores, color=colors, height=0.62, edgecolor="white")

for bar, val in zip(bars, scores):
    ax.text(val + 0.12, bar.get_y() + bar.get_height() / 2, f"{val:.0f}",
            va="center", ha="left", fontsize=10, color=TEXT)

ax.set_xlim(0, 10.6)
ax.set_xlabel("Overall readiness score (0-10)", fontsize=11, color=TEXT)
ax.set_title("Grievance360 Smart Automations - Readiness Scores (team self-assessment)",
             fontsize=13, pad=12, color=TEXT)
ax.spines[["top", "right"]].set_visible(False)
ax.grid(axis="x", alpha=0.3, color=GRID)
ax.tick_params(axis="y", labelsize=10)
ax.tick_params(axis="x", labelsize=10)

legend_handles = [
    mpatches.Patch(color=TIER_A, label="Tier A - strong qualifying asset"),
    mpatches.Patch(color=TIER_B, label="Tier B - good, needs sharpening"),
    mpatches.Patch(color=TIER_C, label="Tier C - risky without careful framing"),
]
ax.legend(handles=legend_handles, loc="lower right", frameon=False, fontsize=9.5)

fig.savefig(os.path.join(OUT_DIR, "fig1_scores.png"), dpi=200, facecolor="white")
plt.close(fig)

# ----------------------------------------------------------------------------
# Figure 2 - SIH 2026 idea pre-screening evaluation weights (pie, 5 slices)
# ----------------------------------------------------------------------------
labels = [
    "Technical approach\n& feasibility (25%)",
    "Prototype /\nimplementation plan (25%)",
    "Problem understanding\n& innovation (20%)",
    "Impact &\nscalability (20%)",
    "Presentation\nclarity (10%)",
]
values = [25, 25, 20, 20, 10]
pie_colors = ["6B9DAD", "C49B72", "7BA68A", "B87472", "9687A8"]
pie_colors = ["#" + c for c in pie_colors]

fig, ax = plt.subplots(figsize=(8, 8), constrained_layout=True)
wedges, texts, autotexts = ax.pie(
    values, labels=labels, colors=pie_colors,
    autopct="%1.0f%%", startangle=90, pctdistance=0.72,
    textprops={"fontsize": 11, "color": TEXT},
    wedgeprops={"edgecolor": "white", "linewidth": 1.5},
)
for t in autotexts:
    t.set_fontsize(11)
    t.set_color("white")
ax.set_title("SIH 2026 Idea Pre-Screening - Published Evaluation Weights",
             fontsize=13, pad=16, color=TEXT)

fig.savefig(os.path.join(OUT_DIR, "fig2_weights.png"), dpi=200, facecolor="white")
plt.close(fig)

# Print actual pixel dimensions for the docx embedder (aspect-ratio safety)
from PIL import Image
for f in ("fig1_scores.png", "fig2_weights.png"):
    p = os.path.join(OUT_DIR, f)
    w, h = Image.open(p).size
    print(f"{f}: {w}x{h}")
print("CHARTS_DONE")
