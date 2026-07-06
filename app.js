// ==========================================
// 1. 固定マスター定義（セル位置と混同しないID）
// ==========================================
const GAS_URL = "https://script.google.com/macros/s/AKfycbxm3ntl_jh78mgk-7Bd1w1D2WpWjGaQueKDMc-7kdCUpAmXlIQwtd30R6cIqIlD_IZM/exec";

const STRUCTURE_MASTER = {
    "BIG-1": {
        name: "主体的な学び",
        short: "主体",
        mids: { "MID-1": "子ども主導のプロジェクト学習", "MID-2": "選択制のアクティビティ", "MID-3": "デジタルを活用した自己表現", "MID-4": "その他" }
    },
    "BIG-2": {
        name: "楽しさと好奇心",
        short: "好奇心",
        mids: { "MID-1": "五感を使う自然体験", "MID-2": "失敗を歓迎する科学遊び", "MID-3": "地域のアート・文化資源の活用", "MID-4": "その他" }
    },
    "BIG-3": {
        name: "未来を生き抜く力",
        short: "未来",
        mids: { "MID-1": "非認知能力の育成", "MID-2": "多様な人々と協働する体験", "MID-3": "答えのない問いに挑む力", "MID-4": "その他" }
    },
    "BIG-4": {
        name: "個性・才能の開花",
        short: "個性",
        mids: { "MID-1": "個別最適化された学習プラン", "MID-2": "多様な才能を認める評価基準", "MID-3": "特別なニーズを持つ子への支援", "MID-4": "その他" }
    },
    "BIG-5": {
        name: "シームレス成長支援",
        short: "シームレス",
        mids: { "MID-1": "保幼小の連携強化", "MID-2": "切れ目のない相談窓口", "MID-3": "育児休業からの復職支援", "MID-4": "その他" }
    }
};

let allOpinions = [];
let currentAiResult = null; 

document.addEventListener("DOMContentLoaded", function () {
    fetchOpinions();

    const btnAiAnalysis = document.getElementById("btnAiAnalysis"); 
    const btnSubmitToBox = document.getElementById("btnSubmitToBox");
    const aiPlaceholder = document.getElementById("aiPlaceholder");
    const aiAssistBox = document.getElementById("aiAssistBox");
    const aiSummaryText = document.getElementById("aiSummaryText");
    const aiPerspectivesText = document.getElementById("aiPerspectivesText");
    const aiTitleText = document.getElementById("aiTitleText");
    const aiRefinedText = document.getElementById("aiRefinedText");
    const categorySelect = document.getElementById("categorySelect");

    // 1. AI分析（壁打ち）処理
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

                if (data.status === "success" && data.result) {
                    currentAiResult = data.result; 
                    
                    const bid = currentAiResult.bigCatId || "BIG-1";
                    const mid = currentAiResult.midCatId || "MID-4";
                    const masterBig = STRUCTURE_MASTER[bid] || STRUCTURE_MASTER["BIG-1"];

                    if (categorySelect) categorySelect.value = masterBig.short;

                    if (aiSummaryText) {
                        aiSummaryText.innerHTML = `<strong>【自動分類】</strong> ${masterBig.name} ＞ ${masterBig.mids[mid] || "その他"}`;
                    }

                    if (aiPerspectivesText) {
                        aiPerspectivesText.innerHTML = `
<div class="mb-3"><strong>a. この意見の核心（本当の願い・課題）</strong><br><span class="text-dark">${currentAiResult["核心"] || "データなし"}</span></div>
<div class="mb-3"><strong>b. 実現した場合の市民生活への変化</strong><br><span class="text-dark">${currentAiResult["変化"] || "データなし"}</span></div>
<div class="mb-3"><strong>c. 成功事例（国内外）</strong><br><span class="text-dark">${currentAiResult["成功事例"] || "データなし"}</span></div>
<div class="mb-3"><strong>d. 懸念点と乗り越え方</strong><br><span class="text-dark">${currentAiResult["懸念点"] || "データなし"}</span></div>
<div class="mb-1"><strong>e. さらに発展させるための問い</strong><br><span class="text-dark">${currentAiResult["問い"] || "データなし"}</span></div>
                        `.trim();
                    }

                    if (aiTitleText) aiTitleText.textContent = currentAiResult["推奨タイトル"] || "無題の提案";
                    if (aiRefinedText) aiRefinedText.textContent = currentAiResult["要約200"] || "";

                    if (aiPlaceholder) aiPlaceholder.style.setProperty("display", "none", "important");
                    if (aiAssistBox) {
                        aiAssistBox.classList.remove("d-none");
                        aiAssistBox.style.setProperty("display", "flex", "important");
                    }
                } else {
                    alert("AI分析エラーが発生しました。");
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

    // 2. 正式投稿処理
    if (btnSubmitToBox) {
        btnSubmitToBox.addEventListener("click", async function () {
            if (!currentAiResult) return;

            const selectedShort = categorySelect ? categorySelect.value : "主体";
            let finalBid = "BIG-1";
            for (const [bid, config] of Object.entries(STRUCTURE_MASTER)) {
                if (config.short === selectedShort) { finalBid = bid; break; }
            }

            if (!confirm(`正式に提案箱へ投稿しますか？`)) return;

            const txtContent = document.getElementById("content");
            const rawText = txtContent ? txtContent.value.trim() : "";

            btnSubmitToBox.disabled = true;

            try {
                const res = await fetch(GAS_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({
                        action: "submit",
                        content: rawText,
                        title: currentAiResult["推奨タイトル"],
                        summary: currentAiResult["要約200"],
                        bigCatId: finalBid,
                        midCatId: currentAiResult.midCatId || "MID-4"
                    })
                });
                const data = await res.json();

                if (data.status === "success") {
                    alert(`📥 投稿が完了しました！`);
                    if (txtContent) txtContent.value = "";
                    if (aiAssistBox) {
                        aiAssistBox.classList.add("d-none");
                        aiAssistBox.style.setProperty("display", "none", "important");
                    }
                    if (aiPlaceholder) aiPlaceholder.style.removeProperty("display");
                    currentAiResult = null;

                    await fetchOpinions();

                    const listTabBtn = document.getElementById("list-tab-btn");
                    if (listTabBtn) listTabBtn.click();
                }
            } catch (err) {
                console.error(err);
            } finally {
                btnSubmitToBox.disabled = false;
                btnSubmitToBox.innerHTML = `📥 この内容で提案箱へ正式に投稿する`;
            }
        });
    }
});

// 3. データ取得
// 🌐 GASから届いた日本語の大分類・中分類を正しく画面に認識させる
async function fetchOpinions() {
    try {
        const res = await fetch(GAS_URL + "?action=get");
        const data = await res.json();
        
        if (data.status === "success" && Array.isArray(data.opinions)) {
            allOpinions = data.opinions.map(op => {
                
                // 💡 送られてきた大分類（B列の文字列）を画面のID（BIG-1〜5）に変換する
                let bid = "BIG-1";
                const bStr = String(op.bigCatId);
                if (bStr.includes("主体")) bid = "BIG-1";
                else if (bStr.includes("好奇心") || bStr.includes("楽しさ")) bid = "BIG-2";
                else if (bStr.includes("未来")) bid = "BIG-3";
                else if (bStr.includes("個性") || bStr.includes("才能")) bid = "BIG-4";
                else if (bStr.includes("シームレス") || bStr.includes("成長")) bid = "BIG-5";

                // 💡 送られてきた中分類（F列の文字列）を画面のID（MID-1〜4）に変換する
                let mid = "MID-4"; // 基本はその他
                const mStr = String(op.midCatId);
                const config = STRUCTURE_MASTER[bid];
                if (config && config.mids) {
                    for (const [mKey, mName] of Object.entries(config.mids)) {
                        if (mStr.includes(mName) || mName.includes(mStr)) {
                            mid = mKey;
                            break;
                        }
                    }
                }

                // 画面が表示できるようにデータを整形して戻す
                return {
                    title: op.title,
                    summary: op.summary,
                    content: op.content,
                    bigCatId: bid,  // 整形したIDを入れる
                    midCatId: mid,  // 整形したIDを入れる
                    status: op.status,
                    reason: op.reason
                };
            });
        } else {
            allOpinions = [];
        }
        
        // 画面のレンダリングへ
        render3StepProposalBox(allOpinions);
        renderIdeaMap(allOpinions);
    } catch (e) {
        console.error("データ取得エラー:", e);
    }
}
// 4. 📦 3段階アコーディオン描画（新ID完全一致・堅牢版）
function render3StepProposalBox(opinions) {
    const container = document.getElementById("proposal-container");
    if (!container) return;
    container.innerHTML = ""; 

    if (!opinions || opinions.length === 0) {
        container.innerHTML = `<div class="alert alert-info">届いた提案はまだありません。</div>`;
        return;
    }

    const mainAccordion = document.createElement("div");
    mainAccordion.className = "accordion";
    mainAccordion.id = "mainProposalAccordion";

    for (const [bid, bigConfig] of Object.entries(STRUCTURE_MASTER)) {
        const bigCatItems = opinions.filter(item => item.bigCatId === bid);
        const totalBigCount = bigCatItems.length;

        const bigCollapseId = `bigCollapse-${bid}`;
        const bigAccordionItem = document.createElement("div");
        bigAccordionItem.className = "accordion-item mb-3 shadow-sm border rounded overflow-hidden";

        bigAccordionItem.innerHTML = `
            <h2 class="accordion-header position-relative">
                <button class="accordion-button collapsed py-3 bg-dark text-white fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#${bigCollapseId}">
                    ${bigConfig.name}
                </button>
                <span class="position-absolute top-50 end-0 translate-middle-y me-5 badge bg-primary rounded-pill" style="z-index:10;">${totalBigCount} 件</span>
            </h2>
        `;

        const bigCollapseDiv = document.createElement("div");
        bigCollapseDiv.id = bigCollapseId;
        bigCollapseDiv.className = "accordion-collapse collapse";
        bigCollapseDiv.setAttribute("data-bs-parent", "#mainProposalAccordion");

        const bigBody = document.createElement("div");
        bigBody.className = "accordion-body bg-light p-3";

        const midAccordion = document.createElement("div");
        midAccordion.className = "accordion";
        midAccordion.id = `midAccordion-${bid}`;

        for (const [mid, midName] of Object.entries(bigConfig.mids)) {
            const matchedItems = bigCatItems.filter(item => item.midCatId === mid);
            const totalMidCount = matchedItems.length;
            const midCollapseId = `midCollapse-${bid}-${mid}`;

            const midAccordionItem = document.createElement("div");
            midAccordionItem.className = "accordion-item mb-2 border rounded overflow-hidden";

            midAccordionItem.innerHTML = `
                <h3 class="accordion-header position-relative">
                    <button class="accordion-button collapsed py-2 bg-secondary text-white small fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#${midCollapseId}">
                        📁 ${midName}
                    </button>
                    <span class="position-absolute top-50 end-0 translate-middle-y me-5 badge bg-light text-dark rounded-pill" style="z-index:10;">${totalMidCount} 件</span>
                </h3>
            `;

            const midCollapseDiv = document.createElement("div");
            midCollapseDiv.id = midCollapseId;
            midCollapseDiv.className = "accordion-collapse collapse";
            midCollapseDiv.setAttribute("data-bs-parent", `#midAccordion-${bid}`); 

            const midBody = document.createElement("div");
            midBody.className = "accordion-body bg-white p-3";

            if (matchedItems.length === 0) {
                midBody.innerHTML = `<p class="text-muted small mb-0">この分類の投稿はまだありません。</p>`;
            } else {
                const newMergeItems = matchedItems.filter(item => item.status === "新統合" || item.status === "マージ");
                const originalItems = matchedItems.filter(item => item.status === "元記事" || item.status === "元データ");
                const singleItems = matchedItems.filter(item => item.status !== "新統合" && item.status !== "マージ" && item.status !== "元記事" && item.status !== "元データ");

                // 1. 新統合の描画
                newMergeItems.forEach(item => {
                    midBody.innerHTML += `
                        <div class="card border-start border-success border-4 mb-2 shadow-sm bg-success-subtle">
                            <div class="card-body p-3">
                                <span class="badge bg-success mb-1">👑 新統合</span>
                                <h6 class="fw-bold text-success mb-1">${item.title}</h6>
                                <p class="small text-dark mb-0 lh-base" style="white-space: pre-wrap;">${item.summary}</p>
                            </div>
                        </div>
                    `;
                });

                // 2. 単独提案の描画
                singleItems.forEach(item => {
                    midBody.innerHTML += `
                        <div class="card border-start border-info border-4 mb-2 shadow-sm">
                            <div class="card-body p-3">
                                <span class="badge bg-info text-dark mb-1">${item.status || "単独提案"}</span>
                                <h6 class="fw-bold text-dark mb-1">${item.title}</h6>
                                <p class="small text-secondary mb-0 lh-base" style="white-space: pre-wrap;">${item.summary}</p>
                            </div>
                        </div>
                    `;
                });

                // 3. 統合の元になった市民の声（履歴）の描画
                if (originalItems.length > 0) {
                    const origCollapseId = `origCollapse-${bid}-${mid}`;
                    let origWrapper = `
                        <div class="mt-3">
                            <button class="btn btn-sm btn-outline-secondary w-100 text-start d-flex justify-content-between align-items-center" type="button" data-bs-toggle="collapse" data-bs-target="#${origCollapseId}">
                                <span>📂 統合の元になった市民の声 (${originalItems.length}件)</span>
                                <small>開く</small>
                            </button>
                            <div class="collapse mt-2" id="${origCollapseId}">
                                <div class="p-2 border rounded bg-light" style="max-height: 250px; overflow-y: auto;">
                    `;
                    originalItems.forEach(orig => {
                        origWrapper += `
                            <div class="p-2 mb-2 bg-white rounded border-bottom small">
                                <span class="badge bg-secondary mb-1">元記事</span>
                                <h6 class="fw-bold text-muted mb-1" style="text-decoration: line-through;">${orig.title}</h6>
                                <p class="text-muted mb-1" style="font-size: 0.8rem; white-space: pre-wrap;">${orig.summary}</p>
                                <div class="p-2 bg-light rounded text-success border-start border-success border-2" style="font-size: 0.75rem;">
                                    <strong>💡 配置・統合された理由：</strong>${orig.reason || "包括案へ統合されました。"}
                                </div>
                            </div>
                        `;
                    });
                    origWrapper += `</div></div></div>`;
                    midBody.innerHTML += origWrapper;
                }
            }

            midCollapseDiv.appendChild(midBody);
            midAccordionItem.appendChild(midCollapseDiv);
            midAccordion.appendChild(midAccordionItem);
        }

        bigBody.appendChild(midAccordion);
        bigCollapseDiv.appendChild(bigBody);
        bigAccordionItem.appendChild(bigCollapseDiv);
        mainAccordion.appendChild(bigAccordionItem);
    }

    container.appendChild(mainAccordion);
}

// 5. 🗺️ アイデアの地図の描画
function renderIdeaMap(opinions) {
    for (const [bid, bigConfig] of Object.entries(STRUCTURE_MASTER)) {
        const sumEl = document.getElementById(`sum-text-${bigConfig.short}`);
        if (!sumEl) continue;

        const activeItems = opinions.filter(item => item.bigCatId === bid && item.status !== "元記事" && item.status !== "元データ");

        if (activeItems.length > 0) {
            const mergeItem = activeItems.find(item => item.status === "新統合" || item.status === "マージ");
            const targetItem = mergeItem ? mergeItem : activeItems[activeItems.length - 1];
            
            sumEl.textContent = targetItem.summary || "";
            sumEl.className = "text-dark fw-bold lh-base fs-6 font-monospace bg-white p-3 rounded-3 border";
            sumEl.style.borderColor = "#bbf7d0";
        }
    }
}
