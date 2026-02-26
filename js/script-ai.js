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
    
    const originalBtnText = btn.innerHTML;
    btn.disabled = true; 
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t.loading_gen}`;
    loader.style.display='inline-block';

    try {
        const width = window.currentW || 1024;
        const height = window.currentH || 1024;
        const seed = Math.floor(Math.random() * 1000000);
        
        // URL RESMI SESUAI DOKUMENTASI POLLINATIONS
        // Kita pakai model 'flux' karena kualitasnya terbaik saat ini di sana
        // Parameter: prompt, width, height, seed, nologo=true
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;

        console.log("📸 Requesting Official Pollinations API:", imageUrl);

        // FETCH LANGSUNG TANPA HEADER ANEH-ANEH
        // Dokumentasi mereka tidak mensyaratkan header khusus.
        // Semakin sederhana request, semakin kecil kemungkinan diblokir firewall.
        const response = await fetch(imageUrl, {
            method: 'GET',
            // Kita hanya pakai header standar browser, tidak perlu spoofing User-Agent lagi
            headers: {
                'Accept': 'image/*' 
            }
        });

        if (!response.ok) {
            // Jika error, baca pesannya
            const errorText = await response.text();
            throw new Error(`Pollinations Error ${response.status}: ${errorText.substring(0, 100)}`);
        }

        const blob = await response.blob();
        
        if (blob.size < 1000) {
            throw new Error("Gambar terlalu kecil/rusak.");
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
            console.log("✅ Image generated successfully via Official API!");
        };

    } catch(e) {
        console.error("❌ Generate Error:", e);
        loader.style.display='none'; 
        placeholder.style.display='block';
        placeholder.innerHTML = `<span style="color:#ff4444">❌ ${e.message}<br><small>Coba prompt lain atau tunggu sebentar.</small></span>`;
        btn.disabled=false;
        btn.innerHTML = originalBtnText;
    }
}
