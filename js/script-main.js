
        const API_KEYS = [
            'AIzaSyBGH3y7ZJwEtETVd1hQmwzBlZFmsvKBUJE', 
            'AIzaSyB8jJo5jvlTFSH2pLWSKlmNTnrGu2xojvg', 
            'AIzaSyBzH-UD6q3DaIj3Q7usfzRU6di_Pg4qOcY', 
            'AIzaSyCmZ0LwP3WAiD2Uk_r3G4a067aMMVwsil4', 
            'AIzaSyD91GscbeZQm0wVVmpSVDuqYb3T_UndK-M'
        ];

        let currentKeyIndex = 0;
        let favorites = JSON.parse(localStorage.getItem('viralScopeFavorites')) || [];
        let userRegion = 'ID'; 
        
        let currentQuery = '';
        let currentPageToken = null;
        let hasMoreData = true;
        let isLoading = false;
        let totalVideosLoaded = 0;
        let currentModalVideoId = null;

        const queries = {
            'trending': 'trending shorts',
            'funny': 'funny cats shorts',
            'ai': 'AI technology shorts',
            'gaming': 'gaming highlights shorts',
            'music': 'music hits shorts'
        };

        const translations = {
            en: { loading: "Loading viral videos...", btnClose: "Close", favTitle: "My Saved Videos ❤️", emptyFav: "No saved videos yet.", loadMore: "Load More Viral Videos", searchPlaceholder: "Search viral videos...", toastCopy: "✅ Link copied to clipboard!" },
            id: { loading: "Memuat video viral...", btnClose: "Tutup", favTitle: "Video Tersimpan ❤️", emptyFav: "Belum ada video tersimpan.", loadMore: "Muat Lebih Banyak", searchPlaceholder: "Cari video viral...", toastCopy: "✅ Link disalin!" },
            es: { loading: "Cargando videos...", btnClose: "Cerrar", favTitle: "Mis Guardados ❤️", emptyFav: "Sin videos guardados.", loadMore: "Cargar Más", searchPlaceholder: "Buscar videos...", toastCopy: "¡✅ Enlace copiado!" },
            jp: { loading: "読み込み中...", btnClose: "閉じる", favTitle: "保存した動画 ❤️", emptyFav: "保存された動画はありません。", loadMore: "もっと読み込む", searchPlaceholder: "動画を検索...", toastCopy: "✅ リンクをコピーしました！" }
        };

        let currentLang = 'en';

        function detectRegion() {
            const lang = navigator.language || navigator.userLanguage; 
            if (lang.includes('id')) userRegion = 'ID';
            else if (lang.includes('es')) userRegion = 'ES';
            else if (lang.includes('ja')) userRegion = 'JP';
            else userRegion = 'US';
        }

        function toggleMenu() {
            document.getElementById('dropdownMenu').classList.toggle('active');
        }

        function toggleTheme() {
            const body = document.body;
            const btn = document.querySelector('.theme-btn');
            const isDark = body.getAttribute('data-theme') !== 'light';
            if (isDark) { body.setAttribute('data-theme', 'light'); btn.innerText = '☀️'; } 
            else { body.removeAttribute('data-theme'); btn.innerText = '🌙'; }
        }

        function changeLanguage() {
            const select = document.getElementById('langSelect');
            currentLang = select.value;
            const t = translations[currentLang];
            
            document.getElementById('txt-loading').innerText = t.loading;
            document.getElementById('txt-btn-close').innerText = t.btnClose;
            document.getElementById('txt-fav-title').innerText = t.favTitle;
            document.getElementById('emptyFavMsg').innerText = t.emptyFav;
            document.getElementById('loadMoreBtn').innerText = t.loadMore;
            document.getElementById('searchInput').placeholder = t.searchPlaceholder;
        }

        function showToast() {
            const t = translations[currentLang].toastCopy;
            const x = document.getElementById("toast");
            x.innerText = t;
            x.className = "show";
            setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
        }

        window.addEventListener('scroll', () => {
            const btn = document.getElementById('backToTop');
            if (window.scrollY > 300) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        });

        function showHome() {
            document.getElementById('homeView').style.display = 'block';
            document.getElementById('favoritesView').style.display = 'none';
            window.scrollTo(0,0);
        }

        function showFavorites() {
            document.getElementById('homeView').style.display = 'none';
            document.getElementById('favoritesView').style.display = 'block';
            renderFavorites();
            window.scrollTo(0,0);
        }

        async function loadCategory(category) {
            document.getElementById('videoGrid').innerHTML = '';
            document.getElementById('errorMsg').style.display = 'none';
            document.getElementById('loadMoreBtn').style.display = 'none';
            
            currentQuery = queries[category] || 'viral shorts';
            currentPageToken = null;
            hasMoreData = true;
            totalVideosLoaded = 0;
            currentKeyIndex = 0;

            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            const chipId = category === 'trending' ? 'chip-trending' : `chip-${category}`;
            if(document.getElementById(chipId)) document.getElementById(chipId).classList.add('active');

            // Scroll filters to left when category changes
            document.querySelector('.filters').scrollLeft = 0;

            await fetchVideos(true);
        }

        async function performSearch() {
            const query = document.getElementById('searchInput').value;
            if (!query) return;
            
            document.getElementById('videoGrid').innerHTML = '';
            document.getElementById('errorMsg').style.display = 'none';
            document.getElementById('loadMoreBtn').style.display = 'none';
            
            currentQuery = query;
            currentPageToken = null;
            hasMoreData = true;
            totalVideosLoaded = 0;
            currentKeyIndex = 0;

            await fetchVideos(true);
        }

        function loadMoreVideos() {
            if (!isLoading && hasMoreData) fetchVideos(false);
        }

        async function fetchVideos(isReset) {
            if (isLoading || !hasMoreData) return;
            isLoading = true;

            if (isReset) {
                document.getElementById('loadingState').style.display = 'block';
                document.getElementById('loadMoreBtn').style.display = 'none';
            } else {
                const grid = document.getElementById('videoGrid');
                for(let i=0; i<6; i++) {
                    const skel = document.createElement('div');
                    skel.className = 'skeleton';
                    grid.appendChild(skel);
                }
                document.getElementById('loadMoreBtn').disabled = true;
                document.getElementById('loadMoreBtn').innerText = "Loading...";
            }

            let success = false;
            let triedKeys = 0;

            while (!success && triedKeys < API_KEYS.length) {
                const apiKey = API_KEYS[currentKeyIndex];
                try {
                    const maxResults = 50;
                    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&q=${encodeURIComponent(currentQuery)}&type=video&videoDuration=short&order=viewCount&regionCode=${userRegion}&key=${apiKey}`;
                    if (currentPageToken) url += `&pageToken=${currentPageToken}`;
                    
                    const response = await fetch(url);
                    const data = await response.json();

                    if (data.error && data.error.errors[0].reason === 'quotaExceeded') {
                        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
                        triedKeys++;
                        continue;
                    }
                    if (data.error) throw new Error(data.error.message);

                    if(!isReset) {
                        const skeletons = document.querySelectorAll('.skeleton');
                        skeletons.forEach(s => s.remove());
                    }

                    currentPageToken = data.nextPageToken || null;
                    if (!data.nextPageToken) hasMoreData = false;
                    
                    renderVideosWithAds(data.items, isReset);
                    totalVideosLoaded += data.items.length;
                    success = true;

                } catch (err) {
                    if(!isReset) {
                        const skeletons = document.querySelectorAll('.skeleton');
                        skeletons.forEach(s => s.remove());
                    }
                    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
                    triedKeys++;
                }
            }

            isLoading = false;
            document.getElementById('loadingState').style.display = 'none';
            
            const btn = document.getElementById('loadMoreBtn');
            if (!success) {
                btn.style.display = 'none';
                if (isReset) {
                    document.getElementById('errorMsg').innerText = "All API keys exceeded or error.";
                    document.getElementById('errorMsg').style.display = 'block';
                }
            } else {
                btn.disabled = false;
                btn.innerText = translations[currentLang].loadMore;
                btn.style.display = hasMoreData ? 'inline-block' : 'none';
            }
        }

        function renderVideosWithAds(items, isReset) {
            const grid = document.getElementById('videoGrid');
            if (!items || items.length === 0) {
                if(isReset) {
                    document.getElementById('errorMsg').innerText = "No videos found.";
                    document.getElementById('errorMsg').style.display = 'block';
                }
                return;
            }

            let localCount = totalVideosLoaded;
            items.forEach((item, index) => {
                if ((localCount + index) > 0 && (localCount + index) % 10 === 0) {
                    grid.appendChild(createAdCard());
                }
                const videoId = item.id.videoId;
                const snippet = item.snippet;
                if (!snippet.thumbnails) return;
                const thumbUrl = snippet.thumbnails.high ? snippet.thumbnails.high.url : snippet.thumbnails.medium.url;
                grid.appendChild(createVideoCard(videoId, snippet.title, snippet.channelTitle, thumbUrl));
            });
        }

        function createAdCard() {
            const ad = document.createElement('div');
            ad.className = 'ad-card';
            ad.innerHTML = `<div class="ad-label">Advertisement</div><h3>Your Ad Here</h3><p>Promote your brand!</p>`;
            return ad;
        }

        function createVideoCard(id, title, channel, thumbUrl) {
            const card = document.createElement('div');
            card.className = 'video-card';
            card.onclick = () => openModal(id);
            const isSaved = favorites.some(v => v.id === id);
            card.innerHTML = `
                <div class="thumbnail-container">
                    <div class="watermark">⚡ ViralScope</div>
                    <img src="${thumbUrl}" class="thumbnail" alt="${title}" loading="lazy">
                    <div class="play-icon">▶</div>
                    <div class="shorts-badge">SHORTS</div>
                    <div class="card-actions">
                        <button class="action-btn ${isSaved ? 'favorited' : ''}" onclick="toggleFavorite('${id}', '${title.replace(/'/g, "\\'")}', '${channel.replace(/'/g, "\\'")}', '${thumbUrl}', event)">
                            ${isSaved ? '❤️' : '🤍'}
                        </button>
                        <button class="action-btn" onclick="shareVideo('${id}', '${title.replace(/'/g, "\\'")}', event)">📤</button>
                    </div>
                </div>
                <div class="info"><div class="title">${title}</div><div class="stats">${channel}</div></div>`;
            return card;
        }

        function toggleFavorite(id, title, channel, thumb, e) {
            if(e) e.stopPropagation();
            const idx = favorites.findIndex(v => v.id === id);
            if (idx === -1) { 
                favorites.push({id, title, channel, thumb}); 
                if(e) { e.target.classList.add('favorited'); e.target.innerText='❤️'; }
                updateModalFavButton(id);
            } else { 
                favorites.splice(idx, 1); 
                if(e) { e.target.classList.remove('favorited'); e.target.innerText='🤍'; }
                updateModalFavButton(id);
                if(document.getElementById('favoritesView').style.display==='block') renderFavorites(); 
            }
            localStorage.setItem('viralScopeFavorites', JSON.stringify(favorites));
        }

        function updateModalFavButton(id) {
            const btn = document.getElementById('modalFavBtn');
            if(!btn) return;
            const isSaved = favorites.some(v => v.id === id);
            btn.innerText = isSaved ? '❤️' : '🤍';
            if(isSaved) btn.style.background = 'var(--primary)';
            else btn.style.background = 'var(--chip-bg)';
        }

        function toggleFavoriteFromModal() {
            if(currentModalVideoId) {
                toggleFavorite(currentModalVideoId, '', '', '');
            }
        }

        function renderFavorites() {
            const grid = document.getElementById('favGrid'); grid.innerHTML='';
            if(favorites.length===0) { document.getElementById('emptyFavMsg').style.display='block'; return; }
            document.getElementById('emptyFavMsg').style.display='none';
            favorites.forEach(f => grid.appendChild(createVideoCard(f.id, f.title, f.channel, f.thumb)));
        }

        function shareVideo(id, title, e) {
            if(e) e.stopPropagation();
            doShare(id, title);
        }

        function shareVideoFromModal() {
            if(currentModalVideoId) doShare(currentModalVideoId, "Check out this video!");
        }

        function doShare(id, title) {
            const url = `https://www.youtube.com/watch?v=${id}`;
            if(navigator.share) {
                navigator.share({title: title, text: title, url: url}).catch(()=>{});
            } else {
                navigator.clipboard.writeText(url);
                showToast();
            }
        }

        function openModal(id) {
            currentModalVideoId = id;
            document.getElementById('youtubePlayer').src = `https://www.youtube.com/embed/${id}?autoplay=1`;
            document.getElementById('videoModal').style.display = 'flex';
            updateModalFavButton(id);
        }

        function closeModal() {
            document.getElementById('youtubePlayer').src = '';
            document.getElementById('videoModal').style.display = 'none';
            currentModalVideoId = null;
        }

        window.onload = function() {
            detectRegion();
            changeLanguage();
            if(API_KEYS[0] && API_KEYS[0] !== 'KEY_1_DISINI') {
                loadCategory('trending');
            } else {
                document.getElementById('loadingState').style.display = 'none';
                document.getElementById('errorMsg').innerText = "⚠️ Please edit code and insert your 5 API Keys.";
                document.getElementById('errorMsg').style.display = 'block';
            }
        };
    
