document.addEventListener('DOMContentLoaded', () => {
    // --- Инициализация темы ---
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateCategoriesBackground(savedTheme);

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateCategoriesBackground(newTheme);
    }

    window.toggleTheme = toggleTheme;

    function updateCategoriesBackground(theme) {
        const menu = document.getElementById('menu');
        if (!menu) return;

        if (theme === 'light') {
            menu.style.background = 'rgba(255, 255, 255, 0.9)';
            const buttons = menu.querySelectorAll('.category-btn');
            buttons.forEach(btn => btn.style.color = '#1a1a1a');
        } else {
            menu.style.background = 'rgba(30, 30, 30, 0.8)';
            const buttons = menu.querySelectorAll('.category-btn');
            buttons.forEach(btn => btn.style.color = '#ffffff');
        }
    }

    // --- Загрузка и рендер новостей ---
    let allNews = [];
    let featuredNewsId = null;

    async function loadNews() {
        try {
            const res = await fetch('news.json');
            if (!res.ok) throw new Error('Не удалось загрузить news.json');
            const data = await res.json();
            
            // Обработка структуры JSON (поддерживает оба формата: плоский массив или объект с items)
            allNews = Array.isArray(data) ? data : (data.items || []);
            featuredNewsId = data.featuredNewsId || null;
            
            document.getElementById('loader').style.display = 'none';
            renderNews(allNews);
        } catch (e) {
            console.error('Ошибка загрузки:', e);
            const loader = document.getElementById('loader');
            loader.style.display = 'block';
            loader.innerHTML = `<p style="color: red; text-align: center;">Ошибка загрузки новостей. Проверьте файл news.json.</p>`;
        }
    }

    function renderNews(data, query = '') {
        const container = document.getElementById('news-container');
        container.innerHTML = '';
        
        // Рендер главной новости (Featured)
        if (featuredNewsId && data.some(item => item.id === featuredNewsId)) {
            const featuredNews = data.find(item => item.id === featuredNewsId);
            if (featuredNews) {
                const hotBadge = featuredNews.isHot ? '<span class="hot-badge">ТОП</span>' : '';
                const featuredCatClass = getCategoryClass(featuredNews.category);

                const featuredHTML = `
                    <article class="card" itemscope itemtype="https://schema.org/NewsArticle" style="width: 100%;">
                        <div class="card-image-wrapper">
                            <img src="${featuredNews.image || 'images/placeholder.jpg'}" alt="${featuredNews.title}" itemprop="image" class="card-image" loading="lazy">
                            ${hotBadge}
                            <span class="category-badge ${featuredCatClass}">${featuredNews.category}</span>
                        </div>
                        
                        <div class="meta-container">
                            <span class="meta-date" itemprop="datePublished" content="${featuredNews.date}">${featuredNews.date}</span>
                            <span class="meta-author" itemprop="author" itemscope itemtype="https://schema.org/Person"><span itemprop="name">${featuredNews.author || ''}</span></span>
                        </div>
                        <h3 itemprop="headline">${featuredNews.title}</h3>
                        <div class="desc" itemprop="description">${featuredNews.description || ''}</div>
                    </article>`;
                
                document.getElementById('main-news').innerHTML = featuredHTML;
                document.getElementById('main-news').style.display = 'block';
            }
        } else {
            document.getElementById('main-news').style.display = 'none';
        }

        // Рендер остальных новостей
        const filteredNews = data.filter(item => item.id !== featuredNewsId);
        
        container.innerHTML = filteredNews.map(item => {
            const hotBadge = item.isHot ? '<span class="hot-badge">ТОП</span>' : '';
            const catClass = getCategoryClass(item.category); 
            
            // Подсветка поиска
            let title = query ? item.title.replace(new RegExp(`(${query})`, 'gi'), '<span class="highlight">$1</span>') : item.title;
            
            return `
                <article class="card" itemscope itemtype="https://schema.org/NewsArticle" onclick="window.location.href='/${item.id}.html'">
                    <div class="card-image-wrapper">
                        <img src="${item.image || 'images/placeholder.jpg'}" alt="${item.title}" itemprop="image" class="card-image" loading="lazy">
                        ${hotBadge}
                        <span class="category-badge ${catClass}">${item.category}</span>
                    </div>
                    
                    <div class="meta-container">
                        <span class="meta-date" itemprop="datePublished" content="${item.date}">${item.date}</span>
                        <span class="meta-author" itemprop="author" itemscope itemtype="https://schema.org/Person"><span itemprop="name">${item.author || ''}</span></span>
                    </div>
                    <h3 itemprop="headline">${title}</h3>
                    <div class="desc" itemprop="description">${item.description || ''}</div>
                </article>`;
        }).join('');
    }

    // --- Поиск ---
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('search-results');
    let searchTimeout;

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const val = e.target.value.trim().toLowerCase();
            if (val.length < 3) { 
                searchResults.style.display = 'none'; 
                return; 
            }
            const filtered = allNews
                .filter(n => n.title.toLowerCase().includes(val))
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            
            if (filtered.length === 0) {
                searchResults.innerHTML = '<div class="result-item">Ничего не найдено</div>';
                searchResults.style.display = 'block';
                return;
            }
            searchResults.innerHTML = filtered.map(n => 
                `<div class="result-item" onclick="handleSearchResultClick('${n.id}')">
                    ${n.title.replace(new RegExp(`(${val})`, 'gi'), '<span class="highlight">$1</span>')}
                </div>`
            ).join('');
            searchResults.style.display = 'block';
        });
    }

    function handleSearchResultClick(newsId) {
        if(searchInput) searchInput.value = '';
        if(searchResults) searchResults.style.display = 'none';
        window.location.href = `/${newsId}.html`;
    }

    // --- Категории ---
    const menuElement = document.getElementById('menu');

    function handleCategoryClick(e) {
        if (!e.target.classList.contains('category-btn')) return;
        
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        const cat = e.target.dataset.category;
        if (cat === 'all') {
            renderNews(allNews);
        } else {
            renderNews(allNews.filter(n => n.category === cat));
        }
    }

    if (menuElement) menuElement.addEventListener('click', handleCategoryClick);

    // --- Утилиты ---
    function getCategoryClass(category) {
        if (!category) return 'cat-default';
        const cat = category.toLowerCase();

        if (cat.includes('сво')) return 'cat-svo';
        if (cat.includes('политика') || cat.includes('госдума') || cat.includes('президент') || cat.includes('власть')) return 'cat-politics';
        if (cat.includes('государство')) return 'cat-state';
        if (cat.includes('геополитика')) return 'cat-geopolitics';
        if (cat.includes('происшествие') || cat.includes('чп') || cat.includes('авария')) return 'cat-incidents';
        if (cat.includes('общество')) return 'cat-society';
        if (cat.includes('регионы') || cat.includes('регион')) return 'cat-regions';
        if (cat.includes('криминал')) return 'cat-crime';
        if (cat.includes('коррупция')) return 'cat-corruption';
        if (cat.includes('культура') || cat.includes('искусство')) return 'cat-culture';
        if (cat.includes('наука') || cat.includes('технологии')) return 'cat-science';
        if (cat.includes('стиль') || cat.includes('мода')) return 'cat-style';
        if (cat.includes('спорт')) return 'cat-sports';
        if (cat.includes('шоу-бизнес') || cat.includes('знаменитости')) return 'cat-showbiz';

        return 'cat-default';
    }

    // --- Прогресс бар и скролл ---
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        const indicator = document.getElementById('top-scroll-indicator');
        if (indicator) indicator.style.width = scrollPercent + '%';

        // Показ кнопок внизу
        const btn = document.getElementById('scrollToTop');
        const floatBtns = document.querySelector('.floating-buttons');
        
        if (btn) {
            if (window.scrollY > 300) {
                btn.style.display = 'flex';
                btn.style.opacity = '0.7';
                btn.style.bottom = '30px'; 
                btn.style.right = '30px';
            } else {
                btn.style.display = 'none';
            }
        }

        if (floatBtns) {
             if (window.scrollY > 100) {
                floatBtns.style.opacity = '1';
                floatBtns.style.visibility = 'visible';
             } else {
                floatBtns.style.opacity = '0';
                floatBtns.style.visibility = 'hidden';
             }
        }
    });

    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    window.scrollToTop = scrollToTop;

    loadNews();
});
