# План разработки Obsidian Gallery

Связанные заметки: [[expectation]], [[documentation/_MOC]], [[documentation/architecture]], [[progress_log]]

Этот файл описывает рабочий маршрут разработки плагина `obsidian-gallery` и считается каноническим планом проекта.

## Архитектурная линия

Плагин строится вокруг небольшого ядра без фронтенд-фреймворка. Это сохраняет нативность Obsidian, уменьшает размер сборки и упрощает работу внутри Reading mode, Live Preview и hover pop-up.

Основные слои:

| Слой                 | Ответственность                                                                                 | Когда нужен |
| -------------------- | ----------------------------------------------------------------------------------------------- | ----------- |
| Plugin entry         | Регистрация code block processor, настроек, подписок на события vault                           | Phase 1     |
| Parser               | Преобразование текста `gallery` code block в типизированный config и validation result          | Phase 1     |
| Media resolver       | Поиск файлов из `dir` и `list`, фильтрация форматов, сортировка, дедупликация                   | Phase 1     |
| Gallery state        | Индекс текущего элемента или страницы, переходы, wrap-around, swipe intent                      | Phase 1     |
| Renderer             | DOM-виджет, кнопки, viewport, dots/slider, caption panel                                        | Phase 1-5   |
| Caption service      | Пути caption-файлов, lazy creation, frontmatter, markdown body                                  | Phase 2     |
| Markdown integration | `MarkdownRenderer.render()`, ручное подключение internal-link click/hover preview, hover source | Phase 2     |
| Media controls       | Видео-контролы и синхронизация состояния с caption frontmatter                                  | Phase 4     |

Ключевой принцип: бизнес-логика тестируется отдельно от Obsidian DOM. Парсер, сортировка, резолвинг списков, вычисление caption path и gallery state должны быть покрыты unit-тестами без запуска Obsidian.

## Фазы

| Фаза | Фокус | Результат |
| --- | --- | --- |
| **Phase 0 — Project Foundation** | Структура проекта, архитектурные решения, документация, инструменты сборки и тестов | Проект готов к реализации MVP |
| **Phase 1 — MVP Image Gallery** | Базовый `gallery` code block processor, одиночный viewport, изображения, arrows, dots | Галерея изображений работает в Reading mode и Live Preview |
| **Phase 2 — Captions** | Lazy creation markdown-подписей, inline editing, markdown rendering, Obsidian links | Каждое медиа получает отдельную редактируемую caption-заметку |
| **Phase 3 — Top Navigation** | Preview thumbnails, slider mode при длинных галереях, улучшенная навигация | Верхняя панель соответствует `navigation` и размеру набора |
| **Phase 4 — Video** | Видео-форматы, кастомные минимальные controls, frontmatter playback state | Видео ведёт себя как нативный элемент галереи |
| **Phase 5 — Grid and Fullscreen** | `grid`, paging группами, групповые подписи, click-to-caption, fullscreen | Галерея поддерживает сложные наборы и расширенный просмотр |
| **Phase 6 — Release Hardening** | Производительность, accessibility, документация пользователя, community plugin checklist | Плагин готов к публикации |

## Phase 0 — Project Foundation

Цель: подготовить проект так, чтобы Phase 1 можно было писать без архитектурных переделок.

Задачи:
- Создать канонические файлы проекта: [[plan]], [[progress_log]], [[documentation/_MOC]], директории `documentation/`, `src/`, `log/`.
- Зафиксировать архитектуру в [[documentation/architecture]].
- Создать каркас Obsidian Sample Plugin:
  - `manifest.json`;
  - `package.json`;
  - `tsconfig.json`;
  - `esbuild.config.mjs`;
  - `styles.css`;
  - `src/main.ts`.
- Подключить TypeScript, `obsidian` types, сборку через esbuild.
- Подключить unit-тесты через Vitest для чистой логики.
- Определить соглашения по модулям `src/`.

Предлагаемая структура `src/`:

```text
src/
  main.ts
  parser/
    galleryBlockParser.ts
    galleryBlockParser.test.ts
  media/
    mediaTypes.ts
    mediaResolver.ts
    mediaResolver.test.ts
  state/
    galleryState.ts
    galleryState.test.ts
  render/
    GalleryRenderer.ts
    renderTypes.ts
  captions/
    captionPath.ts
    captionMarkdown.ts
    captionPath.test.ts
  settings/
    settings.ts
```

Критерии готовности:
- Проект имеет ожидаемые директории и документационную карту.
- Архитектурный документ объясняет слои и границы ответственности.
- Черновой `plane.md` удалён после принятия [[plan]] как канонического файла.
- Следующий шаг очевиден: scaffold sample plugin и первая партия тестов.

## Phase 1 — MVP Image Gallery

Цель: реализовать минимальную полезную галерею изображений без подписей, видео и grid.

Scope:
- `registerMarkdownCodeBlockProcessor("gallery", ...)`.
- Парсер параметров:
  - `gallery_id`;
  - `dir`;
  - `list`;
  - `sort`;
  - `height`;
  - `navigation`, но в Phase 1 реально поддерживается только `plane`;
  - `grid`, но любые значения кроме `1,1` дают inline-сообщение "not supported yet".
- Валидация:
  - `gallery_id` обязателен;
  - нужен хотя бы один источник `dir` или `list`;
  - `height` должен быть положительным числом;
  - `sort` допускает `name`, `created`, `modified`;
  - пустой результат показывает inline state вместо падения.
- Media resolver:
  - читает `dir` через `Vault.getAbstractFileByPath`;
  - рекурсивно собирает файлы из `dir`, включая вложенные папки;
  - фильтрует изображения: `jpg`, `jpeg`, `png`, `gif`, `webp`, `svg`;
  - объединяет `dir` и `list`;
  - дедуплицирует по vault path;
  - сортирует весь объединённый набор по `sort`.
- Renderer:
  - один viewport;
  - arrows left/right;
  - wrap-around navigation;
  - dots navigation;
  - `object-fit: cover`;
  - CSS variables Obsidian;
  - cleanup event listeners при unload.
- Input:
  - click по arrows/dots;
  - keyboard focus на controls;
  - базовый swipe через pointer events.

Тесты:
- Парсер корректно читает минимальный блок.
- Валидация возвращает дружелюбные ошибки.
- `dir + list` объединяются без дублей и сортируются как единое множество.
- Сортировка по имени стабильна.
- Gallery state корректно переходит `next`, `previous`, `goTo`, wrap-around.

Критерии приемки:
- Код-блок с `dir` показывает первую картинку.
- Код-блок с `list` показывает заданные картинки в порядке списка.
- Стрелки и dots переключают изображения.
- Ошибочные параметры не ломают рендер заметки.
- Виджет визуально не спорит со стандартной темой Obsidian.
- Работает в Reading mode и Live Preview.

Принятые решения Phase 1:
- `dir` сканируется рекурсивно: контент вложенных папок входит в галерею.
- `dir` и `list` объединяются в одно множество, затем весь набор сортируется согласно `sort`.
- Временные подписи до Phase 2 не показываются, чтобы не закреплять лишний UI.

## Phase 2 — Captions

Цель: вынести подписи в обычные markdown-заметки и сделать их редактируемыми прямо в галерее.

Scope:
- Настройка `gallery_save_dir`, default: `gallery-captions/`.
- Детерминированный caption path:
  - `{gallery_save_dir}/{gallery_id}/{target_type}-{short_hash}.md`;
  - `target_type`: `img` или `vid`;
  - hash считается от vault path.
- Lazy creation:
  - если файл есть — рендерить body без frontmatter;
  - если файла нет — показывать `_insert caption_`;
  - первый edit создаёт файл с минимальным frontmatter.
- Markdown rendering через Obsidian API.
- Поддержка `[[internal links]]` и hover preview после рендера:
  - использовать `MarkdownRenderer.render(app, markdown, containerEl, sourcePath, component)`;
  - после рендера пройти по `a.internal-link` и вручную повесить `click` через `app.workspace.openLinkText`;
  - вручную повесить `mouseover` через `app.workspace.trigger("hover-link", ...)`;
  - зарегистрировать source в `onload()` через `registerHoverLinkSource`;
  - передавать `hoverParent: component`, чтобы hover popover жил вместе с lifecycle gallery component;
  - передавать корректный `sourcePath` caption-заметки для разрешения относительных и неоднозначных ссылок.
- Inline editing с сохранением в caption file.

Тесты:
- Caption path стабилен для одного path.
- Разные `gallery_id` дают разные caption paths.
- Frontmatter отделяется от body.
- Lazy creation не создаёт файлы до первого edit.
- Markdown integration helper навешивает обработчики только на `a.internal-link` и использует зарегистрированный hover source.

Критерии приемки:
- Caption-файл появляется только после редактирования.
- Существующая caption-заметка отображается как Markdown.
- Внутренние ссылки кликабельны и поддерживают hover preview в caption panel, включая custom gallery DOM.
- Page Preview видит gallery caption source как легитимный источник и уважает настройки пользователя.

## Phase 3 — Top Navigation

Цель: довести верхнюю навигацию до спецификации.

Scope:
- `navigation: plane`:
  - dots до 10 элементов;
  - slider при >10 элементах.
- `navigation: preview`:
  - thumbnails для `grid: 1,1`;
  - горизонтальный scroll;
  - click по thumbnail.
- Превью для видео на Phase 3 можно показывать как placeholder с filename; реальная видео-интеграция в Phase 4.

Тесты:
- Выбор режима навигации по config и количеству элементов.
- Маппинг slider position в item index.

Критерии приемки:
- Верхняя панель не растягивает layout.
- Длинные галереи остаются управляемыми.

## Phase 4 — Video

Цель: добавить видео как полноценный media type.

Scope:
- Форматы: `mp4`, `avi`, `mov`, `webm`.
- Минимальные controls:
  - play / pause;
  - mute / unmute;
  - loop;
  - progress slider.
- Чтение и запись playback state во frontmatter caption-файла.
- Lazy loading видео: preload только текущего и соседнего элемента.

Тесты:
- Определение media type по расширению.
- Чтение/запись playback frontmatter.
- State controls не ломают image items.

Критерии приемки:
- Видео переключается вместе с изображениями.
- При уходе со слайда видео останавливается или переводится в предсказуемое состояние.
- UI controls не конфликтуют с Obsidian темой.

## Phase 5 — Grid and Fullscreen

Цель: реализовать групповой просмотр и fullscreen.

Scope:
- `grid: rows,cols`, максимум `5,7`.
- Paging группами.
- Верхняя панель принудительно slider.
- Group captions:
  - объединение caption bodies текущей группы;
  - разделитель `---`;
  - порядок слева направо, сверху вниз.
- Click-to-caption:
  - click по media cell скроллит caption panel к нужному фрагменту;
  - краткая подсветка.
- Fullscreen mode:
  - отдельный overlay;
  - escape/click close;
  - сохранение текущего index.

Тесты:
- Разбиение items на pages.
- Индекс элемента в grid cell.
- Порядок group captions.

Критерии приемки:
- Grid не ломает высоту и пропорции.
- Подписи группы читаемы и связаны с изображениями.
- Fullscreen работает без потери позиции.

## Phase 6 — Release Hardening

Цель: подготовить плагин к open-source публикации и каталогу community plugins.

Scope:
- README для пользователя.
- Документация синтаксиса.
- Settings tab.
- Accessibility pass:
  - aria-labels;
  - focus states;
  - keyboard navigation.
  - Keyboard arrow navigation now uses a plugin-level active gallery target. Keep regression checks in Reading mode, Live Preview, fullscreen, and caption editing. Full notes: [[documentation/keyboard-navigation-backlog]].
- Performance pass:
  - проверка галерей 100+ элементов;
  - lazy loading;
  - минимизация DOM updates.
- Packaging:
  - version bump;
  - release artifact;
  - community plugin checklist.

Критерии приемки:
- Плагин можно установить вручную в vault.
- Пользователь может создать галерею по README без чтения исходников.
- Нет известных blocking issues для публикации.

## Feature Backlog — Remote Media Sources

Цель: добавить поддержку явных remote media entries в `list`: прямые ссылки на изображения, прямые ссылки на видео, YouTube links и будущие allowlisted provider embeds.

Архитектурное описание: [[documentation/remote-media-sources]].

Scope:
- расширить `GalleryItem` до union-модели для vault, remote и embed sources;
- добавить pure helpers для HTTP URL, YouTube ID, embed URL, thumbnail URL и content-type mapping;
- добавить async remote resolver с cache, timeout и fallback `HEAD` -> `GET`;
- сделать `resolveGalleryMedia()` async или добавить async wrapper;
- рендерить remote images через `<img>`, remote videos через `<video>`, YouTube через allowlisted `<iframe>`;
- считать caption path hash от нормализованного URL или provider canonical URL;
- явно задокументировать, что remote media делает сетевые запросы при рендере заметки.

Критерии приемки:
- `list` принимает vault paths и remote URLs в одном порядке;
- YouTube `watch` и `youtu.be` ссылки рендерятся iframe embed;
- прямые remote image/video URLs рендерятся без копирования в vault;
- unsupported URLs показывают inline state и не ломают галерею;
- captions работают для remote media так же лениво, как для vault media.

## Текущие архитектурные рекомендации

- Не использовать React/Vue/Svelte на старте. Plain DOM + Obsidian API лучше соответствует цели "нативность, простота, лёгкость".
- Не смешивать рендер и файловую систему. Renderer получает готовые `GalleryItem[]`, а не сам ходит в vault.
- Не хранить подписи в code block. Выбранная модель caption-заметок хорошо ложится на Obsidian и даёт внутренние ссылки, поиск и backlinks.
- Не делать grid в MVP. Он кратно усложняет state, captions и layout; правильнее сначала стабилизировать одиночный viewport.
- Сразу писать тесты для parser/state/path logic. Эти части дешевле всего тестировать и дороже всего чинить после появления UI.
- Все user-facing ошибки показывать inline внутри виджета, а не через `Notice`, потому что code block должен быть самодостаточным и понятным при чтении заметки.
