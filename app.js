// ==========================================
// 1. 設定・定数・グローバル変数定義。
// ==========================================
const GAS_URL = "https://script.google.com/macros/s/AKfycbxmM8xb0WjGw32yLSVacv30nz2y1LabmGu0aKfFa9DBPRJUw6R_U9Q6odT5HA1A-t2I/exec";

let allOpinions = [];
let currentAiResult = null;

// ==========================================
// 2. メイン処理
// ==========================================
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
<div class="mb-3"><strong>a. この意見の核心</strong><br><span class="text-dark">${currentAiResult["核心"] || "分析中"}</span></div>
<div class="mb-3"><strong>b. 実現した場合の変化</strong><br><span class="text-dark">${currentAiResult["変化"] || "分析中"}</span></div>
<div class="mb-3"><strong>c. 成功事例</strong><br><span class="text-dark">${currentAiResult["成功事例"] || "分析中"}</span></div>
<div class="mb-3"><strong>d. 懸念点</strong><br><span class="text-dark">${currentAiResult["懸念点"] || "分析中"}</span></div>
<div class="mb-1"><strong>e. 発展的な問い</strong><br><span class="text-dark">${currentAiResult["問い"] || "分析中"}</span></div>
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

            if (!confirm(`正式に提案箱へ投稿しますか？\n（大分類「${bigCat}」＞ 中分類「${midCat}」へ格納されます）`)) return;

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
                    alert(`📥 投稿が完了しました！`);
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
});

async function fetchOpinions() {
    try {
        const res = await fetch(GAS_URL + "?action=get");
        const data = await res.json();
        allOpinions = Array.isArray(data) ? data : (data?.opinions || []);
        renderStructuredIdeas(allOpinions);
    } catch (e) {
        console.error("データ取得失敗:", e);
    }
}

function renderStructuredIdeas(ideasDataset) {
    const proposalContainer = document.getElementById("proposal-container");
    if (proposalContainer) proposalContainer.innerHTML = "";

    const pillarRules = [
        { id: 1, bigName: "🌱 1. 探究心を育む知育環境（主体的な学び）", bigId: "BIG-1" },
        { id: 2, bigName: "🎨 2. 感性を磨くアートと表現（楽しさと好奇心）", bigId: "BIG-2" },
        { id: 3, bigName: "🤝 3. 協調性を養うグループワーク（未来を生き抜く力）", bigId: "BIG-3" },
        { id: 4, bigName: "🌳 4. 心身を健やかに育てる自然体験（個性・才能の開花）", bigId: "BIG-4" },
        { id: 5, bigName: "🌐 5. 地域と言語を繋ぐグローバルコミュニケーション（シームレス成長支援）", bigId: "BIG-5" }
    ];

    pillarRules.forEach(rule => {
        const pillarId = rule.id;
        const pillarIdeas = ideasDataset.filter(item => {
            if (!item) return false;
            const cat = String(item.bigCatId || item.category || "").trim();
            return cat === rule.bigId || rule.bigName.includes(cat);
        });

        const pillarSection = document.createElement("div");
        pillarSection.className = "mb-4 p-3 border rounded bg-light shadow-sm";
        pillarSection.innerHTML = `<h5 class="fw-bold border-bottom pb-2 text-dark">${rule.bigName}</h5>`;

        const mainIdeas = pillarIdeas.filter(item => String(item.status || "").trim() !== "元記事");

        mainIdeas.forEach(idea => {
            let displayStatus = String(idea.status || "単独提案").trim();
            let badgeColor = displayStatus === "新統合" ? "bg-success" : "bg-info text-dark";

            const cardHtml = `
                <div class="card mb-2 shadow-sm border-0 cursor-pointer" onclick="showIdeaDetail(${JSON.stringify(idea).replace(/"/g, '&quot;')})">
                    <div class="card-body p-3">
                        <span class="badge ${badgeColor} mb-2">${displayStatus}</span>
                        <h6 class="fw-bold text-dark mb-1">${idea.title || "無題の提案"}</h6>
                        <p class="small text-secondary mb-0">${idea.summary || ""}</p>
                    </div>
                </div>
            `;
            pillarSection.innerHTML += cardHtml;
        });

        if (proposalContainer) {
            proposalContainer.appendChild(pillarSection);
        }
    });
}

function showIdeaDetail(idea) {
    alert(`【${idea.title || "無題の提案"}】\n\n${idea.summary || ""}`);
}
}); // ← この行を追加
