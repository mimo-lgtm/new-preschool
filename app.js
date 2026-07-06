// ==========================================
// 1. 設定・定数・グローバル変数定義
// ==========================================
const GAS_URL = "https://script.google.com/macros/s/AKfycbyDV8Ic3jWmDHaWTHrtzf19_aEgTxUAaP9EvM7XinMk1W4ZPFk9NVcdnGtV27LbrPp2/exec";

const CAT_MAP = {
    "主体": "主体的な学び",
    "好奇心": "楽しさと好奇心",
    "未来": "未来を生き抜く力",
    "個性": "個性・才能の開花",
    "シームレス": "シームレス成長支援"
};

const STRUC_CONFIG = {
    "主体的な学び": ["子ども主導のプロジェクト学習", "選択制のアクティビティ", "デジタルを活用した自己表現", "その他"],
    "楽しさと好奇心": ["五感を使う自然体験", "失敗を歓迎する科学遊び", "地域のアート・文化資源の活用", "その他"],
    "未来を生き抜く力": ["非認知能力の育成", "多様な人々と協働する体験", "答えのない問いに挑む力", "その他"],
    "個性・才能の開花": ["個別最適化された学習プラン", "多様な才能を認める評価基準", "特別なニーズを持つ子への支援", "その他"],
    "シームレス成長支援": ["保幼小の連携強化", "切れ目のない相談窓口", "育児休業からの復職支援", "その他"]
};

// 【固定分析】アイデアの地図・左側用の300字固定分析テキスト
const FIXED_MAP_ANALYSIS = {
    "主体": "【全体傾向分析】多くの市民から、子どもたちが自発的に活動を選択できる環境づくりへの要望が寄せられています。画一的な一斉保育から脱却し、個々の興味関心に基づくプロジェクト型学習の導入や、デジタルを活用した自己表現の場を確保することが急務とされています。課題は自由度を高めた際の見守りの難しさですが、保育者が『教える』立場から『子どもの探求を支える』ファシリテーターへとシフトするための研修体制を整備することが、今後の現場改革における最大のブレイクスルーの鍵となります。",
    "好奇心": "【全体傾向分析】自然体験や五感を使った遊びを通じて、科学的探究心の芽生えを重視する意見が多数を占めています。失敗を恐れずに挑戦できる遊びの場や、地域のアート・文化資源を日常の保育に融合させるアイデアが注目を集めています。懸念点としては、屋外活動時などの安全性確保と保育者の引率負担増が挙げられますが、地域のシニア人材や専門家ボランティアを巻き込んだ『コミュニティ一体型保育』を構築することで、安全かつ持続可能な運営が可能となります。",
    "未来": "【全体傾向分析】予測困難な時代において、非認知能力（やり抜く力、感情コントロール等）や多様な人々と協働する体験を重視する提案が多く見られます。答えのない問いにチームで挑むワークショップなど、幼児期から社会との接点を持つ重要性が説かれています。現場のカリキュラム過密化が懸念されますが、既存の行事中心のスケジュールを見直し、日常の自由遊びの中に『協働と対話』を促す仕掛けを組み込むことで、現場に負担をかけずに能力を育むアプローチが期待されます。",
    "個性": "【全体傾向分析】子どもの多様な才能を認め、凸凹のある発達や特別なニーズに対しても、個別最適化された支援を行いたいという願いが強く反映されています。一律の基準での評価を改め、ポートフォリオ等を活用した多角的な成長記録の導入が提案されています。専門知識を持つスタッフの不足が共通の課題ですが、外部の専門機関や理学療法士等とのオンライン巡回相談システムの構築、および保育者向けの簡易診断スキルの習得支援によって、早期の適切なケアが実現します。",
    "シームレス": "【全体傾向分析】幼稚園・保育園から小学校への移行期（いわゆる小１の壁）における、切れ目のない保幼小連携と成長支援を求める声が集中しています。就学前の育ちの情報が小学校へ滑らかに引き継がれず、子どもが環境変化に戸惑う課題が指摘されています。解決には、自治体主導による「保幼小合同の研修会」の定期開催や、保護者がいつでも育児休業からの復職や子育ての悩みを一元的に相談できる、デジタル相談窓口の統合化が不可欠なステップとなります。"
};

let allOpinions = [];
let currentAiResult = null; 

// ==========================================
// 2. メイン処理（画面初期化・イベント設定）
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
    // 起動時にまず左側の地図を固定テキストで埋める
    initializeStaticMap();
    
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
                        for (const [htmlVal, gasVal] of Object.entries(CAT_MAP)) {
                            if (gasVal === bigCat) {
                                categorySelect.value = htmlVal;
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
            const bigCat = CAT_MAP[selectedShortCat] || "主体的な学び";
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

// 左側の地図テキストを初期状態で強制固定配置する関数
function initializeStaticMap() {
    const keys = ["主体", "好奇心", "未来", "個性", "シームレス"];
    keys.forEach(key => {
        const baseEl = document.getElementById(`base-text-${key}`);
        if (baseEl) {
            baseEl.textContent = FIXED_MAP_ANALYSIS[key];
        }
        // 右側はいったん空か初期状態にする
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
        
        if (data && Array.isArray(data.opinions)) {
            allOpinions = data.opinions;
        } else if (Array.isArray(data)) {
            allOpinions = data;
        } else {
            allOpinions = [];
        }
        
        render3StepProposalBox(allOpinions);
        renderIdeaMap(allOpinions);

        const mapAnalysisEl = document.getElementById("map-analysis");
        if (mapAnalysisEl && allOpinions.length > 0) {
            const firstWithAiJson = allOpinions.find(item => item.aiJson && item.aiJson.trim() !== "");
            mapAnalysisEl.textContent = firstWithAiJson ? firstWithAiJson.aiJson : "現在、複数の提案を掛け合わせた新しいクロス分析マップを自動生成しています。";
        }

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
// 4. 📦 3段階アコーディオン描画（新統合対応版）
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
        
        // 大分類の一致（表記ブレ・空白対策）
        const totalBigCount = opinions.filter(item => {
            return item.category && String(item.category).trim() === bigCat.trim();
        }).length;

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

            // スプレッドシート内の「大分類」と「中分類」の両方が完全に一致する全レコードを抽出
            const matchedItems = opinions.filter(item => {
                if (!item.category || !item.midCat) return false;
                return String(item.category).trim() === bigCat.trim() && String(item.midCat).trim() === midCat.trim();
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
                // 各ステータスのデータ抽出（表記揺れ吸収のためtrimを徹底）
                const newMergeItems = matchedItems.filter(item => item.status && String(item.status).trim() === "新統合");
                const singleItems = matchedItems.filter(item => !item.status || (String(item.status).trim() !== "新統合" && String(item.status).trim() !== "元記事"));
                const originalItems = matchedItems.filter(item => item.status && String(item.status).trim() === "元記事");

                // 1. 👑 新統合（16行目〜30行目の統合データ）を一番上に目立たせて描画
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

                // 2. 単独提案
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
// 5. 🗺️ アイデアの地図（マッピング処理）
// ==========================================
function renderIdeaMap(opinions) {
    const keys = ["主体", "好奇心", "未来", "個性", "シームレス"];

    keys.forEach(key => {
        const gasCategoryName = CAT_MAP[key];
        const baseEl = document.getElementById(`base-text-${key}`);
        const sumEl = document.getElementById(`sum-text-${key}`);
        
        // 左側はGASの通信結果に関わらず、ここで再度確実に300字固定文を代入
        if (baseEl) {
            baseEl.textContent = FIXED_MAP_ANALYSIS[key] || "";
        }

        if (!sumEl) return;

        // 右側用：該当カテゴリの「新統合」または「単独提案」の最新アクティブデータを抽出
        const matchedActiveItems = opinions.filter(item => {
            if (!item.category || !item.status) return false;
            const isCat = String(item.category).trim() === gasCategoryName;
            const statusStr = String(item.status).trim();
            const isActive = statusStr === "新統合" || statusStr === "単独提案";
            return isCat && isActive;
        });

        // 該当する市民の声や統合データが存在する場合のみ、右側にそのサマリーを上書き反映
        if (matchedActiveItems.length > 0) {
            const latestItem = matchedActiveItems[matchedActiveItems.length - 1];
            sumEl.textContent = latestItem.summary || "";
            sumEl.className = "text-dark fw-bold lh-base small bg-white p-2 rounded border border-success";
        } else {
            // 合致するデータが1件もない場合は初期状態（収集中）に戻す
            sumEl.innerHTML = `<span class="text-muted" style="font-size:0.75rem;">市民の声を収集中...</span>`;
            sumEl.className = "text-muted small p-2 text-center bg-light rounded";
        }
    });
}
