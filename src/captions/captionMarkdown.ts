// Documentation: [[documentation/phase-2-captions]], [[documentation/phase-4-video]]

export interface CaptionMarkdownParts {
  frontmatter: string | null;
  body: string;
}

export interface CaptionNoteInput {
  galleryId: string;
  target: string;
  sourcePath: string;
  body: string;
  rotation?: number;
  playback?: CaptionVideoPlayback;
}

export interface CaptionVideoPlayback {
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  start: number | null;
  end: number | null;
}

export const DEFAULT_VIDEO_PLAYBACK: CaptionVideoPlayback = {
  autoplay: false,
  muted: false,
  loop: false,
  start: null,
  end: null,
};

export function splitCaptionMarkdown(markdown: string): CaptionMarkdownParts {
  const normalized = markdown.replace(/\r\n/g, "\n");

  if (!normalized.startsWith("---\n")) {
    return {
      frontmatter: null,
      body: normalized,
    };
  }

  const closingIndex = normalized.indexOf("\n---", 4);
  if (closingIndex === -1) {
    return {
      frontmatter: null,
      body: normalized,
    };
  }

  const afterClosing = normalized.slice(closingIndex + "\n---".length);

  return {
    frontmatter: normalized.slice(4, closingIndex),
    body: afterClosing.replace(/^\n/, ""),
  };
}

export function createCaptionMarkdown(input: CaptionNoteInput): string {
  const frontmatter = [
    "---",
    `gallery_id: ${JSON.stringify(input.galleryId)}`,
    `target: ${JSON.stringify(input.target)}`,
    `source_path: ${JSON.stringify(input.sourcePath)}`,
    `rotation: ${normalizeRotation(input.rotation ?? 0)}`,
  ];

  if (input.playback) {
    frontmatter.push(
      `autoplay: ${input.playback.autoplay}`,
      `muted: ${input.playback.muted}`,
      `loop: ${input.playback.loop}`,
    );
    if (input.playback.start !== null) {
      frontmatter.push(`start: ${formatFrontmatterNumber(input.playback.start)}`);
    }
    if (input.playback.end !== null) {
      frontmatter.push(`end: ${formatFrontmatterNumber(input.playback.end)}`);
    }
  }

  return [
    ...frontmatter,
    "---",
    input.body,
  ].join("\n");
}

export function readFrontmatterNumber(frontmatter: string | null, key: string, fallback: number): number {
  return readFrontmatterOptionalNumber(frontmatter, key) ?? fallback;
}

export function readFrontmatterOptionalNumber(frontmatter: string | null, key: string): number | null {
  if (!frontmatter) {
    return null;
  }

  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = frontmatter.match(new RegExp(`^${escapedKey}:\\s*(-?\\d+(?:\\.\\d+)?)\\s*$`, "m"));
  if (!match) {
    return null;
  }

  const value = Number.parseFloat(match[1]);
  return Number.isFinite(value) ? value : null;
}

export function upsertFrontmatterNumber(frontmatter: string | null, key: string, value: number): string {
  const nextLine = `${key}: ${formatFrontmatterNumber(value)}`;
  if (!frontmatter) {
    return nextLine;
  }

  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedKey}:\\s*.*$`, "m");
  if (pattern.test(frontmatter)) {
    return frontmatter.replace(pattern, nextLine);
  }

  return `${frontmatter}\n${nextLine}`;
}

export function readFrontmatterBoolean(frontmatter: string | null, key: string, fallback: boolean): boolean {
  if (!frontmatter) {
    return fallback;
  }

  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = frontmatter.match(new RegExp(`^${escapedKey}:\\s*(true|false)\\s*$`, "im"));
  if (!match) {
    return fallback;
  }

  return match[1].toLowerCase() === "true";
}

export function readVideoPlayback(frontmatter: string | null): CaptionVideoPlayback {
  return {
    autoplay: readFrontmatterBoolean(frontmatter, "autoplay", DEFAULT_VIDEO_PLAYBACK.autoplay),
    muted: readFrontmatterBoolean(frontmatter, "muted", DEFAULT_VIDEO_PLAYBACK.muted),
    loop: readFrontmatterBoolean(frontmatter, "loop", DEFAULT_VIDEO_PLAYBACK.loop),
    start: readFrontmatterOptionalNumber(frontmatter, "start"),
    end: readFrontmatterOptionalNumber(frontmatter, "end"),
  };
}

export function upsertFrontmatterBoolean(frontmatter: string | null, key: string, value: boolean): string {
  const nextLine = `${key}: ${value}`;
  if (!frontmatter) {
    return nextLine;
  }

  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedKey}:\\s*.*$`, "m");
  if (pattern.test(frontmatter)) {
    return frontmatter.replace(pattern, nextLine);
  }

  return `${frontmatter}\n${nextLine}`;
}

export function upsertVideoPlayback(frontmatter: string | null, playback: CaptionVideoPlayback): string {
  const withBooleans = ([
    ["autoplay", playback.autoplay],
    ["muted", playback.muted],
    ["loop", playback.loop],
  ] as const)
    .reduce<string>(
      (nextFrontmatter, [key, value]) => upsertFrontmatterBoolean(nextFrontmatter, key, value),
      frontmatter ?? "",
    );

  return ([
    ["start", playback.start],
    ["end", playback.end],
  ] as const)
    .reduce<string>(
      (nextFrontmatter, [key, value]) => value === null
        ? nextFrontmatter
        : upsertFrontmatterNumber(nextFrontmatter, key, value),
      withBooleans,
    );
}

export function normalizeRotation(value: number): number {
  return ((value % 360) + 360) % 360;
}

function formatFrontmatterNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(3).replace(/\.?0+$/, "");
}
