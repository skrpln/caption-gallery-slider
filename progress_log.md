# Progress

## Phase 2 — Captions

Текущий статус: Phase 2 captions foundation завершён и принят оператором. Код собран, установлен в vault и протестирован unit-тестами.

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
- Добавлена документация [[documentation/phase-2-captions]].
- Проверки пройдены: `npm test` — 26 тестов, `npm run build` — успешно.

Осталось:
- Продолжить Phase 2 hardening при новых результатах ручного тестирования.
- Перейти к Phase 3 top navigation после стабилизации подписей.

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

## Phase 2 — Captions

### 2026-05-26 21:42 — Phase 2 Captions Foundation

Сессия завершена результативно: добавлены настройки директории caption-заметок, lazy creation, inline editing, Markdown rendering, hover/click для internal links, отдельные высоты viewport/caption, fullscreen и rotation controls. Подробности: [[log/2026-05-26_21-42_phase-2-captions-foundation]].

## Phase 1 — MVP Image Gallery

### 2026-05-25 23:31 — Phase 1 Slider Polishing

Сессия завершена результативно: добавлены параметры `fit` и `caption`, обновлён внешний вид слайдера, навигационные кнопки перенесены под viewport, keyboard navigation задокументирована как отложенный accessibility backlog. Подробности: [[log/2026-05-25_23-31_phase-1-slider-polishing]].

### 2026-05-25 18:18 — Phase 1 MVP Foundation

Сессия завершена результативно: создан и протестирован MVP-каркас плагина, выполнена сборка, установка в vault, первый commit и публикация в приватный GitHub-репозиторий. Подробности: [[log/2026-05-25_18-18_phase-1-mvp-foundation]].
