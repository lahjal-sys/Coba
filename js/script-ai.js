
let currentImgUrl = '';
let currentLang = 'en';

window.addEventListener('DOMContentLoaded', () => {
    loadTheme(); loadGallery(); changeLanguage();
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
    
    btn.disabled = true; placeholder.style.display='none'; container.style.display='none'; actions.style.display='none'; loader.style.display='inline-block';

    try {
        // PERUBAHAN BESAR DI SINI:
        // Dulu: fetch('https://api.huggingface.co/...', { headers: { Authorization: ... } })
        // Sekarang: fetch('/api/generate-image', ...) -> Token otomatis dipakai server
        
        const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: p, 
                width: window.currentW, 
                height: window.currentH 
            })
        });

        // Cek jika server mengembalikan error
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Gagal generate gambar');
        }
        
        // Karena response kita sekarang adalah image blob langsung dari server kita
        const blob = await response.blob();
        currentImgUrl = URL.createObjectURL(blob);
        
        const img = document.getElementById('generatedImage');
        img.src = currentImgUrl;
        img.onload = () => {
            loader.style.display='none'; container.style.display='block'; actions.style.display='flex'; btn.disabled=false;
            saveToGallery(currentImgUrl);
        };
    } catch(e) {
        console.error(e);
        loader.style.display='none'; placeholder.style.display='block';
        placeholder.innerHTML = `<span style="color:#ff4444">❌ ${e.message}</span>`;
        btn.disabled=false;
    }
}
async function sendChat() {
    const inp = document.getElementById('chatInput');
    const txt = inp.value.trim();
    if(!txt) return;
    const box = document.getElementById('chatBox');
    box.innerHTML += `<div class="message user">${txt}</div>`;
    inp.value='';
    const id = 'l'+Date.now();
    box.innerHTML += `<div class="message ai" id="${id}">...</div>`;
    box.scrollTop = box.scrollHeight;

    // SUSUN URL TARGET (TANPA SPASI)
    const target = `https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct`;
    const proxyUrl = `${PROXY_BASE}${encodeURIComponent(target)}`;

    try {
        const res = await fetch(proxyUrl, {
            method:'POST',
            headers: {'Authorization':`Bearer ${HF_TOKEN}`, 'Content-Type':'application/json'},
            body: JSON.stringify({inputs: txt})
        });
        const d = await res.json();
        let reply = "Error.";
        if(d[0] && d[0].generated_text) reply = d[0].generated_text.replace(txt,'').trim();
        document.getElementById(id).innerText = reply;
    } catch(e) { 
        console.error(e);
        document.getElementById(id).innerText = "Network Error"; 
    }
}

function saveToGallery(url) {
    let g = JSON.parse(localStorage.getItem('vs_g')||'[]');
    g.unshift(url); if(g.length>6)g.pop();
    localStorage.setItem('vs_g', JSON.stringify(g)); loadGallery();
}

function loadGallery() {
    let g = JSON.parse(localStorage.getItem('vs_g')||'[]');
    const grid = document.getElementById('galleryGrid');
    const sec = document.getElementById('gallerySection');
    grid.innerHTML='';
    if(g.length>0){
        sec.style.display='block';
        g.forEach(u=>{
            const d=document.createElement('div'); d.className='gallery-item';
            d.innerHTML=`<img src="${u}" onclick="view('${u}')">`; grid.appendChild(d);
        });
    } else sec.style.display='none';
}

function view(u) {
    currentImgUrl=u;
    document.getElementById('generatedImage').src=u;
    document.getElementById('imgPlaceholder').style.display='none';
    document.getElementById('imgLoader').style.display='none';
    document.getElementById('imgContainer').style.display='block';
    document.getElementById('imgActions').style.display='flex';
}

function downloadImage() { 
    if(!currentImgUrl)return; 
    const a=document.createElement('a'); 
    a.href=currentImgUrl; 
    a.download='viral.png'; 
    a.click(); 
}

function shareImage() { 
    if(!currentImgUrl)return; 
    navigator.clipboard.writeText(currentImgUrl); 
    document.getElementById('toast').className='show'; 
    setTimeout(()=>document.getElementById('toast').className='',3000); 
}
