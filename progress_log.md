# Progress

## Phase 3 — Top Navigation

Текущий статус: Phase 3 закрыта и принята оператором. Код собран, установлен в vault, протестирован unit-тестами и ручной проверкой.

Сделано:
- Parser принимает `navigation: preview` для текущего `grid: 1,1`.
- `navigation: plain` использует точки до `10` элементов и переключается в rail mode при большем количестве или нехватке ширины.
- Добавлен чистый helper выбора top navigation layout и маппинга rail pointer position в индекс элемента.
- Добавлен preview mode: горизонтальная полоса миниатюр внутри viewport, клик по миниатюре переключает текущий элемент.
- Колесо/trackpad над preview strip прокручивает миниатюры, а не перелистывает основное изображение.
- Button tooltips автоматически скрываются через `5` секунд после hover/focus и восстанавливаются после mouseleave/blur.
- Исправлен поворот при `view: crop`: для `90`/`270` градусов media box пересчитывается под размеры viewport, поэтому rotated image снова обрезается как crop.
- Добавлена документация [[documentation/phase-3-top-navigation]] и обновлена ссылка в [[documentation/_MOC]].
- Проверки пройдены: `npm test` — 35 тестов, `npm run build` — успешно.
- Собранный плагин обновлён в `/Users/nikita/Documents/Test Vault/.obsidian/plugins/obsidian-gallery`.
- Ручная приемка оператором успешна: tooltip lifetime, preview navigation и rotated crop behavior приняты.

Осталось:
- Сделать commit текущей сессии.
- Перейти к Phase 4 Video.

## Phase 2 — Captions

Текущий статус: Phase 2 закрыта и принята оператором. Код собран, установлен в vault, протестирован unit-тестами и ручной проверкой.

Сделано:
- Добавлено поле настроек `Caption folder` для директории caption-заметок.
- `gallery_captions` больше не выбирается автоматически: это placeholder `Example: gallery_captions`.
- Для настройки папки добавлены подсказки существующих директорий и создание отсутствующей директории при подтверждении поля.
- Добавлены pure helpers для нормализации директории, вычисления caption path и отделения frontmatter от body.
- Caption panel добавлена под кнопками previous/next, во всю ширину галереи, высотой `2 * --og-control-size`.
- `caption` теперь включён по умолчанию; `caption: false` оставляет компактный режим без панели.
- Реализованы чтение существующих caption-заметок, lazy creation после первого ввода, inline editing и Markdown rendering.
- Добавлен ручной binding click/hover для `[[internal links]]` после `MarkdownRenderer.render()`.
- Добавлена кнопка открытия соответствующей caption-заметки.
- Параметры переименованы: `navigation: plain` и `view: crop | fit`; старые `plane`/`fit` временно поддерживаются как aliases.
- `height` разделён на `view_height` и `caption_height`; старый `height` временно работает как alias для `view_height`.
- Уплотнены line-height и верхний padding в caption panel.
- Кнопочные tooltips приведены к коротким lowercase-формулировкам.
- Кнопка открытия caption-заметки теперь появляется только при hover/focus в зоне подписи и доступна даже на `_insert caption_`.
- Удалён лишний `title`, из-за которого кнопочные подсказки отображались дважды.
- Fullscreen-кнопка перенесена в viewport, стала hover-only и получила прозрачный стиль с символом `⛶`.
- Добавлена hover-only кнопка поворота медиа по часовой стрелке; угол сохраняется в `rotation` frontmatter caption-заметки.
- Caption panel доведена до компактного режима: rendered Markdown использует нормальный whitespace, editing сохраняет `pre-wrap`, межстрочный интервал принят оператором.
- Markdown-заголовки в caption panel сохраняют размеры темы Obsidian при компактных отступах.
- Верхняя plain-навигация перенесена внутрь viewport, стала hover-only и не загромождает демонстрационное поле.
- Добавлен adaptive rail mode; в Phase 3 порог переключения обновлён до `10` элементов.
- Активный элемент навигации отображается коротким серым овалом; точки однотонные, без обводки.
- Добавлена документация [[documentation/phase-2-captions]].
- Добавлена заметка для будущей статьи о сложностях rendered captions: [[documentation/caption-rendering-case-study]].
- Проверки пройдены: `npm test` — 30 тестов, `npm run build` — успешно.

Осталось:
- Phase 2 закрыта; дальнейшие изменения ведутся в Phase 3.

## Phase 1 — MVP Image Gallery

Текущий статус: Phase 1 MVP и slider polishing завершены и приняты оператором. Код собран, установлен в vault, протестирован unit-тестами. Последняя сессия готовится к commit.

Сделано:
- Создан канонический план: [[plan]].
- Зафиксирована архитектурная линия: [[documentation/architecture]].
- Создана документационная карта: [[documentation/_MOC]].
- Созданы базовые директории `documentation/`, `src/`, `log/`.
- В архитектуре Phase 2 учтён нюанс Obsidian: после `MarkdownRenderer.render()` нужно вручную подключать click и hover preview для `a.internal-link` в caption panel.
- План принят оператором; черновик `plane.md` больше не нужен.
- Для Phase 1 принято: `dir` сканируется рекурсивно, `dir + list` сортируются как единое множество.
- Создан scaffold Obsidian Sample Plugin: `manifest.json`, `package.json`, `tsconfig.json`, `esbuild.config.mjs`, `styles.css`, `src/main.ts`.
- Реализованы Phase 1 модули: parser, media resolver, Obsidian vault adapter, gallery state, DOM renderer.
- Добавлена документация MVP: [[documentation/phase-1-mvp]].
- Добавлены unit-тесты для parser/media/state.
- Проверки пройдены: `npm test` — 11 тестов, `npm run build` — успешно.
- Собранный плагин перенесён в `/Users/nikita/Documents/Test Vault/.obsidian/plugins/obsidian-gallery`.
- Создан приватный GitHub-репозиторий: https://github.com/PolinaSkr/obsidian-gallery.
- Коммит `[Phase 1] initial MVP plugin scaffold` успешно отправлен в `main`.
- Сессия принята оператором: тестирование и commit прошли успешно.
- Выполнен Phase 1 slider polishing:
  - добавлен `fit: cover | contain`;
  - добавлен forward-compatible параметр `caption: true | false`;
  - навигационные кнопки вынесены в нижнюю полосу под viewport;
  - добавлена компактная fullscreen-кнопка;
  - добавана wheel/trackpad навигация после клика по галерее;
  - обновлена документация [[documentation/phase-1-mvp]].
- Keyboard navigation стрелками протестирована несколькими подходами, но отложена до Phase 6 accessibility pass; подробности: [[documentation/keyboard-navigation-backlog]].
- Проверки последней сессии пройдены: `npm test` — 12 тестов, `npm run build` — успешно.

Осталось:
- Сделать commit текущей сессии.
- Перейти к Phase 2 Captions.

Вопросы:
- Нужно ли для `sort: created|modified` сортировать по возрастанию или удобнее по убыванию для пользовательских галерей?

# Log

## Phase 3 — Top Navigation

### 2026-05-27 20:21 — Phase 3 Top Navigation

Сессия завершена результативно: реализованы preview thumbnails, plain dots/rail threshold, авто-скрытие button tooltips и корректный `view: crop` после поворота. Phase 3 принята оператором. Подробности: [[log/2026-05-27_20-21_phase-3-top-navigation]].

## Phase 2 — Captions

### 2026-05-27 00:48 — Phase 2 Hardening and Close

Сессия завершена результативно: уплотнён rendered caption, сохранена иерархия Markdown-заголовков, top navigation стала hover-only и получила rail mode для длинных галерей. Phase 2 закрыта оператором; заметка для будущей статьи: [[documentation/caption-rendering-case-study]]. Подробности: [[log/2026-05-27_00-48_phase-2-hardening-and-close]].

### 2026-05-26 21:42 — Phase 2 Captions Foundation

Сессия завершена результативно: добавлены настройки директории caption-заметок, lazy creation, inline editing, Markdown rendering, hover/click для internal links, отдельные высоты viewport/caption, fullscreen и rotation controls. Подробности: [[log/2026-05-26_21-42_phase-2-captions-foundation]].

## Phase 1 — MVP Image Gallery

### 2026-05-25 23:31 — Phase 1 Slider Polishing

Сессия завершена результативно: добавлены параметры `fit` и `caption`, обновлён внешний вид слайдера, навигационные кнопки перенесены под viewport, keyboard navigation задокументирована как отложенный accessibility backlog. Подробности: [[log/2026-05-25_23-31_phase-1-slider-polishing]].

### 2026-05-25 18:18 — Phase 1 MVP Foundation

Сессия завершена результативно: создан и протестирован MVP-каркас плагина, выполнена сборка, установка в vault, первый commit и публикация в приватный GitHub-репозиторий. Подробности: [[log/2026-05-25_18-18_phase-1-mvp-foundation]].
