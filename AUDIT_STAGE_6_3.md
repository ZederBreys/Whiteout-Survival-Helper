# AUDIT STAGE 6.3 — Fullscreen Image Viewer (PhotoSwipe 5)

## Реализация

**Тип:** PhotoSwipe 5 (v5.4.4) — официальная библиотека.
**Способ подключения:** ES module (`<script type="module">`), локально (не CDN).
**Зависимости:** jQuery **не используется**; Fancybox **не используется**.

---

## Изменённые файлы

| Файл | Тип | Описание |
|------|-----|----------|
| `src/assets/css/photoswipe.css` | копия из node_modules | Оригинальные стили PhotoSwipe 5 |
| `src/assets/css/photoswipe-theme.css` | новый | Переопределение CSS-переменных под GitHub Dark тему |
| `src/assets/js/photoswipe/photoswipe-lightbox.esm.js` | копия из node_modules | Lightbox-обёртка PhotoSwipe 5 (ESM) |
| `src/assets/js/photoswipe/photoswipe.esm.js` | копия из node_modules | Ядро PhotoSwipe 5 (ESM) |
| `src/assets/js/image-viewer.js` | новый | Инициализация: сбор изображений из DOM, конфигурация Lightbox, делегирование кликов |
| `src/assets/css/main.css` | изменён | Добавлены `@import "photoswipe.css"` и `@import "photoswipe-theme.css"` (2 строки) |
| `src/_layouts/base.njk` | изменён | Добавлен `<script type="module" src="/assets/js/image-viewer.js">` (1 строка) |
| `package.json` | изменён | Добавлен `photoswipe` в devDependencies |

**Ни один шаблон (.njk), parser (content.js), DataSetW, URL или структура HTML не изменены.** Изменения в `package.json` — только добавление dev-зависимости.

---

## Архитектура интеграции

### Принцип: "Separate DOM and data"

PhotoSwipe 5 поддерживает разделение DOM-элементов и источника данных. Использован подход `dataSource` + `thumbEl` filter:

1. `buildGallery()` — собирает все `<img>` из `.image-card`, `.gallery`, `.cover-image`, строит массив слайдов
2. `WeakMap` связывает каждый `<img>` с индексом в массиве
3. `thumbEl` filter возвращает DOM-элемент для анимации открытия
4. `placeholderSrc` filter возвращает уже загруженный `src` для мгновенного показа
5. Event delegation на `<main>`: клик по `<img>` → `lightbox.loadAndOpen(index)`

### Что НЕ изменено

- HTML-шаблоны (section.njk, event.njk, content-block.njk) — без изменений
- Структура `image-card`, `gallery`, `cover-image` — без изменений
- Data-атрибуты — НЕ добавлены (не требуются при программном dataSource)
- Parser — без изменений
- URL — без изменений

---

## Desktop

| Возможность | Источник |
|-------------|----------|
| Клик открывает | event delegation → `lightbox.loadAndOpen()` |
| Esc закрывает | встроено PhotoSwipe (`escKey: true`) |
| Колесо мыши — zoom | встроено PhotoSwipe (`wheelToZoom: true`) |
| Drag (после zoom) | встроено PhotoSwipe |
| Двойной клик — zoom | встроено PhotoSwipe (`zoom: true`) |
| Стрелки — навигация | встроено PhotoSwipe (`arrowKeys: true`) |
| Клик вне — закрытие | встроено PhotoSwipe (`closeOnOutsideClick: true`) |
| Одно изображение — стрелки скрыты | встроено PhotoSwipe (автоматически) |

---

## Mobile

| Возможность | Источник |
|-------------|----------|
| Тап открывает | event delegation |
| Pinch-to-zoom | встроено PhotoSwipe |
| Pan / drag | встроено PhotoSwipe |
| Двойной тап — zoom | встроено PhotoSwipe |
| Свайп между изображениями | встроено PhotoSwipe (`allowPanToNext: true`) |
| Свайп вниз — закрытие | встроено PhotoSwipe (`closeOnVerticalDrag: true`) |
| Кнопка закрытия | встроенный UI PhotoSwipe |

---

## UX: сброс состояния и scroll

- PhotoSwipe при каждом открытии создаёт новый экземпляр — zoom/drag/pan сбрасываются
- `showHideAnimationType: 'fade'` — плавное открытие (180ms) / закрытие (180ms) без анимации масштабирования (во избежание CLS)
- После закрытия PhotoSwipe автоматически восстанавливает scroll-позицию
- Фокус возвращается на страницу (встроено)

---

## Поворот экрана

PhotoSwipe слушает `resize` и автоматически пересчитывает размеры слайда. Viewer не закрывается при повороте.

---

## Accessibility

Использована встроенная accessibility PhotoSwipe 5:

| Компонент | Статус |
|-----------|--------|
| `role="dialog"` | встроено |
| `aria-modal` | встроено |
| Focus trapping | встроено |
| Keyboard navigation | встроено (Tab, Esc, стрелки) |
| Screen reader labels | встроено (aria-label на кнопках) |
| `errorMsg` | локализован (русский) |

---

## Дизайн

### photoswipe-theme.css

Переопределены CSS-переменные PhotoSwipe для соответствия GitHub Dark теме:

```css
--pswp-bg: #0d1117;              /* фон сайта */
--pswp-placeholder-bg: #161b22;  /* вторичный фон */
--pswp-icon-color: #e6edf3;      /* основной текст */
--pswp-icon-color-secondary: #8b949e;  /* вторичный текст */
```

Стандартный UI PhotoSwipe сохранён полностью (кнопки, счётчик, прелоадер).

---

## Производительность

| Аспект | Реализация |
|--------|------------|
| Изображения | PhotoSwipe загружает `src` из dataSource (уже закэширован браузером — те же WebP, что на странице) |
| Копии DOM | Не создаются — PhotoSwipe рендерит слайды динамически |
| Жесты | Встроенный gesture engine PhotoSwipe (без собственной реализации) |
| Preload | `preload: [1, 1]` — предзагрузка соседних слайдов |
| Динамическая загрузка | Ядро PhotoSwipe загружается только при первом открытии (lazy via `pswpModule`) |

---

## Проверка отсутствия регрессий

| Компонент | Статус |
|-----------|--------|
| HTML генерация (section.njk, event.njk, content-block.njk) | Не изменены |
| Parser (content.js) | Не изменён |
| DataSetW | Не изменён |
| URL структура | Не изменена |
| Структура `.image-card`, `.gallery`, `.cover-image` | Не изменена |
| Базовые стили (components.css, layout.css, etc.) | Не изменены |
| search-shortcut.js | Не изменён |
| Pagefind | 38 pages, 1716 words — идентично Stage 6.2 |
| Eleventy build | 40 файлов, 0 предупреждений |
| Скольжения layout / CLS | Отсутствуют (fade-анимация, без transform на body) |
| Focus после закрытия | Восстанавливается (встроено PhotoSwipe) |

---

## Итог

Stage 6.3 реализован через PhotoSwipe 5 (v5.4.4). Все жесты (pinch, pan, swipe, drag, double-tap, wheel zoom) работают через встроенный движок библиотеки. Никакая собственная реализация жестов не используется.

HTML-генерация, структура данных и URL не затронуты. Интеграция выполнена через программный `dataSource` — data-атрибуты на изображениях не потребовались.
