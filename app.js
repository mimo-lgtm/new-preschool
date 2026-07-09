// ==========================================
// 1. 設定・定数・グローバル変数定義
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
                const res = await // 【修正前】
fetch(GAS_URL,{ 
    method: "POST", // ここにも { が足りない可能性が高いです

// 【修正後】
fetch(GAS_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        action: "submit",
        content: rawText,
        title: currentAiResult["推奨タイトル"] || "無題の提案",
        summary: currentAiResult["要約200"] || "",
        bigCatName: globalBigCat, 
        midCatName: globalMidCat
    })
});
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
    headers: { "Content-Type": "application/json" }, // "text/plain" から変更
    body: JSON.stringify({ 
        action: "analyze", 
        content: contentValue 
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
// ==========================================
// 4. 描画ロジック（アコーディオン式）
// ==========================================

/* 【退避：古い描画ロジック】
   以前使用していた「名称変換版」のロジックです。
   必要に応じてこのコメントアウトを外してください。
*/
/*
function renderStructuredIdeas(ideasDataset) {
    const proposalContainer = document.getElementById("proposal-container");
    if (proposalContainer) proposalContainer.innerHTML = "";
    // ... (以前の複雑なロジック)
    // 括弧の整合性に注意して復元してください
}
*/

/**
 * 【修復済み：階層型アコーディオン表示ロジック】
 * 現在はこちらのロジックがアクティブです。
 * スプレッドシートのデータを大分類＞中分類＞タイトルの順でツリー表示します。
 */
function renderStructuredIdeas(ideasDataset) {
    const container = document.getElementById("proposal-container");
    if (!container) return;
    container.innerHTML = ""; // 初期化

    // 1. データを階層化するオブジェクトを構築
    const structure = {};
    
    // ideasDataset は配列データであると仮定
    ideasDataset.forEach(row => {
        // row[1]: 大分類, row[6]: 中分類, row[2]: タイトル, row[3]: 要約
        // rowデータがない場合への対策
        const big = (row[1] || "その他").trim();
        const mid = (row[6] || "その他").trim();

        if (!structure[big]) structure[big] = {};
        if (!structure[big][mid]) structure[big][mid] = [];
        
        structure[big][mid].push(row);
    });

    // 2. HTMLを生成してDOMに追加
    Object.keys(structure).forEach(bigName => {
        const bigDetails = document.createElement("details");
        bigDetails.className = "mb-3 border rounded p-3 shadow-sm";
        bigDetails.innerHTML = `<summary class="fw-bold fs-5 p-2" style="cursor:pointer;">${bigName}</summary>`;

        Object.keys(structure[bigName]).forEach(midName => {
            const midDetails = document.createElement("details");
            midDetails.className = "ms-4 mt-2 border-start ps-3";
            midDetails.innerHTML = `<summary class="fw-bold text-primary p-1" style="cursor:pointer;">${midName}</summary>`;

            structure[bigName][midName].forEach(post => {
                const postDiv = document.createElement("div");
                postDiv.className = "ms-3 mt-1 p-2 bg-light border-bottom";
                // post[2]: タイトル, post[3]: 要約
                postDiv.innerHTML = `<strong>${post[2] || "無題の提案"}</strong><br><small class="text-muted">${post[3] || ""}</small>`;
                midDetails.appendChild(postDiv);
            });
            bigDetails.appendChild(midDetails);
        });
        container.appendChild(bigDetails);
    });
}
