const GAS_URL = "https://script.google.com/macros/s/AKfycbz_kVbBkm2vye9FRcSOTzvYHNLFTVesZp45x7By_hFrLcJJLgPDieuoXlU7IlYpcehm/exec";

let allOpinions = [];
let currentAiResult = null;

document.addEventListener("DOMContentLoaded", function () {
    const btnAiAnalysis = document.getElementById("btnAiAnalysis");
    const btnSubmitToBox = document.getElementById("btnSubmitToBox");
    const aiPlaceholder = document.getElementById("aiPlaceholder");
    const aiAssistBox = document.getElementById("aiAssistBox");
    const aiSummaryText = document.getElementById("aiSummaryText");
    const aiPerspectivesText = document.getElementById("aiPerspectivesText");
    const aiTitleText = document.getElementById("aiTitleText");
    const aiRefinedText = document.getElementById("aiRefinedText");



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
<div class="mb-3"><strong>a. この意見の核心（本当の願い・課題）</strong><br><span class="text-dark">${currentAiResult["核心"] || "分析中"}</span></div>
<div class="mb-3"><strong>b. 実現した場合の市民生活への変化</strong><br><span class="text-dark">${currentAiResult["変化"] || "分析中"}</span></div>
<div class="mb-3"><strong>c. 成功事例（国内外）</strong><br><span class="text-dark">${currentAiResult["成功事例"] || "分析中"}</span></div>
<div class="mb-3"><strong>d. 懸念点と乗り越え方</strong><br><span class="text-dark">${currentAiResult["懸念点"] || "分析中"}</span></div>
<div class="mb-1"><strong>e. さらに発展させるための問い</strong><br><span class="text-dark">${currentAiResult["問い"] || "分析中"}</span></div>
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

            const txtContent = document.getElementById("content");
            const rawText = txtContent ? txtContent.value.trim() : "";

            const bigCat = currentAiResult["大分類"] || "その他";
            const midCat = currentAiResult["中分類"] || "その他";

            const message = `正式に提案箱へ投稿しますか？\n(大分類「${bigCat}」 > 中分類「${midCat}」へ格納されます)`;
            if (!confirm(message)) return;

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
                    btnSubmitToBox.disabled = false;
                }
            } catch (err) {
                console.error(err);
                alert("送信エラーが発生しました。");
                btnSubmitToBox.disabled = false;
            }
        });
    }

document.addEventListener("click", function(e) {
    const btn = e.target.closest("[data-map-refresh]");
    if (!btn) return;
    refreshMapAnalysis(btn.getAttribute("data-map-refresh"));
});
});

async function fetchOpinions() {
    try {
        const res = await fetch(GAS_URL + "?action=get");
        const data = await res.json();

        if (data.status !== "success") {
            console.error(data.message);
            return;
        }

        allOpinions = data.opinions || [];
        renderProposalTree(allOpinions);
    } catch (e) {
        console.error(e);
    }
}

function renderProposalTree(opinions) {
    const container = document.getElementById("proposal-container");
    if (!container) return;
    container.innerHTML = "";

    const TREE = CATEGORY_STRUCTURE;

    const statusOrder = ["新統合", "新提案", "元記事"];
    const statusMeta = {
        "新統合": { badge: "bg-success", titleClass: "text-success", icon: "🟢" },
        "新提案": { badge: "bg-warning text-dark", titleClass: "text-warning", icon: "🟡" },
        "元記事": { badge: "bg-secondary", titleClass: "text-secondary", icon: "⚪" }
    };

    const countByStatus = (big, mid, status) => {
        return (opinions || []).filter(o =>
            String(o.bigCatName || "").trim() === big &&
            String(o.midCatName || "").trim() === mid &&
            String(o.status || "新提案").trim() === status
        ).length;
    };

    const articlesBy = (big, mid, status) => {
        return (opinions || [])
            .filter(o =>
                String(o.bigCatName || "").trim() === big &&
                String(o.midCatName || "").trim() === mid &&
                String(o.status || "新提案").trim() === status
            )
            .map(o => ({
                title: String(o.title || "無題"),
                summary: String(o.summary || ""),
                reason: String(o.reason || ""),
                content: String(o.content || ""),
                status: String(o.status || "新提案")
            }));
    };

    let html = `
    <div class="accordion" id="proposalAccordion">
    `;

    Object.keys(TREE).forEach((big, bigIndex) => {
        const bigId = `big-${bigIndex}`;
        const bigCount = (opinions || []).filter(o => String(o.bigCatName || "").trim() === big).length;

        html += `
        <div class="category-accordion-item">
            <button class="category-accordion-header" type="button" onclick="toggleTree('${bigId}')">
                <span>🌳 ${big}</span>
                <span class="badge bg-primary rounded-pill">${bigCount}</span>
            </button>
            <div class="category-accordion-body" id="${bigId}" style="display:none;">
        `;

        TREE[big].forEach((mid, midIndex) => {
            const midId = `mid-${bigIndex}-${midIndex}`;
            const midCount = (opinions || []).filter(o =>
                String(o.bigCatName || "").trim() === big &&
                String(o.midCatName || "").trim() === mid
            ).length;

            html += `
            <div class="category-accordion-item mb-3">
                <button class="category-accordion-header" type="button" onclick="toggleTree('${midId}')">
                    <span>📂 ${mid}</span>
                    <span class="badge bg-dark rounded-pill">${midCount}</span>
                </button>
                <div class="category-accordion-body" id="${midId}" style="display:none;">
                    <div class="lane-row">
            `;

            statusOrder.forEach(status => {
                const items = articlesBy(big, mid, status);
                const meta = statusMeta[status];
                const laneId = `${midId}-${status}`;

                html += `
                <div class="lane-col">
                    <div class="col-header ${meta.titleClass}">
                        ${meta.icon} ${status}
                        <span class="badge bg-light text-dark ms-2">${items.length}</span>
                    </div>
                    <div id="${laneId}">
                `;

                if (!items.length) {
                    html += `<div class="text-muted small">該当記事はありません。</div>`;
                } else {
                    items.forEach((item, idx) => {
                        const postId = `${laneId}-${idx}`;
                        const borderClass =
                            status === "新統合" ? "border-success-custom" :
                            status === "新提案" ? "border-primary-custom" :
                            "border-danger-custom";

                        html += `
                        <div class="opinion-card ${borderClass}">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div class="card-title-text">${escapeHtml(item.title)}</div>
                                <span class="badge ${meta.badge}">${status}</span>
                            </div>
                            <div class="badge-keyword mb-2">
                                ${escapeHtml(big)} / ${escapeHtml(mid)}
                            </div>
                            <button class="btn btn-sm btn-outline-secondary w-100 mb-2" type="button" onclick="toggleTree('${postId}')">
                                詳細を表示
                            </button>
                            <div id="${postId}" style="display:none;">
                                <div class="small text-muted mb-2" style="white-space: pre-wrap;">${escapeHtml(item.summary)}</div>
                                ${item.reason ? `<div class="small text-secondary border-top pt-2" style="white-space: pre-wrap;">${escapeHtml(item.reason)}</div>` : ""}
                            </div>
                        </div>
                        `;
                    });
                }

                html += `
                    </div>
                </div>
                `;
            });

            html += `
                    </div>
                </div>
            </div>
            `;
        });

        html += `
            </div>
        </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}


function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
function toggleTree(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = (el.style.display === "none" || !el.style.display) ? "block" : "none";
}
async function refreshMapAnalysis(categoryKey) {
    const target = document.getElementById(`sum-text-${categoryKey}`);
    if (!target) return;

    target.innerHTML = `<span class="text-muted">読み込み中...</span>`;

    try {
        const res = await fetch(GAS_URL + "?action=get");
        const data = await res.json();
        if (data.status !== "success") {
            target.textContent = "更新に失敗しました。";
            return;
        }

        const all = data.opinions || [];
        const merged = all.filter(o => (o.status || "") === "新統合" && o.bigCatName === categoryKey);

        const fixed = (document.getElementById(`base-text-${categoryKey}`)?.innerText || "").trim();
        const mergedText = merged.map(o => `${o.title} ${o.summary}`).join("。 ");

        if (!merged.length) {
            target.textContent = "まだ新統合記事がありません。";
            return;
        }

        const combined = buildHalfHalfSummary(fixed, mergedText);
        target.textContent = combined;
    } catch (e) {
        console.error(e);
        target.textContent = "更新中にエラーが発生しました。";
    }
}

function buildHalfHalfSummary(fixedText, mergedText) {
    const fixedPart = splitByLength(fixedText, 150);
    const mergedPart = splitByLength(mergedText, 150);
    return `${fixedPart}\n\n${mergedPart}`;
}

function splitByLength(text, len) {
    const t = String(text || "").replace(/\s+/g, " ").trim();
    if (t.length <= len) return t;
    return t.slice(0, len) + "…";
}
