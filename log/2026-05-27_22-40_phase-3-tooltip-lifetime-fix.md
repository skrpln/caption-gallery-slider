# 2026-05-27 22:40 — Phase 3 Tooltip Lifetime Fix

Связанные заметки: [[progress_log]], [[documentation/phase-3-top-navigation]], [[plan]]

## Сделано

- Исправлено зависание Obsidian tooltip поверх контента галереи после появления.
- Добавлен helper `src/render/autoHidingTooltip.ts`, который управляет жизненным циклом tooltip label:
  - сохраняет доступный `aria-label` в состоянии покоя;
  - скрывает label через `5` секунд после hover/focus;
  - восстанавливает label после mouseleave/blur.
- Renderer теперь регистрирует Obsidian-native tooltip через `setTooltip()` с классом `og-gallery__tooltip`.
- В `styles.css` добавлена CSS-анимация, скрывающая сам tooltip popover через `5` секунд.
- Добавлен fallback: timeout удаляет уже видимый Obsidian tooltip node, если Obsidian не закрывает его сам.
- Добавлены unit-тесты для авто-скрытия label, восстановления доступности, native tooltip hook и удаления видимого tooltip node.
- Обновлена документация [[documentation/phase-3-top-navigation]].
- Собранный плагин обновлён в `/Users/nikita/Documents/Test Vault/.obsidian/plugins/obsidian-gallery`: `main.js` и `styles.css`.

## Проверки

- `npm test` — 40 тестов, успешно.
- `npm run build` — успешно.
- Ручная проверка оператором успешна: tooltip теперь исчезает через `5` секунд и не перекрывает контент.

## Осталось

- Перейти к [[plan#Phase 4 — Video]].
