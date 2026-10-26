const CFG = window.SHOP_CONFIG || {};
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money = n => Number(n || 0).toLocaleString("zh-TW");
const errMsg = e => String((e && e.message) || e || "發生錯誤，請稍後再試");

// text/plain keeps the request "simple", so the browser skips the CORS preflight Apps Script can't answer
function api(action, data) {
  if (!CFG.API_URL) return Promise.reject(new Error("還沒設定 API 網址，請編輯 config.js。"));
  return fetch(CFG.API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(Object.assign({ action }, data || {}))
  }).then(r => r.json()).then(d => {
    if (!d.ok) throw new Error(d.error);
    return d.data;
  }, e => { if (e instanceof SyntaxError) throw new Error("伺服器回應格式不對，請確認 API 網址和部署設定。"); throw new Error("連不上伺服器，請檢查網路後再試一次。"); });
}

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, 2600);
}

function copyText(text, msg) {
  const done = () => toast(msg);
  const fallback = () => {
    const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); done(); } catch (_) { toast("請長按文字手動複製"); }
    ta.remove();
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
  else fallback();
}

function photo(p) {
  if (p.image) return `<img src="${esc(p.image)}" alt="" loading="lazy" referrerpolicy="no-referrer">`;
  // first real character, skipping a leading tag like ［範例］
  const t = String(p.title || "?").replace(/^\s*[［\[【(（][^］\]】)）]*[］\]】)）]\s*/, "");
  return esc((t || p.title || "?").slice(0, 1));
}

// 舊版後端沒有分類、預購、多張照片、規格價格這些欄位時，補上預設值
function normProduct(p) {
  const variants = (p.variants || []).map(v => Object.assign({ price: p.price, stockLeft: v.left }, v));
  return Object.assign({ category: "", preorder: false, sold: variants.reduce((a, v) => a + (v.sold || 0), 0),
    createdAt: 0, images: p.image ? [p.image] : [] }, p, { variants });
}
