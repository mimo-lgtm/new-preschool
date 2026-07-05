// =================================================================
// 意見ひろば システム連携プログラム（完全同期・根本解決版）
// =================================================================

const GAS_URL = "https://script.google.com/macros/s/AKfycbzl2w3LIhCKFx0Xw-biVr2bEarkPl3mZWGi-wKLahfG_u4EWdDioF0CLpnn1Mjr2FY0/exec";

// 1. 画面（HTML）側の5つの柱の正式名称
const MAIN_CATEGORIES = [
    "🌱 1. 探究心を育む知育環境（主体的な学び）",
    "🎨 2. 学問の楽しさと感性の融合（楽しさと好奇心）",
    "🤝 3. 逆境を跳ね返すサバイバル能力（未来を生き抜く力）",
    "🌳 4. 個性の開花ととことんやり抜く環境（才能の応援）",
    "🌐 5. 学校の枠に縛られない個別最適化教育（自由な学び）"
];

// 2. GAS（AI）の出力テキストと、画面側の柱を完全に1対1で紐付けるマップ（ここが断絶の根本原因でした）
const CATEGORY_MAP = {
    "主体的な学び": "🌱 1. 探究心を育む知育環境（主体的な学び）",
    "楽しさと好奇心": "🎨 2. 学問の楽しさと感性の融合（楽しさと好奇心）",
    "未来を生き抜く力": "🤝 3. 逆境を跳ね返すサバイバル能力（未来を生き抜く力）",
    "個性・才能の開花": "🌳 4. 個性の開花ととことんやり抜く環境（才能の応援）",
    "個性の開花": "🌳 4. 個性の開花ととことんやり抜く環境（才能の応援）",
    "シームレス成長支援": "🌐 5. 学校の枠に縛られない個別最適化教育（自由な学び）",
    "シームレス成長": "🌐 5. 学校の枠に縛られない個別最適化教育（自由な学び）"
};

let allOpinions = [];
let currentAiResult = null;

// ==========================================
// イベント設定＆初期化
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
                            <div class="mb-3"><strong>a. この意見の核心（本当の願い・課題）</strong><br><span class="text-dark">${currentAiResult["核心"] || "分析中"}</span></div>
                            <div class="mb-3"><strong>b. 実現した場合の市民生活への変化</strong><br><span class="text-dark">${currentAiResult["変化"] || "分析中"}</span></div>
                            <div class="mb-3"><strong>c. 成功事例（国内外）</strong><br><span class="text-dark">${currentAiResult["成功事例"] || "分析中"}</span></div>
                            <div class="mb-3"><strong>d. 懸念点と乗り跨える方法</strong><br><span class="text-dark">${currentAiResult["懸念点"] || "分析中"}</span></div>
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
            const bigCat = currentAiResult["大分類"] || "その他";
            const midCat = currentAiResult["中分類"] || "その他";

            if (!confirm(`正式に提案箱へ投稿しますか？\n（大分類「${bigCat}」へ格納されます）`)) return;

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
                        title: currentAiResult["推奨タイトル"],
                        summary: currentAiResult["要約200"],
                        category: bigCat, 
                        midCat: midCat
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
                    alert("投稿エラー: " + data.message);
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
// データ取得処理
// ==========================================
async function fetchOpinions() {
    try {
        const res = await fetch(GAS_URL + "?action=get");
        const data = await res.json();
        
        if (Array.isArray(data)) {
            allOpinions = data;
        } else if (data && data.opinions) {
            allOpinions = data.opinions;
        } else {
            allOpinions = [];
        }
        
        renderStructuredIdeas(allOpinions);
    } catch (e) {
        console.error("データ取得に失敗しました:", e);
    }
}

// ==========================================
// 根本解決：アイデアの地図 ＆ 提案箱の描画ロジック
// ==========================================
function renderStructuredIdeas(ideasDataset) {
    const proposalContainer = document.getElementById("proposal-container") || document.getElementById("opinions-container") || document.getElementById("list-container");
    if (proposalContainer) proposalContainer.innerHTML = "";

    // 1. 地図側のエリア（1〜5）を完全に初期化
    for (let i = 1; i <= 5; i++) {
        const mapPillar = document.getElementById(`map-pillar-${i}`) || document.getElementById(`pillar-box-${i}`);
        if (mapPillar) mapPillar.innerHTML = "";
    }

    if (!ideasDataset || !Array.isArray(ideasDataset)) return;

    // 3. 5つの柱ごとに、完全に同期したマッピング処理を実行
    MAIN_CATEGORIES.forEach((pillarName, index) => {
        const pillarId = index + 1;

        // B列の分類文字を読み取り、対応する正式な柱名に属するデータだけをフィルタリング
        const pillarIdeas = ideasDataset.filter(item => {
            if (!item || !item.category) return false;
            const rawCat = String(item.category).trim();
            
            // マップに登録されている名称、または直接一致を検証
            const mappedName = CATEGORY_MAP[rawCat] || rawCat;
            return mappedName === pillarName;
        });

        // 提案箱（一覧）側の外枠セクションを生成
        const pillarSection = document.createElement("div");
        pillarSection.className = "mb-4 p-3 border rounded bg-light shadow-sm";
        pillarSection.innerHTML = `<h5 class="fw-bold border-bottom pb-2 text-dark">${pillarName}</h5>`;

        // statusが「元記事」以外のメイン投稿を抽出
        const mainIdeas = pillarIdeas.filter(item => {
            if (!item) return false;
            return item.status ? String(item.status).trim() !== "元記事" : true;
        });

        if (mainIdeas.length === 0 && !pillarIdeas.some(item => item && item.status && String(item.status).trim() === "元記事")) {
            pillarSection.innerHTML += `<p class="text-muted small">投稿されたアイデアはまだありません。</p>`;
        }

        // メインアイデアのカード描画
        mainIdeas.forEach(idea => {
            let badgeColor = "bg-info text-dark";
            let displayStatus = idea.status ? String(idea.status).trim() : "";
            
            if (displayStatus === "新統合") {
                badgeColor = "bg-success text-white";
            } else {
                displayStatus = "単独提案";
                badgeColor = "bg-info text-dark";
            }

            const card = `
                <div class="card mb-2 shadow-sm border-0">
                    <div class="card-body p-3">
                        <span class="badge ${badgeColor} mb-2">${displayStatus}</span>
                        <h6 class="fw-bold text-dark mb-1">${idea.title || "無題の提案"}</h6>
                        <p class="small text-secondary mb-0">${idea.summary || ""}</p>
                    </div>
                </div>
            `;
            pillarSection.innerHTML += card;

            // 地図（マップ）側へのカード複製配置
            if (displayStatus === "新統合") {
                const mapPillar = document.getElementById(`map-pillar-${pillarId}`) || document.getElementById(`pillar-box-${pillarId}`);
                if (mapPillar) {
                    mapPillar.innerHTML += `
                        <div class="p-3 mb-2 border-start border-success border-4 bg-light rounded shadow-sm">
                            <span class="badge bg-success text-white mb-2">新統合</span>
                            <h5 class="fw-bold text-success mb-1">${idea.title || "無題の提案"}</h5>
                            <p class="mb-0 text-secondary small">${idea.summary || ""}</p>
                        </div>
                    `;
                }
            }
        });

        // 「元記事」の一覧とアコーディオン折りたたみ描画
        const originalIdeas = pillarIdeas.filter(item => item && item.status && String(item.status).trim() === "元記事");
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
                let reasonText = orig.reason ? String(orig.reason).trim() : (orig.mergedTo ? String(orig.mergedTo).trim() : '類似した投稿のため、新統合記事へ集約されました。');
                originalSectionHtml += `
                    <div class="p-2 mb-2 border-bottom bg-light-subtle rounded">
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

    // マップ側の空枠テキストの補填
    for (let i = 1; i <= 5; i++) {
        const mapPillar = document.getElementById(`map-pillar-${i}`) || document.getElementById(`pillar-box-${i}`);
        if (mapPillar && mapPillar.innerHTML.trim() === "") {
            mapPillar.innerHTML = `<p class="text-muted small mb-0">現在、この分野の「新統合」アイデアはありません。</p>`;
        }
    }
}
