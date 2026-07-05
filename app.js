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

document.addEventListener("DOMContentLoaded", function () {
    // 画面を開いたらスプレッドシートからデータを取得
    fetchOpinions();
});

// データ取得
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
        
        // 提案箱（タブ3）の3段階アコーディオンを描画
        render3StepProposalBox(allOpinions);

    } catch (e) {
        console.error("データ取得失敗:", e);
        const container = document.getElementById("proposal-container");
        if (container) container.innerHTML = `<p class="text-danger">データの読み込みに失敗しました。</p>`;
    }
}

// 📦 3段階アコーディオン & 件数バッジ付き 描画ロジック
function render3StepProposalBox(opinions) {
    const container = document.getElementById("proposal-container");
    if (!container) return;
    container.innerHTML = ""; // 初期化

    // 親アコーディオンの作成
    const mainAccordion = document.createElement("div");
    mainAccordion.className = "accordion";
    mainAccordion.id = "mainProposalAccordion";

    let bigIndex = 0;

    // 1段階目：大分類のループ
    for (const [bigCat, midCatList] of Object.entries(STRUC_CONFIG)) {
        bigIndex++;
        
        // この大分類に属する全記事数をカウント
        const totalBigCount = opinions.filter(item => item.category && String(item.category).trim().includes(bigCat.substring(0, 4))).length;

        const bigCollapseId = `bigCollapse-${bigIndex}`;
        const bigAccordionItem = document.createElement("div");
        bigAccordionItem.className = "accordion-item mb-3 shadow-sm border rounded overflow-hidden";
        bigAccordionItem.style.borderRadius = "8px";

        // 大分類ヘッダー（右上にバッジ配置用スタイル）
        bigAccordionItem.innerHTML = `
            <h2 class="accordion-header position-relative">
                <button class="accordion-button collapsed py-3 bg-dark text-white fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#${bigCollapseId}">
                    ${bigCat}
                </button>
                <span class="position-absolute top-50 end-0 translate-middle-y me-5 badge bg-primary rounded-pill" style="z-index:10; font-size:0.9rem;">${totalBigCount} 件</span>
            </h2>
        `;

        // 大分類のボディ（この中に中分類のアコーディオンを入れる）
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

            // この中分類に属するデータを抽出
            const matchedItems = opinions.filter(item => {
                const bMatch = item.category && String(item.category).trim().includes(bigCat.substring(0, 4));
                const mMatch = item.midCat && String(item.midCat).trim() === midCat;
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
            midCollapseDiv.setAttribute("data-bs-parent", `#midAccordion-${bigIndex}`);

            const midBody = document.createElement("div");
            midBody.className = "accordion-body bg-white p-3";

            // 3段階目：中分類の中身（新統合、単独投稿、元記事の仕分け表示）
            if (matchedItems.length === 0) {
                midBody.innerHTML = `<p class="text-muted small mb-0">この分類の投稿はまだありません。</p>`;
            } else {
                // 1. 新統合データの抽出
                const newMergeItems = matchedItems.filter(item => item.status && String(item.status).trim() === "新統合");
                // 2. 単独投稿データの抽出
                const singleItems = matchedItems.filter(item => !item.status || (String(item.status).trim() !== "新統合" && String(item.status).trim() !== "元記事"));
                // 3. 元記事データの抽出
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

                // --- 📂 元記事の描画（クリックで全件開閉するアコーディオン構造） ---
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
