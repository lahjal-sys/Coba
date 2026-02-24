async function generateImage() {
    const p = document.getElementById('imgPrompt').value.trim();
    if(!p) return alert("Enter prompt!");
    
    const btn = document.getElementById('genImgBtn');
    const loader = document.getElementById('imgLoader');
    const placeholder = document.getElementById('imgPlaceholder');
    const container = document.getElementById('imgContainer');
    const actions = document.getElementById('imgActions');
    
    const t = translations[currentLang];
    
    placeholder.style.display='none'; 
    container.style.display='none'; 
    actions.style.display='none'; 
    
    // Ubah tombol jadi loading
    const originalBtnText = btn.innerHTML;
    btn.disabled = true; 
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t.loading_gen}`;
    loader.style.display='inline-block';

    try {
        // STRATEGI BARU: DIRECT FETCH DARI FRONTEND (Tanpa Proxy, Tanpa Server Vercel)
        // Pollinations mendukung CORS, jadi bisa dipanggil langsung dari browser.
        const width = window.currentW || 1024;
        const height = window.currentH || 1024;
        const seed = Math.floor(Math.random() * 1000000);
        
        // URL Langsung ke Pollinations (Model Flux)
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;

        console.log("Fetching image directly from:", imageUrl);

        // Fetch sebagai blob
        const response = await fetch(imageUrl);
        
        if (!response.ok) {
            throw new Error(`Gagal mengunduh gambar: ${response.status}`);
        }

        const blob = await response.blob();
        
        // Validasi apakah benar gambar
        if (blob.size < 1000) {
            throw new Error("Gambar rusak atau kosong.");
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
        };

    } catch(e) {
        console.error(e);
        loader.style.display='none'; 
        placeholder.style.display='block';
        placeholder.innerHTML = `<span style="color:#ff4444">❌ ${e.message}. Coba prompt lain.</span>`;
        btn.disabled=false;
        btn.innerHTML = originalBtnText;
    }
}
