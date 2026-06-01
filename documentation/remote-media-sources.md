# Remote Media Sources

Related notes: [[plan]], [[documentation/architecture]], [[documentation/phase-4-video]], [[documentation/keyboard-navigation-backlog]]

## Goal

Future gallery versions should accept remote media in addition to vault files:

- direct image URLs;
- direct video URLs;
- YouTube links;
- other public embeddable media providers when their embed URLs are deterministic and safe to construct.

The feature should preserve the current architecture: parser and media resolver stay testable, renderer receives typed media items, and network probing is isolated behind a small service.

## Syntax

The existing `list` block can support remote entries without adding a new top-level option:

```md
gallery_id: remote_examples
list:
  - Attachments/local-image.jpg
  - https://example.com/image.webp
  - https://example.com/video.mp4
  - https://www.youtube.com/watch?v=dQw4w9WgXcQ
  - https://youtu.be/dQw4w9WgXcQ
```

`dir` remains vault-only. Remote URLs are explicit list entries only.

## Item Model

Extend `GalleryItem` into a discriminated union:

```ts
type GalleryItem = VaultGalleryItem | RemoteGalleryItem | EmbedGalleryItem;

interface VaultGalleryItem {
  source: "vault";
  kind: "image" | "video";
  path: string;
  name: string;
  extension: string;
  createdAt: number;
  modifiedAt: number;
}

interface RemoteGalleryItem {
  source: "remote";
  kind: "image" | "video";
  url: string;
  name: string;
  extension: string | null;
}

interface EmbedGalleryItem {
  source: "embed";
  provider: "youtube";
  kind: "embed";
  url: string;
  embedUrl: string;
  thumbnailUrl: string;
  name: string;
}
```

Keep `kind: "embed"` separate from `kind: "video"` because YouTube is rendered with an iframe, not a native `<video>` element. Native video controls and caption playback frontmatter should not be applied to iframe embeds.

## Resolver Design

Add `src/media/remoteMedia.ts` with pure helpers:

- `isHttpUrl(value: string): boolean`;
- `normalizeRemoteUrl(value: string): string`;
- `isYouTubeUrl(url: string): boolean`;
- `parseYouTubeVideoId(url: string): string | null`;
- `toYouTubeEmbedUrl(videoId: string): string`;
- `toYouTubeThumbnailUrl(videoId: string): string`;
- `getRemoteKindFromExtension(url: string): "image" | "video" | null`;
- `mapContentTypeToRemoteKind(contentType: string): "image" | "video" | null`.

Add `src/media/remoteMediaResolver.ts` for asynchronous probing:

- first classify by URL extension;
- classify YouTube before network probing;
- for unknown `http(s)` URLs, try `HEAD`;
- if `HEAD` fails or has no useful `Content-Type`, try `GET` with abort timeout;
- cache detected remote type by normalized URL for the plugin lifetime;
- default timeout: 5000 ms;
- return an unsupported-item warning instead of throwing.

`resolveGalleryMedia()` will need an async variant or become async:

```ts
const mediaResult = await resolveGalleryMedia(parseResult.config, vault, remoteResolver);
```

The plugin entry should render a loading state while remote items are being resolved.

## Rendering

`GalleryRenderer` should branch by item source:

- vault image: current `<img>` path through `getResourcePath()`;
- vault video: current `<video>` path through `getResourcePath()`;
- remote image: `<img src={url} loading="lazy" decoding="async">`;
- remote video: `<video src={url} preload="metadata">` with existing video controls;
- YouTube embed: `<iframe src={embedUrl}>`.

Iframe attributes:

```ts
allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
allowfullscreen = "true";
referrerpolicy = "strict-origin-when-cross-origin";
```

For preview navigation:

- remote image thumbnail uses the image URL;
- remote video thumbnail can use a `video` element with `#t=0.001` when CORS/browser behavior allows it, otherwise show a file-type placeholder;
- YouTube thumbnail uses `https://img.youtube.com/vi/{id}/hqdefault.jpg`.

## Captions

Caption paths should hash a stable target identity:

- vault items: current vault path;
- remote items: normalized URL;
- embed items: provider + normalized canonical URL.

`target_type` can remain `img` / `vid` for remote images and videos. Add `emb` for iframe embeds:

```text
{gallery_save_dir}/{gallery_id}/emb-{short_hash}.md
```

Caption frontmatter for YouTube should include:

```yaml
gallery_id: remote_examples
target: emb
source_path: https://www.youtube.com/watch?v=dQw4w9WgXcQ
provider: youtube
```

Do not store autoplay, muted, or loop frontmatter for iframe embeds in the first implementation.

## Security And Privacy

Remote media causes network requests during note rendering. The user-facing documentation must say this clearly.

Implementation constraints:

- support only `http:` and `https:`;
- reject `javascript:`, `data:`, `file:`, and custom protocols;
- do not proxy remote URLs;
- do not execute remote scripts;
- render provider embeds only from explicit allowlisted providers;
- avoid loading non-current remote videos where possible.

## Tests

Add unit tests for:

- HTTP URL normalization;
- YouTube ID parsing for `youtube.com/watch?v=...` and `youtu.be/...`;
- rejection of non-HTTP protocols;
- extension-based remote image/video classification;
- `Content-Type` mapping;
- caption path stability for normalized remote URLs;
- resolver merge of vault and remote list entries;
- renderer branch selection for `source: "remote"` and `source: "embed"` as a DOM smoke test.

## Implementation Cost

Expected size: medium.

Main reasons:

- resolver must become async;
- renderer needs a third media branch for iframe embeds;
- caption paths need remote identity support;
- preview navigation needs remote thumbnail handling;
- documentation must disclose network behavior.

The feature does not require changing `dir`, gallery state, or core caption editing behavior.
