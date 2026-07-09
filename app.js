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
    container.innerHTML = "<h5>提案箱</h5>";

    ideasDataset.forEach(item => {
        const div = document.createElement("div");
        div.className = "card mb-2 p-3";
        div.innerHTML = `
            <strong>${item.title || "無題"}</strong><br>
            <small>${item.bigCatName || item.category || "その他"}</small><br>
            <small class="text-muted">${item.summary || ""}</small>
        `;
        container.appendChild(div);
    });
}
