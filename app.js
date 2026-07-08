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

// 唯一の定義：名称ベースで管理
const CATEGORY_STRUCTURE = {
    "シームレス成長支援": ["保幼小の連携強化", "切れ目のない相談窓口", "育児休業からの復職支援", "その他"],
    "主体的な学び": ["探究心を育む知育環境", "子ども主導のプロジェクト学習", "デジタルを活用した自己表現", "その他"],
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
            // カテゴリの取得（既存の処理）
            // 削除の代わりに、AIの判定結果（bigCat, midCat）をそのまま使用する
// これにより、手動選択のロジックを完全に排除します
const finalBigCat = bigCat; // AIが判定した大分類名称
const finalMidCat = midCat; // AIが判定した中分類名称
            // 投稿の確認ダイアログの生成と判定
           // 投稿の確認ダイアログ（名称のみを使用）
const message = `正式に提案箱へ投稿しますか？\n(大分類「${finalBigCat}」 > 中分類「${finalMidCat}」へ格納されます)`;

if (!confirm(message)) {
    return; // キャンセル
}

            const txtContent = document.getElementById("content");
            const rawText = txtContent ? txtContent.value.trim() : "";

            btnSubmitToBox.disabled = true;
            btnSubmitToBox.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> 提案箱へ投稿中...`;

            try {
                const res = await fetch(GAS_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain" },
                    // 修正対象: 投稿時の body 送信部分
// 修正対象: fetch(GAS_URL, {...}) の直前にある body: JSON.stringify({...}) の部分
body: JSON.stringify({
    action: "submit",
    content: rawText,
    title: currentAiResult["推奨タイトル"] || "無題の提案",
    summary: currentAiResult["要約200"] || "",
    // 【強制上書き】AIの結果がない場合でも「その他」とする
    bigCatName: currentAiResult["大分類"] || "その他",
    midCatName: currentAiResult["中分類"] || "その他",
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
// 4. 描画ロジック（アコーディオン式・名前表示版）
// ==========================================
// 名称だけで構成された構造定義（IDは含みません）

// 4. 描画ロジック（アコーディオン式・内容表示・名称変換版）
function renderStructuredIdeas(ideasDataset) {
    const container = document.getElementById("proposal-container");
    container.innerHTML = "";

    const accordion = document.createElement("div");
    accordion.className = "accordion shadow-sm";
    accordion.id = "mainAccordion";

    // CATEGORY_STRUCTURE を直接回す（IDは一切不要）
    Object.entries(CATEGORY_STRUCTURE).forEach(([bigName, midNames], bIndex) => {
        const bigId = `big${bIndex}`;
        const bigItem = document.createElement("div");
        bigItem.className = "accordion-item border-0 mb-3";
        bigItem.innerHTML = `
            <h2 class="accordion-header">
                <button class="accordion-button collapsed fw-bold fs-4 bg-primary text-white" type="button" data-bs-toggle="collapse" data-bs-target="#${bigId}">
                    ${bigName}
                </button>
            </h2>
            <div id="${bigId}" class="accordion-collapse collapse" data-bs-parent="#mainAccordion">
                <div class="accordion-body bg-white" id="midContainer${bIndex}"></div>
            </div>
        `;
        accordion.appendChild(bigItem);

        const midContainer = bigItem.querySelector(`#midContainer${bIndex}`);
        midNames.forEach((midName, mIndex) => {
            // 名称一致でフィルタリング
            const filtered = ideasDataset.filter(i => i.bigCatName === bigName && i.midCatName === midName);
            
            // 並び替え：新統合(status === '新統合') を一番上にする
            filtered.sort((a, b) => (b.status === '新統合') - (a.status === '新統合'));

            const midId = `mid${bIndex}${mIndex}`;
            const midItem = document.createElement("div");
            midItem.className = "accordion-item border-0 mb-2";
            midItem.innerHTML = `
                <h2 class="accordion-header">
                    <button class="accordion-button collapsed fw-bold fs-5" type="button" data-bs-toggle="collapse" data-bs-target="#${midId}">
                        ${midName} (${filtered.length})
                    </button>
                </h2>
                <div id="${midId}" class="accordion-collapse collapse">
                    <div class="accordion-body">
                        ${filtered.map(idea => `
                            <div class="card mb-2 ${idea.status === '新統合' ? 'border-success' : 'border-primary'}">
                                <div class="card-header ${idea.status === '新統合' ? 'bg-success text-white' : 'bg-primary text-white'}">
                                    ${idea.status === '新統合' ? '★ ' : ''}${idea.status}：${idea.title}
                                </div>
                                <div class="card-body">
                                    <p class="card-text">${idea.content || idea.summary}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            midContainer.appendChild(midItem);
        });
    });
    container.appendChild(accordion);
}
