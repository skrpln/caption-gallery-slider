# Progress

## Phase 5 — Grid and Fullscreen

Текущий статус: Phase 5 начата с hardening keyboard navigation перед grid/fullscreen работами. Keyboard navigation стрелками принята оператором после перехода на plugin-level active gallery target. Remote media sources вынесены в отдельный backlog-дизайн для будущей реализации.

Сделано:
- Изучен Media Slider как референс для keyboard navigation в Obsidian.
- Удалена хрупкая renderer-local схема keyboard handling через `Scope`, window/document capture и принудительный DOM focus.
- Добавлен plugin-level active gallery target:
  - `src/main.ts` хранит активную галерею и владеет единым `document` `keydown` handler;
  - `src/render/GalleryRenderer.ts` сообщает активность через `activateKeyboardTarget(this)`;
  - активная зона — весь widget root, включая viewport, top navigation, стрелки, video controls и caption shell;
  - caption editing блокирует перехват стрелок;
  - fullscreen продолжает принимать стрелки через `canHandleKeyboard()`.
- Добавлен pure contract/helper `src/render/keyboardNavigation.ts` и unit-тесты `src/render/keyboardNavigation.test.ts`.
- Обновлена документация [[documentation/keyboard-navigation-backlog]].
- Добавлена архитектурная backlog-заметка [[documentation/remote-media-sources]] для будущей поддержки прямых remote image/video URLs, YouTube links и allowlisted embeds.
- Обновлены [[documentation/_MOC]] и [[plan]].
- Проверки пройдены: `npm test` — 54 теста, `npm run build` — успешно, `git diff --check` — без замечаний.
- Собранный плагин обновлён в `/Users/nikita/Documents/Test Vault/.obsidian/plugins/obsidian-gallery`.
- Ручная приемка оператором успешна: keyboard navigation работает корректно после hover и click.

Осталось:
- Продолжить Phase 5 Grid and Fullscreen: `grid`, paging группами, group captions, click-to-caption и fullscreen polish.
- Remote media sources реализовывать позднее по [[documentation/remote-media-sources]].

## Phase 4 — Video

Текущий статус: Phase 4 закрыта и принята оператором. После закрытия выполнена дополнительная UI-полировка размера виджета и tooltip behavior; код собран, установлен в vault, протестирован unit-тестами и ручной проверкой.

Сделано:
- Видео-форматы `mp4`, `avi`, `mov`, `webm` включены в общий media resolver вместе с изображениями.
- Renderer создаёт `<video>` для video items и ставит текущее видео на паузу при уходе со слайда.
- Добавлены минимальные video controls: play / pause, mute / unmute, loop и progress rail.
- Playback state `autoplay`, `muted`, `loop` читается и сохраняется в caption frontmatter через тот же lazy caption path.
- `navigation: preview` для видео показывает metadata-preloaded thumbnail с первым кадром и play-marker поверх него.
- Video progress заменён с native `<input type="range">` на кастомный DOM rail с thumb того же размера и формы, что верхний navigation rail.
- Клик по свободной области видео переключает play / pause; clicks по кнопкам, верхней навигации и progress rail не дублируют это действие.
- Hover/focus подсветка кнопок `fullscreen`, `play/pause`, `mute`, `loop`, `rotate` приведена к единому translucent blur style.
- Узкий layout video controls переносит progress rail на вторую строку, оставляя video-кнопки первым рядом.
- Кнопка rotate осталась отдельной hover-only кнопкой в правом нижнем углу viewport.
- Добавлена документация [[documentation/phase-4-video]]; обновлены [[documentation/_MOC]] и [[documentation/phase-3-top-navigation]].
- Проверки пройдены: `npm test` — 44 теста, `npm run build` — успешно, `git diff --check` — без замечаний.
- Собранный плагин обновлён в `/Users/nikita/Documents/Test Vault/.obsidian/plugins/obsidian-gallery`.
- Ручная приемка оператором успешна: проверены `mp4` и `mov`, video controls, preview thumbnails, progress rail, click-to-play и responsive перенос controls.
- Добавлены resize-зоны для настройки размера виджета: верхняя граница viewport сохраняет `view_height`, нижняя граница caption panel сохраняет `caption_height`.
- Добавлен pure-helper `src/parser/galleryBlockEditor.ts` для обновления size-параметров в исходном `gallery` code block и unit-тесты для него.
- Ряд preview thumbnails поднят до горизонтали верхней границы кнопок `fullscreen` и `</>`.
- Убраны tooltip-подписи с viewport, video media, preview thumbnails, dots и верхнего rail; caption tooltips переименованы в `caption` и `caption note`.
- Добавлена документация [[documentation/widget-size-controls]]; обновлены [[documentation/_MOC]] и [[documentation/phase-3-top-navigation]].
- Проверки последней сессии пройдены: `npm test` — 49 тестов, `npm run build` — успешно, `git diff --check` — без замечаний.
- Собранный плагин повторно обновлён в `/Users/nikita/Documents/Test Vault/.obsidian/plugins/obsidian-gallery`.
- Ручная приемка оператором успешна: сессия настройки размеров и tooltip polish признана результативной.

Осталось:
- Перейти к Phase 5 Grid and Fullscreen.

## Phase 3 — Top Navigation

Текущий статус: Phase 3 закрыта и принята оператором. Код собран, установлен в vault, протестирован unit-тестами и ручной проверкой.

Сделано:
- Parser принимает `navigation: preview` для текущего `grid: 1,1`.
- `navigation: plain` использует точки до `10` элементов и переключается в rail mode при большем количестве или нехватке ширины.
- Добавлен чистый helper выбора top navigation layout и маппинга rail pointer position в индекс элемента.
- Добавлен preview mode: горизонтальная полоса миниатюр внутри viewport, клик по миниатюре переключает текущий элемент.
- Колесо/trackpad над preview strip прокручивает миниатюры, а не перелистывает основное изображение.
- Gallery tooltips автоматически скрываются через `5` секунд после hover/focus и восстанавливаются после mouseleave/blur; для Obsidian-native tooltip popover добавлены CSS lifetime и fallback-закрытие уже открытой подсказки.
- Исправлен поворот при `view: crop`: для `90`/`270` градусов media box пересчитывается под размеры viewport, поэтому rotated image снова обрезается как crop.
- Добавлена документация [[documentation/phase-3-top-navigation]] и обновлена ссылка в [[documentation/_MOC]].
- Проверки пройдены: `npm test` — 40 тестов, `npm run build` — успешно.
- Собранный плагин обновлён в `/Users/nikita/Documents/Test Vault/.obsidian/plugins/obsidian-gallery`.
- Ручная приемка оператором успешна: tooltip lifetime, preview navigation и rotated crop behavior приняты.

Осталось:
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

## Phase 5 — Grid and Fullscreen

### 2026-06-02 05:16 — Keyboard Navigation and Remote Sources Backlog

Сессия завершена результативно: keyboard navigation переведена на plugin-level active gallery target и принята оператором; remote image/video URLs и YouTube embeds вынесены в отдельную архитектурную backlog-заметку. Подробности: [[log/2026-06-02_05-16_keyboard-navigation-remote-backlog]].

## Phase 4 — Video

### 2026-05-31 00:17 — Widget Size and Tooltip Polish

Сессия завершена результативно: добавлены resize-зоны для `view_height` и `caption_height`, убраны лишние tooltip-подписи с viewport и верхней навигации, обновлены документация и установленная сборка. Подробности: [[log/2026-05-31_00-17_widget-size-tooltip-polish]].

### 2026-05-29 01:00 — Phase 4 Video

Сессия завершена результативно: добавлены видео как полноценный media type, custom controls, playback state в caption frontmatter, video thumbnails и полировка progress / click-to-play UX. Phase 4 принята оператором после ручной проверки `mp4` и `mov`. Подробности: [[log/2026-05-29_01-00_phase-4-video]].

## Phase 3 — Top Navigation

### 2026-05-27 22:40 — Phase 3 Tooltip Lifetime Fix

Сессия завершена результативно: исправлено зависание Obsidian-native tooltip поверх контента через CSS lifetime и fallback-закрытие уже открытой подсказки. Проверки прошли, ручная приемка оператором успешна. Подробности: [[log/2026-05-27_22-40_phase-3-tooltip-lifetime-fix]].

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
