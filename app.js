const GAS_URL = "https://script.google.com/macros/s/AKfycbz_kVbBkm2vye9FRcSOTzvYHNLFTVesZp45x7By_hFrLcJJLgPDieuoXlU7IlYpcehm/exec";

const BIG_ORDER = ["主体的な学び", "楽しさと好奇心", "未来を生き抜く力", "個性・才能の開花", "シームレス成長支援"];

const BIG_TO_KEY = {
  "主体的な学び": "主体",
  "楽しさと好奇心": "好奇心",
  "未来を生き抜く力": "未来",
  "個性・才能の開花": "個性",
  "シームレス成長支援": "シームレス"
};

let allOpinions = [];
let currentAiResult = null;
let mapLiveMode = false;

document.addEventListener("DOMContentLoaded", () => {
  const btnAiAnalysis = document.getElementById("btnAiAnalysis");
  const btnSubmitToBox = document.getElementById("btnSubmitToBox");
  const btnMapRefresh = document.getElementById("btnMapRefresh");
  const btnMapClear = document.getElementById("btnMapClear");
  const btnRefreshProposalBox = document.getElementById("btnRefreshProposalBox");
  const aiPlaceholder = document.getElementById("aiPlaceholder");
  const aiAssistBox = document.getElementById("aiAssistBox");
  const aiSummaryText = document.getElementById("aiSummaryText");
  const aiPerspectivesText = document.getElementById("aiPerspectivesText");
  const aiTitleText = document.getElementById("aiTitleText");
  const aiRefinedText = document.getElementById("aiRefinedText");

  const btnVoiceInput = document.getElementById("btnVoiceInput");
  const btnVoiceStop = document.getElementById("btnVoiceStop");
  const voiceStatus = document.getElementById("voiceStatus");
  const txtContent = document.getElementById("content");

  let recognition = null;
let isListening = false;
let finalText = "";

function setupVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    if (voiceStatus) voiceStatus.textContent = "このブラウザは音声入力に対応していません。";
    if (btnVoiceInput) btnVoiceInput.disabled = true;
    return null;
  }

  const rec = new SpeechRecognition();
  rec.lang = "ja-JP";
  rec.continuous = true;
  rec.interimResults = false;

  rec.onstart = () => {
    isListening = true;
    finalText = "";
    if (voiceStatus) voiceStatus.textContent = "音声入力中です。話してください。";
    if (btnVoiceInput) btnVoiceInput.disabled = true;
    if (btnVoiceStop) btnVoiceStop.disabled = false;
  };

  rec.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      finalText += event.results[i][0].transcript;
    }
    if (txtContent) {
      txtContent.value = finalText.trim();
    }
  };

  rec.onerror = (event) => {
    console.error(event);
    if (voiceStatus) voiceStatus.textContent = `音声入力エラー: ${event.error}`;
    stopVoice();
  };

  rec.onend = () => {
    isListening = false;
    if (voiceStatus) voiceStatus.textContent = "音声入力は停止しました。";
    if (btnVoiceInput) btnVoiceInput.disabled = false;
    if (btnVoiceStop) btnVoiceStop.disabled = true;
  };

  return rec;
}

  function startVoice() {
    if (!recognition) recognition = setupVoiceRecognition();
    if (!recognition) return;
    try {
      recognition.start();
    } catch (e) {
      console.error(e);
    }
  }

  function stopVoice() {
    if (recognition && isListening) {
      recognition.stop();
    }
  }

  if (btnVoiceInput) btnVoiceInput.addEventListener("click", startVoice);
  if (btnVoiceStop) btnVoiceStop.addEventListener("click", stopVoice);

  if (aiAssistBox) aiAssistBox.classList.add("d-none");
  if (aiPlaceholder) aiPlaceholder.style.removeProperty("display");

  fetchOpinions();
  renderMapPanels();
  renderProposalBox();

  if (btnMapRefresh) btnMapRefresh.addEventListener("click", () => {
    mapLiveMode = true;
    renderMapPanels();
  });

  if (btnMapClear) btnMapClear.addEventListener("click", () => {
    mapLiveMode = false;
    renderMapPanels();
  });

  if (btnRefreshProposalBox) btnRefreshProposalBox.addEventListener("click", fetchOpinions);

  if (btnAiAnalysis) {
    btnAiAnalysis.addEventListener("click", async () => {
      const contentValue = txtContent ? txtContent.value.trim() : "";
      if (!contentValue) return alert("あなたの想いやアイデアを自由に入力してください。");

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

          if (aiSummaryText) aiSummaryText.innerHTML = `<strong>【自動分類】</strong> ${escapeHtml(bigCat)} ＞ ${escapeHtml(midCat)}`;

          if (aiPerspectivesText) {
            aiPerspectivesText.innerHTML = `
<div class="mb-3"><strong>a. 核心</strong><br><span class="text-dark">${escapeHtml(currentAiResult["核心"] || "分析中")}</span></div>
<div class="mb-3"><strong>b. 変化</strong><br><span class="text-dark">${escapeHtml(currentAiResult["変化"] || "分析中")}</span></div>
<div class="mb-3"><strong>c. 成功事例</strong><br><span class="text-dark">${escapeHtml(currentAiResult["成功事例"] || "分析中")}</span></div>
<div class="mb-3"><strong>d. 懸念点</strong><br><span class="text-dark">${escapeHtml(currentAiResult["懸念点"] || "分析中")}</span></div>
<div class="mb-1"><strong>e. 問い</strong><br><span class="text-dark">${escapeHtml(currentAiResult["問い"] || "分析中")}</span></div>
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
    btnSubmitToBox.addEventListener("click", async () => {
      if (!currentAiResult) return;

      const bigCat = currentAiResult["大分類"] || "その他";
      const midCat = currentAiResult["中分類"] || "その他";

      if (!confirm(`正式に提案箱へ投稿しますか？\n(大分類「${bigCat}」 > 中分類「${midCat}」へ格納されます)`)) return;

      const rawText = txtContent ? txtContent.value.trim() : "";

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

async function fetchOpinions() {
  try {
    const res = await fetch(GAS_URL + "?action=get");
    const data = await res.json();

    if (data.status !== "success") {
      console.error(data.message);
      allOpinions = [];
      renderProposalBox();
      return;
    }

    allOpinions = Array.isArray(data.opinions) ? data.opinions : [];
    console.log("opinions:", allOpinions);
    renderProposalBox();
  } catch (e) {
    console.error(e);
    allOpinions = [];
    renderProposalBox();
  }
}

function buildLiveSummary(big, merged, related) {
  const countText = `対象件数: ${related.length}件 / 新統合: ${merged.length}件`;
  const latest = merged.slice(0, 3).map(o => o.summary || o.content || o.title).filter(Boolean).join(" / ");
  return latest ? `${countText}\n\n${latest}` : `${countText}\n\nまだ新統合はありません。`;
}

function renderProposalBox() {
  const container = document.getElementById("proposal-container");
  if (!container) return;

  if (!allOpinions.length) {
    container.innerHTML = `<div class="text-muted p-4">まだ提案がありません。</div>`;
    return;
  }

  const html = BIG_ORDER.map(big => {
    const bigOpinions = allOpinions.filter(o => normalizeBig(o.bigCatName) === big);
    const mids = buildMidList(big, bigOpinions);

    return `
      <div class="category-accordion-item">
        <button class="category-accordion-header" type="button" onclick="toggleTree('big-${slug(big)}')">
          <span>🌳 ${escapeHtml(big)}</span>
          <span class="badge bg-primary">${bigOpinions.length}</span>
        </button>
        <div id="big-${slug(big)}" class="category-accordion-body" style="display:none;">
          ${mids.map(mid => renderMidSection(big, mid, bigOpinions)).join("")}
        </div>
      </div>
    `;
  }).join("");

  container.innerHTML = html;
}

function buildMidList(big, opinions) {
  const fixed = getFixedMids(big);
  const mids = new Set(["その他", ...fixed]);
  opinions.forEach(o => {
    const m = normalizeMid(o.midCatName, big);
    if (m) mids.add(m);
  });
  return Array.from(mids);
}

function getFixedMids(big) {
  const m = {
    "主体的な学び": ["子ども主導のプロジェクト学習", "選択制のアクティビティ", "デジタルを活用した自己表現"],
    "楽しさと好奇心": ["五感を使う自然体験", "失敗を歓迎する科学遊び", "地域のアート・文化資源の活用"],
    "未来を生き抜く力": ["非認知能力の育成", "多様な人々と協働する体験", "答えのない問いに挑む力"],
    "個性・才能の開花": ["個別最適化された学習プラン", "多様な才能を認める評価基準", "特別なニーズを持つ子への支援"],
    "シームレス成長支援": ["保幼小の連携強化", "切れ目のない相談窓口", "育児休業からの復職支援"]
  };
  return m[big] || [];
}

function renderMidSection(big, mid, opinions) {
  const group = opinions.filter(o => normalizeMid(o.midCatName, big) === mid);
  const merged = group.filter(o => normalizeStatus(o.status) === "新統合");
  const proposals = group.filter(o => normalizeStatus(o.status) === "新提案" || normalizeStatus(o.status) === "単独提案");
  const originals = group.filter(o => normalizeStatus(o.status) === "元記事");

  return `
    <div class="lane-col mb-3">
      <button class="category-accordion-header p-3" type="button" onclick="toggleTree('mid-${slug(big)}-${slug(mid)}')">
        <span>📂 ${escapeHtml(mid)}</span>
        <span class="badge bg-dark">${group.length}</span>
      </button>
      <div id="mid-${slug(big)}-${slug(mid)}" style="display:none; padding: 12px 0 0 0;">
        <div class="mb-2">${labelBadge("新統合")} ${merged.length}</div>
        ${merged.length ? merged.map((p,i) => renderPostCard(p, "新統合", i)).join("") : `<div class="text-muted small mb-3">新統合はありません。</div>`}

        <div class="mb-2">${labelBadge("新提案")} ${proposals.length}</div>
        ${proposals.length ? proposals.map((p,i) => renderPostCard(p, "新提案", i)).join("") : `<div class="text-muted small mb-3">新提案はありません。</div>`}

        <div class="mb-2">${labelBadge("元記事")} ${originals.length}</div>
        ${originals.length ? originals.map((p,i) => renderOriginalFolder(p, i)).join("") : `<div class="text-muted small">元記事はありません。</div>`}
      </div>
    </div>
  `;
}

function renderPostCard(post, status, idx) {
  const cls = status === "新統合" ? "bg-danger" : "bg-primary";
  return `
    <div class="opinion-card">
      <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
        <div class="card-title-text mb-0">${escapeHtml(post.title || "無題")}</div>
        <span class="badge ${cls}">${status}</span>
      </div>
      <div class="small text-muted mb-2">${escapeHtml((post.summary || post.content || "").slice(0, 100))}</div>
    </div>
  `;
}

function renderOriginalFolder(post, idx) {
  const id = `orig-${slug(post.title || "x")}-${idx}`;
  return `
    <div class="accordion-item border-0 mb-2">
      <button class="category-accordion-header p-3" type="button" onclick="toggleTree('${id}')">
        <span>📄 ${escapeHtml(post.title || "無題")}</span>
        <span class="badge bg-secondary">元記事</span>
      </button>
      <div id="${id}" style="display:none;" class="p-3 bg-white border rounded-bottom">
        <div class="small text-muted mb-2">${escapeHtml(post.reason || "")}</div>
        <div class="small">${escapeHtml(post.summary || post.content || "")}</div>
      </div>
    </div>
  `;
}

function labelBadge(text) {
  const cls = text === "新統合" ? "bg-danger" : text === "新提案" ? "bg-primary" : "bg-secondary";
  return `<span class="badge ${cls} me-2">${text}</span>`;
}

function normalizeStatus(s) {
  const x = String(s || "").trim();
  if (x === "新統合" || x === "新提案" || x === "元記事") return x;
  if (x === "単独提案") return "新提案";
  return "新提案";
}

function normalizeBig(s) {
  return String(s || "").trim();
}

function normalizeMid(mid, big) {
  const x = String(mid || "").trim();
  if (x) return x;
  return "その他";
}

function slug(str) {
  return String(str || "").replace(/[^\wぁ-んァ-ヶ一-龠ー]/g, "_");
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toggleTree(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = el.style.display === "none" || !el.style.display ? "block" : "none";
}
