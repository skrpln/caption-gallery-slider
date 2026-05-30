// Documentation: [[documentation/widget-size-controls]]

export type GallerySizeOption = "view_height" | "caption_height";

export function updateGallerySizeOption(source: string, option: GallerySizeOption, value: number): string {
  const lineEnding = source.includes("\r\n") ? "\r\n" : "\n";
  const hadFinalLineEnding = /\r?\n$/.test(source);
  const lines = source.split(/\r?\n/);

  if (hadFinalLineEnding) {
    lines.pop();
  }

  const normalizedValue = String(Math.max(1, Math.round(value)));
  const exactIndex = findOptionLine(lines, option);
  if (exactIndex >= 0) {
    lines[exactIndex] = replaceOptionLine(lines[exactIndex], option, normalizedValue);
    return joinLines(lines, lineEnding, hadFinalLineEnding);
  }

  if (option === "view_height") {
    const legacyIndex = findOptionLine(lines, "height");
    if (legacyIndex >= 0) {
      lines[legacyIndex] = replaceOptionLine(lines[legacyIndex], option, normalizedValue);
      return joinLines(lines, lineEnding, hadFinalLineEnding);
    }
  }

  lines.splice(findInsertionIndex(lines, option), 0, `${option}: ${normalizedValue}`);
  return joinLines(lines, lineEnding, hadFinalLineEnding);
}

function findOptionLine(lines: string[], option: string): number {
  return lines.findIndex((line) => new RegExp(`^\\s*${option}\\s*:`).test(line));
}

function replaceOptionLine(line: string, option: GallerySizeOption, value: string): string {
  const indent = line.match(/^\s*/)?.[0] ?? "";
  return `${indent}${option}: ${value}`;
}

function findInsertionIndex(lines: string[], option: GallerySizeOption): number {
  if (option === "caption_height") {
    const viewHeightIndex = findOptionLine(lines, "view_height");
    if (viewHeightIndex >= 0) {
      return viewHeightIndex + 1;
    }

    const legacyHeightIndex = findOptionLine(lines, "height");
    if (legacyHeightIndex >= 0) {
      return legacyHeightIndex + 1;
    }
  }

  const galleryIdIndex = findOptionLine(lines, "gallery_id");
  return galleryIdIndex >= 0 ? galleryIdIndex + 1 : 0;
}

function joinLines(lines: string[], lineEnding: string, finalLineEnding: boolean): string {
  const joined = lines.join(lineEnding);
  return finalLineEnding ? `${joined}${lineEnding}` : joined;
}
