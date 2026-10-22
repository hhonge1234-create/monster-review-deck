"""v2 deck charts (matplotlib): length distribution, word cloud, emotion-flow GIF.
Run: python3 build_charts_v2.py  -> deck/assets/v2/*
"""
import json, re, collections
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
from matplotlib.animation import FuncAnimation, PillowWriter

ROOT = Path(__file__).parent
OUT = ROOT / "deck/assets/v2"
OUT.mkdir(parents=True, exist_ok=True)
FONT = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
fm.fontManager.addfont(FONT)
plt.rcParams["font.family"] = fm.FontProperties(fname=FONT).get_name()
plt.rcParams["axes.unicode_minus"] = False

INK, MUTED, MOSS, LEAF, SUN, RED, PAPER = "#22301F", "#6B7464", "#3F6B34", "#8DBE6A", "#E9B949", "#D63B2F", "#F7F4EC"

reviews = json.load(open(ROOT / "watcha_괴물_리뷰.json"))
texts = [(r.get("full_text") or r["text"]).strip() for r in reviews]

# 1) length distribution -------------------------------------------------------
L = np.array([len(t) for t in texts])
bins = [(1, 10, "1–10자"), (11, 25, "11–25자"), (26, 50, "26–50자"), (51, 100, "51–100자"), (101, 10**6, "100자 이상")]
vals = [int(((L >= lo) & (L <= hi)).sum()) for lo, hi, _ in bins]
assert sum(vals) == len(texts) == 477, vals
fig, ax = plt.subplots(figsize=(8, 4.4), dpi=200)
fig.patch.set_alpha(0); ax.set_facecolor("none")
colors = [MOSS, MOSS, LEAF, LEAF, SUN]
bars = ax.bar([b[2] for b in bins], vals, color=colors, width=0.62, zorder=3)
for b, v in zip(bars, vals):
    ax.text(b.get_x() + b.get_width() / 2, v + 4, f"{v}건", ha="center", va="bottom", fontsize=12, color=INK, fontweight="bold")
ax.axhline(0, color=INK, lw=1)
for s in ["top", "right", "left"]:
    ax.spines[s].set_visible(False)
ax.spines["bottom"].set_visible(False)
ax.set_yticks([]); ax.tick_params(axis="x", colors=MUTED, labelsize=11, length=0)
ax.set_ylim(0, max(vals) * 1.18)
ax.text(4, vals[4] + 26, "심층 리뷰\n≈ 10%", ha="center", va="bottom", fontsize=10.5, color="#8A6A12")
fig.tight_layout(); fig.savefig(OUT / "length_dist.png", transparent=True); plt.close(fig)
print("length", vals, "mean", L.mean().round(1), "median", np.median(L))

# 2) word cloud (forest palette, report-driven emphasis) -----------------------
from wordcloud import WordCloud
STOP = set("영화 영화를 영화가 영화는 영화의 진짜 너무 정말 그리고 그냥 하는 있는 없는 것은 것을 것이 수 더 이 그 저 좀 잘 또 다 한 할 것 같다 같은 같아 있다 없다 했다 된다 보고 보는 본 때 거 게 건 걸 듯 및 등 왜 더욱 이런 그런 저런 우리 모든 모두 어떤 하고 해서 하지만 그래서 때문에 이렇게 아니라 않아 그것 있어 것들 한다 있고 그저 그들 이들 없어 없었다 했던 이야기이며 있을 하나 통해 너무너무 원래 무엇 이제 걸까 먼저 따라 봤다 하게".split())
cnt = collections.Counter()
for t in texts:
    for w in re.findall(r"[가-힣A-Za-z]{2,}", t):
        if w in STOP:
            continue
        w2 = re.sub(r"(은|는|이|가|을|를|의|에|도|로|으로|와|과|이다|이었다|였다|이야|인가|일까|이라|라고|에게|까지|에서|이고)$", "", w)
        if len(w2) >= 2 and w2 not in STOP:
            cnt[w2] += 1
# report table values for the two headline words
cnt["괴물"] = 146
cnt["나"] = 62

def color_fn(word, *a, **k):
    if word == "괴물":
        return RED
    if word in ("나", "누가", "행복", "오해", "사랑", "위로", "다시"):
        return SUN if word in ("행복", "위로", "사랑") else INK
    return [MOSS, "#2F5130", "#557F44", LEAF][hash(word) % 4]

wc = WordCloud(font_path=FONT, width=1600, height=900, background_color=None, mode="RGBA",
               max_words=110, prefer_horizontal=0.92, relative_scaling=0.45, margin=4,
               color_func=color_fn, random_state=7).generate_from_frequencies(dict(cnt.most_common(160)))
wc.to_file(str(OUT / "wordcloud.png"))
print("wc top", cnt.most_common(12))

# 3) emotion flow GIF: 슬픔 -> 성찰 -> 위로 ------------------------------------
stages = ["슬픔·눈물", "혼란·전복", "자기 성찰", "위로·구원"]
x = np.linspace(0, 3, 300)
# intensity curve: dip (sadness), turbulence, rise (reflection), plateau warm (comfort)
y = 0.45 - 0.30 * np.exp(-((x - 0.15) ** 2) / 0.18) + 0.08 * np.sin(x * 9) * np.exp(-((x - 1.0) ** 2) / 0.12) \
    + 0.42 / (1 + np.exp(-(x - 1.9) * 3.2))
cols = [matplotlib.colors.to_rgb(c) for c in ["#5E7FA0", "#7C8F7A", LEAF, SUN]]

fig, ax = plt.subplots(figsize=(9, 4.2), dpi=110)
fig.patch.set_facecolor(PAPER); ax.set_facecolor(PAPER)
ax.set_xlim(-0.1, 3.1); ax.set_ylim(0, 1.05)
for s in ax.spines.values():
    s.set_visible(False)
ax.set_yticks([]); ax.set_xticks([0, 1, 2, 3]); ax.set_xticklabels(stages, fontsize=13, color=INK)
ax.tick_params(length=0)
ax.text(-0.08, 1.0, "감정의 온도", fontsize=11, color=MUTED, va="top")
line, = ax.plot([], [], lw=3.2, color=INK, solid_capstyle="round")
dot, = ax.plot([], [], "o", ms=11, color=RED)
fills = []

def seg_color(xi):
    i = min(int(xi), 2); f = xi - i
    return tuple(cols[i][j] * (1 - f) + cols[i + 1][j] * f for j in range(3))

N = 60
def update(fr):
    n = int(len(x) * min(1, (fr + 1) / N))
    for p in fills:
        p.remove()
    fills.clear()
    if n > 2:
        for i in range(0, n - 1, 6):
            j = min(i + 7, n)
            fills.append(ax.fill_between(x[i:j], 0, y[i:j], color=seg_color(x[i]), alpha=0.55, lw=0))
        line.set_data(x[:n], y[:n]); dot.set_data([x[n - 1]], [y[n - 1]])
    return [line, dot]

anim = FuncAnimation(fig, update, frames=N + 25, interval=50)
fig.tight_layout()
anim.save(OUT / "emotion_flow.gif", writer=PillowWriter(fps=20))
plt.close(fig)
print("done ->", OUT)
