// ==========================================
// 1. 設定・定数・グローバル変数定義。
// ==========================================
const GAS_URL = "https://script.google.com/macros/s/AKfycbxmM8xb0WjGw32yLSVacv30nz2y1LabmGu0aKfFa9DBPRJUw6R_U9Q6odT5HA1A-t2I/exec";

const MAIN_CATEGORIES = [
    "シームレス成長支援",
    "主体的な学び",
    "楽しさと好奇心",
    "個性・才能の開花",
    "未来を生き抜く力"
];

const FIXED_MID_CATEGORIES = {
    "シームレス成長支援": ["保幼小の連携強化", "切れ目のない相談窓口", "育児休業からの復職支援", "その他"],
    "主体的な学び": ["子ども主導のプロジェクト学習", "選択制のアクティビティ", "デジタルを活用した自己表現", "その他"],
    "楽しさと好奇心": ["五感を使う自然体験", "失敗を歓迎する科学遊び", "地域のアート・文化資源の活用", "その他"],
    "個性・才能の開花": ["個別最適化された学習プラン", "多様な才能を認める評価基準", "特別なニーズを持つ子への支援", "その他"],
    "未来を生き抜く力": ["非認知能力の育成", "多様な人々と協働する体験", "答えのない問いに挑む力", "その他"]
};

let allOpinions = [];
let currentAiResult = null;

// ==========================================
// 2. メイン処理（画面初期化・イベント設定）
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

    // ✨ 最優先でデータを読み込む
    fetchOpinions();

    // 📄 AI分析（壁打ち）ボタンのイベント
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

    // 📤 提案箱へ正式投稿するボタンのイベント
        // 📤 提案箱へ正式投稿するボタンのイベント
    if (btnSubmitToBox) {
        btnSubmitToBox.addEventListener("click", async function () {
            if (!currentAiResult) return;

            const bigCat = currentAiResult["大分類"] || currentAiResult.bigCatId || "その他";
            const midCat = currentAiResult["中分類"] || currentAiResult.midCatId || "その他";
            const smallCat = currentAiResult["小分類"] || "";

            // 手動分類選択（HTMLのselect）
            const selectedCategory = document.getElementById("categorySelect") ? 
                document.getElementById("categorySelect").value : "主体";

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
    title: currentAiResult["推奨タイトル"] || currentAiResult.推奨タイトル || "無題の提案",
    summary: currentAiResult["要約200"] || currentAiResult.要約200 || "",
    bigCatId: bigCat,
    midCatId: midCat,
    category: bigCat, 
    midCat: midCat,
    smallCat: smallCat,
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

// ==========================================
// 3. データ取得・バックエンド連携
// ==========================================
async function fetchOpinions() {
    try {
        const res = await fetch(GAS_URL + "?action=get");
        const data = await res.json();
        
        console.log("取得したデータ:", data); // デバッグ用

        allOpinions = Array.isArray(data) ? data : (data?.opinions || data || []);
        
        console.log("allOpinionsに格納:", allOpinions.length, "件");
        
        renderStructuredIdeas(allOpinions);
    } catch (e) {
        console.error("データ取得に失敗しました:", e);
    }
}

// ==========================================
// 4. 描画ロジック
// ==========================================
function renderStructuredIdeas(ideasDataset) {
    const proposalContainer = document.getElementById("proposal-container");
    if (proposalContainer) proposalContainer.innerHTML = "";

        const pillarRules = [
        { 
            id: 1, 
            bigName: "🌱 1. 探究心を育む知育環境（主体的な学び）",
            bigId: "BIG-1",
            mids: {
                "MID-1": "子ども主導のプロジェクト学習",
                "MID-2": "選択制のアクティビティ",
                "MID-3": "デジタルを活用した自己表現",
                "MID-4": "その他"
            }
        },
        { 
            id: 2, 
            bigName: "🎨 2. 感性を磨くアートと表現（楽しさと好奇心）",
            bigId: "BIG-2",
            mids: {
                "MID-1": "五感を使う自然体験",
                "MID-2": "失敗を歓迎する科学遊び",
                "MID-3": "地域のアート・文化資源の活用",
                "MID-4": "その他"
            }
        },
        { 
            id: 3, 
            bigName: "🤝 3. 協調性を養うグループワーク（未来を生き抜く力）",
            bigId: "BIG-3",
            mids: {
                "MID-1": "非認知能力の育成",
                "MID-2": "多様な人々と協働する体験",
                "MID-3": "答えのない問いに挑む力",
                "MID-4": "その他"
            }
        },
        { 
            id: 4, 
            bigName: "🌳 4. 心身を健やかに育てる自然体験（個性・才能の開花）",
            bigId: "BIG-4",
            mids: {
                "MID-1": "個別最適化された学習プラン",
                "MID-2": "多様な才能を認める評価基準",
                "MID-3": "特別なニーズを持つ子への支援",
                "MID-4": "その他"
            }
        },
        { 
            id: 5, 
            bigName: "🌐 5. 地域と言語を繋ぐグローバルコミュニケーション（シームレス成長支援）",
            bigId: "BIG-5",
            mids: {
                "MID-1": "保幼小の連携強化",
                "MID-2": "切れ目のない相談窓口",
                "MID-3": "育児休業からの復職支援",
                "MID-4": "その他"
            }
        }
    ];

    pillarRules.forEach(rule => {
        const pillarId = rule.id;
        
        const pillarIdeas = ideasDataset.filter(item => {
            if (!item) return false;
            const cat = String(item.bigCatId || item.category || item.B || "").trim();
            return cat.includes(rule.keyword) || cat === rule.name || rule.name.includes(cat);
        });

        const pillarSection = document.createElement("div");
        pillarSection.className = "mb-4 p-3 border rounded bg-light shadow-sm";
        pillarSection.innerHTML = `<h5 class="fw-bold border-bottom pb-2 text-dark">${rule.name}</h5>`;

        // メインアイデア
        const mainIdeas = pillarIdeas.filter(item => 
            String(item.status || "").trim() !== "元記事"
        );

        const hasOriginals = pillarIdeas.some(item => 
            String(item.status || "").trim() === "元記事"
        );

        if (mainIdeas.length === 0 && !hasOriginals) {
            pillarSection.innerHTML += `<p class="text-muted small">投稿されたアイデアはまだありません。</p>`;
        }

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

        // 元記事一覧（アコーディオン）← 残しています
               const pillarIdeas = ideasDataset.filter(item => {
            if (!item) return false;
            const cat = String(item.bigCatId || item.category || item.B || "").trim();
            return cat === rule.bigId || cat.includes(rule.keyword) || rule.name.includes(cat);
        });

        if (originalIdeas.length > 0) {
            const subAccordionId = `subCollapse-original-${pillarId}`;
            let originalSectionHtml = `
                <div class="mt-3">
                    <button class="btn btn-sm btn-outline-secondary w-100 text-start d-flex justify-content-between align-items-center" type="button" data-bs-toggle="collapse" data-bs-target="#${subAccordionId}">
                        <span>📂 この分野の「元記事」一覧 (${originalIdeas.length}件)</span>
                        <small class="text-muted">クリックで開閉</small>
                    </button>
                    <div class="collapse mt-2" id="${subAccordionId}">
                        <div class="p-2 border rounded bg-white" style="max-height: 300px; overflow-y: auto;">
            `;

            originalIdeas.forEach(orig => {
                let reasonText = orig.reason || orig.mergedTo || '類似した投稿のため、新統合記事へ集約されました。';
                originalSectionHtml += `
                    <div class="p-2 mb-2 border-bottom last-border-0 bg-light-subtle rounded">
                        <span class="badge bg-secondary mb-1">元記事</span>
                        <h6 class="fw-bold text-muted mb-1" style="text-decoration: line-through;">${orig.title || "無題の提案"}</h6>
                        <p class="text-danger small mb-1" style="font-size: 0.75rem; font-weight: 500;">🔄 統合理由: ${reasonText}</p>
                        <p class="small text-muted mb-0">${orig.summary || ""}</p>
                    </div>
                `;
            });

            originalSectionHtml += `</div></div></div>`;
            pillarSection.innerHTML += originalSectionHtml;
        }

        if (proposalContainer) {
            proposalContainer.appendChild(pillarSection);
        }
    });

    // 空欄対応
    for (let i = 1; i <= 5; i++) {
        const mapPillar = document.getElementById(`map-pillar-${i}`);
        if (mapPillar && mapPillar.innerHTML.trim() === "") {
            mapPillar.innerHTML = `<p class="text-muted small mb-0">現在、この分野の「新統合」アイデアはありません。</p>`;
        }
    }
}

// 詳細ポップアップ
function showIdeaDetail(idea) {
    const detail = `
【${idea.title || "無題"}】
分類: ${idea.bigCatId || idea.category || ""} > ${idea.midCatId || idea.midCat || ""}

${idea.summary || ""}

${idea.content ? "\n【原文】\n" + idea.content : ""}
    `.trim();
    
    alert(detail);
}
