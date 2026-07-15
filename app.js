const GAS_URL = "https://script.google.com/macros/s/AKfycbz_kVbBkm2vye9FRcSOTzvYHNLFTVesZp45x7By_hFrLcJJLgPDieuoXlU7IlYpcehm/exec";

const CATEGORY_STRUCTURE = {
    "主体的な学び": ["探究心を育む知育環境", "子ども主導のプロジェクト学習", "デジタルを活用した自己表現", "その他"],
    "楽しさと好奇心": ["五感を使う自然体験", "失敗を歓迎する科学遊び", "地域のアート・文化資源の活用", "その他"],
    "未来を生き抜く力": ["非認知能力の育成", "多様な人々と協働する体験", "答えのない問いに挑む力", "その他"],
    "個性・才能の開花": ["個別最適化された学習プラン", "多様な才能を認める評価基準", "特別なニーズを持つ子への支援", "その他"],
    "シームレス成長支援": ["保幼小の連携強化", "切れ目のない相談窓口", "育児休業からの復職支援", "その他"]
};

let allOpinions = [];
let currentAiResult = null;
let currentMapKey = null;

document.addEventListener("DOMContentLoaded", function () {
    const btnAiAnalysis = document.getElementById("btnAiAnalysis");
    const btnSubmitToBox = document.getElementById("btnSubmitToBox");
    const aiPlaceholder = document.getElementById("aiPlaceholder");
    const aiAssistBox = document.getElementById("aiAssistBox");
    const aiSummaryText = document.getElementById("aiSummaryText");
    const aiPerspectivesText = document.getElementById("aiPerspectivesText");
    const aiTitleText = document.getElementById("aiTitleText");
    const aiRefinedText = document.getElementById("aiRefinedText");

    if (aiAssistBox) aiAssistBox.classList.add("d-none");
    if (aiPlaceholder) aiPlaceholder.style.removeProperty("display");

    fetchOpinions();

    if (btnAiAnalysis) {
        btnAiAnalysis.addEventListener("click", async function () {
            const txtContent = document.getElementById("content");
            const contentValue = txtContent ? txtContent.value.trim() : "";

            if (!contentValue) {
                alert("あなたの想いやアイデアを自由に入力してください。");
                return;
            }

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

                    if (aiSummaryText) aiSummaryText.innerHTML = `<strong>【自動分類】</strong> ${bigCat} ＞ ${midCat}`;

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

                    if (currentMapKey) refreshMapAnalysis(currentMapKey);
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
                    currentAiResult = null;
                    if (aiAssistBox) aiAssistBox.classList.add("d-none");
                    if (aiPlaceholder) aiPlaceholder.style.removeProperty("display");
                    await fetchOpinions();
                    const listTabBtn = document.getElementById("list-tab-btn");
                    if (listTabBtn) listTabBtn.click();
                } else {
                    alert("投稿エラー: " + (data.message || "不明なエラー"));
                    btnSubmitToBox.disabled = false;
                }
            } catch (err) {
                console.error(err);
                alert("送信エラーが発生しました。");
                btnSubmitToBox.disabled = false;
            } finally {
                btnSubmitToBox.disabled = false;
                btnSubmitToBox.innerHTML = `📥 この内容で提案箱へ正式に投稿する`;
            }
        });
    }

    document.querySelectorAll("[data-map-key]").forEach(btn => {
        btn.addEventListener("click", function () {
            currentMapKey = this.getAttribute("data-map-key");
            refreshMapAnalysis(currentMapKey);
        });
    });
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

function refreshMapAnalysis(key) {
    const mapAnalysis = document.getElementById("map-analysis");
    const processLog = document.getElementById("process-log");
    const group = CATEGORY_STRUCTURE[key] || CATEGORY_STRUCTURE["主体的な学び"];
    const opinions = allOpinions.filter(o => (o.bigCatName || "").trim() === key);

    if (mapAnalysis) {
        const counts = group.map(mid => ({
            mid,
            count: opinions.filter(o => (o.midCatName || "").trim() === mid).length
        }));

        mapAnalysis.innerHTML = `
            <div class="fw-bold mb-2">選択中：${escapeHtml(key)}</div>
            <div class="small text-muted mb-3">この枠はボタンを押した時だけ更新されます。</div>
            ${counts.map(x => `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span>${escapeHtml(x.mid)}</span>
                    <span class="badge bg-primary">${x.count}</span>
                </div>
            `).join("")}
        `;
    }

    if (processLog) {
        const latest = opinions.slice(-5).reverse();
        processLog.innerHTML = latest.length ? latest.map((o, i) => `
            <div class="opinion-card">
                <div class="card-title-text">${i + 1}. ${escapeHtml(o.title || "無題")}</div>
                <div class="badge-keyword">${escapeHtml(o.midCatName || "")}</div>
                <div class="small text-muted">${escapeHtml(o.status || "単独提案")}</div>
            </div>
        `).join("") : "該当する投稿はまだありません。";
    }
}

function renderProposalTree(opinions) {
    const container = document.getElementById("proposal-container");
    if (!container) return;
    container.innerHTML = "";

    const entries = Object.entries(CATEGORY_STRUCTURE);

    container.innerHTML = entries.map(([big, mids], idx) => {
        const bigOpinions = opinions.filter(o => (o.bigCatName || "").trim() === big);
        return `
        <div class="category-accordion-item">
            <button class="category-accordion-header" type="button" onclick="toggleTree('big${idx}')">
                <span>🌳 ${escapeHtml(big)}</span>
                <span class="badge bg-primary">${bigOpinions.length}</span>
            </button>
            <div id="big${idx}" class="category-accordion-body" style="display:none;">
                <div class="row g-3">
                    ${mids.map((mid, midIdx) => {
                        const midOpinions = bigOpinions.filter(o => (o.midCatName || "").trim() === mid);
                        return `
                        <div class="col-lg-6">
                            <div class="lane-col">
                                <div class="col-header d-flex justify-content-between">
                                    <span>${escapeHtml(mid)}</span>
                                    <span>${midOpinions.length}</span>
                                </div>
                                ${midOpinions.length ? midOpinions.map((post, pIdx) => `
                                    <div class="opinion-card border-${pickBorder(midOpinions.length, pIdx)}">
                                        <div class="card-title-text">${escapeHtml(post.title || "無題")}</div>
                                        <div class="badge-keyword">${escapeHtml(post.status || "単独提案")}</div>
                                        <div class="small text-muted mb-2">${escapeHtml((post.reason || "").slice(0, 60))}</div>
                                        <button class="btn btn-sm btn-outline-secondary" type="button" onclick="toggleTree('post${idx}_${midIdx}_${pIdx}')">詳細</button>
                                        <div id="post${idx}_${midIdx}_${pIdx}" style="display:none;" class="mt-2 small text-dark">
                                            ${escapeHtml(post.summary || "")}
                                        </div>
                                    </div>
                                `).join("") : `<div class="text-muted small">まだ投稿はありません。</div>`}
                            </div>
                        </div>`;
                    }).join("")}
                </div>
            </div>
        </div>`;
    }).join("");
}

function pickBorder(count, idx) {
    if (idx % 3 === 0) return "primary-custom";
    if (idx % 3 === 1) return "success-custom";
    return "danger-custom";
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
