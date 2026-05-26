// Documentation: [[documentation/architecture]]

export type GallerySort = "name" | "created" | "modified";
export type GalleryNavigation = "plain" | "preview";
export type GalleryView = "crop" | "fit";

export interface GalleryGrid {
  rows: number;
  columns: number;
}

export interface GalleryConfig {
  galleryId: string;
  dir?: string;
  list: string[];
  sort: GallerySort;
  grid: GalleryGrid;
  viewHeight: number;
  captionHeight: number;
  navigation: GalleryNavigation;
  view: GalleryView;
  caption: boolean;
}

export interface GalleryParseSuccess {
  ok: true;
  config: GalleryConfig;
}

export interface GalleryParseFailure {
  ok: false;
  errors: string[];
}

export type GalleryParseResult = GalleryParseSuccess | GalleryParseFailure;

const DEFAULT_SORT: GallerySort = "name";
const DEFAULT_GRID: GalleryGrid = { rows: 1, columns: 1 };
const DEFAULT_VIEW_HEIGHT = 400;
const DEFAULT_CAPTION_HEIGHT = 60;
const DEFAULT_NAVIGATION: GalleryNavigation = "plain";
const DEFAULT_VIEW: GalleryView = "crop";
const DEFAULT_CAPTION = true;
const SORT_VALUES = new Set<GallerySort>(["name", "created", "modified"]);
const NAVIGATION_VALUES = new Set<GalleryNavigation>(["plain", "preview"]);
const VIEW_VALUES = new Set<GalleryView>(["crop", "fit"]);

interface RawGalleryConfig {
  gallery_id?: string;
  dir?: string;
  list: string[];
  sort?: string;
  grid?: string;
  height?: string;
  view_height?: string;
  caption_height?: string;
  navigation?: string;
  view?: string;
  fit?: string;
  caption?: string;
}

export function parseGalleryBlock(source: string): GalleryParseResult {
  const raw = parseRawGalleryBlock(source);
  return validateRawGalleryConfig(raw);
}

function parseRawGalleryBlock(source: string): RawGalleryConfig {
  const raw: RawGalleryConfig = { list: [] };
  let currentListKey: "list" | null = null;

  for (const originalLine of source.split(/\r?\n/)) {
    const line = stripInlineComment(originalLine).trimEnd();

    if (line.trim().length === 0) {
      continue;
    }

    const listItem = line.match(/^\s*-\s+(.+)$/);
    if (currentListKey === "list" && listItem) {
      raw.list.push(listItem[1].trim());
      continue;
    }

    const field = line.match(/^([A-Za-z_]+)\s*:\s*(.*)$/);
    if (!field) {
      continue;
    }

    const key = field[1] as keyof RawGalleryConfig;
    const value = field[2].trim();
    currentListKey = null;

    if (key === "list") {
      currentListKey = "list";
      if (value.length > 0) {
        raw.list.push(value);
      }
      continue;
    }

    if (key in raw || isKnownScalarKey(key)) {
      raw[key] = value as never;
    }
  }

  return raw;
}

function validateRawGalleryConfig(raw: RawGalleryConfig): GalleryParseResult {
  const errors: string[] = [];
  const galleryId = raw.gallery_id?.trim();
  const dir = emptyToUndefined(raw.dir);
  const list = raw.list.map((item) => item.trim()).filter(Boolean);
  const sort = parseSort(raw.sort, errors);
  const grid = parseGrid(raw.grid, errors);
  const viewHeight = parsePositiveNumber(raw.view_height ?? raw.height, "view_height", errors, DEFAULT_VIEW_HEIGHT);
  const captionHeight = parsePositiveNumber(raw.caption_height, "caption_height", errors, DEFAULT_CAPTION_HEIGHT);
  const navigation = parseNavigation(raw.navigation, errors);
  const view = parseView(raw.view, raw.fit, errors);
  const caption = parseBoolean(raw.caption, "caption", errors, DEFAULT_CAPTION);

  if (!galleryId) {
    errors.push("`gallery_id` is required.");
  }

  if (!dir && list.length === 0) {
    errors.push("Provide at least one media source: `dir` or `list`.");
  }

  if (grid.rows !== 1 || grid.columns !== 1) {
    errors.push("Only `grid: 1,1` is supported in Phase 1.");
  }

  if (navigation !== "plain") {
    errors.push("Only `navigation: plain` is supported in Phase 1.");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    config: {
      galleryId: galleryId!,
      dir,
      list,
      sort,
      grid,
      viewHeight,
      captionHeight,
      navigation,
      view,
      caption,
    },
  };
}

function parseSort(value: string | undefined, errors: string[]): GallerySort {
  const normalized = normalizeScalarValue(value);
  if (!normalized) {
    return DEFAULT_SORT;
  }

  if (SORT_VALUES.has(normalized as GallerySort)) {
    return normalized as GallerySort;
  }

  errors.push("`sort` must be one of: `name`, `created`, `modified`.");
  return DEFAULT_SORT;
}

function parseGrid(value: string | undefined, errors: string[]): GalleryGrid {
  if (!value) {
    return DEFAULT_GRID;
  }

  const match = value.match(/^(\d+)\s*,\s*(\d+)$/);
  if (!match) {
    errors.push("`grid` must use `rows,columns` format, for example `1,1`.");
    return DEFAULT_GRID;
  }

  const rows = Number.parseInt(match[1], 10);
  const columns = Number.parseInt(match[2], 10);

  if (rows < 1 || columns < 1 || rows > 5 || columns > 7) {
    errors.push("`grid` must be between `1,1` and `5,7`.");
    return DEFAULT_GRID;
  }

  return { rows, columns };
}

function parsePositiveNumber(value: string | undefined, key: string, errors: string[], fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    errors.push(`\`${key}\` must be a positive number.`);
    return fallback;
  }

  return parsed;
}

function parseNavigation(value: string | undefined, errors: string[]): GalleryNavigation {
  const normalized = normalizeScalarValue(value);
  if (!normalized) {
    return DEFAULT_NAVIGATION;
  }

  if (normalized === "plane") {
    return "plain";
  }

  if (NAVIGATION_VALUES.has(normalized as GalleryNavigation)) {
    return normalized as GalleryNavigation;
  }

  errors.push("`navigation` must be one of: `plain`, `preview`.");
  return DEFAULT_NAVIGATION;
}

function parseView(value: string | undefined, legacyFit: string | undefined, errors: string[]): GalleryView {
  const normalized = normalizeScalarValue(value);
  if (!normalized) {
    const legacy = normalizeScalarValue(legacyFit);
    if (legacy === "cover") {
      return "crop";
    }

    if (legacy === "contain") {
      return "fit";
    }

    if (legacy) {
      errors.push("`fit` has been renamed to `view`; use `view: crop` or `view: fit`.");
    }

    return DEFAULT_VIEW;
  }

  if (VIEW_VALUES.has(normalized as GalleryView)) {
    return normalized as GalleryView;
  }

  if (normalized === "cover") {
    return "crop";
  }

  if (normalized === "contain") {
    return "fit";
  }

  errors.push("`view` must be one of: `crop`, `fit`.");
  return DEFAULT_VIEW;
}

function parseBoolean(value: string | undefined, key: string, errors: string[], fallback: boolean): boolean {
  const normalized = normalizeScalarValue(value);
  if (!normalized) {
    return fallback;
  }

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  errors.push(`\`${key}\` must be one of: \`true\`, \`false\`.`);
  return fallback;
}

function normalizeScalarValue(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/[.,;]+$/g, "")
    .replace(/[АВЕКМНОРСТХаеорсух]/g, (char) => {
      const lookalikes: Record<string, string> = {
        А: "A",
        В: "B",
        Е: "E",
        К: "K",
        М: "M",
        Н: "H",
        О: "O",
        Р: "P",
        С: "C",
        Т: "T",
        Х: "X",
        а: "a",
        е: "e",
        о: "o",
        р: "p",
        с: "c",
        у: "y",
        х: "x",
      };

      return lookalikes[char] ?? char;
    })
    .toLowerCase();
}

function stripInlineComment(line: string): string {
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === "#" && (index === 0 || /\s/.test(line[index - 1]))) {
      return line.slice(0, index);
    }
  }

  return line;
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isKnownScalarKey(key: string): key is keyof Omit<RawGalleryConfig, "list"> {
  return [
    "gallery_id",
    "dir",
    "sort",
    "grid",
    "height",
    "view_height",
    "caption_height",
    "navigation",
    "view",
    "fit",
    "caption",
  ].includes(key);
}
