document.addEventListener('DOMContentLoaded', () => {
    const newsContainer = document.getElementById('news-container');
    const loader = document.getElementById('loader');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const searchInput = document.getElementById('searchInput');
    const searchResultsContainer = document.getElementById('search-results');
    const featuredNewsContainer = document.getElementById('main-news');
    const progressBar = document.getElementById('progress-bar');
    const scrollToTopButton = document.getElementById('scrollToTop');

    let allNewsData = []; // Для хранения всех новостей
    let currentCategory = 'all'; // Текущая выбранная категория

    // --- Загрузка данных из JSON ---
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            allNewsData = data.items; // Сохраняем все новости
            // Отображаем сначала "главную" новость, если она есть
            if (data.featuredNewsId && allNewsData.length > 0) {
                const featuredNews = allNewsData.find(item => item.id === data.featuredNewsId);
                if (featuredNews) {
                    displayFeaturedNews(featuredNews);
                }
            }
            // Отображаем все новости по умолчанию
            displayNews(allNewsData);
            loader.style.display = 'none'; // Скрыть индикатор загрузки
        })
        .catch(error => {
            console.error('Ошибка при загрузке новостей:', error);
            loader.textContent = 'Не удалось загрузить новости. Попробуйте позже.';
        });

    // --- Функция отображения главной новости ---
    function displayFeaturedNews(newsItem) {
        featuredNewsContainer.style.display = 'block'; // Показать блок для главной новости
        featuredNewsContainer.innerHTML = `
            <div class="featured-news-card">
                <img src="${newsItem.image}" alt="${newsItem.title}" class="featured-news-image">
                <div class="featured-news-content">
                    <h2 class="featured-news-title">${newsItem.title}</h2>
                    <p class="featured-news-date">${newsItem.date}</p>
                    <p class="featured-news-description">${newsItem.description}</p>
                    <a href="#" class="read-more-featured">Читать полностью</a>
                </div>
            </div>
        `;
        // Можно добавить обработчик для кнопки "Читать полностью"
        featuredNewsContainer.querySelector('.read-more-featured').addEventListener('click', (e) => {
            e.preventDefault();
            // Логика для перехода к полной статье или открытия модального окна
            alert('Переход к полной статье: ' + newsItem.title);
        });
    }

    // --- Функция отображения списка новостей ---
    function displayNews(newsArray) {
        newsContainer.innerHTML = ''; // Очищаем контейнер перед добавлением новых новостей

        if (!newsArray || newsArray.length === 0) {
            newsContainer.innerHTML = '<p>Новостей по данной категории не найдено.</p>';
            return;
        }

        newsArray.forEach(newsItem => {
            const newsElement = document.createElement('div');
            newsElement.classList.add('news-item'); // Класс для стилизации карточки

            // Форматирование даты (пример, можно улучшить)
            const formattedDate = new Date(newsItem.date).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            newsElement.innerHTML = `
                <div class="news-card">
                    <img src="${newsItem.image}" alt="${newsItem.title}" class="news-image">
                    <div class="news-content">
                        <h3 class="news-title">${newsItem.title}</h3>
                        <p class="news-date">${formattedDate}</p>
                        <p class="news-description">${newsItem.description}</p>
                        <a href="#" class="read-more" data-id="${newsItem.id}">Читать далее</a>
                    </div>
                </div>
            `;
            newsContainer.appendChild(newsElement);
        });
    }

    // --- Фильтрация по категориям ---
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Снимаем класс 'active' со всех кнопок
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            // Добавляем класс 'active' к нажатой кнопке
            button.classList.add('active');

            currentCategory = button.getAttribute('data-category');
            filterNews();
        });
    });

    // --- Функция фильтрации новостей ---
    function filterNews() {
        let filteredNews = [];
        if (currentCategory === 'all') {
            filteredNews = allNewsData;
        } else {
            filteredNews = allNewsData.filter(item => item.category === currentCategory);
        }
        displayNews(filteredNews);
    }

    // --- Поиск (базовая реализация) ---
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        if (query.length > 1) { // Начинаем поиск после ввода 2 символов
            const filteredNews = allNewsData.filter(item =>
                item.title.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query) ||
                item.content.toLowerCase().includes(query) ||
                item.tags.some(tag => tag.toLowerCase().includes(query))
            );
            // Пока просто отображаем найденные новости в общем контейнере
            // Для полноценного поиска может потребоваться отдельный блок результатов
            displayNews(filteredNews);
        } else if (query.length === 0) {
            // Если поле поиска пустое, отображаем новости текущей категории
            filterNews();
        }
    });

    // --- Прокрутка наверх ---
    window.onscroll = function() {
        scrollFunction();
        progressBarScroll();
    };

    function scrollFunction() {
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            scrollToTopButton.style.display = "block";
        } else {
            scrollToTopButton.style.display = "none";
        }
    }

    function scrollToTop() {
        document.body.scrollTop = 0; // Для Safari
        document.documentElement.scrollTop = 0; // Для Chrome, Firefox, IE и Opera
    }

    // --- Индикатор прогресса прокрутки ---
    function progressBarScroll() {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
    }

    // --- Переключение темы (пример, требует реализации в CSS) ---
    // Предполагается, что у вас есть функция toggleTheme() в другом скрипте или здесь
    // window.toggleTheme = function() { ... }
    // Для примера, добавим простую логику:
    const themeToggleBtn = document.querySelector('.theme-toggle');
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        // Здесь можно добавить сохранение темы в localStorage
    });

    // --- Обработка кликов по ссылкам "Читать далее" ---
    newsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('read-more')) {
            event.preventDefault();
            const newsId = event.target.getAttribute('data-id');
            // Здесь можно реализовать:
            // 1. Поиск новости по newsId в allNewsData
            // 2. Отображение полной статьи (например, в модальном окне или переход на другую страницу)
            const selectedNews = allNewsData.find(item => item.id === newsId);
            if (selectedNews) {
                alert(`Вы кликнули по новости: ${selectedNews.title}\nID: ${selectedNews.id}`);
                // Пример: displayFullArticle(selectedNews);
            }
        }
    });

    // --- Инициализация при загрузке ---
    // (Загрузка данных уже происходит выше)
});

// --- Пример функции toggleTheme, если она не подключена отдельно ---
// Если у вас есть отдельный скрипт для темы, эту функцию можно удалить
if (typeof toggleTheme === 'undefined') {
    window.toggleTheme = () => {
        document.body.classList.toggle('dark-theme');
        // Можно добавить сохранение темы в localStorage
        if (document.body.classList.contains('dark-theme')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    };
    // При загрузке страницы проверяем сохраненную тему
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
}