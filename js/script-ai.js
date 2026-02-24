let currentImgUrl = '';
let currentLang = 'en';

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
    const ph = document.getElementById('imgPrompt');
    if(l==='id') ph.placeholder = "Kucing cyberpunk...";
    else if(l==='es') ph.placeholder = "Gato cyberpunk...";
    else ph.placeholder = "A cyberpunk cat...";
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
    
    // Reset tampilan
    placeholder.style.display='none'; 
    container.style.display='none'; 
    actions.style.display='none'; 
    
    // Ubah tombol jadi status loading yang jelas
    const originalBtnText = btn.innerHTML;
    btn.disabled = true; 
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sedang Menggambar...';
    
    // Loader kecil tetap nyala juga buat jaga-jaga
    loader.style.display='inline-block';

    try {
        const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: p, 
                width: window.currentW, 
                height: window.currentH 
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Gagal generate gambar');
        }
        
        const blob = await response.blob();
        currentImgUrl = URL.createObjectURL(blob);
        
        const img = document.getElementById('generatedImage');
        img.src = currentImgUrl;
        
        img.onload = () => {
            loader.style.display='none'; 
            container.style.display='block'; 
            actions.style.display='flex'; 
            btn.disabled=false;
            btn.innerHTML = originalBtnText; // Kembalikan teks tombol
            saveToGallery(currentImgUrl);
        };
    } catch(e) {
        console.error(e);
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

    const loadingId = 'loading-' + Date.now();
    box.innerHTML += `<div class="message ai" id="${loadingId}"><i class="fas fa-spinner fa-spin"></i> Thinking...</div>`;
    box.scrollTop = box.scrollHeight;

    try {
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
        let reply = "Maaf, saya tidak mengerti.";
        
        if (data && data[0] && data[0].generated_text) {
            reply = data[0].generated_text.replace(txt, '').trim().split('\n')[0]; 
        }

        document.getElementById(loadingId).innerText = reply;

    } catch(e) {
        console.error(e);
        document.getElementById(loadingId).innerText = "⚠️ Error: " + e.message;
    }
}

function saveToGallery(url) {
    let g = JSON.parse(localStorage.getItem('vs_g')||'[]');
    // Cek duplikasi URL biar galeri gak penuh sama gambar sama
    if (!g.includes(url)) {
        g.unshift(url); 
        if(g.length>6) g.pop();
        localStorage.setItem('vs_g', JSON.stringify(g)); 
        loadGallery();
    }
}

function loadGallery() {
    let g = JSON.parse(localStorage.getItem('vs_g')||'[]');
    const grid = document.getElementById('galleryGrid');
    const sec = document.getElementById('gallerySection');
    grid.innerHTML='';
    
    if(g.length>0){
        sec.style.display='block';
        g.forEach((u, index) => {
            const d=document.createElement('div'); 
            d.className='gallery-item';
            // Tambahkan onclick yang aman
            d.innerHTML = `<img src="${u}" alt="Gallery ${index}" onclick="viewImage('${u}')">`; 
            grid.appendChild(d);
        });
    } else {
        sec.style.display='none';
    }
}

// Fungsi khusus untuk view dari galeri
function viewImage(u) {
    currentImgUrl = u;
    const imgElement = document.getElementById('generatedImage');
    
    // Set source
    imgElement.src = u;
    
    // Atur tampilan manual
    document.getElementById('imgPlaceholder').style.display='none';
    document.getElementById('imgLoader').style.display='none';
    document.getElementById('imgContainer').style.display='block';
    document.getElementById('imgActions').style.display='flex';
    
    // Scroll ke area hasil
    const resultArea = document.getElementById('imgContainer');
    if(resultArea) {
        resultArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
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
