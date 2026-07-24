console.log('Скрипт новостей запущен');

document.addEventListener('DOMContentLoaded', () => {
    const newsContainer = document.getElementById('news-container');
    const loader = document.getElementById('loader');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const searchInput = document.getElementById('searchInput');
    const featuredNewsContainer = document.getElementById('main-news');
    const progressBar = document.getElementById('progress-bar');
    const scrollToTopButton = document.getElementById('scrollToTop');

    let allNewsData = [];
    let currentCategory = 'all';

    // --- 1. ЗАГРУЗКА ДАННЫХ ---
    fetch('news.json')
        .then(response => {
            if (!response.ok) throw new Error(`Ошибка загрузки JSON: ${response.status}`);
            return response.json();
        })
        .then(data => {
            allNewsData = data.items || [];
            
            // Рендер главной новости (Featured)
            if (data.featuredNewsId && allNewsData.length > 0) {
                const featured = allNewsData.find(item => item.id === data.featuredNewsId);
                if (featured) displayFeaturedNews(featured);
            }

            // Рендер сетки новостей
            displayNews(allNewsData);

            // Скрываем лоадер
            if (loader) loader.style.display = 'none';
        })
        .catch(error => {
            console.error('Критическая ошибка:', error);
            if (loader) {
                loader.textContent = 'Ошибка загрузки новостей. Проверьте консоль.';
                loader.style.color = 'red';
            }
        });

    // --- ФУНКЦИИ ОТРИСОВКИ ---

    function formatDate(dateString) {
        try {
            return new Date(dateString).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) {
            return dateString;
        }
    }

    function displayFeaturedNews(newsItem) {
        if (!featuredNewsContainer) return;

        const imgSrc = newsItem.image || 'https://via.placeholder.com/600x400?text=Нет+фото';
        const authorText = newsItem.author ? `Автор: ${newsItem.author}` : '';
        const dateText = newsItem.date ? formatDate(newsItem.date) : '';

        featuredNewsContainer.innerHTML = `
            <div class="featured-news-card">
                <img src="${imgSrc}" alt="${newsItem.title}" class="featured-news-image">
                <div class="featured-news-content">
                    <h2 class="featured-news-title">${newsItem.title}</h2>
                    ${dateText || authorText ? `
                        <div class="news-meta featured-meta">
                            ${dateText ? `<span class="meta-date">${dateText}</span>` : ''}
                            ${authorText ? `<span class="meta-author">${authorText}</span>` : ''}
                        </div>
                    ` : ''}
                    <p class="featured-news-description">${newsItem.description}</p>
                    <a href="#" class="read-more-featured" data-id="${newsItem.id}">Читать полностью</a>
                </div>
            </div>
        `;

        // Обработчик клика по главной новости
        const btn = featuredNewsContainer.querySelector('.read-more-featured');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                handleReadMoreClick(e.target.getAttribute('data-id'));
            });
        }
    }

    function displayNews(newsArray) {
        if (!newsContainer) return;
        newsContainer.innerHTML = '';

        if (!newsArray || newsArray.length === 0) {
            newsContainer.innerHTML = '<p style="padding: 20px; color: var(--meta); text-align: center;">Новостей не найдено</p>';
            return;
        }

        newsArray.forEach(newsItem => {
            // --- НОРМАЛИЗАЦИЯ КАТЕГОРИЙ ---
            let rawCategory = (newsItem.category || '').trim();
            let key = rawCategory.toLowerCase();

            if (['государство', 'гос'].includes(key)) key = 'государство';
            else if (['сво'].includes(key)) key = 'сво';
            else if (['общество'].includes(key)) key = 'общество';
            else if (['регионы'].includes(key)) key = 'регионы';
            else if (['происшествия', 'чп'].includes(key)) key = 'происшествия';
            else if (['криминал'].includes(key)) key = 'криминал';
            else if (['политика'].includes(key)) key = 'политика';
            else if (['геополитика'].includes(key)) key = 'геополитика';
            else if (['коррупция'].includes(key)) key = 'коррупция';
            else if (['шоу-бизнес', 'шоу бизнес'].includes(key)) key = 'шоу-бизнес';
            else if (['спорт'].includes(key)) key = 'спорт';
            else if (['наука'].includes(key)) key = 'наука';
            else if (['стиль', 'мода'].includes(key)) key = 'стиль';
            else if (['культура'].includes(key)) key = 'культура';
            else if (['экономика'].includes(key)) key = 'экономика';
            else if (['технологии', 'it', 'tech'].includes(key)) key = 'технологии';
            else if (['мир', 'международное'].includes(key)) key = 'мир';
            else key = 'other';
            // --------------------------------------

            const displayText = rawCategory || 'Разное';
            const finalClass = `category-${key}`;
            const categoryBadge = `<span class="news-category-badge ${finalClass}">${displayText}</span>`;

            const formattedDate = newsItem.date ? formatDate(newsItem.date) : '';
            const authorText = newsItem.author ? `Автор: ${newsItem.author}` : '';
            
            const metaHtml = (formattedDate || authorText) 
                ? `<div class="news-meta">
                      ${formattedDate ? `<span class="meta-date">${formattedDate}</span>` : ''}
                      ${authorText ? `<span class="meta-author">${authorText}</span>` : ''}
                   </div>` 
                : '';

            const imgSrc = newsItem.image || 'https://via.placeholder.com/300x220?text=Нет+фото';

            newsContainer.innerHTML += `
                <div class="news-item">
                    <img src="${imgSrc}" alt="${newsItem.title}" class="news-image">
                    <div class="news-content">
                        ${categoryBadge}
                        <h3 class="news-title">${newsItem.title}</h3>
                        ${metaHtml}
                        <p class="news-description">${newsItem.description}</p>
                        <a href="#" class="read-more" data-id="${newsItem.id}">Читать далее</a>
                    </div>
                </div>
            `;
        });
    }

    // --- ФИЛЬТРАЦИЯ И ПОИСК ---

    if (categoryButtons.length > 0) {
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentCategory = button.getAttribute('data-category') || 'all';
                filterNews();
            });
        });
    }

    function filterNews() {
        const filtered = currentCategory === 'all' 
            ? allNewsData 
            : allNewsData.filter(item => {
                const itemCat = (item.category || '').toLowerCase().trim();
                const filterCat = currentCategory.toLowerCase().trim();

                if (['гос', 'государство'].includes(itemCat) && ['гос', 'государство'].includes(filterCat)) return true;
                return itemCat === filterCat;
            });
        displayNews(filtered);
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            if (query.length > 1) {
                const filtered = allNewsData.filter(item =>
                    item.title.toLowerCase().includes(query) ||
                    (item.description || '').toLowerCase().includes(query)
                );
                displayNews(filtered);
            } else if (query.length === 0) {
                filterNews(); 
            }
        });
    }

    // --- НАВИГАЦИЯ И КНОПКИ ---

    function handleReadMoreClick(newsId) {
        const item = allNewsData.find(i => i.id === newsId);
        if (item) {
            window.location.href = `article.html?id=${newsId}`; 
        } else {
            console.warn('Новость с ID', newsId, 'не найдена');
        }
    }

    if (newsContainer) {
        newsContainer.addEventListener('click', (event) => {
            const target = event.target.closest('.read-more');
            if (target) {
                event.preventDefault();
                const id = target.getAttribute('data-id');
                if(id) handleReadMoreClick(id);
            }
        });
    }

    // --- ПРОГРЕСС-БАР И КНОПКА "НАВЕРХ" ---

    window.addEventListener('scroll', () => {
        if (progressBar) {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            if (height > 0) {
                progressBar.style.width = ((winScroll / height) * 100) + '%';
            }
        }

        if (scrollToTopButton) {
            scrollToTopButton.classList.toggle('hidden', window.scrollY <= 300);
        }
    });

    if (scrollToTopButton) {
        scrollToTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- ТЕМА (СВЕТЛАЯ/ТЕМНАЯ) ---
    const themeToggleBtn = document.querySelector('.theme-toggle');
    
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
        });
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }

    // ============================================================
    // !!! ГЛАВНОЕ ИСПРАВЛЕНИЕ ДЛЯ СКРОЛЛА КАТЕГОРИЙ !!!
    // Вставь этот блок в конец, перед закрывающей скобкой });
    // ============================================================
    
    function fixCategoryScroll() {
        const panel = document.querySelector('.categories-panel');
        
        if (!panel) {
            console.warn('.categories-panel не найден в DOM. Проверь HTML.');
            return;
        }

        panel.addEventListener('wheel', (event) => {
            // Если крутим колесико (deltaY != 0), двигаем панель
            if (event.deltaY !== 0) {
                // Двигаем влево/вправо
                panel.scrollLeft += event.deltaY;
                
                // ВАЖНО: Блокируем прокрутку всей страницы, пока мышь над панелью
                event.preventDefault(); 
            }
        }, { passive: false }); // passive: false обязательно, иначе preventDefault не сработает
    }

    // Запускаем функцию сразу после загрузки DOM
    fixCategoryScroll();

});

