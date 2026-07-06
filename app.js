// ==========================================
// 1. 設定・定数・グローバル変数定義
// ==========================================
const GAS_URL = "https://script.google.com/macros/s/AKfycbyDV8Ic3jWmDHaWTHrtzf19_aEgTxUAaP9EvM7XinMk1W4ZPFk9NVcdnGtV27LbrPp2/exec";

// マッチング用の判定キーワード（部分一致に対応させるためシンプル化）
const CAT_KEYS = ["主体", "好奇心", "未来", "個性", "シームレス"];

const STRUC_CONFIG = {
    "主体的な学び": ["子ども主導のプロジェクト学習", "選択制のアクティビティ", "デジタルを活用した自己表現", "その他"],
    "楽しさと好奇心": ["五感を使う自然体験", "失敗を歓迎する科学遊び", "地域のアート・文化資源の活用", "その他"],
    "未来を生き抜く力": ["非認知能力の育成", "多様な人々と協働する体験", "答えのない問いに挑む力", "その他"],
    "個性・才能の開花": ["個別最適化された学習プラン", "多様な才能を認める評価基準", "特別なニーズを持つ子への支援", "その他"],
    "シームレス成長支援": ["保幼小の連携強化", "切れ目のない相談窓口", "育児休業からの復職支援", "その他"]
};

let allOpinions = [];
let currentAiResult = null; 

// ==========================================
// 2. メイン処理（画面初期化・イベント設定）
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
    // ※左側マップの300字テキストは、HTML側に直接記述して固定してください。
    // JS側からは初期化等の干渉をせず、右側マップの初期化のみ行います。
    initializeRightMap();
    
    // データ取得開始
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
                    
                    const bigCat = currentAiResult["大分類"] || "主体的な学び";
                    const midCat = currentAiResult["中分類"] || "その他";

                    if (categorySelect) {
                        // プルダウンの選択肢（主体、好奇心など）に部分一致したら選択
                        for (const key of CAT_KEYS) {
                            if (bigCat.includes(key)) {
                                categorySelect.value = key;
                                break;
                            }
                        }
                    }

                    if (aiSummaryText) aiSummaryText.innerHTML = `<strong>【自動分類】</strong> ${bigCat} ＞ ${midCat}`;

                    if (aiPerspectivesText) {
                        aiPerspectivesText.innerHTML = `
<div class="mb-3"><strong>a. この意見の核心（本当の願い・課題）</strong><br><span class="text-dark">${currentAiResult["核心"] || "データなし"}</span></div>
<div class="mb-3"><strong>b. 実現した場合の市民生活への変化</strong><br><span class="text-dark">${currentAiResult["変化"] || "データなし"}</span></div>
<div class="mb-3"><strong>c. 成功事例（国内外）</strong><br><span class="text-dark">${currentAiResult["成功事例"] || "データなし"}</span></div>
<div class="mb-3"><strong>d. 懸念点と乗り跨え方</strong><br><span class="text-dark">${currentAiResult["懸念点"] || "データなし"}</span></div>
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
                    alert("AI分析エラー: " + (data.message || "結果が空です"));
                }
            } catch (err) {
                console.error("AI壁打ちエラー:", err);
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

            const selectedShortCat = categorySelect ? categorySelect.value : "主体";
            // スプレッドシート側のヘッダーに合わせるためのフルネーム補完
            let bigCat = "主体的な学び";
            if (selectedShortCat === "好奇心") bigCat = "楽しさと好奇心";
            if (selectedShortCat === "未来") bigCat = "未来を生き抜く力";
            if (selectedShortCat === "個性") bigCat = "個性・才能の開花";
            if (selectedShortCat === "シームレス") bigCat = "シームレス成長支援";

            const midCat = currentAiResult["中分類"] || "その他";

            if (!confirm(`正式に提案箱へ投稿しますか？`)) return;

            const txtContent = document.getElementById("content");
            const rawText = txtContent ? txtContent.value.trim() : "";

            btnSubmitToBox.disabled = true;
            btnSubmitToBox.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> 投稿中...`;

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
                    if (aiAssistBox) {
                        aiAssistBox.classList.add("d-none");
                        aiAssistBox.style.setProperty("display", "none", "important");
                    }
                    if (aiPlaceholder) aiPlaceholder.style.removeProperty("display");
                    currentAiResult = null;

                    await fetchOpinions();

                    const listTabBtn = document.getElementById("list-tab-btn");
                    if (listTabBtn) listTabBtn.click();
                } else {
                    alert("投稿エラー: " + data.message);
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
});

// 右側の地図エリアのみを初期化する
function initializeRightMap() {
    CAT_KEYS.forEach(key => {
        const sumEl = document.getElementById(`sum-text-${key}`);
        if (sumEl) {
            sumEl.innerHTML = `<span class="text-muted" style="font-size:0.75rem;">市民の声を収集中...</span>`;
            sumEl.className = "text-muted small p-2 text-center bg-light rounded";
        }
    });
}

// ==========================================
// 3. データ取得・バックエンド連携
// ==========================================
async function fetchOpinions() {
    try {
        const res = await fetch(GAS_URL + "?action=get");
        const data = await res.json();
        
        let rawList = [];
        if (data && Array.isArray(data.opinions)) {
            rawList = data.opinions;
        } else if (Array.isArray(data)) {
            rawList = data;
        }

        // スプレッドシートの実際のヘッダー日本語名から安全にプロパティを標準化
        allOpinions = rawList.map(item => {
            return {
                category: item["大分類"] || item["category"] || "",
                midCat: item["中分類"] || item["midCat"] || "",
                title: item["推奨タイトル"] || item["title"] || "",
                summary: item["200字要約"] || item["summary"] || "",
                status: item["status"] || item["ステータス"] || "",
                reason: item["AI分析深掘り(JS統合・配置理由"] || item["reason"] || "",
                aiJson: item["aiJson"] || ""
            };
        });

        console.log(`データ正規化完了: ${allOpinions.length}件を処理します。`);
        
        render3StepProposalBox(allOpinions);
        renderIdeaMap(allOpinions);

        // ログエリアの描画
        const processLogEl = document.getElementById("process-log");
        if (processLogEl) {
            const logs = allOpinions
                .filter(item => item.reason && item.reason.trim() !== "")
                .map(item => `◆ ${item.title || "統合施策"}\n   ➔ ${item.reason}`)
                .join("\n\n");
            processLogEl.textContent = logs ? logs : "現在、自動統合プロセスログはありません。";
        }
    } catch (e) {
        console.error("データ取得・描画フェーズエラー:", e);
    }
}

// ==========================================
// 4. 📦 3段階アコーディオン描画（表記ブレ完全吸収版）
// ==========================================
function render3StepProposalBox(opinions) {
    const container = document.getElementById("proposal-container");
    if (!container) return;
    container.innerHTML = ""; 

    if (!opinions || opinions.length === 0) {
        container.innerHTML = `<div class="alert alert-info">届いた提案はまだありません。最初の提案を投稿してみましょう！</div>`;
        return;
    }

    const mainAccordion = document.createElement("div");
    mainAccordion.className = "accordion";
    mainAccordion.id = "mainProposalAccordion";

    let bigIndex = 0;

    for (const [bigCat, midCatList] of Object.entries(STRUC_CONFIG)) {
        bigIndex++;
        
        // 判定キーワードの抽出（例: 「主体的な学び」から「主体」を取得）
        const targetKeyword = CAT_KEYS.find(k => bigCat.includes(k)) || bigCat;

        // 大分類の一致判定（「1. シームレス...」と「シームレス...」の両方を部分一致で救済）
        const bigCatItems = opinions.filter(item => {
            return item.category && String(item.category).includes(targetKeyword);
        });
        const totalBigCount = bigCatItems.length;

        const bigCollapseId = `bigCollapse-${bigIndex}`;
        const bigAccordionItem = document.createElement("div");
        bigAccordionItem.className = "accordion-item mb-3 shadow-sm border rounded overflow-hidden";

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

        midCatList.forEach(midCat => {
            midIndex++;
            const midCollapseId = `midCollapse-${bigIndex}-${midIndex}`;

            // 大分類（部分一致）かつ 中分類（完全一致）のデータを抽出
            const matchedItems = bigCatItems.filter(item => {
                return item.midCat && String(item.midCat).trim() === midCat.trim();
            });

            const totalMidCount = matchedItems.length;

            const midAccordionItem = document.createElement("div");
            midAccordionItem.className = "accordion-item mb-2 border rounded overflow-hidden";

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
            midCollapseDiv.setAttribute("data-bs-parent", `#midAccordion-${bigIndex}`); 

            const midBody = document.createElement("div");
            midBody.className = "accordion-body bg-white p-3";

            if (matchedItems.length === 0) {
                midBody.innerHTML = `<p class="text-muted small mb-0">この分類の投稿はまだありません。</p>`;
            } else {
                // 各ステータスのデータ抽出（前後のスペースを確実に除去）
                const newMergeItems = matchedItems.filter(item => item.status && String(item.status).trim() === "新統合");
                const singleItems = matchedItems.filter(item => {
                    const s = item.status ? String(item.status).trim() : "";
                    return s === "単独提案" || s === "表示" || s === "";
                });
                const originalItems = matchedItems.filter(item => item.status && String(item.status).trim() === "元記事");

                // 1. 👑 新統合（16行目〜30行目のデータ）を一番上に最優先で描画
                newMergeItems.forEach(item => {
                    midBody.innerHTML += `
                        <div class="card border-start border-success border-4 mb-2 shadow-sm bg-success-subtle">
                            <div class="card-body p-3">
                                <span class="badge bg-success mb-1">👑 新統合（集約された施策）</span>
                                <h6 class="fw-bold text-success mb-1">${item.title || "無題の統合案"}</h6>
                                <p class="small text-dark mb-0 lh-base" style="white-space: pre-wrap;">${item.summary || ""}</p>
                            </div>
                        </div>
                    `;
                });

                // 2. 単独提案 または 初期表示データ
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

                // 3. 元記事アコーディオン
                if (originalItems.length > 0) {
                    const origCollapseId = `origCollapse-${bigIndex}-${midIndex}`;
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
                                <h6 class="fw-bold text-muted mb-1" style="text-decoration: line-through;">${orig.title || "無題"}</h6>
                                <p class="text-danger mb-1" style="font-size: 0.75rem;">🔄 ${orig.reason || "新統合へ集約"}</p>
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
// 5. 🗺️ アイデアの地図（右側マッピング処理）
// ==========================================
function renderIdeaMap(opinions) {
    CAT_KEYS.forEach(key => {
        const sumEl = document.getElementById(`sum-text-${key}`);
        if (!sumEl) return;

        // 右側用：該当カテゴリ（部分一致）の「新統合」または「単独提案」「表示」データを抽出
        const matchedActiveItems = opinions.filter(item => {
            if (!item.category) return false;
            const isCat = String(item.category).includes(key);
            const s = item.status ? String(item.status).trim() : "";
            const isActive = s === "新統合" || s === "単独提案" || s === "表示";
            return isCat && isActive;
        });

        // 該当するデータが存在する場合、その最新のサマリーを右側に反映
        if (matchedActiveItems.length > 0) {
            const latestItem = matchedActiveItems[matchedActiveItems.length - 1];
            sumEl.textContent = latestItem.summary || "";
            sumEl.className = "text-dark fw-bold lh-base small bg-white p-2 rounded border border-success";
        } else {
            sumEl.innerHTML = `<span class="text-muted" style="font-size:0.75rem;">市民の声を収集中...</span>`;
            sumEl.className = "text-muted small p-2 text-center bg-light rounded";
        }
    });
}
