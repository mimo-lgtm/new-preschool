// ==========================================
// 1. 設定・定数・グローバル変数定義
// ==========================================
const GAS_URL = "https://script.google.com/macros/s/AKfycbwhi5dmsG_PlC80sh5Y5_nMeGqf2vcA6PxbZFXvtCnWSYgX1z2tS5fLzY3NFYI36PE/exec";

// 厳密に定義された5つの大分類と、それぞれに紐づく中分類
const STRUC_CONFIG = {
    "主体的な学び": ["子ども主導のプロジェクト学習", "選択制のアクティビティ", "デジタルを活用した自己表現", "その他"],
    "楽しさと好奇心": ["五感を使う自然体験", "失敗を歓迎する科学遊び", "地域のアート・文化資源の活用", "その他"],
    "未来を生き抜く力": ["非認知能力の育成", "多様な人々と協働する体験", "答えのない問いに挑む力", "その他"],
    "個性・才能の開花": ["個別最適化された学習プラン", "多様な才能を認める評価基準", "特別なニーズを持つ子への支援", "その他"],
    "シームレス成長支援": ["保幼小の連携強化", "切れ目のない相談窓口", "育児休業からの復職支援", "その他"]
};

let allOpinions = [];
let currentAiResult = null; // ★欠落：AI分析結果を一時保持する変数を追加

// ==========================================
// 2. メイン処理（画面初期化・イベント設定）
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
    // 画面を開いたらスプレッドシートからデータを取得して描画
    fetchOpinions();

    // ★欠落：HTML側の各ボタンや表示エリアの要素を正しく取得
    const btnAiAnalysis = document.getElementById("btnAiAnalysis"); 
    const btnSubmitToBox = document.getElementById("btnSubmitToBox");
    const aiPlaceholder = document.getElementById("aiPlaceholder");
    const aiAssistBox = document.getElementById("aiAssistBox");
    const aiSummaryText = document.getElementById("aiSummaryText");
    const aiPerspectivesText = document.getElementById("aiPerspectivesText");
    const aiTitleText = document.getElementById("aiTitleText");
    const aiRefinedText = document.getElementById("aiRefinedText");

    // ★欠落：1. AI分析（壁打ち）ボタンのクリックイベントを設定
    if (btnAiAnalysis) {
        btnAiAnalysis.addEventListener("click", async function () {
            const txtContent = document.getElementById("content");
            const contentValue = txtContent ? txtContent.value.trim() : "";

            if (!contentValue) {
                alert("あなたの想いやアイデアを自由に入力してください。");
                return;
            }

            // ボタンをローディング状態にして二重送信を防止
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

                    // AI分析結果を画面の各要素に流し込む
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

                    // プレースホルダーを隠し、AI分析結果エリアを表示する
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
                // ボタンの状態を元に戻す
                btnAiAnalysis.disabled = false;
                btnAiAnalysis.innerHTML = `✨ 1. 意見を送信してAIと壁打ちする`;
            }
        });
    }

    // ★欠落：2. 提案箱へ正式投稿するボタンのクリックイベントを設定
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
                        title: currentAiResult["推奨タイトル"],
                        summary: currentAiResult["要約200"],
                        category: bigCat, 
                        midCat: midCat
                    })
                });
                const data = await res.json();

                if (data.status === "success") {
                    alert(`📥 投稿が完了しました！\n\nあなたのアイデアは\n【大分類：${bigCat}】＞【中分類：${midCat}】\nのプロセス提案箱にリアルタイムに格納されました。`);
                    
                    // 入力欄とAIエリアをクリアして初期状態に戻す
                    if (txtContent) txtContent.value = "";
                    if (aiAssistBox) aiAssistBox.classList.add("d-none");
                    if (aiPlaceholder) aiPlaceholder.style.removeProperty("display");
                    currentAiResult = null;

                    // 最新のデータを再取得して地図と提案箱をアップデート
                    await fetchOpinions();

                    // 投稿完了後、自動的に「3. 届いた提案箱」タブへ移動させる
                    const listTabBtn = document.getElementById("list-tab-btn");
                    if (listTabBtn) {
                        listTabBtn.click();
                    }
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
// 3. データ取得・バックエンド連携
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
        
        // 1. 提案箱（タブ3）の3段階アコーディオンを描画
        render3StepProposalBox(allOpinions);
        
        // 2. アイデアの地図（タブ2）への描画を連動
        renderIdeaMap(allOpinions);

    } catch (e) {
        console.error("データ取得失敗:", e);
        const container = document.getElementById("proposal-container");
        if (container) container.innerHTML = `<p class="text-danger">データの読み込みに失敗しました。</p>`;
    }
}

// ==========================================
// 4. 📦 3段階アコーディオン & 件数バッジ付き 描画ロジック（タブ3用）
// ==========================================
function render3StepProposalBox(opinions) {
    const container = document.getElementById("proposal-container");
    if (!container) return;
    container.innerHTML = ""; // 初期化

    const mainAccordion = document.createElement("div");
    mainAccordion.className = "accordion";
    mainAccordion.id = "mainProposalAccordion";

    let bigIndex = 0;

    // 1段階目：大分類のループ
    for (const [bigCat, midCatList] of Object.entries(STRUC_CONFIG)) {
        bigIndex++;
        
        const totalBigCount = opinions.filter(item => {
            if (!item.category) return false;
            return String(item.category).trim().includes(bigCat.trim());
        }).length;

        const bigCollapseId = `bigCollapse-${bigIndex}`;
        const bigAccordionItem = document.createElement("div");
        bigAccordionItem.className = "accordion-item mb-3 shadow-sm border rounded overflow-hidden";
        bigAccordionItem.style.borderRadius = "8px";

        bigAccordionItem.innerHTML = `
            <h2 class="accordion-header position-relative">
                <button class="accordion-button collapsed py-3 bg-dark text-white fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#${bigCollapseId}">
                    ${bigCat}
                </button>
                <span class="position-absolute top-50 end-0 translate-middle-y me-5 badge bg-primary rounded-pill" style="z-index:10; font-size:0.9rem;">${totalBigCount} 件</span>
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
        midAccordion.id = `midAccordion-${bigIndex}`;

        let midIndex = 0;

        // 2段階目：中分類のループ
        midCatList.forEach(midCat => {
            midIndex++;
            const midCollapseId = `midCollapse-${bigIndex}-${midIndex}`;

            const matchedItems = opinions.filter(item => {
                if (!item.category || !item.midCat) return false;
                const bMatch = String(item.category).trim().includes(bigCat.trim());
                const mMatch = String(item.midCat).trim().includes(midCat.trim());
                return bMatch && mMatch;
            });

            const totalMidCount = matchedItems.length;

            const midAccordionItem = document.createElement("div");
            midAccordionItem.className = "accordion-item mb-2 border rounded overflow-hidden";
            midAccordionItem.style.borderRadius = "6px";

            midAccordionItem.innerHTML = `
                <h3 class="accordion-header position-relative">
                    <button class="accordion-button collapsed py-2 bg-secondary text-white small fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#${midCollapseId}">
                        📁 ${midCat}
                    </button>
                    <span class="position-absolute top-50 end-0 translate-middle-y me-5 badge bg-light text-dark rounded-pill" style="z-index:10; font-size:0.8rem;">${totalMidCount} 件</span>
                </h3>
            `;

            const midCollapseDiv = document.createElement("div");
            midCollapseDiv.id = midCollapseId;
            midCollapseDiv.className = "accordion-collapse collapse";
            midCollapseDiv.setAttribute("data-bs-parent", `#midAccordion-${bigIndex}`); // ★修正：セレクタ記法 (#) のバグを補正

            const midBody = document.createElement("div");
            midBody.className = "accordion-body bg-white p-3";

            // 3段階目：中分類の中身（新統合、単独投稿、元記事の仕分け表示）
            if (matchedItems.length === 0) {
                midBody.innerHTML = `<p class="text-muted small mb-0">この分類の投稿はまだありません。</p>`;
            } else {
                const newMergeItems = matchedItems.filter(item => item.status && String(item.status).trim() === "新統合");
                const singleItems = matchedItems.filter(item => !item.status || (String(item.status).trim() !== "新統合" && String(item.status).trim() !== "元記事"));
                const originalItems = matchedItems.filter(item => item.status && String(item.status).trim() === "元記事");

                // --- 👑 新統合の描画 ---
                newMergeItems.forEach(item => {
                    midBody.innerHTML += `
                        <div class="card border-start border-success border-4 mb-2 shadow-sm bg-success-subtle">
                            <div class="card-body p-3">
                                <span class="badge bg-success mb-1">👑 基礎・新統合</span>
                                <h6 class="fw-bold text-success mb-1">${item.title || "無題の統合案"}</h6>
                                <p class="small text-dark mb-0 lh-base" style="white-space: pre-wrap;">${item.summary || ""}</p>
                            </div>
                        </div>
                    `;
                });

                // --- 🔹 単独投稿の描画 ---
                singleItems.forEach(item => {
                    midBody.innerHTML += `
                        <div class="card border-start border-info border-4 mb-2 shadow-sm">
                            <div class="card-body p-3">
                                <span class="badge bg-info text-dark mb-1">単独提案</span>
                                <h6 class="fw-bold text-dark mb-1">${item.title || "無題の提案"}</h6>
                                <p class="small text-secondary mb-0 lh-base">${item.summary || ""}</p>
                            </div>
                        </div>
                    `;
                });

                // --- 📂 元記事の描画 ---
                if (originalItems.length > 0) {
                    const origCollapseId = `origCollapse-${bigIndex}-${midIndex}`;
                    let origWrapper = `
                        <div class="mt-3">
                            <button class="btn btn-sm btn-outline-secondary w-100 text-start d-flex justify-content-between align-items-center" type="button" data-bs-toggle="collapse" data-bs-target="#${origCollapseId}">
                                <span>📂 蓄積された「元記事」の一覧 (${originalItems.length}件)</span>
                                <small>開く</small>
                            </button>
                            <div class="collapse mt-2" id="${origCollapseId}">
                                <div class="p-2 border rounded bg-light" style="max-height: 250px; overflow-y: auto;">
                    `;

                    originalItems.forEach(orig => {
                        let reason = orig.mergedTo ? String(orig.mergedTo).trim() : '類似性のため新統合へ集約';
                        origWrapper += `
                            <div class="p-2 mb-2 bg-white rounded border-bottom small">
                                <span class="badge bg-secondary mb-1">元記事</span>
                                <h6 class="fw-bold text-muted mb-1" style="text-decoration: line-through;">${orig.title || "無題"}</h6>
                                <p class="text-danger mb-1" style="font-size: 0.75rem;">🔄 統合理由: ${reason}</p>
                                <p class="text-muted mb-0" style="font-size: 0.8rem;">${orig.summary || ""}</p>
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
        });

        bigBody.appendChild(midAccordion);
        bigCollapseDiv.appendChild(bigBody);
        bigAccordionItem.appendChild(bigCollapseDiv);
        mainAccordion.appendChild(bigAccordionItem);
    }

    container.appendChild(mainAccordion);
}

// ==========================================
// 5. 🗺️ アイデアの地図（タブ2）描画ロジック
// ==========================================
function renderIdeaMap(opinions) {
    const bigCategories = ["主体的な学び", "楽しさと好奇心", "未来を生き抜く力", "個性・才能の開花", "シームレス成長支援"];
    
    bigCategories.forEach((bigCat, index) => {
        const pillarId = index + 1;
        const mapPillar = document.getElementById(`map-pillar-${pillarId}`);
        if (!mapPillar) return;
        
        mapPillar.innerHTML = ""; // 初期化

        const mergeItems = opinions.filter(item => {
            if (!item.category || !item.status) return false;
            const isBigCat = String(item.category).trim().includes(bigCat);
            const isMerged = String(item.status).trim() === "新統合";
            return isBigCat && isMerged;
        });

        if (mergeItems.length === 0) {
            mapPillar.innerHTML = `<p class="text-muted small mb-0">現在、この分野の「新統合」アイデアはありません。</p>`;
        } else {
            mergeItems.forEach(item => {
                mapPillar.innerHTML += `
                    <div class="p-3 mb-2 border-start border-success border-4 bg-light rounded shadow-sm">
                        <span class="badge bg-success mb-2">👑 新統合</span>
                        <h6 class="fw-bold text-success mb-1">${item.title || "無題の統合案"}</h6>
                        <p class="mb-0 text-secondary small lh-base">${item.summary || ""}</p>
                    </div>
                `;
            });
        }
    });
}
