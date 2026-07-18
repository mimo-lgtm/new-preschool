
const GAS_URL = "https://script.google.com/macros/s/AKfycbz_kVbBkm2vye9FRcSOTzvYHNLFTVesZp45x7By_hFrLcJJLgPDieuoXlU7IlYpcehm/exec";
const BIG_ORDER = ["主体的な学び", "楽しさと好奇心", "未来を生き抜く力", "個性・才能の開花", "シームレス成長支援"];
let allOpinions = [];
let currentAiResult = null;
let mapLiveMode = false;

function escapeHtml(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
function slug(s){return String(s||"").replace(/[^\wぁ-んァ-ヶ一-龠ー]/g,"_");}
function normalizeStatus(s){const x=String(s||"").trim(); if(x==="新統合"||x==="新提案"||x==="元記事")return x; if(x==="単独提案")return "新提案"; return "新提案";}
function normalizeBig(s){return String(s||"").trim();}
function normalizeMid(m){return String(m||"").trim()||"その他";}

// --- 内容ベース重複除去ロジック ---
function tokenize(text){ return String(text).replace(/[、。,.！!？?\s]+/g," ").split(/ |　/).join(" ").split(" ").filter(w=>w.length>1); }
function jaccard(a,b){
  const setA=new Set(tokenize(a)); const setB=new Set(tokenize(b));
  const inter=[...setA].filter(x=>setB.has(x)).length;
  const uni=new Set([...setA,...setB]).size;
  return uni===0?0:inter/uni;
}
function splitSentences(text){
  return String(text||"").split(/(?<=[。！!？?])\s*/).map(s=>s.trim()).filter(s=>s.length>10);
}
function dedupSentences(sentences, threshold=0.55){
  const out=[];
  for(const s of sentences){
    let dup=false;
    for(const o of out){ if(jaccard(s,o)>threshold){ dup=true; break; } }
    if(!dup) out.push(s);
  }
  return out;
}

// 50% base + 50% 新統合 で最終提案を生成（内容ベース）
function buildFinalProposal(baseText, mergedOps){
  const baseSents = splitSentences(baseText);
  const mergedTextAll = mergedOps.map(o=>o.summary||o.content||o.title||"").join(" ");
  const mergedSents = splitSentences(mergedTextAll);

  if(!mergedOps.length){
    return `【まだ新統合がありません】\n${baseText.slice(0,300)}…\n\n（市民の声が3件以上集まると新統合が自動生成され、ここに反映されます）`;
  }

  // 重複除去：ベースとマージ済みをそれぞれ整理
  const uniqBase = dedupSentences(baseSents, 0.6);
  const uniqMerged = dedupSentences(mergedSents, 0.6);

  // 相互の重複も除去（マージ側がベースと被っていればスキップ）
  const filteredMerged=[];
  for(const m of uniqMerged){
    let isDupBase = uniqBase.some(b=>jaccard(b,m)>0.5);
    if(!isDupBase) filteredMerged.push(m);
  }

  // 50%ずつを内容で選抜：ベース2文 + 市民2-3文 を交互に
  const takeBase = Math.max(2, Math.ceil(uniqBase.length*0.5));
  const takeMerged = Math.max(2, Math.ceil(filteredMerged.length*0.5));

  const selectedBase = uniqBase.slice(0, takeBase);
  const selectedMerged = filteredMerged.slice(0, takeMerged);

  // 混ぜて300-400字に整形
  let combined = [];
  const maxLen = Math.max(selectedBase.length, selectedMerged.length);
  for(let i=0;i<maxLen;i++){
    if(i<selectedBase.length) combined.push(selectedBase[i]);
    if(i<selectedMerged.length) combined.push(selectedMerged[i]);
  }
  combined = dedupSentences(combined, 0.55);

  let result = combined.join("");
  // 文字数調整：300-400字を目安に
  if(result.length<200){
    // 足りない場合は残りを追加
    const rest = [...uniqBase.slice(takeBase), ...filteredMerged.slice(takeMerged)];
    for(const r of rest){ if(result.length>=350) break; if(!combined.includes(r)) result+=r; }
  }
  if(result.length>400){
    result = result.slice(0,380)+"…";
  }

  // ヘッダー付きで返す
  const countInfo = `${mergedOps.length}件の新統合を反映`;
  return `【${countInfo}・市民の声を50%反映した最終提案】\n${result}`;
}

document.addEventListener('DOMContentLoaded',()=>{
  fetchOpinions();
  renderMapPanels(true);
  renderProposalBox();
  document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(btn=>{
    btn.addEventListener('shown.bs.tab',e=>{
      const t=e.target.getAttribute('data-bs-target');
      if(t==="#map-tab-pane") renderMapPanels();
      if(t==="#list-tab-pane") renderProposalBox();
    });
  });
  document.getElementById("btnMapRefresh")?.addEventListener("click",()=>{ mapLiveMode=true; renderMapPanels(); });
  document.getElementById("btnMapClear")?.addEventListener("click",()=>{ mapLiveMode=false; renderMapPanels(); });
  document.getElementById("btnRefreshProposalBox")?.addEventListener("click",fetchOpinions);

  const btnAiAnalysis=document.getElementById("btnAiAnalysis");
  const btnSubmitToBox=document.getElementById("btnSubmitToBox");
  if(btnAiAnalysis){
    btnAiAnalysis.addEventListener("click", async()=>{
      const txt=document.getElementById("content")?.value.trim()||"";
      if(!txt) return alert("あなたの想いやアイデアを自由に入力してください。");
      btnAiAnalysis.disabled=true; btnAiAnalysis.innerHTML=`<span class="spinner-border spinner-border-sm"></span> AI が思考を整理中...`;
      try{
        const res=await fetch(GAS_URL,{method:"POST",headers:{"Content-Type":"text/plain"},body:JSON.stringify({action:"analyze",content:txt})});
        const data=await res.json();
        if(data.status==="success"){
          currentAiResult=data.result;
          document.getElementById("aiSummaryText").innerHTML=`<strong>【自動分類】</strong> ${escapeHtml(currentAiResult["大分類"]||"その他")} ＞ ${escapeHtml(currentAiResult["中分類"]||"その他")}`;
          document.getElementById("aiPerspectivesText").innerHTML=`
<div class="mb-3"><strong>a. 核心</strong><br><span class="text-dark">${escapeHtml(currentAiResult["核心"]||"")}</span></div>
<div class="mb-3"><strong>b. 変化</strong><br><span class="text-dark">${escapeHtml(currentAiResult["変化"]||"")}</span></div>
<div class="mb-3"><strong>c. 成功事例</strong><br><span class="text-dark">${escapeHtml(currentAiResult["成功事例"]||"")}</span></div>
<div class="mb-3"><strong>d. 懸念点</strong><br><span class="text-dark">${escapeHtml(currentAiResult["懸念点"]||"")}</span></div>
<div class="mb-1"><strong>e. 問い</strong><br><span class="text-dark">${escapeHtml(currentAiResult["問い"]||"")}</span></div>`;
          document.getElementById("aiTitleText").textContent=currentAiResult["推奨タイトル"]||"無題";
          document.getElementById("aiRefinedText").textContent=currentAiResult["要約200"]||currentAiResult["要約 200"]||"";
          document.getElementById("aiPlaceholder").style.setProperty("display","none","important");
          const box=document.getElementById("aiAssistBox"); box.style.setProperty("display","flex","important"); box.classList.remove("d-none");
        }else alert("AI 分析エラー："+(data.message||""));
      }catch(e){console.error(e); alert("通信エラー");}
      finally{btnAiAnalysis.disabled=false; btnAiAnalysis.innerHTML=`✨ 1. 意見を送信して AI と壁打ちする`;}
    });
  }
  if(btnSubmitToBox){
    btnSubmitToBox.addEventListener("click", async()=>{
      if(!currentAiResult) return;
      const big=currentAiResult["大分類"]||"その他"; const mid=currentAiResult["中分類"]||"その他";
      if(!confirm(`正式に提案箱へ投稿しますか？\n(大分類「${big}」 > 中分類「${mid}」へ格納されます)`)) return;
      const raw=document.getElementById("content")?.value.trim()||"";
      btnSubmitToBox.disabled=true; btnSubmitToBox.innerHTML=`<span class="spinner-border spinner-border-sm"></span> 投稿中...`;
      try{
        const res=await fetch(GAS_URL,{method:"POST",headers:{"Content-Type":"text/plain"},body:JSON.stringify({action:"submit",content:raw,title:currentAiResult["推奨タイトル"]||"無題",summary:currentAiResult["要約200"]||currentAiResult["要約 200"]||"",bigCatName:big,midCatName:mid,aiResult:currentAiResult})});
        const data=await res.json();
        if(data.status==="success"){
          alert("📥 投稿が完了しました！"); document.getElementById("content").value="";
          document.getElementById("aiAssistBox").classList.add("d-none"); document.getElementById("aiPlaceholder").style.removeProperty("display"); currentAiResult=null;
          await fetchOpinions(); const btn=document.getElementById("list-tab-btn"); if(btn) new bootstrap.Tab(btn).show();
        }else alert("投稿エラー");
      }catch(e){console.error(e); alert("送信エラー");}
      finally{btnSubmitToBox.disabled=false; btnSubmitToBox.innerHTML=`📥 この内容で提案箱へ正式に投稿する`;}
    });
  }
});

async function fetchOpinions(){
  try{ const res=await fetch(GAS_URL+"?action=get"); const data=await res.json(); allOpinions=Array.isArray(data.opinions)?data.opinions:[]; renderMapPanels(); renderProposalBox(); }
  catch(e){console.error(e); allOpinions=[]; renderMapPanels(); renderProposalBox();}
}

function renderMapPanels(){
  const mapEl=document.getElementById("map-analysis"); const logEl=document.getElementById("process-log");
  if(mapEl) mapEl.textContent=buildMapAnalysisText();
  if(logEl) logEl.textContent=buildProcessLogText();

  const keys=[
    {key:"主体", big:"主体的な学び"},
    {key:"楽しさ", big:"楽しさと好奇心"},
    {key:"未来", big:"未来を生き抜く力"},
    {key:"個性", big:"個性・才能の開花"},
    {key:"シームレス", big:"シームレス成長支援"},
  ];
  keys.forEach(({key,big})=>{
    const el=document.getElementById(`sum-text-${key}`);
    const baseEl=document.getElementById(`base-text-${key}`);
    if(!el) return;
    const baseText=baseEl?baseEl.textContent: "";
    if(!mapLiveMode){
      el.textContent="ここを表示させるには、右上のリアルタイム集計ボタンをクリックしてください";
      el.className="text-muted fw-bold lh-base fs-6 bg-white p-3 rounded-3 border";
    }else{
      // 新統合のみを集計対象（比重50%の市民側）
      const mergedOps=allOpinions.filter(o=>normalizeBig(o.bigCatName)===big && normalizeStatus(o.status)==="新統合");
      const finalText=buildFinalProposal(baseText, mergedOps);
      el.textContent=finalText;
      el.className="text-dark fw-bold lh-base fs-6 bg-white p-3 rounded-3 border border-success";
    }
  });
}

function buildMapAnalysisText(){
  const counts=BIG_ORDER.map(b=>`${b}: ${allOpinions.filter(o=>normalizeBig(o.bigCatName)===b).length}件 (うち新統合:${allOpinions.filter(o=>normalizeBig(o.bigCatName)===b && normalizeStatus(o.status)==="新統合").length}件)`).join("\n");
  return [
    "【この地図の見方】",
    "・左側：AIが用意した固定の原点提案（比重50%）",
    "・右側：左側50% + 市民の新統合記事50%を内容ベースで統合・重複除去した最終提案",
    "・右上の『リアルタイム集計』でその時点の集計結果を表示",
    "",
    "【現在の投稿状況】",
    `総件数：${allOpinions.length}件`,
    counts,
    "",
    "※提案箱の個別記事（新提案・元記事）はこの地図の上部には表示しません。右側は新統合のみを対象に集計します。"
  ].join("\n");
}
function buildProcessLogText(){
  if(!allOpinions.length) return "まだデータがありません。";
  if(!mapLiveMode) return `総件数 ${allOpinions.length}件。\n右上の『リアルタイム集計』を押すと、5分野それぞれの最終提案（左50%+新統合50%・重複除去）を生成します。`;
  const latest=allOpinions.filter(o=>normalizeStatus(o.status)==="新統合").slice(-10).reverse();
  if(!latest.length) return "まだ新統合がありません。\n3件以上同じテーマに集まると自動で新統合が生成され、集計対象になります。";
  return latest.map((o,i)=>`${i+1}. [新統合] ${o.bigCatName} > ${o.midCatName}\n${o.title}\n${(o.summary||"").slice(0,80)}…`).join("\n\n");
}

// 提案箱は地図に出さない
function renderProposalBox(){
  const container=document.getElementById("proposal-container"); if(!container) return;
  if(!allOpinions.length){container.innerHTML=`<div class="text-muted p-4">まだ提案がありません。</div>`; return;}
  container.innerHTML=BIG_ORDER.map(big=>{
    const bigOps=allOpinions.filter(o=>normalizeBig(o.bigCatName)===big);
    const mids=buildMidList(big,bigOps);
    return `<div class="category-accordion-item"><button class="category-accordion-header" type="button" onclick="toggleTree('big-${slug(big)}')"><span>🌳 ${escapeHtml(big)}</span><span class="badge bg-primary">${bigOps.length}</span></button><div id="big-${slug(big)}" class="category-accordion-body" style="display:none;">${mids.map(mid=>renderMidSection(big,mid,bigOps)).join("")}</div></div>`;
  }).join("");
}
function buildMidList(big,ops){const fixed=getFixedMids(big); const set=new Set(["その他",...fixed]); ops.forEach(o=>{const m=normalizeMid(o.midCatName); if(m)set.add(m);}); return Array.from(set);}
function getFixedMids(big){const m={"主体的な学び":["子ども主導のプロジェクト学習","選択制のアクティビティ","デジタルを活用した自己表現"],"楽しさと好奇心":["五感を使う自然体験","失敗を歓迎する科学遊び","地域のアート・文化資源の活用"],"未来を生き抜く力":["非認知能力の育成","多様な人々と協働する体験","答えのない問いに挑む力"],"個性・才能の開花":["個別最適化された学習プラン","多様な才能を認める評価基準","特別なニーズを持つ子への支援"],"シームレス成長支援":["保幼小の連携強化","切れ目のない相談窓口","育児休業からの復職支援"]}; return m[big]||[];}
function renderMidSection(big,mid,ops){
  const group=ops.filter(o=>normalizeMid(o.midCatName)===mid);
  const merged=group.filter(o=>normalizeStatus(o.status)==="新統合");
  const props=group.filter(o=>normalizeStatus(o.status)==="新提案");
  const orig=group.filter(o=>normalizeStatus(o.status)==="元記事");
  return `<div class="lane-col mb-3"><button class="category-accordion-header p-3" type="button" onclick="toggleTree('mid-${slug(big)}-${slug(mid)}')"><span>📂 ${escapeHtml(mid)}</span><span class="badge bg-dark">${group.length}</span></button><div id="mid-${slug(big)}-${slug(mid)}" style="display:none; padding:12px 0 0 0;"><div class="mb-2"><span class="badge bg-danger me-2">新統合</span>${merged.length}</div>${merged.length?merged.map(p=>renderPostCard(p,"新統合")).join(""):`<div class="text-muted small mb-3">新統合はありません。</div>`}<div class="mb-2"><span class="badge bg-primary me-2">新提案</span>${props.length}</div>${props.length?props.map(p=>renderPostCard(p,"新提案")).join(""):`<div class="text-muted small mb-3">新提案はありません。</div>`}<div class="mb-2"><span class="badge bg-secondary me-2">元記事</span>${orig.length}</div>${orig.length?orig.map((p,i)=>renderOriginalFolder(p,i)).join(""):`<div class="text-muted small">元記事はありません。</div>`}</div></div>`;
}
function renderPostCard(post,status){const cls=status==="新統合"?"bg-danger":"bg-primary"; return `<div class="opinion-card"><div class="d-flex justify-content-between gap-2 mb-2"><div class="card-title-text mb-0">${escapeHtml(post.title||"無題")}</div><span class="badge ${cls}">${status}</span></div><div class="small text-muted mb-2">${escapeHtml((post.summary||post.content||"").slice(0,200))}</div><div class="small text-muted">${escapeHtml(post.bigCatName||"")} ＞ ${escapeHtml(post.midCatName||"")}</div></div>`;}
function renderOriginalFolder(post,idx){const id=`orig-${slug(post.title||"x")}-${idx}-${Math.random().toString(36).slice(2,4)}`; return `<div class="mb-2"><button class="category-accordion-header p-3" type="button" onclick="toggleTree('${id}')"><span>📄 ${escapeHtml(post.title||"無題")}</span><span class="badge bg-secondary">元記事</span></button><div id="${id}" style="display:none;" class="p-3 bg-white border rounded-bottom"><div class="small text-muted mb-2">集約理由: ${escapeHtml(post.reason||"")}</div><div class="small">${escapeHtml(post.summary||post.content||"")}</div></div></div>`;}
window.toggleTree=function(id){const el=document.getElementById(id); if(!el)return; el.style.display=(el.style.display==="none"||!el.style.display)?"block":"none";};
