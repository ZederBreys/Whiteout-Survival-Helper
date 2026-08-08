# AUDIT STAGE THEME — Whiteout Survival Ice/Cold Theme

## Изменённые файлы

| Файл | Что изменено |
|------|-------------|
| `src/assets/css/variables.css` | Добавлены `--gradient-page`, `--gradient-card`, `--gradient-card-hover`, `--shadow-card`, `--shadow-card-hover`, `--shadow-accent`, `--shadow-accent-strong`, `--glow-accent`, `--glow-accent-hover` |
| `src/assets/css/typography.css` | `body` — `background: var(--gradient-page)` вместо flat `background-color`; `code` — `background-color: var(--color-bg-hover)` вместо `rgba(255,255,255,0.08)` |
| `src/assets/css/components.css` | `.card` — gradient background + ice hover glow; `.image-card` — gradient + shadow; `.extra-block` — gradient + shadow; `.info-block` — gradient + shadow; `.intro-block` — gradient; `.tip-block` — warning-amber вместо хардкод-оранжевого; `.btn-primary:hover` — accent glow вместо orange shadow; `.heroes-table tr:hover` — ice blue вместо orange |
| `src/assets/css/navigation.css` | `.sidebar ul a.active` — `rgba(56, 189, 248, 0.06)` вместо `rgba(249, 115, 22, 0.06)` |
| `src/assets/css/search.css` | `.search-shortcut` — `var(--color-bg-hover)` + `var(--color-border)` вместо `rgba(255,255,255,...)` |
| `src/assets/css/photoswipe-theme.css` | `--pswp-bg` → `#080f1d`, `--pswp-placeholder-bg` → `#0d1728`, цвета иконок → `#edf7ff` / `#62768c`, error color → `#fb7185` |

## Цветовая система

| Группа | Переменные | Статус |
|--------|-----------|--------|
| Background | `--color-bg-primary` … `--color-bg-active` | Без изменений (уже ice) |
| Borders | `--color-border` … `--color-border-active` | Без изменений (уже ice) |
| Text | `--color-text-primary` … `--color-text-accent` | Без изменений (уже ice) |
| Accent | `--color-accent` … `--color-accent-bright` | Без изменений (уже ice) |
| Accent Secondary | `--color-accent-secondary: #a78bfa` | Без изменений (фиолетовый) |
| Status | `--color-success`, `--color-warning`, `--color-danger` | Без изменений |
| Gradients | `--gradient-page`, `--gradient-card`, `--gradient-card-hover` | **Добавлено** |
| Shadows | `--shadow-card`, `--shadow-card-hover`, `--shadow-accent`, `--shadow-accent-strong` | **Добавлено** |
| Glow | `--glow-accent`, `--glow-accent-hover` | **Добавлено** |

## Компоненты — проверка

| Компонент | Статус | Примечание |
|-----------|--------|-----------|
| body | PASS | `--gradient-page` с radial декоративными кругами |
| header | PASS | `--color-bg-secondary` + ледяной border |
| sidebar | PASS | Активный пункт — ice blue вместо orange |
| mobile nav | PASS | Только цвета через переменные, архитектура без изменений |
| cards (.card) | PASS | Gradient bg, ice border hover, едва заметный glow |
| image-card | PASS | Gradient + shadow |
| info-block | PASS | Gradient + shadow |
| extra-block | PASS | Gradient + shadow + accent left border |
| intro-block | PASS | Gradient + accent left border |
| tip-block | PASS | Warning-amber `rgba(251,191,36,...)` вместо хардкод-orange |
| tables (heroes) | PASS | Row hover — `rgba(56,189,248,0.04)` вместо orange |
| breadcrumbs | PASS | Без изменений (уже используют переменные) |
| prev/next | PASS | Без изменений (уже используют переменные) |
| buttons (.btn-primary) | PASS | Hover glow — `var(--glow-accent)` вместо orange |
| search / Pagefind | PASS | Pagefind CSS vars уже были ice; shortcut обновлён |
| image viewer (PhotoSwipe) | PASS | BG цвета обновлены под ice палитру |
| focus-visible | PASS | `outline: 2px solid var(--color-accent)` без изменений |
| error page (404) | PASS | Gradient text на accent остаётся без изменений |

## Regression

| Проверка | Результат |
|----------|-----------|
| Build (Eleventy) | PASS — 39 files, 0 errors, 0 warnings |
| Pagefind | PASS — 37 pages indexed, 2112 words |
| HTML-структура | PASS — без изменений |
| DataSetW / parser | PASS — без изменений |
| Изображения (eleventy-img) | PASS — без изменений |
| Архитектура | PASS — только CSS, 0 изменений HTML/JS/NJK |

## Что НЕ менялось

- HTML / Nunjucks шаблоны
- DataSetW / parser / scanner / slug
- JavaScript (image-viewer.js, search-shortcut.js, PhotoSwipe)
- Pagefind конфигурация
- `.eleventy.js`
- Структура страниц / permalinks
- Мобильная навигация (архитектура)

## Итог

**STATUS: PASS**

Сайт переведён с flat dark theme на cold ice winter theme. Все хардкод-оранжевые значения заменены на ледяные голубые. Добавлены gradient/shadow/glow переменные для глубины. Архитектура проекта не затронута. Build проходит без ошибок.
