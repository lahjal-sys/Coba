// File: js/script-ai.js
// AI Generator - Hybrid Free Tier + BYOP

let currentImgUrl = '';
let currentLang = 'en';

const translations = {
    en: { 
        ph_img: "A cyberpunk cat...", 
        loading_gen: "Generating...", 
        err_gen: "Failed", 
        api_key_ph: "pk_ your key",
        free_remaining: "Free generations left today:",
        byop_title: "🔑 Connect Your Pollinations Key",
        byop_desc: "Free limit exhausted. Enter your pk_ key to continue.",
        byop_submit: "Connect",
        byop_cancel: "Cancel",
        byop_hint: "Key stored locally, not sent to other servers.",
        get_key: "Get free key"
    },
    id: { 
        ph_img: "Kucing cyberpunk...", 
        loading_gen: "Menggambar...", 
        err_gen: "Gagal", 
        api_key_ph: "pk_ key-mu",
        free_remaining: "Sisa generate gratis hari ini:",
        byop_title: "🔑 Connect Pollinations Key",
        byop_desc: "Limit gratis habis. Masukkan pk_ key untuk lanjut.",
        byop_submit: "Connect",
        byop_cancel: "Batal",
        byop_hint: "Key disimpan lokal, tidak dikirim ke server lain.",
        get_key: "Dapatkan key gratis"
    },
    es: { 
        ph_img: "Gato cyberpunk...", 
        loading_gen: "Generando...", 
        err_gen: "Error", 
        api_key_ph: "tu clave pk_",
        free_remaining: "Generaciones gratis hoy:",
        byop_title: "🔑 Conectar tu Clave",
        byop_desc: "Límite gratis agotado. Ingresa tu clave pk_.",
        byop_submit: "Conectar",
        byop_cancel: "Cancelar",
        byop_hint: "Clave guardada localmente.",
        get_key: "Obtener clave gratis"
    },
    jp: { 
        ph_img: "猫...", 
        loading_gen: "生成中...", 
        err_gen: "エラー", 
        api_key_ph: "pk_キー",
        free_remaining: "今日の無料生成:",
        byop_title: "🔑 キーを接続",
        byop_desc: "無料制限超過。pk_キーを入力。",
        byop_submit: "接続",
        byop_cancel: "キャンセル",
        byop_hint: "キーはローカル保存。",
        get_key: "無料キー取得"
    }
};

// ========== INIT ==========
window.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadGallery();
    changeLanguage();
    updateFreeTierDisplay();
});

// ========== THEME ==========
function loadTheme() {
    const t = localStorage.getItem('viralScopeTheme');
    const btn = document.getElementById('themeBtn');
    if (!btn) return;
    
    if (t === 'light') {
        document.body.setAttribute('data-theme', 'light');
        btn.innerText = '☀️';
    } else {
        document.body.removeAttribute('data-theme');
        btn.innerText = '🌙';
    }
}

function toggleTheme() {
    const isLight = document.body.getAttribute('data-theme') === 'light';
    const btn = document.getElementById('themeBtn');
    
    if (isLight) {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('viralScopeTheme', 'dark');
        btn.innerText = '🌙';
    } else {
        document.body.setAttribute('data-theme', 'light');
        localStorage.setItem('viralScopeTheme', 'light');
        btn.innerText = '☀️';
    }
}

// ========== LANGUAGE ==========
function changeLanguage() {
    const select = document.getElementById('langSelect');
    if (!select) return;
    
    currentLang = select.value;
    const t = translations[currentLang];
    
    const ph = document.getElementById('imgPrompt');
    if (ph && t) ph.placeholder = t.ph_img;
    
    updateFreeTierDisplay();
}

function updateFreeTierDisplay() {
    const display = document.getElementById('freeTierDisplay');
    if (!display) return;
    
    const t = translations[currentLang];
    const remaining = getFreeTierRemaining();
    
    if (remaining > 0) {
        display.innerHTML = `<span style="color:#4ade80">✅ ${t.free_remaining} ${remaining}</span>`;
    } else {
        display.innerHTML = `<span style="color:#fbbf24">⚠️ ${t.free_remaining} 0</span>`;
    }
}

// ========== FREE TIER (1/day) ==========
function getFreeTierRemaining() {
    const key = 'vs_free_usage';
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    const usage = JSON.parse(localStorage.getItem(key) || '{"count":0,"resetAt":0}');
    
    if (now > usage.resetAt) {
        return 1;
    }
    
    return Math.max(0, 1 - usage.count);
}

function checkFreeTier() {
    return getFreeTierRemaining() > 0;
}

function markFreeTierUsed() {
    const key = 'vs_free_usage';
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    const usage = JSON.parse(localStorage.getItem(key) || '{"count":0,"resetAt":0}');
    
    if (now > usage.resetAt) {
        usage.count = 0;
        usage.resetAt = now + oneDay;
    }
    
    usage.count = Math.min(usage.count + 1, 1);
    localStorage.setItem(key, JSON.stringify(usage));
}

// ========== USER KEY (BYOP) ==========
function getUserKey() {
    return localStorage.getItem('vs_user_pk');
}

function saveUserKey(key) {
    if (key?.startsWith('pk_')) {
        localStorage.setItem('vs_user_pk', key);
        return true;
    }
    return false;
}

function clearUserKey() {
    localStorage.removeItem('vs_user_pk');
}

// ========== RATIO ==========
function setRatio(w, h, btn) {
    document.querySelectorAll('.ratio-btn').forEach(e => e.classList.remove('active'));
    if (btn) btn.classList.add('active');
    window.currentW = parseInt(w);
    window.currentH = parseInt(h);
}
window.currentW = 1024;
window.currentH = 1024;

// ========== RANDOM PROMPT ==========
const randomPrompts = [
    "Cyberpunk cat in neon city",
    "Astronaut riding a horse on Mars",
    "Dragon made of flowers",
    "Steampunk robot drinking coffee",
    "Magical forest spirit at night",
    "Futuristic Tokyo street rain"
];

function fillRandomPrompt() {
    const input = document.getElementById('imgPrompt');
    if (input) {
        input.value = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
    }
}

// ========== GENERATE IMAGE (HYBRID) ==========
async function generateImage() {
    const input = document.getElementById('imgPrompt');
    const p = input?.value.trim() || '';
    
    if (!p) {
        showToast("⚠️ Enter a prompt first!", true);
        return;
    }

    const btn = document.getElementById('genImgBtn');
    const loader = document.getElementById('imgLoader');
    const placeholder = document.getElementById('imgPlaceholder');
    const container = document.getElementById('imgContainer');
    const actions = document.getElementById('imgActions');
    
    if (!btn || !loader || !placeholder) return;
    
    const t = translations[currentLang];

    // Reset UI
    placeholder.style.display = 'none';
    container.style.display = 'none';
    actions.style.display = 'none';
    document.getElementById('errorMsg').style.display = 'none';
    
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t.loading_gen}`;
    loader.style.display = 'inline-block';

    try {
        const w = parseInt(window.currentW) || 1024;
        const h = parseInt(window.currentH) || 1024;
        const seed = Math.floor(Math.random() * 1000000);
        const model = window.currentModel || "flux";

        let proxyUrl;
        const canUseFree = checkFreeTier();

        if (canUseFree) {
            // FREE TIER: Pakai server key
            proxyUrl = `/api/generate-image?prompt=${encodeURIComponent(p)}&width=${w}&height=${h}&model=${model}&seed=${seed}`;
            markFreeTierUsed();
            console.log("🎁 Using FREE tier");
        } else {
            // BYOP MODE: Cek user key
            const userKey = getUserKey();
            
            if (!userKey) {
                // Tampilkan modal BYOP
                loader.style.display = 'none';
                btn.disabled = false;
                btn.innerHTML = originalText;
                
                await showBYOPModal();
                
                // Retry setelah user input key
                const newKey = getUserKey();
                if (!newKey) {
                    showToast("❌ Cancelled", true);
                    return;
                }
                
                // Restart generate
                generateImage();
                return;
            }
            
            proxyUrl = `/api/generate-image?prompt=${encodeURIComponent(p)}&width=${w}&height=${h}&model=${model}&seed=${seed}&user_key=${encodeURIComponent(userKey)}`;
            console.log("🔑 Using BYOP key");
        }

        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            
            if (response.status === 401) throw new Error("Invalid API key");
            if (response.status === 402) throw new Error("Pollen balance low");
            if (response.status === 400) throw new Error("Invalid prompt");
            
            throw new Error(errData.error || `Error ${response.status}`);
        }

        const ct = response.headers.get('content-type');
        if (!ct || !ct.includes('image/')) {
            throw new Error("Response is not an image");
        }

        const blob = await response.blob();
        if (blob.size < 1000) throw new Error("Empty/corrupt image");

        currentImgUrl = URL.createObjectURL(blob);
        const img = document.getElementById('generatedImage');
        img.src = currentImgUrl;

        img.onload = () => {
            loader.style.display = 'none';
            container.style.display = 'block';
            actions.style.display = 'flex';
            btn.disabled = false;
            btn.innerHTML = originalText;
            saveToGallery(currentImgUrl);
            updateFreeTierDisplay();
            showToast("✅ Generated!");
        };

    } catch (e) {
        console.error("Generate error:", e);
        loader.style.display = 'none';
        placeholder.style.display = 'block';
        document.getElementById('errorMsg').style.display = 'block';
        document.getElementById('errorMsg').textContent = `❌ ${e.message}`;
        btn.disabled = false;
        btn.innerHTML = originalText;
        showToast(`❌ ${e.message}`, true);
    }
}

// ========== BYOP MODAL ==========
function showBYOPModal() {
    return new Promise((resolve) => {
        const existing = document.getElementById('byopModal');
        if (existing) existing.remove();

        const t = translations[currentLang];
        const modal = document.createElement('div');
        modal.id = 'byopModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;
            z-index: 2000; padding: 20px; backdrop-filter: blur(4px);
        `;
        
        modal.innerHTML = `
            <div style="background: var(--card-bg, #1e1e1e); border-radius: 16px; padding: 24px; max-width: 420px; width: 100%; border: 1px solid var(--border, #333); box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
                <h3 style="margin: 0 0 12px; color: var(--text, #fff); font-size: 18px;">${t.byop_title}</h3>
                <p style="color: var(--text-sec, #aaa); font-size: 14px; margin-bottom: 16px; line-height: 1.5;">${t.byop_desc}</p>
                
                <input type="password" id="byopKeyInput" placeholder="pk_..." 
                       style="width: 100%; padding: 12px 14px; background: var(--input-bg, #2a2a2a); border: 1px solid var(--border, #333); border-radius: 8px; color: var(--text, #fff); margin-bottom: 16px; box-sizing: border-box; font-size: 14px;">
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="byopCancel" style="padding: 10px 20px; background: transparent; border: 1px solid var(--border); border-radius: 8px; color: var(--text); cursor: pointer; font-size: 14px;">${t.byop_cancel}</button>
                    <button id="byopSubmit" style="padding: 10px 20px; background: var(--primary, #ff0050); border: none; border-radius: 8px; color: white; cursor: pointer; font-size: 14px; font-weight: 600;">${t.byop_submit}</button>
                </div>
                
                <p style="font-size: 11px; color: var(--text-sec); margin-top: 16px; line-height: 1.4;">
                    🔐 ${t.byop_hint}
                    <br><a href="https://enter.pollinations.ai" target="_blank" style="color: var(--primary); text-decoration: none;">${t.get_key} →</a>
                </p>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const handleSubmit = () => {
            const key = document.getElementById('byopKeyInput').value.trim();
            if (key.startsWith('pk_')) {
                saveUserKey(key);
                modal.remove();
                resolve();
            } else {
                showToast("⚠️ Invalid pk_ key", true);
            }
        };
        
        document.getElementById('byopCancel').onclick = () => {
            modal.remove();
            resolve();
        };
        
        document.getElementById('byopSubmit').onclick = handleSubmit;
        
        document.getElementById('byopKeyInput').onkeypress = (e) => {
            if (e.key === 'Enter') handleSubmit();
        };
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve();
            }
        };
    });
}

// ========== GALLERY ==========
function saveToGallery(url) {
    if (!url) return;
    let g = JSON.parse(localStorage.getItem('vs_g') || '[]');
    if (!g.includes(url)) {
        g.unshift(url);
        if (g.length > 6) g.pop();
        localStorage.setItem('vs_g', JSON.stringify(g));
        loadGallery();
    }
}

function loadGallery() {
    let g = JSON.parse(localStorage.getItem('vs_g') || '[]');
    const grid = document.getElementById('galleryGrid');
    const sec = document.getElementById('gallerySection');
    
    if (!grid) return;
    
    grid.innerHTML = '';
    if (g.length > 0 && g[0]) {
        if (sec) sec.style.display = 'block';
        g.forEach(u => {
            const d = document.createElement('div');
            d.className = 'gallery-item';
            d.innerHTML = `<img src="${u}" onclick="viewImage('${u}')">`;
            grid.appendChild(d);
        });
    } else {
        if (sec) sec.style.display = 'none';
    }
}

function viewImage(u) {
    if (!u) return;
    currentImgUrl = u;
    const img = document.getElementById('generatedImage');
    const container = document.getElementById('imgContainer');
    const placeholder = document.getElementById('imgPlaceholder');
    const loader = document.getElementById('imgLoader');
    const actions = document.getElementById('imgActions');

    if (img) img.src = u;
    if (placeholder) placeholder.style.display = 'none';
    if (loader) loader.style.display = 'none';
    if (container) {
        container.style.display = 'block';
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (actions) actions.style.display = 'flex';
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
}

function shareImage() {
    if (!currentImgUrl) return;
    navigator.clipboard.writeText(currentImgUrl);
    showToast("🔗 Link copied!");
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

// ========== MENU ==========
function toggleMenu() {
    const menu = document.getElementById('dropdownMenu');
    if (menu) menu.classList.toggle('active');
}

function switchTab(t) {
    document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(e => e.classList.remove('active'));
    document.getElementById(`tab-${t}`).classList.add('active');
    if (event?.currentTarget) event.currentTarget.classList.add('active');
}
