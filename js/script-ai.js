// File: js/script-ai.js
// CLEAN VERSION: Mengikuti Docs Resmi Pollinations & Groq

let currentImgUrl = '';
let currentLang = 'en';

const translations = {
    en: { ph_img: "A cyberpunk cat...", loading_gen: "Generating...", loading_chat: "Thinking...", err_gen: "Failed", err_chat: "Chat Error" },
    id: { ph_img: "Kucing cyberpunk...", loading_gen: "Menggambar...", loading_chat: "Berpikir...", err_gen: "Gagal", err_chat: "Gagal Chat" },
    es: { ph_img: "Gato cyberpunk...", loading_gen: "Generando...", loading_chat: "Pensando...", err_gen: "Error", err_chat: "Error Chat" },
    jp: { ph_img: "猫...", loading_gen: "生成中...", loading_chat: "考え中...", err_gen: "エラー", err_chat: "チャットエラー" }
};

window.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('themeBtn')) loadTheme();
    if(document.getElementById('galleryGrid')) loadGallery();
    if(document.getElementById('langSelect')) changeLanguage();
});

function loadTheme() {
    const t = localStorage.getItem('viralScopeTheme');
    const btn = document.getElementById('themeBtn');
    if(!btn) return;
    document.body.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
    btn.innerText = t === 'light' ? '☀️' : '🌙';
}

function toggleTheme() {
    const isLight = document.body.getAttribute('data-theme') === 'light';
    const newTheme = isLight ? 'dark' : 'light';
    document.body.setAttribute('data-theme', newTheme);
    document.getElementById('themeBtn').innerText = newTheme === 'light' ? '☀️' : '🌙';
    localStorage.setItem('viralScopeTheme', newTheme);
}

function toggleMenu() {
    const menu = document.getElementById('dropdownMenu');
    if(menu) menu.classList.toggle('active');
}

function switchTab(t) {
    document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(e => e.classList.remove('active'));
    document.getElementById(`tab-${t}`).classList.add('active');
    if(event.currentTarget) event.currentTarget.classList.add('active');
}

function changeLanguage() {
    const l = document.getElementById('langSelect').value;
    currentLang = l;
    const t = translations[l];
    const ph = document.getElementById('imgPrompt');
    if(ph && t) ph.placeholder = t.ph_img;
}

function setRatio(w, h, btn) {
    document.querySelectorAll('.ratio-btn').forEach(e => e.classList.remove('active'));
    if(btn) btn.classList.add('active');
    window.currentW = w;
    window.currentH = h;
}
window.currentW = 1024;
window.currentH = 1024;
window.currentModel = "flux"; // Default model

// Fungsi baru untuk menyimpan pilihan model
function setModel(modelName) {
    window.currentModel = modelName;
    console.log("Model changed to:", modelName);
    
    // Opsional: Beri tahu user jika pilih Turbo
    if(modelName === 'turbo') {
        // Bisa tambah toast notification kecil disini kalau mau
        console.log("Switched to Fast Mode!");
    }
}
const randomPrompts = ["Cyberpunk cat", "Astronaut on horse", "Flower dragon", "Steampunk robot", "Neon city"];
function fillRandomPrompt() {
    const input = document.getElementById('imgPrompt');
    if(input) input.value = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
}

// --- FUNGSI GENERATE GAMBAR (POLLINATIONS OFFICIAL API) ---

async function generateImage() {
    // 1. Ambil Prompt
    const p = document.getElementById('imgPrompt').value.trim();
    if(!p) return alert("Isi prompt dulu!");

    // 2. Siap-siap UI (Loading)
    const btn = document.getElementById('genImgBtn');
    const loader = document.getElementById('imgLoader');
    const placeholder = document.getElementById('imgPlaceholder');
    const container = document.getElementById('imgContainer');
    const actions = document.getElementById('imgActions');
    
    placeholder.style.display='none'; 
    container.style.display='none'; 
    actions.style.display='none'; 
    
    const originalText = btn.innerHTML;
    btn.disabled = true; 
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Menggambar...`;
    loader.style.display='inline-block';

    try {
        // 3. MASUKAN KEY KAMU DI SINI (Ganti teks di bawah ini!)
        const DEEPAI_KEY = "5ecbae0a-c4aa-43ea-9700-62a531fad26f"; 

        // Cek kalau lupa ganti key
        if(DEEPAI_KEY === "GANTI_DENGAN_KEY_ASLI_KAMU_DISINI") {
            throw new Error("Hei! Kamu belum pasang API Key di kode script-ai.js!");
        }

        // 4. Kirim Langsung ke DeepAI (Tanpa Perantara!)
        const formData = new FormData();
        formData.append('text', p);
        
        const response = await fetch('https://api.deepai.org/api/text2img', {
            method: 'POST',
            headers: { 'api-key': DEEPAI_KEY },
            body: formData
        });

        const data = await response.json();

        if (!response.ok || data.err) {
            throw new Error(data.err || "DeepAI Error");
        }

        // 5. Download Gambarnya
        const imgUrl = data.output_url;
        const imgRes = await fetch(imgUrl);
        const blob = await imgRes.blob();

        // 6. Tampilkan!
        currentImgUrl = URL.createObjectURL(blob);
        const img = document.getElementById('generatedImage');
        img.src = currentImgUrl;

        img.onload = () => {
            loader.style.display='none'; 
            container.style.display='block'; 
            actions.style.display='flex'; 
            btn.disabled=false;
            btn.innerHTML = originalText;
            saveToGallery(currentImgUrl);
            console.log("BERHASIL! Gambar muncul!");
        };

    } catch(e) {
        console.error(e);
        loader.style.display='none'; 
        placeholder.style.display='block';
        placeholder.innerHTML = `<span style="color:#ff4444">❌ ${e.message}</span>`;
        btn.disabled=false;
        btn.innerHTML = originalText;
    }
}

// --- FUNGSI CHAT (GROQ API VIA BACKEND) ---
async function sendChat() {
    const inp = document.getElementById('chatInput');
    const txt = inp ? inp.value.trim() : '';
    if(!txt) return;

    const box = document.getElementById('chatBox');
    if(!box) return;

    box.innerHTML += `<div class="message user">${txt}</div>`;
    inp.value = '';
    box.scrollTop = box.scrollHeight;

    const t = translations[currentLang] || translations['en'];
    const id = 'msg-' + Date.now();
    box.innerHTML += `<div class="message ai" id="${id}"><i class="fas fa-spinner fa-spin"></i> ${t.loading_chat}</div>`;
    box.scrollTop = box.scrollHeight;

    try {
        const res = await fetch('/api/send-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputs: txt })
        });

        // Cek Content-Type sebelum parse JSON
        const contentType = res.headers.get("content-type");
        let data;

        if (contentType && contentType.includes("application/json")) {
            data = await res.json();
        } else {
            const textErr = await res.text();
            throw new Error(`Server Error: ${textErr.substring(0, 100)}`);
        }

        if (!res.ok) {
            throw new Error(data.message || "Chat failed");
        }

        const replyEl = document.getElementById(id);
        if(replyEl) {
            replyEl.innerText = (data && data.result) ? data.result.trim() : "No response.";
        }

    } catch (e) {
        console.error(e);
        const replyEl = document.getElementById(id);
        if(replyEl) replyEl.innerText = `⚠️ ${e.message}`;
    }
}

// --- GALERI & UTILS ---
function saveToGallery(url) {
    if(!url) return;
    let g = JSON.parse(localStorage.getItem('vs_g') || '[]');
    if(!g.includes(url)) {
        g.unshift(url);
        if(g.length > 6) g.pop();
        localStorage.setItem('vs_g', JSON.stringify(g));
        loadGallery();
    }
}

function loadGallery() {
    let g = JSON.parse(localStorage.getItem('vs_g') || '[]');
    const grid = document.getElementById('galleryGrid');
    const sec = document.getElementById('gallerySection');
    if(!grid) return;
    
    grid.innerHTML = '';
    if(g.length > 0 && g[0]) {
        if(sec) sec.style.display = 'block';
        g.forEach(u => {
            const d = document.createElement('div');
            d.className = 'gallery-item';
            d.innerHTML = `<img src="${u}" onclick="viewImage('${u}')">`;
            grid.appendChild(d);
        });
    } else {
        if(sec) sec.style.display = 'none';
    }
}

function viewImage(u) {
    if(!u) return;
    currentImgUrl = u;
    const img = document.getElementById('generatedImage');
    const container = document.getElementById('imgContainer');
    const placeholder = document.getElementById('imgPlaceholder');
    const loader = document.getElementById('imgLoader');
    const actions = document.getElementById('imgActions');

    if(img) img.src = u;
    if(placeholder) placeholder.style.display = 'none';
    if(loader) loader.style.display = 'none';
    if(container) {
        container.style.display = 'block';
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if(actions) actions.style.display = 'flex';
}

function downloadImage() {
    if(!currentImgUrl) return;
    const a = document.createElement('a');
    a.href = currentImgUrl;
    a.download = `viral-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function shareImage() {
    if(!currentImgUrl) return;
    navigator.clipboard.writeText(currentImgUrl);
    const toast = document.getElementById('toast');
    if(toast) {
        toast.className = 'show';
        setTimeout(() => toast.className = '', 3000);
    }
}
