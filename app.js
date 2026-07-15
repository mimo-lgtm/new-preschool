const GAS_URL = "https://script.google.com/macros/s/AKfycbz_kVbBkm2vye9FRcSOTzvYHNLFTVesZp45x7By_hFrLcJJLgPDieuoXlU7IlYpcehm/exec";

let allOpinions = [];
let currentAiResult = null;

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

    if (btnSubmitToBox) {
        btnSubmitToBox.addEventListener("click", async function () {
            if (!currentAiResult) return;

            const txtContent = document.getElementById("content");
            const rawText = txtContent ? txtContent.value.trim() : "";

            const bigCat = currentAiResult["大分類"] || "その他";
            const midCat = currentAiResult["中分類"] || "その他";

            const message = `正式に提案箱へ投稿しますか？\n(大分類「${bigCat}」 > 中分類「${midCat}」へ格納されます)`;
            if (!confirm(message)) return;

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
                    alert("📥 投稿が完了しました！");

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

        if (data.status !== "success") {
            console.error(data.message);
            return;
        }

        allOpinions = data.opinions || [];
        renderProposalTree(allOpinions);
    } catch (e) {
        console.error(e);
    }
}

function renderProposalTree(opinions) {
    const container = document.getElementById("proposal-container");
    if (!container) return;

    container.innerHTML = "";

    const TREE = {
        "主体的な学び": [
            "子ども主導のプロジェクト学習",
            "選択制のアクティビティ",
            "デジタルを活用した自己表現",
            "その他"
        ],
        "楽しさと好奇心": [
            "五感を使う自然体験",
            "失敗を歓迎する科学遊び",
            "地域のアート・文化資源の活用",
            "その他"
        ],
        "未来を生き抜く力": [
            "非認知能力の育成",
            "多様な人々と協働する体験",
            "答えのない問いに挑む力",
            "その他"
        ],
        "個性・才能の開花": [
            "個別最適化された学習プラン",
            "多様な才能を認める評価基準",
            "特別なニーズを持つ子への支援",
            "その他"
        ],
        "シームレス成長支援": [
            "保幼小の連携強化",
            "切れ目のない相談窓口",
            "育児休業からの復職支援",
            "その他"
        ]
    };

    let html = "";
    let bigNo = 0;

    Object.keys(TREE).forEach(big => {
        bigNo++;
        html += `
        <div class="big-box">
            <div class="big-title" onclick="toggleTree('big${bigNo}')">
                🌳 ${big}
            </div>
            <div id="big${bigNo}" style="display:none">
        `;

        let midNo = 0;

        TREE[big].forEach(mid => {
            midNo++;
            html += `
            <div class="mid-box">
                <div class="mid-title" onclick="toggleTree('mid${bigNo}_${midNo}')">
                    📂 ${mid}
                </div>
                <div id="mid${bigNo}_${midNo}" style="display:none">
            `;

            opinions
                .filter(o => String(o.bigCatName || "").trim() === big && String(o.midCatName || "").trim() === mid)
                .forEach((post, p) => {
                    html += `
                    <div class="post-title" onclick="toggleTree('post${bigNo}_${midNo}_${p}')">
                        📝 ${post.title}
                    </div>
                    <div class="post-body" id="post${bigNo}_${midNo}_${p}" style="display:none">
                        ${post.summary || ""}
                    </div>
                    `;
                });

            html += `
                </div>
            </div>
            `;
        });

        html += `
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
}

function toggleTree(id) {
    const el = document.getElementById(id);
    if (!el) return;

    if (el.style.display === "none") {
        el.style.display = "block";
    } else {
        el.style.display = "none";
    }
}
