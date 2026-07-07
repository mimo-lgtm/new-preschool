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
