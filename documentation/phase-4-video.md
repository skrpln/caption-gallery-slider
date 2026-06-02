# Phase 4 Video

Связанные заметки: [[expectation]], [[plan]], [[documentation/architecture]], [[documentation/phase-2-captions]], [[documentation/phase-3-top-navigation]]

Phase 4 добавляет видео как полноценный `GalleryItem` без отдельного UI-фреймворка. Изображения и видео проходят через общий resolver, общий gallery state и общий caption lifecycle.

## Media resolution

- Поддерживаемые видео расширения: `mp4`, `avi`, `mov`, `webm`.
- `getMediaKind()` возвращает `image`, `video` или `null`.
- `resolveGalleryMedia()` больше не ограничивается Phase 1 изображениями: он фильтрует все поддерживаемые media-файлы и сохраняет `kind` в `GalleryItem`.
- Сортировка, дедупликация `dir + list` и сообщения об ошибках остаются общими для изображений и видео.

## Rendering

- Renderer создаёт `<img>` или `<video>` по `item.kind`.
- При уходе с видео текущий `<video>` ставится на паузу перед переключением слайда.
- Нативные video controls отключены: UI остаётся минимальным и визуально встроенным в Obsidian.
- Для видео показывается нижний overlay на одной горизонтали с кнопкой поворота:
  - play / pause;
  - mute / unmute;
  - loop;
  - progress slider.
- Кнопка rotate остаётся отдельной hover-only кнопкой в правом нижнем углу viewport.
- Если ширины viewport не хватает, progress slider переносится на вторую строку, а video-кнопки остаются первым рядом.
- Click по свободной области видео переключает play / pause; clicks по кнопкам, верхней навигации и progress rail не дублируют это действие.
- Progress slider реализован как кастомный DOM rail с thumb того же размера и формы, что и верхний navigation rail. Track использует отдельный тёмно-серый цвет, чтобы не сливаться с thumb. Slider пишет только `currentTime` текущего `<video>` и не сохраняется в caption frontmatter.
- Hover по progress rail показывает локальный DOM-tooltip с временем в формате `mm:ss`, вычисленным по позиции курсора. Tooltip позиционируется относительно `.og-gallery`, поэтому работает и когда root открыт через fullscreen API.
- В `navigation: preview` видео отображается как metadata-preloaded thumbnail с первым кадром (`#t=0.001`) и play-marker поверх кадра.

## Playback frontmatter

Caption frontmatter для видео может содержать:

```yaml
autoplay: false
muted: true
loop: true
```

Правила:

- `autoplay`, `muted`, `loop` читаются при появлении видео в viewport.
- Переключение play / pause сохраняет `autoplay`.
- Переключение mute / unmute сохраняет `muted`.
- Переключение loop сохраняет `loop`.
- Если caption-заметки ещё нет, первое изменение playback state создаёт её через тот же lazy creation path, что и подписи.
- `rotation` остаётся общей настройкой для изображений и видео.

## Tests

Покрыто unit-тестами:

- media resolver распознаёт видео как `kind: "video"`;
- caption Markdown создаёт video playback frontmatter;
- boolean frontmatter helpers читают и обновляют `autoplay`, `muted`, `loop`.
- video progress helper форматирует hover time и ограничивает pointer-position внутри rail.
