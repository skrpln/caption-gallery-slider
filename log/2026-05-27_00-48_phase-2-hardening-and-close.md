# 2026-05-27 00:48 — Phase 2 Hardening and Close

Связанные заметки: [[progress_log]], [[documentation/phase-2-captions]], [[plan]]

## Сделано

- Доработана компактность caption panel: режим просмотра использует `white-space: normal`, режим редактирования сохраняет `white-space: pre-wrap`.
- Устранён лишний визуальный интервал между строками rendered Markdown в подписи.
- Добавлен post-processing Markdown wrapper-блоков Obsidian (`.el-p`, `.markdown-preview-section > div`) для компактных отступов в caption panel.
- Сохранена Markdown-иерархия заголовков: `h1-h6` снова используют размеры темы Obsidian.
- Верхняя plain-навигация перенесена внутрь viewport и стала hover-only, как fullscreen/rotate controls.
- Активный элемент навигации отображается коротким серым овалом; точки стали однотонными без обводки.
- Добавлен adaptive rail mode: при ширине, недостаточной для точек, или при количестве элементов больше `15`, показывается только ползунок без точек.
- Добавлен pure helper `src/render/navigationLayout.ts` и unit-тесты для выбора `dots`/`rail`.
- Обновлена документация [[documentation/phase-2-captions]].
- Собранный плагин обновлён в `.obsidian/plugins/obsidian-gallery`.

## Проверки

- `npm test` — 30 тестов passed.
- `npm run build` — успешно.
- `git diff --check` — без whitespace-проблем.
- Оператор подтвердил ручное тестирование: результат идеальный, сессия успешна.

## Решения

- Phase 2 объявлена закрытой.
- Следующий этап по [[plan]] — Phase 3 Top Navigation.

## Важно

- В рабочем дереве оставались изменения в `expectation.md` и `plan.md`, не относящиеся к текущему коммиту; они не включались в commit этой сессии.
