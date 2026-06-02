# 2026-06-03 04:52 — Overlay Controls Layout

Связанные заметки: [[plan]], [[progress_log]], [[documentation/overlay-controls-layout]], [[documentation/crop-controls]], [[documentation/phase-4-video]]

## Сделано

- Добавлен responsive layout для overlay controls поверх media viewport.
- Video controls, crop/rotate controls и video progress объединены в единый `.og-gallery__overlay-controls` слой.
- Добавлен pure-helper `src/render/overlayControlsLayout.ts` с режимами:
  - `normal` — video buttons, progress и crop/rotate buttons в одной строке;
  - `compact` — video buttons слева и crop/rotate buttons справа в первой строке, progress ниже;
  - `ultra` — три строки: video buttons, crop/rotate buttons, progress;
  - `hidden` — overlay controls скрываются, если заняли бы больше `60%` viewport или не помещаются по ширине.
- `GalleryRenderer` пересчитывает overlay layout через `ResizeObserver` на viewport и при изменении `view_height`.
- CSS overlay controls переписан на grid layout, чтобы popup и ultra-compact cases не требовали независимого позиционирования правой и левой групп.
- Добавлены unit-тесты `src/render/overlayControlsLayout.test.ts`.
- Добавлена документация [[documentation/overlay-controls-layout]]; обновлены [[documentation/_MOC]], [[plan]], [[progress_log]].
- Собранный плагин обновлён в `/Users/nikita/Documents/Test Vault/.obsidian/plugins/obsidian-gallery`.

## Проверки

- `npm test` — 77 тестов, успешно.
- `npm run build` — успешно.
- `git diff --check` — без замечаний.
- Ручная приёмка оператором успешна: layout overlay controls в popup признан корректным.

## Сложности

- Старое независимое позиционирование video controls слева и crop/rotate controls справа не могло корректно адаптироваться в маленьком hover popup.
- Для маленьких viewport нужен не только CSS wrap, но и явный режим `hidden`, чтобы controls не закрывали больше `60%` области демонстрации.

## Следующие шаги

- Продолжить Phase 5 как стабилизацию текущего single-slide scope.
- После накопления оставшихся pre-release правок перейти к Phase 6: formal release and publication.
