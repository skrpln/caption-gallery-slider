// Documentation: [[documentation/architecture]]

export type GallerySort = "name" | "created" | "modified";
export type GalleryNavigation = "plane" | "preview";

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
  height: number;
  navigation: GalleryNavigation;
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
const DEFAULT_HEIGHT = 360;
const DEFAULT_NAVIGATION: GalleryNavigation = "plane";
const SORT_VALUES = new Set<GallerySort>(["name", "created", "modified"]);
const NAVIGATION_VALUES = new Set<GalleryNavigation>(["plane", "preview"]);

interface RawGalleryConfig {
  gallery_id?: string;
  dir?: string;
  list: string[];
  sort?: string;
  grid?: string;
  height?: string;
  navigation?: string;
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
  const height = parseHeight(raw.height, errors);
  const navigation = parseNavigation(raw.navigation, errors);

  if (!galleryId) {
    errors.push("`gallery_id` is required.");
  }

  if (!dir && list.length === 0) {
    errors.push("Provide at least one media source: `dir` or `list`.");
  }

  if (grid.rows !== 1 || grid.columns !== 1) {
    errors.push("Only `grid: 1,1` is supported in Phase 1.");
  }

  if (navigation !== "plane") {
    errors.push("Only `navigation: plane` is supported in Phase 1.");
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
      height,
      navigation,
    },
  };
}

function parseSort(value: string | undefined, errors: string[]): GallerySort {
  if (!value) {
    return DEFAULT_SORT;
  }

  if (SORT_VALUES.has(value as GallerySort)) {
    return value as GallerySort;
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

function parseHeight(value: string | undefined, errors: string[]): number {
  if (!value) {
    return DEFAULT_HEIGHT;
  }

  const height = Number.parseInt(value, 10);
  if (!Number.isFinite(height) || height <= 0) {
    errors.push("`height` must be a positive number.");
    return DEFAULT_HEIGHT;
  }

  return height;
}

function parseNavigation(value: string | undefined, errors: string[]): GalleryNavigation {
  if (!value) {
    return DEFAULT_NAVIGATION;
  }

  if (NAVIGATION_VALUES.has(value as GalleryNavigation)) {
    return value as GalleryNavigation;
  }

  errors.push("`navigation` must be one of: `plane`, `preview`.");
  return DEFAULT_NAVIGATION;
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
  return ["gallery_id", "dir", "sort", "grid", "height", "navigation"].includes(key);
}
