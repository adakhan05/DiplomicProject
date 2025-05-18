Дипломная работа

JobSearch — Веб-сервис для поиска работы

Веб-приложение на Django + Vue.js, предоставляющее функциональность поиска и публикации вакансий, управления резюме, чата между работодателями и соискателями.

Основные возможности
Регистрация и аутентификация пользователей (JWT)
Два типа пользователей: соискатели и работодатели
Создание и управление вакансиями
Создание и управление резюме
Поиск вакансий
Сохранение понравившихся вакансий
Отклик на вакансии
Чат в реальном времени между работодателями и соискателями (WebSockets)
Управление статусами заявок на вакансии
Технологии
Backend
Django 5.0.1 + Django REST Framework
PostgreSQL — для хранения данных
Channels + Daphne — для WebSocket соединений
JWT — для аутентификации
Frontend
Vue.js + Vite — основной фреймворк
Pinia — управление состоянием
Tailwind CSS — стилизация
Axios — HTTP запросы
Запуск проекта
Предварительные требования
Python 3.8+
Node.js и npm
PostgreSQL
Настройка базы данных
Запуск backend
Создание и активация виртуального окружения
python -m venv venv

Windows:
venv\Scripts\activate

Linux/Mac:
source venv/bin/activate

Установка зависимостей
cd project pip install -r requirements.txt

Создание .env файла
Создайте файл .env в директории project/ со следующим содержимым:
SECRET_KEY=ключ DEBUG=True ALLOWED_HOSTS=localhost,127.0.0.1

Применение миграций
python manage.py migrate

Запуск Django сервера
python manage.py runserver

Запуск frontend
В директории project/
npm install npm run dev

Доступ к приложению
Откройте браузер и перейдите по адресу: http://localhost:5173

Структура проекта
jobsearch/ — основной Django проект
users/ — приложение для пользователей и резюме
jobs/ — приложение для вакансий, заявок и чата
src/ — Vue.js приложение:
views/ — страницы приложения
components/ — компоненты интерфейса
stores/ — Pinia хранилища состояния
router/ — маршрутизация Vue Router
