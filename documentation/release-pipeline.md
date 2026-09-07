# Release Pipeline

Связанные заметки: [[documentation/stylesheet-specificity]], [[CHANGELOG]], [[progress_log]]

Релизы собирает `.github/workflows/release.yml` по пушу тега. Ручная сборка и ручная загрузка ассетов больше не используются: scorecard каталога сообщества требует artifact attestations, а их выдаёт только GitHub Actions.

## Что делает workflow

Триггер — `push` любого тега. Шаги: `npm ci` → `npm test` → `npm run build` → `actions/attest-build-provenance@v2` → `gh release create --draft`.

Права джоба:

| Право | Зачем |
| ----- | ----- |
| `contents: write` | создать релиз и загрузить ассеты |
| `id-token: write` | получить OIDC-токен для подписи |
| `attestations: write` | записать attestation в реестр репозитория |

Подписываются и прикладываются к релизу `main.js`, `manifest.json`, `styles.css` — три файла, которые Obsidian ставит в vault.

Релиз создаётся **черновиком**: заметки дописываются вручную из CHANGELOG, публикация — отдельным действием. Каталог сообщества видит только опубликованный релиз.

## Порядок выпуска

1. Поднять версию в `manifest.json`, `package.json`, `package-lock.json`, `versions.json` (ключ версии → `minAppVersion`).
2. Добавить раздел версии в `CHANGELOG.md`.
3. Коммит, `git push origin main`.
4. `git tag <version>` и `git push origin <version>`.
5. Дождаться прогона, сверить `shasum -a 256` ассетов с локальной сборкой.
6. `gh release edit <version> --draft=false --latest --notes-file <notes>`.

Тег обязан указывать на коммит, уже отправленный в `main`: attestation привязывается к `refs/tags/<version>`, и повторное перемещение тега потребует нового прогона.

## Проверка ассета

```bash
gh attestation verify main.js --repo skrpln/caption-gallery-slider
```

Успешная проверка возвращает код 0; в JSON-выводе `buildSignerURI` указывает на `.github/workflows/release.yml@refs/tags/<version>`.

## Зависимости сборки

`esbuild.config.mjs` помечает встроенные модули Node внешними через `builtinModules` из `node:module`. Пакет `builtin-modules` удалён: scorecard отмечает его как замещаемый. В `external` попадают оба написания имени — `fs` и `node:fs`.
