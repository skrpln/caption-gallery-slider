// Documentation: [[documentation/phase-2-captions]]

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
}

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
  return [
    "---",
    `gallery_id: ${JSON.stringify(input.galleryId)}`,
    `target: ${JSON.stringify(input.target)}`,
    `source_path: ${JSON.stringify(input.sourcePath)}`,
    `rotation: ${normalizeRotation(input.rotation ?? 0)}`,
    "---",
    input.body,
  ].join("\n");
}

export function readFrontmatterNumber(frontmatter: string | null, key: string, fallback: number): number {
  if (!frontmatter) {
    return fallback;
  }

  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = frontmatter.match(new RegExp(`^${escapedKey}:\\s*(-?\\d+)\\s*$`, "m"));
  if (!match) {
    return fallback;
  }

  const value = Number.parseInt(match[1], 10);
  return Number.isFinite(value) ? value : fallback;
}

export function upsertFrontmatterNumber(frontmatter: string | null, key: string, value: number): string {
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

export function normalizeRotation(value: number): number {
  return ((value % 360) + 360) % 360;
}
