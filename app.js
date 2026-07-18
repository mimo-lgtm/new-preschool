const GAS_URL = "https://script.google.com/macros/s/AKfycbz_kVbBkm2vye9FRcSOTzvYHNLFTVesZp45x7By_hFrLcJJLgPDieuoXlU7IlYpcehm/exec";
const BIG_ORDER = ["主体的な学び", "楽しさと好奇心", "未来を生き抜く力", "個性・才能の開花", "シームレス成長支援"];
let allOpinions = [];
let currentAiResult = null;
let mapLiveMode = false;

// ---------- ユーティリティ ----------
function escapeHtml(str){
  return String(str||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function slug(str){ return String(str||"").replace(/[^\wぁ-んァ-ヶ一-龠ー]/g,"_"); }
function normalizeStatus(s){
  const x = String(s||"").trim();
  if(x==="新統合"||x==="新提案"||x==="元記事") return x;
  if(x==="単独提案") return "新提案";
  return "新提案";
}
function normalizeBig(s){ return String(s||"").trim(); }
function normalizeMid(m){ return String(m||"").trim() || "その他"; }

// ---------- DOM ----------
document.addEventListener('DOMContentLoaded', () => {
  const btnAiAnalysis = document.getElementById("btnAiAnalysis");
  const btnSubmitToBox = document.getElementById("btnSubmitToBox");
  const btnMapRefresh = document.getElementById("btnMapRefresh");
  const btnMapClear = document.getElementById("btnMapClear");
  const btnRefreshProposalBox = document.getElementById("btnRefreshProposalBox");

  fetchOpinions();
  renderMapPanels(true);
  renderProposalBox();

  // タブ切替時に再描画（Bootstrapのイベント）
  document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(btn=>{
    btn.addEventListener('shown.bs.tab', e=>{
      const target = e.target.getAttribute('data-bs-target');
      if(target === "#map-tab-pane") renderMapPanels();
      if(target === "#list-tab-pane") renderProposalBox();
    });
  });

  if(btnMapRefresh) btnMapRefresh.addEventListener("click", () => { mapLiveMode = true; renderMapPanels(); });
  if(btnMapClear) btnMapClear.addEventListener("click", () => { mapLiveMode = false; renderMapPanels(); });
  if(btnRefreshProposalBox) btnRefreshProposalBox.addEventListener("click", fetchOpinions);

  if(btnAiAnalysis){
    btnAiAnalysis.addEventListener("click", async () => {
      const txtContent = document.getElementById("content");
      const contentValue = txtContent? txtContent.value.trim() : "";
      if(!contentValue) return alert("あなたの想いやアイデアを自由に入力してください。");
      btnAiAnalysis.disabled = true;
      btnAiAnalysis.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> AI が思考を整理中...`;
      try{
        const res = await fetch(GAS_URL, { method:"POST", headers:{ "Content-Type":"text/plain" }, body: JSON.stringify({ action:"analyze", content: contentValue }) });
        const data = await res.json();
        if(data.status==="success"){
          currentAiResult = data.result;
          const bigCat = currentAiResult["大分類"] || "その他";
          const midCat = currentAiResult["中分類"] || "その他";
          const aiSummaryText = document.getElementById("aiSummaryText");
          const aiPerspectivesText = document.getElementById("aiPerspectivesText");
          const aiTitleText = document.getElementById("aiTitleText");
          const aiRefinedText = document.getElementById("aiRefinedText");
          const aiPlaceholder = document.getElementById("aiPlaceholder");
          const aiAssistBox = document.getElementById("aiAssistBox");
          if(aiSummaryText) aiSummaryText.innerHTML = `<strong>【自動分類】</strong> ${escapeHtml(bigCat)} ＞ ${escapeHtml(midCat)}`;
          if(aiPerspectivesText){
            aiPerspectivesText.innerHTML = `
<div class="mb-3"><strong>a. 核心</strong><br><span class="text-dark">${escapeHtml(currentAiResult["核心"]||"分析中")}</span></div>
<div class="mb-3"><strong>b. 変化</strong><br><span class="text-dark">${escapeHtml(currentAiResult["変化"]||"分析中")}</span></div>
<div class="mb-3"><strong>c. 成功事例</strong><br><span class="text-dark">${escapeHtml(currentAiResult["成功事例"]||"分析中")}</span></div>
<div class="mb-3"><strong>d. 懸念点</strong><br><span class="text-dark">${escapeHtml(currentAiResult["懸念点"]||"分析中")}</span></div>
<div class="mb-1"><strong>e. 問い</strong><br><span class="text-dark">${escapeHtml(currentAiResult["問い"]||"分析中")}</span></div>`.trim();
          }
          if(aiTitleText) aiTitleText.textContent = currentAiResult["推奨タイトル"] || "無題の提案";
          if(aiRefinedText) aiRefinedText.textContent = currentAiResult["要約200"] || currentAiResult["要約 200"] || "";
          if(aiPlaceholder) aiPlaceholder.style.setProperty("display","none","important");
          if(aiAssistBox){ aiAssistBox.style.setProperty("display","flex","important"); aiAssistBox.classList.remove("d-none"); }
        }else{ alert("AI 分析エラー："+(data.message||"不明なエラー")); }
      }catch(err){ console.error(err); alert("通信エラーが発生しました。"); }
      finally{ btnAiAnalysis.disabled=false; btnAiAnalysis.innerHTML=`✨ 1. 意見を送信して AI と壁打ちする`; }
    });
  }

  if(btnSubmitToBox){
    btnSubmitToBox.addEventListener("click", async () => {
      if(!currentAiResult) return;
      const bigCat = currentAiResult["大分類"]||"その他";
      const midCat = currentAiResult["中分類"]||"その他";
      if(!confirm(`正式に提案箱へ投稿しますか？\n(大分類「${bigCat}」 > 中分類「${midCat}」へ格納されます)`)) return;
      const txtContent = document.getElementById("content");
      const rawText = txtContent? txtContent.value.trim() : "";
      btnSubmitToBox.disabled=true;
      btnSubmitToBox.innerHTML=`<span class="spinner-border spinner-border-sm" role="status"></span> 提案箱へ投稿中...`;
      try{
        const res = await fetch(GAS_URL, { method:"POST", headers:{ "Content-Type":"text/plain" }, body: JSON.stringify({ action:"submit", content: rawText, title: currentAiResult["推奨タイトル"]||"無題の提案", summary: currentAiResult["要約200"]||currentAiResult["要約 200"]||"", bigCatName: bigCat, midCatName: midCat, aiResult: currentAiResult }) });
        const data = await res.json();
        if(data.status==="success"){
          alert("📥 投稿が完了しました！");
          if(txtContent) txtContent.value="";
          document.getElementById("aiAssistBox")?.classList.add("d-none");
          document.getElementById("aiPlaceholder")?.style.removeProperty("display");
          currentAiResult=null;
          await fetchOpinions();
          const listTabBtn = document.getElementById("list-tab-btn");
          if(listTabBtn){ const tab = new bootstrap.Tab(listTabBtn); tab.show(); }
        }else{ alert("投稿エラー："+(data.message||"不明なエラー")); }
      }catch(err){ console.error(err); alert("送信エラーが発生しました。"); }
      finally{ btnSubmitToBox.disabled=false; btnSubmitToBox.innerHTML=`📥 この内容で提案箱へ正式に投稿する`; }
    });
  }
});

async function fetchOpinions(){
  try{
    const res = await fetch(GAS_URL+"?action=get", { method:"GET" });
    const data = await res.json();
    allOpinions = Array.isArray(data.opinions)? data.opinions : [];
    console.log("opinions:", allOpinions);
    renderMapPanels();
    renderProposalBox();
  }catch(e){ console.error(e); allOpinions=[]; renderMapPanels(); renderProposalBox(); }
}

// ---------- アイデアの地図：提案箱の中身を出さないように分離 ----------
function renderMapPanels(isInitial=false){
  const mapEl = document.getElementById("map-analysis");
  const logEl = document.getElementById("process-log");
  if(mapEl) mapEl.textContent = buildMapAnalysisText();
  if(logEl) logEl.textContent = buildProcessLogText();
  const bigKeys = [
    {key:"主体", big:"主体的な学び"},
    {key:"楽しさ", big:"楽しさと好奇心"},
    {key:"未来", big:"未来を生き抜く力"},
    {key:"個性", big:"個性・才能の開花"},
    {key:"シームレス", big:"シームレス成長支援"},
  ];
  bigKeys.forEach(({key,big})=>{
    const el = document.getElementById(`sum-text-${key}`);
    if(!el) return;
    if(!mapLiveMode){
      el.textContent = "ここを表示させるには、右上のリアルタイム更新中のボタンをクリックしてください";
      el.classList.remove("text-success");
      el.classList.add("text-muted");
    }else{
      const ops = allOpinions.filter(o=>normalizeBig(o.bigCatName)===big);
      if(!ops.length){ el.textContent = `【${big}】まだ市民の声がありません。1件目の投稿をお待ちしています。`; }
      else{
        const merged = ops.filter(o=>normalizeStatus(o.status)==="新統合");
        const titles = ops.slice(-5).map(o=>o.title).join(" / ");
        if(merged.length){
          el.textContent = `【${ops.length}件の声から統合】\n${merged[0].summary||merged[0].title}\n\n— 関連する声: ${titles.slice(0,200)}`;
        }else{
          const recentSummaries = ops.slice(-3).map(o=>o.summary||o.content||"").join(" ");
          const trimmed = recentSummaries.slice(0,300);
          el.textContent = `【${ops.length}件の市民の声を反映した提案（試作）】\n${trimmed}${recentSummaries.length>300?"…":""}\n\n※詳細は提案箱タブで個別に確認できます。`;
        }
      }
      el.classList.add("text-dark");
    }
  });
}
function buildMapAnalysisText(){
  const counts = BIG_ORDER.map(b=>`${b}: ${allOpinions.filter(o=>normalizeBig(o.bigCatName)===b).length}件`).join("\n");
  return [
    "【この地図の見方】",
    "・左側はAIが用意した原点となる提案（固定）",
    "・右側は市民の声を重ねて磨いた最終提案（集約）",
    "・右側は『リアルタイム更新中』を押すと最新の集約が表示されます。",
    "",
    "【現在の投稿状況】",
    `総件数：${allOpinions.length}件`,
    counts,
    "",
    "※提案箱の個別記事はこの地図には表示しません。詳細は『3. 届いた提案箱』タブで確認してください。"
  ].join("\n");
}
function buildProcessLogText(){
  if(!allOpinions.length) return "まだデータがありません。AIと壁打ちして最初の提案を投稿してみましょう。";
  if(!mapLiveMode) return `総件数 ${allOpinions.length}件。\n右上の『リアルタイム更新中』を押すと、最新10件のサマリーと集約状況を表示します。\n\n（提案箱の本文は表示しません）`;
  const latest = allOpinions.slice(-10).reverse();
  return latest.map((o,i)=>`${i+1}. [${o.status||"単独提案"}] ${o.bigCatName||"その他"} > ${o.midCatName||"その他"}\n${o.title||"無題"}（${(o.summary||"").slice(0,40)}…）`).join("\n\n");
}

// ---------- 提案箱 ----------
function renderProposalBox(){
  const container = document.getElementById("proposal-container");
  if(!container) return;
  if(!allOpinions.length){ container.innerHTML = `<div class="text-muted p-4">まだ提案がありません。1.でAIと壁打ちして投稿してください。</div>`; return; }
  const html = BIG_ORDER.map(big=>{
    const bigOpinions = allOpinions.filter(o=>normalizeBig(o.bigCatName)===big);
    const mids = buildMidList(big, bigOpinions);
    return `
      <div class="category-accordion-item">
        <button class="category-accordion-header" type="button" onclick="toggleTree('big-${slug(big)}')">
          <span>🌳 ${escapeHtml(big)}</span>
          <span class="badge bg-primary">${bigOpinions.length}</span>
        </button>
        <div id="big-${slug(big)}" class="category-accordion-body" style="display:none;">
          ${mids.map(mid=>renderMidSection(big, mid, bigOpinions)).join("")}
        </div>
      </div>
    `;
  }).join("");
  container.innerHTML = html;
}
function buildMidList(big, opinions){
  const fixed = getFixedMids(big);
  const mids = new Set(["その他",...fixed]);
  opinions.forEach(o=>{ const m = normalizeMid(o.midCatName); if(m) mids.add(m); });
  return Array.from(mids);
}
function getFixedMids(big){
  const m = {
    "主体的な学び": ["子ども主導のプロジェクト学習", "選択制のアクティビティ", "デジタルを活用した自己表現"],
    "楽しさと好奇心": ["五感を使う自然体験", "失敗を歓迎する科学遊び", "地域のアート・文化資源の活用"],
    "未来を生き抜く力": ["非認知能力の育成", "多様な人々と協働する体験", "答えのない問いに挑む力"],
    "個性・才能の開花": ["個別最適化された学習プラン", "多様な才能を認める評価基準", "特別なニーズを持つ子への支援"],
    "シームレス成長支援": ["保幼小の連携強化", "切れ目のない相談窓口", "育児休業からの復職支援"]
  };
  return m[big]||[];
}
function renderMidSection(big, mid, opinions){
  const group = opinions.filter(o=>normalizeMid(o.midCatName)===mid);
  const merged = group.filter(o=>normalizeStatus(o.status)==="新統合");
  const proposals = group.filter(o=>normalizeStatus(o.status)==="新提案"||normalizeStatus(o.status)==="単独提案");
  const originals = group.filter(o=>normalizeStatus(o.status)==="元記事");
  return `
    <div class="lane-col mb-3">
      <button class="category-accordion-header p-3" type="button" onclick="toggleTree('mid-${slug(big)}-${slug(mid)}')">
        <span>📂 ${escapeHtml(mid)}</span>
        <span class="badge bg-dark">${group.length}</span>
      </button>
      <div id="mid-${slug(big)}-${slug(mid)}" style="display:none; padding: 12px 0 0 0;">
        <div class="mb-2">${labelBadge("新統合")} ${merged.length}</div>
        ${merged.length? merged.map(p=>renderPostCard(p,"新統合")).join("") : `<div class="text-muted small mb-3">新統合はありません。</div>`}
        <div class="mb-2">${labelBadge("新提案")} ${proposals.length}</div>
        ${proposals.length? proposals.map(p=>renderPostCard(p,"新提案")).join("") : `<div class="text-muted small mb-3">新提案はありません。</div>`}
        <div class="mb-2">${labelBadge("元記事")} ${originals.length}</div>
        ${originals.length? originals.map((p,i)=>renderOriginalFolder(p,i)).join("") : `<div class="text-muted small">元記事はありません。</div>`}
      </div>
    </div>
  `;
}
function renderPostCard(post, status){
  const cls = status==="新統合"? "bg-danger" : "bg-primary";
  return `
    <div class="opinion-card">
      <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
        <div class="card-title-text mb-0">${escapeHtml(post.title||"無題")}</div>
        <span class="badge ${cls}">${status}</span>
      </div>
      <div class="small text-muted mb-2">${escapeHtml((post.summary||post.content||"").slice(0,200))}</div>
      <div class="small text-muted">${escapeHtml(post.bigCatName||"")} ＞ ${escapeHtml(post.midCatName||"")}</div>
    </div>
  `;
}
function renderOriginalFolder(post, idx){
  const id = `orig-${slug(post.title||"x")}-${idx}-${Math.random().toString(36).slice(2,6)}`;
  return `
    <div class="mb-2">
      <button class="category-accordion-header p-3" type="button" onclick="toggleTree('${id}')">
        <span>📄 ${escapeHtml(post.title||"無題")}</span>
        <span class="badge bg-secondary">元記事</span>
      </button>
      <div id="${id}" style="display:none;" class="p-3 bg-white border rounded-bottom">
        <div class="small text-muted mb-2">集約理由: ${escapeHtml(post.reason||"")}</div>
        <div class="small">${escapeHtml(post.summary||post.content||"")}</div>
      </div>
    </div>
  `;
}
function labelBadge(text){
  const cls = text==="新統合"? "bg-danger" : text==="新提案"? "bg-primary" : "bg-secondary";
  return `<span class="badge ${cls} me-2">${text}</span>`;
}
window.toggleTree = function(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.style.display = (el.style.display==="none" ||!el.style.display)? "block" : "none";
};
