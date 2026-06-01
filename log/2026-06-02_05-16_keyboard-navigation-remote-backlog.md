# 2026-06-02 05:16 — Keyboard Navigation and Remote Sources Backlog

Связанные заметки: [[progress_log]], [[documentation/keyboard-navigation-backlog]], [[documentation/remote-media-sources]], [[plan]]

## Сделано

- Изучен open-source плагин Media Slider как референс для keyboard navigation.
- Предыдущая renderer-local схема keyboard navigation заменена на plugin-level active gallery target:
  - `src/main.ts` хранит активную галерею и владеет единым `document` `keydown` handler;
  - `src/render/GalleryRenderer.ts` сообщает об активности через `activateKeyboardTarget(this)`;
  - активная зона — весь widget root, включая viewport, top navigation, стрелки, video controls и caption shell;
  - caption editing блокирует перехват стрелок;
  - fullscreen продолжает принимать стрелки через `canHandleKeyboard()`.
- Добавлен pure contract/helper `src/render/keyboardNavigation.ts` и unit-тесты `src/render/keyboardNavigation.test.ts`.
- Обновлена документация [[documentation/keyboard-navigation-backlog]].
- Добавлена архитектурная backlog-заметка [[documentation/remote-media-sources]] для будущей поддержки:
  - прямых remote image URLs;
  - прямых remote video URLs;
  - YouTube `watch` / `youtu.be` embeds;
  - будущих allowlisted provider embeds.
- Обновлены [[documentation/_MOC]] и [[plan]] со ссылкой на remote sources backlog.
- Собранный плагин обновлён в `/Users/nikita/Documents/Test Vault/.obsidian/plugins/obsidian-gallery`.

## Проверки

- `npm test` — 54 теста успешно.
- `npm run build` — успешно.
- `git diff --check` — без замечаний.
- Ручная приемка оператором успешна: keyboard navigation стрелками работает корректно после hover и click, включая проблемный сценарий клика в демонстрационной области.

## Решения

- Keyboard routing должен жить на уровне plugin entry, а не внутри каждого renderer instance.
- Не использовать принудительный DOM focus viewport/root для keyboard activation: в Obsidian он ведёт себя хрупко рядом с Reading/Live Preview infrastructure.
- Remote media sources не добавлять поверх текущего resolver хаотично; будущая реализация должна идти через typed union для `GalleryItem`, async remote resolver и отдельные pure helpers.

## Следующие шаги

- Продолжить Phase 5 Grid and Fullscreen.
- При разработке remote media стартовать с [[documentation/remote-media-sources]], не возвращаясь к первоисточнику Media Slider.
