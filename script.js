console.log('Скрипт запустился');

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

    // --- 1. ЗАГРУЗКА НОВОСТЕЙ ---
    fetch('news.json')
        .then(response => {
            if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);
            return response.json();
        })
        .then(data => {
            allNewsData = data.items || []; 

            // Показываем главную новость
            if (data.featuredNewsId && allNewsData.length > 0) {
                const featuredNews = allNewsData.find(item => item.id === data.featuredNewsId);
                if (featuredNews) {
                    displayFeaturedNews(featuredNews);
                }
            }

            // Показываем список новостей
            displayNews(allNewsData);

            // Скрываем лоадер
            if (loader) {
                loader.style.display = 'none'; 
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки новостей:', error);
            if (loader) {
                loader.textContent = 'Не удалось загрузить новости. Проверьте консоль.';
                loader.style.display = 'block'; 
            }
        });

    // --- ФУНКЦИИ ОТРИСОВКИ ---

    function displayFeaturedNews(newsItem) {
        if (!featuredNewsContainer) return;

        // Безопасное получение картинки
        const imgSrc = newsItem.image ? newsItem.image : 'https://via.placeholder.com/600x400?text=Нет+фото';

        featuredNewsContainer.style.display = 'block';
        featuredNewsContainer.innerHTML = `
            <div class="featured-news-card">
                <img src="${imgSrc}" alt="${newsItem.title}" class="featured-news-image">
                <div class="featured-news-content">
                    <h2 class="featured-news-title">${newsItem.title}</h2>
                    ${newsItem.date ? `<p class="featured-news-date">${formatDate(newsItem.date)}</p>` : ''}
                    <p class="featured-news-description">${newsItem.description}</p>
                    <a href="#" class="read-more-featured" data-id="${newsItem.id}">Читать полностью</a>
                </div>
            </div>
        `;

        const readMoreFeatured = featuredNewsContainer.querySelector('.read-more-featured');
        if (readMoreFeatured) {
            readMoreFeatured.addEventListener('click', (e) => {
                e.preventDefault();
                handleReadMoreClick(e.target.getAttribute('data-id'));
            });
        }
    }

    function formatDate(dateString) {
        try {
            return new Date(dateString).toLocaleDateString('ru-RU', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        } catch (e) {
            return dateString; 
        }
    }

    function displayNews(newsArray) {
        if (!newsContainer) return;

        newsContainer.innerHTML = ''; 
        
        if (!newsArray || newsArray.length === 0) {
            newsContainer.innerHTML = '<p style="padding: 20px; color: var(--meta);">Новостей не найдено.</p>';
            return;
        }

        // Словарь для перевода русских категорий в английские (для цветов)
        const categoryMap = {
            'спорт': 'sport',
            'политика': 'politics',
            'экономика': 'economy',
            'технологии': 'tech',
            'культура': 'culture',
            'наука': 'science',
            'мир': 'world',
            'сво': 'svo', 
            'общество': 'society',
            'регионы': 'regions',
            'гос': 'state',
            'геополитика': 'geopolitics',
            'криминал': 'crime',
            'коррупция': 'corruption',
            'стиль': 'style',
            'происшествия': 'incidents',
            'шоу-бизнес': 'showbiz'
        };

        newsArray.forEach(newsItem => {
            // 1. Форматируем дату
            const formattedDate = newsItem.date ? formatDate(newsItem.date) : '';

            // 2. Логика категорий и цветов
            let rawCategory = newsItem.category || '';
            let displayText = rawCategory; 
            
            // Если категории нет вообще, ставим нейтральное значение
            if (!rawCategory || rawCategory.trim() === '') {
                displayText = 'Разное';
            }

            const key = rawCategory.toLowerCase().trim();
            const colorClass = categoryMap[key] || 'other'; // Если нет в словаре -> other
            const finalClass = `category-${colorClass}`;

            // 3. Обработка картинки (защита от битых ссылок)
            const imgSrc = newsItem.image ? newsItem.image : 'https://via.placeholder.com/400x250?text=Нет+фото';

            // Создаем элемент карточки
            const newsElement = document.createElement('div');
            newsElement.classList.add('news-card'); // ВАЖНО: этот класс имеет position: relative в CSS
            
            if (rawCategory) {
                newsElement.setAttribute('data-category', rawCategory);
            }

            newsElement.innerHTML = `
                <!-- Бейдж: класс category-color определяет цвет, текст остается русским -->
                <span class="news-category-badge ${finalClass}">${displayText}</span>
                
                <img src="${imgSrc}" alt="${newsItem.title}" class="news-image">
                
                <div class="news-content">
                    <h3 class="news-title">${newsItem.title}</h3>
                    ${formattedDate ? `<p class="news-date">${formattedDate}</p>` : ''}
                    <p class="news-description">${newsItem.description}</p>
                    <a href="#" class="read-more" data-id="${newsItem.id}">Читать далее</a>
                </div>
            `;
            
            newsContainer.appendChild(newsElement);
        });
    }

    // --- ФИЛЬТРАЦИЯ И ПОИСК ---
    if (categoryButtons.length > 0) {
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentCategory = button.getAttribute('data-category');
                filterNews();
            });
        });
    }

    function filterNews() {
        const filtered = currentCategory === 'all' 
            ? allNewsData 
            : allNewsData.filter(item => (item.category || '').toLowerCase() === currentCategory.toLowerCase());
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

    // --- ОБРАБОТКА КЛИКА НА "ЧИТАТЬ ДАЛЕЕ" ---
    function handleReadMoreClick(newsId) {
        const item = allNewsData.find(i => i.id === newsId);
        if (item) {
            window.location.href = `${newsId}.html`;
        } else {
            alert('Новость не найдена в текущем списке данных.');
        }
    }

    // Глобальный слушатель для кнопок "Читать далее" внутри контейнера
    if (newsContainer) { 
        newsContainer.addEventListener('click', (event) => {
            const target = event.target.closest('.read-more');
            if (target) {
                event.preventDefault(); 
                handleReadMoreClick(target.getAttribute('data-id'));
            }
        });
    }

    // --- ПРОКРУТКА И ПРОГРЕСС-БАР ---
    
    window.addEventListener('scroll', () => {
        progressBarScroll();
        
        // Логика кнопки "Наверх"
        if (scrollToTopButton) {
            if (window.scrollY > 300) {
                scrollToTopButton.classList.add('visible');
            } else {
                scrollToTopButton.classList.remove('visible');
            }
        }
    });

    function progressBarScroll() {
        if (!progressBar) return;
        
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        
        if (height > 0) {
            progressBar.style.width = ((winScroll / height) * 100) + '%';
        }
    }

    if (scrollToTopButton) {
        scrollToTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // --- ПЕРЕКЛЮЧЕНИЕ ТЕМЫ ---
    const themeToggleBtn = document.querySelector('.theme-toggle');
    
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            
            if (document.body.classList.contains('dark-theme')) {
                localStorage.setItem('theme', 'dark');
            } else {
                localStorage.removeItem('theme');
            }
        });
    }

    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme'); 
    }
});
// --- СКРОЛЛ КАТЕГОРИЙ КОЛЕСИКОМ МЫШКИ ---
const categoriesPanel = document.querySelector('.categories-panel');

if (categoriesPanel) {
    categoriesPanel.addEventListener('wheel', (event) => {
        if (event.target.closest('.categories-panel')) {
            event.preventDefault(); // Останавливаем скролл страницы
            
            const scrollAmount = event.deltaY;
            const currentScroll = categoriesPanel.scrollLeft;
            const maxScroll = categoriesPanel.scrollWidth - categoriesPanel.clientWidth;

            // Вычисляем новую позицию
            let newScroll = currentScroll + scrollAmount;

            // Логика "доскроллить до конца": если мы почти уперлись, едем точно в конец
            if (newScroll >= maxScroll - 10) { 
                newScroll = maxScroll;
            } else if (newScroll <= 10) {
                newScroll = 0;
            }

            categoriesPanel.scrollTo({
                left: newScroll,
                behavior: 'smooth'
            });
        }
    });
}
