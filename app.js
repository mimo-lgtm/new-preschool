// ==========================================
// 1. 固定マスター定義（セル位置と混同しないID）
// ==========================================
const GAS_URL = "https://script.google.com/macros/s/AKfycbxm3ntl_jh78mgk-7Bd1w1D2WpWjGaQueKDMc-7kdCUpAmXlIQwtd30R6cIqIlD_IZM/exec";

const masterBig = STRUCTURE_MASTER[bid] || { name: "その他", short: "その他", mids: { "MID-4": "その他" } };

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

                // AI分析結果の処理部分（app.js）
if (data.status === "success" && data.result) {
    currentAiResult = data.result;
    
    // 💡 ID（BIG-1など）に依存せず、送られてきた結果をそのまま表示する
    if (aiSummaryText) {
        aiSummaryText.innerHTML = `<strong>【自動分類】</strong> ${currentAiResult.bigCatId || "未分類"} ＞ ${currentAiResult.midCatId || "その他"}`;
    }
    // 以下、タイトルや懸念点の表示処理はそのまま
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
// 3. データ取得（安定版）
async function fetchOpinions() {
    try {
        const res = await fetch(GAS_URL + "?action=get");
        const data = await res.json();
        
        if (data.status === "success" && Array.isArray(data.opinions)) {
            // スプレッドシートの生の値をそのまま使用し、マスターとの不一致でエラーにならないようにする
            allOpinions = data.opinions.map(op => ({
                title: op.title,
                summary: op.summary,
                content: op.content,
                bigCatId: op.bigCatId || "BIG-1",
                midCatId: op.midCatId || "MID-4",
                status: op.status || "単独提案",
                reason: op.reason || ""
            }));
            
            render3StepProposalBox(allOpinions);
            renderIdeaMap(allOpinions);
        }
    } catch (e) {
        console.error("データ取得エラー:", e);
    }
}

// 4. 📦 アコーディオン描画（固定マスター依存版）
function render3StepProposalBox(opinions) {
    const container = document.getElementById("proposal-container");
    if (!container) return;
    container.innerHTML = "";

    const mainAccordion = document.createElement("div");
    mainAccordion.className = "accordion";
    mainAccordion.id = "mainProposalAccordion";

    for (const [bid, bigConfig] of Object.entries(STRUCTURE_MASTER)) {
        const bigCatItems = opinions.filter(item => item.bigCatId === bid);
        const bigCollapseId = `bigCollapse-${bid}`;
        
        const bigAccordionItem = document.createElement("div");
        bigAccordionItem.className = "accordion-item mb-3 shadow-sm border rounded";
        bigAccordionItem.innerHTML = `
            <h2 class="accordion-header"><button class="accordion-button collapsed bg-dark text-white fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#${bigCollapseId}">${bigConfig.name}</button></h2>
            <div id="${bigCollapseId}" class="accordion-collapse collapse" data-bs-parent="#mainProposalAccordion">
                <div class="accordion-body bg-light p-3" id="body-${bigCollapseId}"></div>
            </div>`;
        mainAccordion.appendChild(bigAccordionItem);

        const bodyDiv = bigAccordionItem.querySelector(`#body-${bigCollapseId}`);
        for (const [mid, midName] of Object.entries(bigConfig.mids)) {
            const matchedItems = bigCatItems.filter(item => item.midCatId === mid);
            bodyDiv.innerHTML += `
                <div class="card mb-2">
                    <div class="card-header bg-secondary text-white small fw-bold">📁 ${midName} (${matchedItems.length}件)</div>
                    <div class="card-body p-2">${matchedItems.map(item => `<div class="p-2 border-bottom small"><strong>${item.title}</strong><br>${item.summary}</div>`).join('')}</div>
                </div>`;
        }
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
