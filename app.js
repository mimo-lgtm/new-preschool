const GAS_URL = "https://script.google.com/macros/s/AKfycby8HCiLJ_uch9y7vwrFVf6GhmeBF5K_T3OE8OPAhQ2utDp-mrR2Daad91WhVuPgtn8Z/exec"; // 貼り付け後、デプロイは不要

document.addEventListener("DOMContentLoaded", function () {
    console.log("初期化開始");
    fetchData();
});

async function fetchData() {
    try {
        const response = await fetch(GAS_URL);
        const data = await response.json();
        console.log("データ取得成功:", data);
    } catch (err) {
        console.error("取得エラー:", err);
    }
}
