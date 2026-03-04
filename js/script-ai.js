// File: js/script-ai.js
// Ai Trends AI Generator - Full Feature Implementation

// ========== CONFIG ==========
const POLLEN_CONFIG = {
  free_limit: 1.0,
  reset_hours: 24,
  models: {
    'flux': { cost: 0.008, name: 'FLUX.2 Klein 4B', premium: false },
    'zimage': { cost: 0.006, name: 'Z-Image Turbo', premium: false },
    'gptimage': { cost: 0.02, name: 'GPT Image 1 Mini', premium: true },
    'klein': { cost: 0.008, name: 'FLUX.2 Klein 4B', premium: true },
    'klein-large': { cost: 0.012, name: 'FLUX.2 Klein 9B', premium: true },
    'imagen-4': { cost: 0.035, name: 'Imagen 4', premium: true },
    'grok-imagine': { cost: 0.025, name: 'Grok Imagine', premium: true }
  }
};

const translations = {
  en: {
    ph_img: "Describe your image...",
    loading_gen: "Generating...",
    err_gen: "Failed",
    pollen_display: "🌸 Pollen Left",
    auto_render: "✨ Auto-Render",
    random: "🎲 Random",
    generate: "✨ Generate",
    download: "⬇️ Download",
    share: "🔗 Share",
    regenerate: "🔄 Regenerate",
    modal_title: "🔑 API Key Required",
    modal_desc: "This feature needs your Pollinations API key. Enter pk_ key:",
    modal_confirm: "Connect",
    modal_cancel: "Cancel",
    modal_hint: "Key stored locally in browser.",
    get_key: "Get free key",
    placeholder: "Your art will appear here",
    favorites_title: "🤖 AI Image Favorites",
    no_favorites: "No favorites yet"
  },
  id: {
    ph_img: "Deskripsikan gambar...",
    loading_gen: "Menggambar...",
    err_gen: "Gagal",
    pollen_display: "🌸 Sisa Pollen",
    auto_render: "✨ Auto-Render",
    random: "🎲 Acak",
    generate: "✨ Generate",
    download: "⬇️ Download",
    share: "🔗 Share",
    regenerate: "🔄 Ulangi",
    modal_title: "🔑 Butuh API Key",
    modal_desc: "Fitur ini butuh API key Pollinations. Masukkan pk_ key:",
    modal_confirm: "Connect",
    modal_cancel: "Batal",
    modal_hint: "Key disimpan lokal di browser.",
    get_key: "Dapatkan key gratis",
    placeholder: "Hasil generate akan muncul di sini",
    favorites_title: "🤖 Favorit AI Image",
    no_favorites: "Belum ada favorit"
  },
  es: {
    ph_img: "Describe tu imagen...",
    loading_gen: "Generando...",
    err_gen: "Error",
    pollen_display: "🌸 Pollen Restante",
    auto_render: "✨ Auto-Render",
    random: "🎲 Aleatorio",
    generate: "✨ Generar",
    download: "⬇️ Descargar",
    share: "🔗 Compartir",
    regenerate: "🔄 Repetir",
    modal_title: "🔑 Clave Requerida",
    modal_desc: "Esta función necesita tu clave Pollinations. Ingresa pk_:",
    modal_confirm: "Conectar",
    modal_cancel: "Cancelar",
    modal_hint: "Clave guardada localmente.",
    get_key: "Obtener clave gratis",
    placeholder: "Tu arte aparecerá aquí",
    favorites_title: "🤖 Favoritos AI",
    no_favorites: "Sin favoritos aún"
  },
  jp: {
    ph_img: "画像を説明...",
    loading_gen: "生成中...",
    err_gen: "エラー",
    pollen_display: "🌸 残花粉",
    auto_render: "✨ 自動強化",
    random: "🎲 ランダム",
    generate: "✨ 生成",
    download: "⬇️ ダウンロード",
    share: "🔗 シェア",
    regenerate: "🔄 再試行",
    modal_title: "🔑 APIキー必要",
    modal_desc: "この機能にはPollinationsキーが必要です。pk_を入力:",
    modal_confirm: "接続",
    modal_cancel: "キャンセル",
    modal_hint: "キーはローカル保存。",
    get_key: "無料キー取得",
    placeholder: "ここに画像が表示されます",
    favorites_title: "🤖 お気に入り",
    no_favorites: "まだありません"
  }
};

// ========== GLOBAL STATE ==========
let currentImgUrl = '';
let currentLang = 'en';
let currentModel = 'flux';
let currentW = 1024;
let currentH = 1024;

// ========== INIT ==========
window.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  loadLanguage();
  updatePollenDisplay();
  loadFavoritesCount();
  setupModelButtons();
  setupRatioButtons();
  
  // Check URL params for tab
  const urlParams = new URLSearchParams(window.location.search);
  const tab = urlParams.get('tab');
  if (tab) switchTab(tab);
});

// ========== THEME ==========
function loadTheme() {
  const t = localStorage.getItem('viralScopeTheme');
  const btn = document.getElementById('themeBtn');
  if (!btn) return;
  document.body.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
  btn.innerText = t === 'light' ? '☀️' : '🌙';
}

function toggleTheme() {
  const isLight = document.body.getAttribute('data-theme') === 'light';
  const newTheme = isLight ? 'dark' : 'light';
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('viralScopeTheme', newTheme);
  document.getElementById('themeBtn').innerText = newTheme === 'light' ? '☀️' : '🌙';
}

// ========== LANGUAGE ==========
function loadLanguage() {
  const select = document.getElementById('langSelect');
  if (!select) return;
  
  // Auto-detect or use saved
  const saved = localStorage.getItem('vs_lang');
  if (saved) {
    select.value = saved;
    currentLang = saved;
  } else {
    const detected = navigator.language?.split('-')[0] || 'en';
    const valid = ['en', 'id', 'es', 'jp'];
    currentLang = valid.includes(detected) ? detected : 'en';
    select.value = currentLang;
  }
  applyTranslations();
}

function changeLanguage() {
  const select = document.getElementById('langSelect');
  if (!select) return;
  currentLang = select.value;
  localStorage.setItem('vs_lang', currentLang);
  applyTranslations();
  updatePollenDisplay();
}

function applyTranslations() {
  const t = translations[currentLang];
  if (!t) return;
  
  // Update placeholders
  const promptInput = document.getElementById('imgPrompt');
  if (promptInput) promptInput.placeholder = t.ph_img;
  
  // Update buttons
  const autoRenderBtn = document.querySelector('[onclick="autoRenderPrompt()"]');
  if (autoRenderBtn) autoRenderBtn.innerHTML = `✨ ${t.auto_render.split(' ')[1] || 'Auto'}`;
  
  const randomBtn = document.querySelector('[onclick="fillRandomPrompt()"]');
  if (randomBtn) randomBtn.innerHTML = `🎲 ${t.random.split(' ')[1] || 'Random'}`;
  
  const genBtn = document.getElementById('genImgBtn');
  if (genBtn) genBtn.innerHTML = `✨ ${t.generate}`;
  
  // Update pollen display label
  updatePollenDisplay();
}

function getT() {
  return translations[currentLang] || translations['en'];
}

// ========== POLLEN TRACKING ==========
function getPollenUsage() {
  const key = 'vs_pollen_usage';
  const now = Date.now();
  const defaultUsage = { used: 0, resetAt: now + 24*60*60*1000 };
  
  try {
    const usage = JSON.parse(localStorage.getItem(key) || 'null');
    if (!usage || now > usage.resetAt) {
      return { used: 0, resetAt: now + POLLEN_CONFIG.reset_hours*60*60*1000 };
    }
    return usage;
  } catch {
    return defaultUsage;
  }
}

function savePollenUsage(usage) {
  localStorage.setItem('vs_pollen_usage', JSON.stringify(usage));
}

function canUseFreeTier(model) {
  const config = POLLEN_CONFIG.models[model];
  if (!config || config.premium) return false;
  const usage = getPollenUsage();
  return (POLLEN_CONFIG.free_limit - usage.used) >= config.cost;
}

function usePollen(model) {
  const config = POLLEN_CONFIG.models[model];
  if (!config || config.premium) return false;
  
  const usage = getPollenUsage();
  const newUsed = usage.used + config.cost;
  if (newUsed > POLLEN_CONFIG.free_limit) return false;
  
  usage.used = newUsed;
  savePollenUsage(usage);
  return true;
}

function getRemainingPollen() {
  const usage = getPollenUsage();
  return Math.max(0, POLLEN_CONFIG.free_limit - usage.used).toFixed(3);
}

function updatePollenDisplay() {
  const display = document.getElementById('pollenDisplay');
  if (!display) return;
  const t = getT();
  const remaining = getRemainingPollen();
  display.innerHTML = `${t.pollen_display}: ${remaining} / ${POLLEN_CONFIG.free_limit.toFixed(3)}`;
  display.style.color = parseFloat(remaining) < 0.1 ? '#fbbf24' : 'inherit';
}

// ========== API KEY MANAGEMENT ==========
function getUserApiKey() {
  return localStorage.getItem('vs_user_api_key') || '';
}

function saveUserApiKey(key) {
  if (key?.startsWith('pk_')) {
    localStorage.setItem('vs_user_api_key', key);
    return true;
  }
  return false;
}

function isPremiumModel(model) {
  return POLLEN_CONFIG.models[model]?.premium === true;
}

// ========== API KEY MODAL ==========
function showApiKeyModal(featureName) {
  return new Promise((resolve) => {
    const existing = document.getElementById('apiKeyModal');
    if (existing) existing.remove();

    const t = getT();
    const modal = document.createElement('div');
    modal.id = 'apiKeyModal';
    modal.style.cssText = `
      position:fixed; top:0; left:0; right:0; bottom:0;
      background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center;
      z-index:3000; padding:20px; backdrop-filter:blur(4px);
    `;
    
    modal.innerHTML = `
      <div style="background:var(--card-bg); border-radius:16px; padding:24px; max-width:420px; width:100%; border:1px solid var(--border); box-shadow:0 8px 32px rgba(0,0,0,0.3);">
        <h3 style="margin:0 0 12px; color:var(--text); font-size:18px;">${t.modal_title}</h3>
        <p style="color:var(--text-sec); font-size:14px; margin-bottom:16px; line-height:1.5;">
          ${featureName}<br><br>${t.modal_desc}
        </p>
        <input type="password" id="modalApiKeyInput" placeholder="pk_..." 
               style="width:100%; padding:12px 14px; background:var(--input-bg); border:1px solid var(--border); border-radius:8px; color:var(--text); margin-bottom:16px; box-sizing:border-box; font-size:14px;">
        <div style="display:flex; gap:10px; justify-content:flex-end;">
          <button id="modalCancel" style="padding:10px 20px; background:transparent; border:1px solid var(--border); border-radius:8px; color:var(--text); cursor:pointer; font-size:14px;">${t.modal_cancel}</button>
          <button id="modalConfirm" style="padding:10px 20px; background:var(--primary); border:none; border-radius:8px; color:white; cursor:pointer; font-weight:600; font-size:14px;">${t.modal_confirm}</button>
        </div>
        <p style="font-size:11px; color:var(--text-sec); margin-top:16px; line-height:1.4;">
          🔐 ${t.modal_hint}
          <br><a href="https://enter.pollinations.ai" target="_blank" style="color:var(--primary); text-decoration:none;">${t.get_key} →</a>
        </p>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const handleSubmit = () => {
      const key = document.getElementById('modalApiKeyInput').value.trim();
      if (key.startsWith('pk_')) {
        saveUserApiKey(key);
        modal.remove();
        resolve(true);
      } else {
        showToast("⚠️ Invalid pk_ key", true);
      }
    };
    
    document.getElementById('modalCancel').onclick = () => { modal.remove(); resolve(false); };
    document.getElementById('modalConfirm').onclick = handleSubmit;
    document.getElementById('modalApiKeyInput').onkeypress = (e) => { if(e.key==='Enter') handleSubmit(); };
    modal.onclick = (e) => { if(e.target===modal) { modal.remove(); resolve(false); } };
    
    // Focus input
    setTimeout(() => document.getElementById('modalApiKeyInput')?.focus(), 100);
  });
}

async function requireApiKey(featureName) {
  const key = getUserApiKey();
  if (key) return true;
  const confirmed = await showApiKeyModal(featureName);
  return confirmed && getUserApiKey();
}

// ========== MODEL SELECTION ==========
function setupModelButtons() {
  document.querySelectorAll('.model-btn').forEach(btn => {
    btn.onclick = (e) => {
      const model = e.currentTarget.dataset.model;
      selectModel(model);
    };
  });
}

function selectModel(modelName) {
  // Update UI active state
  document.querySelectorAll('.model-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.model-btn[data-model="${modelName}"]`);
  if (btn) btn.classList.add('active');
  
  // Handle premium models
  if (isPremiumModel(modelName)) {
    const modelNameDisplay = POLLEN_CONFIG.models[modelName]?.name || modelName;
    requireApiKey(modelNameDisplay).then(hasKey => {
      if (hasKey) {
        currentModel = modelName;
        showToast(`✅ ${modelNameDisplay} selected`);
      } else {
        // Revert to last free model
        currentModel = 'flux';
        document.querySelector('.model-btn[data-model="flux"]')?.classList.add('active');
        showToast("❌ Cancelled");
      }
    });
  } else {
    currentModel = modelName;
  }
}

// ========== RATIO SELECTION ==========
function setupRatioButtons() {
  document.querySelectorAll('.ratio-btn').forEach(btn => {
    btn.onclick = (e) => {
      const w = parseInt(e.currentTarget.dataset.w);
      const h = parseInt(e.currentTarget.dataset.h);
      setRatio(w, h, e.currentTarget);
    };
  });
}

function setRatio(w, h, btn) {
  document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  currentW = w;
  currentH = h;
}

// ========== PROMPT UTILS ==========
const randomPrompts = [
  "Cyberpunk cat in neon city, digital art",
  "Astronaut riding horse on Mars, cinematic",
  "Dragon made of cherry blossoms, fantasy art",
  "Steampunk robot drinking coffee, detailed",
  "Magical forest spirit at night, ethereal",
  "Futuristic Tokyo street in rain, neon lights"
];

function fillRandomPrompt() {
  const input = document.getElementById('imgPrompt');
  if (input) {
    input.value = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
    showToast("🎲 Random prompt loaded");
  }
}

async function enhancePrompt(original) {
  const apiKey = getUserApiKey();
  if (!apiKey) return original;
  
  try {
    const response = await fetch(`https://gen.pollinations.ai/text/enhance%20this%20prompt:%20${encodeURIComponent(original)}?key=${apiKey}`);
    if (response.ok) {
      const enhanced = await response.text();
      return enhanced.trim() || original;
    }
  } catch (e) {
    console.log('Enhance failed:', e);
  }
  return original;
}

async function autoRenderPrompt() {
  const input = document.getElementById('imgPrompt');
  const original = input?.value.trim();
  if (!original) {
    showToast("⚠️ Enter a prompt first", true);
    return;
  }
  
  showToast("✨ Enhancing...");
  const enhanced = await enhancePrompt(original);
  if (input) {
    input.value = enhanced;
    showToast("✅ Prompt enhanced!");
  }
}

// ========== IMAGE GENERATION ==========
async function generateImage() {
  const input = document.getElementById('imgPrompt');
  const prompt = input?.value.trim();
  
  if (!prompt) {
    showToast("⚠️ Enter a prompt first", true);
    return;
  }
  
  // Track attempt
  trackUsage('generate_attempt', { model: currentModel, prompt_length: prompt.length });
  
  // Check premium model requirement
  if (isPremiumModel(currentModel)) {
    const hasKey = await requireApiKey(POLLEN_CONFIG.models[currentModel].name);
    if (!hasKey) return;
  } else {
    // Check free tier pollen
    if (!canUseFreeTier(currentModel)) {
      showToast("⚠️ Free pollen exhausted. Connect API key for more.", true);
      return;
    }
  }
  
  const btn = document.getElementById('genImgBtn');
  const loader = document.getElementById('imgLoader');
  const placeholder = document.getElementById('imgPlaceholder');
  const container = document.getElementById('imgContainer');
  const actions = document.getElementById('imgActions');
  const errorMsg = document.getElementById('errorMsg');
  
  if (!btn || !loader) return;
  const t = getT();
  
  // Reset UI
  placeholder.style.display = 'none';
  container.style.display = 'none';
  actions.style.display = 'none';
  if (errorMsg) errorMsg.style.display = 'none';
  
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t.loading_gen}`;
  loader.style.display = 'inline-block';
  
  try {
    const seed = Math.floor(Math.random() * 1000000);
    
    // Build proxy URL
    const params = new URLSearchParams({
      prompt: prompt,
      width: currentW,
      height: currentH,
      model: currentModel,
      seed: seed,
    });
    
    // Add user key if premium model
    if (isPremiumModel(currentModel)) {
      const key = getUserApiKey();
      if (key) params.append('user_key', key);
    }
    
    const proxyUrl = `/api/generate-image?${params.toString()}`;
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      
      if (response.status === 401) throw new Error("Invalid API key");
      if (response.status === 402) throw new Error("Pollen balance low");
      if (response.status === 400) throw new Error("Invalid parameters");
      
      throw new Error(errData.error || `Error ${response.status}`);
    }
    
    const ct = response.headers.get('content-type');
    if (!ct || !ct.includes('image/')) {
      throw new Error("Response is not an image");
    }
    
    const blob = await response.blob();
    if (blob.size < 1000) throw new Error("Empty/corrupt image");
    
    // Convert to base64 for caching
    const base64 = await blobToBase64(blob);
    
    currentImgUrl = URL.createObjectURL(blob);
    const img = document.getElementById('generatedImage');
    img.src = currentImgUrl;
    
    img.onload = async () => {
      // Save to favorites cache
      await saveImageToCache(base64, { prompt, model: currentModel });
      
      loader.style.display = 'none';
      container.style.display = 'block';
      actions.style.display = 'flex';
      btn.disabled = false;
      btn.innerHTML = originalText;
      
      // Deduct pollen for free tier
      if (!isPremiumModel(currentModel)) {
        usePollen(currentModel);
        updatePollenDisplay();
      }
      
      loadFavoritesCount();
      trackUsage('generate_success', { model: currentModel });
      showToast("✅ Generated!");
    };
    
  } catch (e) {
    console.error("Generate error:", e);
    loader.style.display = 'none';
    placeholder.style.display = 'block';
    if (errorMsg) {
      errorMsg.textContent = `❌ ${e.message}`;
      errorMsg.style.display = 'block';
    }
    btn.disabled = false;
    btn.innerHTML = originalText;
    showToast(`❌ ${e.message}`, true);
    trackUsage('generate_error', { error: e.message });
  }
}

// Helper: Blob to Base64
function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// ========== FAVORITES CACHE ==========
async function saveImageToCache(base64Data, metadata = {}) {
  try {
    const item = {
      id: Date.now(),
       base64Data,
      prompt: metadata.prompt || '',
      model: metadata.model || currentModel,
      savedAt: new Date().toISOString(),
      dimensions: `${currentW}x${currentH}`
    };
    
    let favorites = JSON.parse(localStorage.getItem('vs_favorites') || '{"images":[]}');
    favorites.images.unshift(item);
    if (favorites.images.length > 30) favorites.images.pop();
    localStorage.setItem('vs_favorites', JSON.stringify(favorites));
    
    return true;
  } catch (e) {
    console.error('Cache save failed:', e);
    return false;
  }
}

function loadFavoritesCount() {
  const badge = document.getElementById('favBadge');
  if (!badge) return;
  
  const favorites = JSON.parse(localStorage.getItem('vs_favorites') || '{"images":[]}');
  const count = favorites.images?.length || 0;
  badge.textContent = count > 0 ? `(${count})` : '';
}

function openFavorites() {
  const favorites = JSON.parse(localStorage.getItem('vs_favorites') || '{"images":[]}');
  const items = favorites.images || [];
  const t = getT();
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    position:fixed; top:0; left:0; right:0; bottom:0; 
    background:rgba(0,0,0,0.92); z-index:4000; 
    display:flex; align-items:center; justify-content:center; padding:20px;
  `;
  
  const content = items.length > 0 
    ? items.map(item => `
        <div style="background:var(--card-bg); border-radius:12px; overflow:hidden; border:1px solid var(--border);">
          <img src="${item.data}" style="width:100%; height:auto; display:block; cursor:pointer;" onclick="useFavorite('${item.id}')">
          <div style="padding:10px; font-size:12px;">
            <div style="color:var(--text-sec); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.prompt?.substring(0,40) || 'No prompt'}</div>
            <div style="color:var(--text-sec); font-size:10px; margin-top:4px;">${item.model} • ${item.dimensions}</div>
          </div>
        </div>
      `).join('')
    : `<p style="color:var(--text-sec); text-align:center; padding:40px;">${t.no_favorites}</p>`;
  
  modal.innerHTML = `
    <div style="background:var(--card-bg); border-radius:16px; padding:20px; max-width:900px; width:100%; max-height:85vh; overflow-y:auto;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; padding-bottom:15px; border-bottom:1px solid var(--border);">
        <h3 style="margin:0; color:var(--text);">${t.favorites_title}</h3>
        <button onclick="this.closest('div[style*=\"position:fixed\"]').remove()" style="background:none; border:none; color:var(--text); font-size:24px; cursor:pointer; line-height:1;">&times;</button>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:15px;">
        ${content}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function useFavorite(id) {
  const favorites = JSON.parse(localStorage.getItem('vs_favorites') || '{"images":[]}');
  const item = favorites.images?.find(i => i.id === id);
  
  if (item) {
    currentImgUrl = item.data;
    const img = document.getElementById('generatedImage');
    const container = document.getElementById('imgContainer');
    const actions = document.getElementById('imgActions');
    const placeholder = document.getElementById('imgPlaceholder');
    
    if (img) img.src = item.data;
    if (placeholder) placeholder.style.display = 'none';
    if (container) container.style.display = 'block';
    if (actions) actions.style.display = 'flex';
    
    // Close modal
    document.querySelectorAll('[style*="position:fixed"]').forEach(el => {
      if (el.querySelector('h3')?.textContent?.includes('Favorites')) el.remove();
    });
    
    showToast('✅ Image loaded from favorites');
    
    // Scroll to result
    container?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// ========== ACTIONS ==========
function downloadImage() {
  if (!currentImgUrl) return;
  const a = document.createElement('a');
  a.href = currentImgUrl;
  a.download = `ai-trends-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast("⬇️ Downloaded!");
  trackUsage('image_downloaded');
}

function shareImage() {
  if (!currentImgUrl) return;
  // For blob URLs, we can't share directly - copy a note instead
  navigator.clipboard.writeText(`Generated with Ai Trends: https://${window.location.host}`);
  showToast("🔗 Link copied!");
  trackUsage('image_shared');
}

function regenerate() {
  generateImage();
}

// ========== TOAST ==========
function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.textContent = msg;
  toast.style.background = isError ? '#ff4444' : '';
  toast.className = 'show';
  setTimeout(() => toast.className = '', 3000);
}

// ========== DEVICE FINGERPRINTING & TRACKING ==========
function getDeviceFingerprint() {
  const parts = [
    navigator.userAgent,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language
  ];
  
  let hash = 0;
  const str = parts.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substring(0, 12);
}

function trackUsage(event, metadata = {}) {
  const entry = {
    event,
    fingerprint: getDeviceFingerprint(),
    timestamp: new Date().toISOString(),
    url: window.location.pathname,
    ...metadata
  };
  
  // Save locally
  let logs = JSON.parse(localStorage.getItem('vs_usage_logs') || '[]');
  logs.unshift(entry);
  if (logs.length > 100) logs.pop();
  localStorage.setItem('vs_usage_logs', JSON.stringify(logs));
  
  // Optional: send to backend analytics later
  // fetch('/api/track', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(entry) });
}

// ========== NAVIGATION ==========
function toggleMenu() {
  const menu = document.getElementById('dropdownMenu');
  if (menu) menu.classList.toggle('active');
}

function switchTab(tabName) {
  // Update URL
  const url = new URL(window.location);
  url.searchParams.set('tab', tabName);
  window.history.pushState({}, '', url);
  
  // Update UI tabs
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  
  const content = document.getElementById(`tab-${tabName}`);
  const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  
  if (content) content.classList.add('active');
  if (btn) btn.classList.add('active');
  
  // Close mobile menu if open
  document.getElementById('dropdownMenu')?.classList.remove('active');
}

// ========== UTILITY ==========
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
