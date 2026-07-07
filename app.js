var GAS_URL = "https://script.google.com/macros/s/AKfycby8HCiLJ_uch9y7vwrFVf6GhmeBF5K_T3OE8OPAhQ2utDp-mrR2Daad91WhVuPgtn8Z/exec";

// 画面読み込み時に実行
document.addEventListener("DOMContentLoaded", function () {
    fetchOpinions();
});

// データ取得（非同期処理を整理）
async function fetchOpinions() {
    try {
        var res = await fetch(GAS_URL);
        var data = await res.json();
        console.log("データ取得成功:", data);
        // ここに描画処理を追加できます
    } catch (e) {
        console.error("エラー:", e);
    }
}

// 投稿処理（ボタンに紐づける関数）
async function submitIdea(data) {
    try {
        var res = await fetch(GAS_URL, {
            method: "POST",
            body: JSON.stringify({ action: "add", ...data })
        });
        alert("投稿しました");
    } catch (e) {
        alert("送信失敗");
    }
}
