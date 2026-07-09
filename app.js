const GAS_URL = "https://script.google.com/macros/s/AKfycbxmM8xb0WjGw32yLSVacv30nz2y1LabmGu0aKfFa9DBPRJUw6R_U9Q6odT5HA1A-t2I/exec";

let allOpinions = [];
let currentAiResult = null;

document.addEventListener("DOMContentLoaded", function () {
    const btnAiAnalysis = document.getElementById("btnAiAnalysis"); 
    const btnSubmitToBox = document.getElementById("btnSubmitToBox");

    fetchOpinions();

    if (btnAiAnalysis) {
        btnAiAnalysis.addEventListener("click", async function () {
            const contentValue = document.getElementById("content").value.trim();
            if (!contentValue) return alert("内容を入力してください。");

            const res = await fetch(GAS_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ action: "analyze", content: contentValue })
            });
            const data = await res.json();

            if (data.status === "success") {
                currentAiResult = data.result;
                alert("AI分析完了: " + currentAiResult["推奨タイトル"]);
            }
        });
    }

    if (btnSubmitToBox) {
        btnSubmitToBox.addEventListener("click", async function () {
            if (!currentAiResult) return alert("AI分析を先に行ってください。");

            const res = await fetch(GAS_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({
                    action: "submit",
                    content: document.getElementById("content").value.trim(),
                    title: currentAiResult["推奨タイトル"],
                    summary: currentAiResult["要約200"],
                    bigCatName: currentAiResult["大分類"] || "その他",
                    midCatName: currentAiResult["中分類"] || "その他"
                })
            });
            const data = await res.json();

            if (data.status === "success") {
                alert("投稿完了！");
                fetchOpinions();
            }
        });
    }
});

async function fetchOpinions() {
    const res = await fetch(GAS_URL + "?action=get");
    const data = await res.json();
    allOpinions = Array.isArray(data) ? data : (data?.opinions || []);
    console.log("取得データ:", allOpinions.length, "件");
}

function renderStructuredIdeas(ideasDataset) {
    console.log("描画中:", ideasDataset.length, "件");
}
// 投稿機能
if (btnSubmitToBox) {
    btnSubmitToBox.addEventListener("click", async function () {
        if (!currentAiResult) return alert("AI分析を先に行ってください。");

        const bigCat = currentAiResult["大分類"] || "その他";
        const midCat = currentAiResult["中分類"] || "その他";

        if (!confirm(`投稿しますか？\n（${bigCat} > ${midCat}）`)) return;

        const rawText = document.getElementById("content").value.trim();

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
                alert("投稿完了！");
                document.getElementById("content").value = "";
                fetchOpinions();
            } else {
                alert("投稿エラー: " + data.message);
            }
        } catch (err) {
            alert("送信エラー");
        }
    });
}

// 提案箱の表示
function renderStructuredIdeas(ideasDataset) {
    const container = document.getElementById("proposal-container");
    if (!container) return;
    container.innerHTML = "";

    const pillarRules = [
        { id: 1, bigName: "🌱 1. 探究心を育む知育環境（主体的な学び）", bigId: "BIG-1" },
        { id: 2, bigName: "🎨 2. 感性を磨くアートと表現（楽しさと好奇心）", bigId: "BIG-2" },
        { id: 3, bigName: "🤝 3. 協調性を養うグループワーク（未来を生き抜く力）", bigId: "BIG-3" },
        { id: 4, bigName: "🌳 4. 心身を健やかに育てる自然体験（個性・才能の開花）", bigId: "BIG-4" },
        { id: 5, bigName: "🌐 5. 地域と言語を繋ぐグローバルコミュニケーション（シームレス成長支援）", bigId: "BIG-5" }
    ];

    pillarRules.forEach(rule => {
        const pillarIdeas = ideasDataset.filter(item => {
            const cat = String(item.bigCatId || item.bigCatName || item.category || "").trim();
            return cat === rule.bigId || rule.bigName.includes(cat);
        });

        if (pillarIdeas.length === 0) return;

        const section = document.createElement("div");
        section.className = "mb-4";
        section.innerHTML = `<h5 class="fw-bold">${rule.bigName} (${pillarIdeas.length}件)</h5>`;

        pillarIdeas.forEach(idea => {
            const card = document.createElement("div");
            card.className = "card mb-2 p-3";
            card.style.cursor = "pointer";
            card.innerHTML = `
                <strong>${idea.title || "無題"}</strong><br>
                <small class="text-muted">${idea.summary || ""}</small>
            `;
            card.onclick = () => showIdeaDetail(idea);
            section.appendChild(card);
        });

        container.appendChild(section);
    });
}

function showIdeaDetail(idea) {
    alert(`【${idea.title}】\n\n${idea.summary}\n\n${idea.content || ""}`);
}
