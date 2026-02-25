let currentImgUrl = '';
let currentLang = 'en';

// --- TRANSLATIONS (DITAMBAHKAN TEKS LOADING) ---
const translations = {
    en: { 
        ph_img: "A cyberpunk cat...", 
        loading_gen: "Generating Image...", 
        loading_chat: "Thinking...", 
        err_gen: "Failed to generate image",
        err_chat: "Chat failed"
    },
    id: { 
        ph_img: "Kucing cyberpunk...", 
        loading_gen: "Sedang Menggambar...", 
        loading_chat: "Berpikir...", 
        err_gen: "Gagal membuat gambar",
        err_chat: "Chat gagal"
    },
    es: { 
        ph_img: "Gato cyberpunk...", 
        loading_gen: "Generando imagen...", 
        loading_chat: "Pensando...", 
        err_gen: "Error al generar",
        err_chat: "Chat falló"
    },
    jp: { 
        ph_img: "サイバーパンクな猫...", 
        loading_gen: "生成中...", 
        loading_chat: "考え中...", 
        err_gen: "生成エラー",
        err_chat: "チャット失敗"
    }
};

window.addEventListener('DOMContentLoaded', () => {
    loadTheme(); 
    loadGallery(); 
    changeLanguage();
});

function loadTheme() {
    const t = localStorage.getItem('viralScopeTheme');
    const btn = document.getElementById('themeBtn');
    if(t==='light'){document.body.setAttribute('data-theme','light'); btn.innerText='☀️';}
    else{document.body.removeAttribute('data-theme'); btn.innerText='🌙';}
}

function toggleTheme() {
    const isDark = document.body.getAttribute('data-theme') !== 'light';
    const btn = document.getElementById('themeBtn');
    if(isDark){document.body.setAttribute('data-theme','light'); btn.innerText='☀️'; localStorage.setItem('viralScopeTheme','light');}
    else{document.body.removeAttribute('data-theme'); btn.innerText='🌙'; localStorage.setItem('viralScopeTheme','dark');}
}

function toggleMenu() { document.getElementById('dropdownMenu').classList.toggle('active'); }

function switchTab(t) {
    document.querySelectorAll('.tab-content').forEach(e=>e.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(e=>e.classList.remove('active'));
    document.getElementById(`tab-${t}`).classList.add('active');
    event.currentTarget.classList.add('active');
}

function changeLanguage() {
    const l = document.getElementById('langSelect').value;
    currentLang = l;
    const t = translations[l];
    
    // Update Placeholder
    const ph = document.getElementById('imgPrompt');
    ph.placeholder = t.ph_img;
}

function setRatio(w,h,b) {
    document.querySelectorAll('.ratio-btn').forEach(e=>e.classList.remove('active'));
    b.classList.add('active');
    window.currentW = w; window.currentH = h;
}
window.currentW = 1024; window.currentH = 1024;

const randoms = ["Cyberpunk cat", "Astronaut on horse", "Flower dragon", "Steampunk robot"];
function fillRandomPrompt() { document.getElementById('imgPrompt').value = randoms[Math.floor(Math.random()*randoms.length)]; }

async function generateImage() {
    const p = document.getElementById('imgPrompt').value.trim();
    if(!p) return alert("Enter prompt!");
    
    const btn = document.getElementById('genImgBtn');
    const loader = document.getElementById('imgLoader');
    const placeholder = document.getElementById('imgPlaceholder');
    const container = document.getElementById('imgContainer');
    const actions = document.getElementById('imgActions');
    
    const t = translations[currentLang];
    
    // Reset UI
    placeholder.style.display='none'; 
    container.style.display='none'; 
    actions.style.display='none'; 
    
    // Set Loading State
    const originalBtnText = btn.innerHTML;
    btn.disabled = true; 
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t.loading_gen}`;
    loader.style.display='inline-block';

    try {
        const width = window.currentW || 1024;
        const height = window.currentH || 1024;
        const seed = Math.floor(Math.random() * 1000000);
        
        // PERBAIKAN 1: HAPUS SPASI DI URL!
        // Format: .../prompt/{teks}?width=...
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=turbo`;

        console.log("Fetching with Turbo Model:", imageUrl);

        // PERBAIKAN 2: HAPUS SPASI DI REFERER
        const response = await fetch(imageUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Referer': 'https://pollinations.ai/' // Spasi dihapus!
            }
        });
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Server Error ${response.status}: ${errText.substring(0, 100)}`);
        }

        const blob = await response.blob();
        
        // Validasi Ukuran Blob
        if (blob.size < 1000) {
            throw new Error("Gambar terlalu kecil/rusak. Server mungkin menolak prompt ini.");
        }

        currentImgUrl = URL.createObjectURL(blob);
        const img = document.getElementById('generatedImage');
        img.src = currentImgUrl;
        
        img.onload = () => {
            loader.style.display='none'; 
            container.style.display='block'; 
            actions.style.display='flex'; 
            btn.disabled=false;
            btn.innerHTML = originalBtnText;
            saveToGallery(currentImgUrl);
            console.log("Image generated successfully!");
        };
        
        img.onerror = () => {
            throw new Error("Gagal memuat gambar di browser.");
        };

    } catch(e) {
        console.error("Generate Error:", e);
        loader.style.display='none'; 
        placeholder.style.display='block';
        placeholder.innerHTML = `<span style="color:#ff4444">❌ ${e.message}</span>`;
        btn.disabled=false;
        btn.innerHTML = originalBtnText;
    }
}
async function sendChat() {
    const inp = document.getElementById('chatInput');
    const txt = inp.value.trim();
    if(!txt) return;

    const box = document.getElementById('chatBox');
    box.innerHTML += `<div class="message user">${txt}</div>`;
    inp.value = '';
    box.scrollTop = box.scrollHeight;

    const t = translations[currentLang];
    const loadingId = 'loading-' + Date.now();
    box.innerHTML += `<div class="message ai" id="${loadingId}"><i class="fas fa-spinner fa-spin"></i> ${t.loading_chat}</div>`;
    box.scrollTop = box.scrollHeight;

    try {
                // ... (kode sebelumnya tetap sama sampai baris fetch) ...

        const response = await fetch('/api/send-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputs: txt })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Gagal chat');
        }

        const data = await response.json();
        
        // PERUBAHAN DI SINI: Groq mengembalikan { result: "jawaban" }
        let reply = "Maaf, saya tidak mengerti.";
        
        if (data && data.result) {
            reply = data.result.trim(); 
        }

        document.getElementById(loadingId).innerText = reply;

        // ... (kode selanjutnya tetap sama) ...

    } catch(e) {
        console.error(e);
        document.getElementById(loadingId).innerText = "⚠️ Error: " + e.message;
    }
}

function saveToGallery(url) {
    if (!url) return;
    let g = JSON.parse(localStorage.getItem('vs_g') || '[]');
    if (!g.includes(url)) {
        g.unshift(url); 
        if(g.length>6) g.pop();
        localStorage.setItem('vs_g', JSON.stringify(g)); 
        loadGallery();
    }
}

function loadGallery() {
    let g = JSON.parse(localStorage.getItem('vs_g') || '[]');
    const grid = document.getElementById('galleryGrid');
    const sec = document.getElementById('gallerySection');
    if (!grid) return;
    grid.innerHTML='';
    
    if(g.length>0 && g[0] !== ''){
        sec.style.display='block';
        g.forEach((u, index) => {
            if (!u) return;
            const d=document.createElement('div'); 
            d.className='gallery-item';
            d.innerHTML = `<img src="${u}" alt="Art ${index}" onclick="viewImage('${u}')">`; 
            grid.appendChild(d);
        });
    } else {
        sec.style.display='none';
    }
}

function viewImage(u) {
    if (!u) return;
    currentImgUrl = u;
    const imgElement = document.getElementById('generatedImage');
    const container = document.getElementById('imgContainer');
    const placeholder = document.getElementById('imgPlaceholder');
    const loader = document.getElementById('imgLoader');
    const actions = document.getElementById('imgActions');

    imgElement.src = u;
    placeholder.style.display = 'none';
    loader.style.display = 'none';
    container.style.display = 'block';
    actions.style.display = 'flex';
    
    setTimeout(() => {
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

function downloadImage() { 
    if(!currentImgUrl)return; 
    const a=document.createElement('a'); 
    a.href=currentImgUrl; 
    a.download='viral-scope-' + Date.now() + '.png'; 
    document.body.appendChild(a); 
    a.click(); 
    document.body.removeChild(a); 
}

function shareImage() { 
    if(!currentImgUrl)return; 
    navigator.clipboard.writeText(currentImgUrl); 
    const toast = document.getElementById('toast');
    toast.className='show'; 
    setTimeout(()=>toast.className='',3000); 
}
