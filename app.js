const GAS_URL = "https://script.google.com/macros/s/AKfycbz_kVbBkm2vye9FRcSOTzvYHNLFTVesZp45x7By_hFrLcJJLgPDieuoXlU7IlYpcehm/exec";

const CATEGORY_STRUCTURE = {
    "主体的な学び": ["子ども主導のプロジェクト学習", "選択制のアクティビティ", "デジタルを活用した自己表現", "その他"],
    "楽しさと好奇心": ["五感を使う自然体験", "失敗を歓迎する科学遊び", "地域のアート・文化資源の活用", "その他"],
    "未来を生き抜く力": ["非認知能力の育成", "多様な人々と協働する体験", "答えのない問いに挑む力", "その他"],
    "個性・才能の開花": ["個別最適化された学習プラン", "多様な才能を認める評価基準", "特別なニーズを持つ子への支援", "その他"],
    "シームレス成長支援": ["保幼小の連携強化", "切れ目のない相談窓口", "育児休業からの復職支援", "その他"]
};

const BIG_ORDER = ["主体的な学び", "楽しさと好奇心", "未来を生き抜く力", "個性・才能の開花", "シームレス成長支援"];
const STATUS_META = {
    "新統合": { label: "新統合", cls: "bg-danger", icon: "🆕" },
    "新提案": { label: "新提案", cls: "bg-primary", icon: "✨" },
    "元記事": { label: "元記事", cls: "bg-secondary", icon: "📄" },
    "単独提案": { label: "新提案", cls: "bg-primary", icon: "✨" }
};

let allOpinions = [];
let currentAiResult = null;
let mapBaseData = {
    "主体的な学び": "",
    "楽しさと好奇心": "",
    "未来を生き抜く力": "",
    "個性・才能の開花": "",
    "シームレス成長支援": ""
};
let mapLiveMode = false;

document.addEventListener("DOMContentLoaded", function () {
    const btnAiAnalysis = document.getElementById("btnAiAnalysis");
    const btnSubmitToBox = document.getElementById("btnSubmitToBox");
    const aiPlaceholder = document.getElementById("aiPlaceholder");
    const aiAssistBox = document.getElementById("aiAssistBox");
    const aiSummaryText = document.getElementById("aiSummaryText");
    const aiPerspectivesText = document.getElementById("aiPerspectivesText");
    const aiTitleText = document.getElementById("aiTitleText");
    const aiRefinedText = document.getElementById("aiRefinedText");
    const btnMapRefresh = document.getElementById("btnMapRefresh");
    const btnMapClear = document.getElementById("btnMapClear");
    const btnRefreshProposalBox = document.getElementById("btnRefreshProposalBox");

    if (aiAssistBox) aiAssistBox.classList.add("d-none");
    if (aiPlaceholder) aiPlaceholder.style.removeProperty("display");

    fetchOpinions();

    if (btnMapRefresh) btnMapRefresh.addEventListener("click", () => {
        mapLiveMode = true;
        renderMapPanels();
    });

    if (btnMapClear) btnMapClear.addEventListener("click", () => {
        mapLiveMode = false;
        renderMapPanels();
    });

    if (btnRefreshProposalBox) {
        btnRefreshProposalBox.addEventListener("click", fetchOpinions);
    }

    if (btnAiAnalysis) {
        btnAiAnalysis.addEventListener("click", async function () {
            const txtContent = document.getElementById("content");
            const contentValue = txtContent ? txtContent.value.trim() : "";
            if (!contentValue) return alert("あなたの想いやアイデアを自由に入力してください。");

            btnAiAnalysis.disabled = true;
            btnAiAnalysis.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> AIが思考を整理中...`;

            try {
                const res = await fetch(GAS_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({ action: "analyze", content: contentValue })
                });
                const data = await res.json();
                if (data.status === "success") {
                    currentAiResult = data.result;
                    const bigCat = currentAiResult["大分類"] || "その他";
                    const midCat = currentAiResult["中分類"] || "その他";

                    if (aiSummaryText) aiSummaryText.innerHTML = `<strong>【自動分類】</strong> ${escapeHtml(bigCat)} ＞ ${escapeHtml(midCat)}`;

                    if (aiPerspectivesText) {
                        aiPerspectivesText.innerHTML = `
<div class="mb-3"><strong>a. この意見の核心</strong><br><span class="text-dark">${escapeHtml(currentAiResult["核心"] || "分析中")}</span></div>
<div class="mb-3"><strong>b. 実現した場合の変化</strong><br><span class="text-dark">${escapeHtml(currentAiResult["変化"] || "分析中")}</span></div>
<div class="mb-3"><strong>c. 成功事例</strong><br><span class="text-dark">${escapeHtml(currentAiResult["成功事例"] || "分析中")}</span></div>
<div class="mb-3"><strong>d. 懸念点</strong><br><span class="text-dark">${escapeHtml(currentAiResult["懸念点"] || "分析中")}</span></div>
<div class="mb-1"><strong>e. 発展させる問い</strong><br><span class="text-dark">${escapeHtml(currentAiResult["問い"] || "分析中")}</span></div>
                        `.trim();
                    }

                    if (aiTitleText) aiTitleText.textContent = currentAiResult["推奨タイトル"] || "無題の提案";
                    if (aiRefinedText) aiRefinedText.textContent = currentAiResult["要約200"] || "";

                    if (aiPlaceholder) aiPlaceholder.style.setProperty("display", "none", "important");
                    if (aiAssistBox) {
                        aiAssistBox.style.setProperty("display", "flex", "important");
                        aiAssistBox.classList.remove("d-none");
                    }
                } else {
                    alert("AI分析エラー: " + data.message);
                }
            } catch (err) {
                console.error(err);
                alert("通信エラーが発生しました。");
            } finally {
                btnAiAnalysis.disabled = false;
                btnAiAnalysis.innerHTML = `✨ 1. 意見を送信してAIと壁打ちする`;
            }
        });
    }

    if (btnSubmitToBox) {
        btnSubmitToBox.addEventListener("click", async function () {
            if (!currentAiResult) return;
            const bigCat = currentAiResult["大分類"] || "その他";
            const midCat = currentAiResult["中分類"] || "その他";
            if (!confirm(`正式に提案箱へ投稿しますか？\n(大分類「${bigCat}」 > 中分類「${midCat}」へ格納されます)`)) return;

            const txtContent = document.getElementById("content");
            const rawText = txtContent ? txtContent.value.trim() : "";

            btnSubmitToBox.disabled = true;
            btnSubmitToBox.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> 提案箱へ投稿中...`;

            try {
                const res = await fetch(GAS_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({
                        action: "submit",
                        content: rawText,
                        title: currentAiResult["推奨タイトル"] || "無題の提案",
                        summary: currentAiResult["要約200"] || "",
                        bigCatName: bigCat,
                        midCatName: midCat,
                        aiResult: currentAiResult
                    })
                });
                const data = await res.json();

                if (data.status === "success") {
                    alert("📥 投稿が完了しました！");
                    if (txtContent) txtContent.value = "";
                    if (aiAssistBox) aiAssistBox.classList.add("d-none");
                    if (aiPlaceholder) aiPlaceholder.style.removeProperty("display");
                    currentAiResult = null;
                    await fetchOpinions();
                    const listTabBtn = document.getElementById("list-tab-btn");
                    if (listTabBtn) listTabBtn.click();
                } else {
                    alert("投稿エラー: " + (data.message || "不明なエラー"));
                }
            } catch (err) {
                console.error(err);
                alert("送信エラーが発生しました。");
            } finally {
                btnSubmitToBox.disabled = false;
                btnSubmitToBox.innerHTML = `📥 この内容で提案箱へ正式に投稿する`;
            }
        });
    }

    renderMapPanels();
});

async function fetchOpinions() {
    try {
        const res = await fetch(GAS_URL + "?action=get");
        const data = await res.json();
        if (data.status !== "success") return;
        allOpinions = data.opinions || [];
        renderProposalTree(allOpinions);
    } catch (e) {
        console.error(e);
    }
}

function renderMapPanels() {
    const baseEls = {};
    const sumEls = {};
    BIG_ORDER.forEach(big => {
        baseEls[big] = document.getElementById(`base-text-${pickBigKey(big)}`);
        sumEls[big] = document.getElementById(`sum-text-${pickBigKey(big)}`);
    });

    if (!mapLiveMode) {
        BIG_ORDER.forEach(big => {
            const baseEl = document.getElementById(`base-text-${pickBigKey(big)}`);
            const sumEl = document.getElementById(`sum-text-${pickBigKey(big)}`);
            if (baseEl) baseEl.innerHTML = mapBaseData[big] || getDefaultBaseText(big);
            if (sumEl) sumEl.innerHTML = "";
        });
        return;
    }

    BIG_ORDER.forEach(big => {
        const baseEl = document.getElementById(`base-text-${pickBigKey(big)}`);
        const sumEl = document.getElementById(`sum-text-${pickBigKey(big)}`);
        const related = allOpinions.filter(o => normalizeBig(o.bigCatName) === big && !["元記事", "新統合"].includes(normalizeStatus(o.status)));
        const integrated = allOpinions.filter(o => normalizeBig(o.bigCatName) === big && normalizeStatus(o.status) === "新統合");
        if (baseEl) baseEl.innerHTML = mapBaseData[big] || getDefaultBaseText(big);
        if (sumEl) sumEl.innerHTML = buildRealtimeSummary(big, integrated, related);
    });
}

function getDefaultBaseText(big) {
    const texts = {
        "主体的な学び": "子どもが自分で選び、考え、試せる環境を広げることが大切です。学びは一斉進行だけでなく、興味の違いを受け止める柔軟さが必要です。",
        "楽しさと好奇心": "五感を使う体験や遊びを通じて、知る喜びを育てます。楽しい活動が、自然な探究心と学びにつながる設計が求められます。",
        "未来を生き抜く力": "失敗しても立ち直る力や、人と協力する経験が必要です。知識だけでなく、状況に応じて動ける力を育てる視点が重要です。",
        "個性・才能の開花": "一人ひとりの違いを前提に、得意を伸ばす仕組みが求められます。評価の仕方も、画一的ではなく多面的であるべきです。",
        "シームレス成長支援": "保育・教育・家庭支援を切れ目なくつなぐことで、子どもの成長が途切れないように支えます。相談しやすい導線も大切です。"
    };
    return texts[big] || "";
}

function buildRealtimeSummary(big, integrated, related) {
    const base = getDefaultBaseText(big);
    const merged = integrated.slice(0, 3).map(o => o.summary || o.content || o.title).filter(Boolean).join(" / ");
    const finalText = merged
        ? `${base}\n\n【新統合の要点】${merged}`
        : `${base}\n\n【新統合の要点】まだ統合済み提案はありません。`;
    return finalText;
}

function renderProposalTree(opinions) {
    const container = document.getElementById("proposal-container");
    if (!container) return;

    const bigGroups = groupOpinions(opinions, o => normalizeBig(o.bigCatName));
    const html = BIG_ORDER.map(big => {
        const mids = buildDynamicMids(big, opinions);
        const bigOpinions = bigGroups[big] || [];
        const count = bigOpinions.length;
        return `
        <div class="category-accordion-item" style="background: linear-gradient(180deg, #ffffff, #f8fbff); border: 1px solid #dbeafe;">
            <button class="category-accordion-header" type="button" onclick="toggleTree('big-${slug(big)}')">
                <span>${statusChip("新統合", count)} 🌳 ${escapeHtml(big)}</span>
                <span class="badge bg-primary">${count}</span>
            </button>
            <div id="big-${slug(big)}" class="category-accordion-body" style="display:none;">
                <div class="row g-3">
                    ${mids.map(mid => renderMidColumn(big, mid, opinions)).join("")}
                </div>
            </div>
        </div>`;
    }).join("");

    container.innerHTML = html;
}

function buildDynamicMids(big, opinions) {
    const fixed = CATEGORY_STRUCTURE[big] || [];
    const mids = new Set(["その他", ...fixed]);
    opinions.filter(o => normalizeBig(o.bigCatName) === big).forEach(o => {
        if (o.midCatName) mids.add(o.midCatName);
    });
    return Array.from(mids);
}

function renderMidColumn(big, mid, opinions) {
    const group = opinions.filter(o => normalizeBig(o.bigCatName) === big && normalizeMid(o.midCatName, big) === mid);
    const merged = group.filter(o => normalizeStatus(o.status) === "新統合");
    const proposals = group.filter(o => normalizeStatus(o.status) === "新提案" || normalizeStatus(o.status) === "単独提案" || !normalizeStatus(o.status));
    const originals = group.filter(o => normalizeStatus(o.status) === "元記事");
    return `
    <div class="col-lg-4">
        <div class="lane-col shadow-sm" style="background: linear-gradient(180deg, #fff, #f8fafc);">
            <div class="col-header d-flex justify-content-between align-items-center">
                <span>📂 ${escapeHtml(mid)}</span>
                <span class="badge bg-dark">${group.length}</span>
            </div>

            <div class="mb-2">${statusLabel("新統合")} ${merged.length}</div>
            ${merged.length ? merged.map((post, i) => renderPostCard(post, "新統合", i)).join("") : `<div class="text-muted small mb-3">新統合はまだありません。</div>`}

            <div class="mb-2">${statusLabel("新提案")} ${proposals.length}</div>
            ${proposals.length ? proposals.map((post, i) => renderPostCard(post, "新提案", i)).join("") : `<div class="text-muted small mb-3">新提案はまだありません。</div>`}

            <div class="mb-2">${statusLabel("元記事")} ${originals.length}</div>
            ${originals.length ? `
                <div class="accordion" id="acc-${slug(big)}-${slug(mid)}">
                    ${originals.map((post, i) => renderOriginalFolder(post, big, mid, i)).join("")}
                </div>
            ` : `<div class="text-muted small">元記事はまだありません。</div>`}
        </div>
    </div>`;
}

function renderPostCard(post, status, idx) {
    const meta = STATUS_META[status] || STATUS_META["新提案"];
    return `
    <div class="opinion-card border-${pickBorder(idx)}">
        <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
            <div class="card-title-text mb-0">${escapeHtml(post.title || "無題")}</div>
            <span class="badge ${meta.cls}">${meta.icon} ${meta.label}</span>
        </div>
        <div class="small text-muted mb-2">${escapeHtml((post.reason || post.summary || post.content || "").slice(0, 90))}</div>
        <button class="btn btn-sm btn-outline-secondary" type="button" onclick="toggleTree('detail-${slug(post.title || "x")}-${idx}')">詳細</button>
        <div id="detail-${slug(post.title || "x")}-${idx}" style="display:none;" class="mt-2 small text-dark">${escapeHtml(post.summary || post.content || "")}</div>
    </div>`;
}

function renderOriginalFolder(post, big, mid, idx) {
    const id = `orig-${slug(big)}-${slug(mid)}-${idx}`;
    return `
    <div class="accordion-item mb-2 border-0">
        <h2 class="accordion-header" id="h-${id}">
            <button class="accordion-button collapsed py-2 px-3" type="button" data-bs-toggle="collapse" data-bs-target="#c-${id}">
                <span class="badge bg-secondary me-2">📄 元記事</span>
                ${escapeHtml(post.title || "無題")}
            </button>
        </h2>
        <div id="c-${id}" class="accordion-collapse collapse" data-bs-parent="#acc-${slug(big)}-${slug(mid)}">
            <div class="accordion-body bg-light">
                <div class="small text-muted mb-2">${escapeHtml(post.reason || "")}</div>
                <div class="small text-dark">${escapeHtml(post.summary || post.content || "")}</div>
            </div>
        </div>
    </div>`;
}

function statusLabel(status) {
    const meta = STATUS_META[status] || STATUS_META["新提案"];
    return `<span class="badge ${meta.cls} me-1">${meta.icon} ${meta.label}</span>`;
}

function statusChip(status, count) {
    const meta = STATUS_META[status] || STATUS_META["新提案"];
    return `<span class="badge ${meta.cls} me-2">${meta.icon} ${meta.label}</span>`;
}

function normalizeStatus(s) {
    const x = String(s || "").trim();
    if (x === "単独提案") return "新提案";
    return x || "新提案";
}

function normalizeBig(v) {
    return String(v || "その他").trim();
}

function normalizeMid(v, big) {
    const x = String(v || "その他").trim();
    if (!x) return "その他";
    return x;
}

function groupOpinions(list, keyFn) {
    return list.reduce((acc, item) => {
        const key = keyFn(item);
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});
}

function pickBigKey(big) {
    const map = {
        "主体的な学び": "主体",
        "楽しさと好奇心": "好奇心",
        "未来を生き抜く力": "未来",
        "個性・才能の開花": "個性",
        "シームレス成長支援": "シームレス"
    };
    return map[big] || "主体";
}

function pickBorder(idx) {
    return idx % 3 === 0 ? "primary-custom" : idx % 3 === 1 ? "success-custom" : "danger-custom";
}

function slug(s) {
    return String(s || "").replace(/[^\wぁ-んァ-ヶー一-龠]/g, "-");
}

function toggleTree(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = el.style.display === "none" ? "block" : "none";
}

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
