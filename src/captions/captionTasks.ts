// Documentation: [[documentation/phase-2-captions]]

const TASK_LINE_PATTERN = /^(\s*(?:[-*+]|\d+[.)])\s+\[)([^\]])\]/;

export function countCaptionTasks(body: string): number {
  return body.split("\n").filter((line) => TASK_LINE_PATTERN.test(line)).length;
}

export function toggleCaptionTask(body: string, taskIndex: number, checked: boolean): string | null {
  if (!Number.isInteger(taskIndex) || taskIndex < 0) {
    return null;
  }

  const lines = body.split("\n");
  let seen = -1;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = line.match(TASK_LINE_PATTERN);
    if (!match) {
      continue;
    }

    seen += 1;
    if (seen !== taskIndex) {
      continue;
    }

    const marker = checked ? "x" : " ";
    if (match[2] === marker) {
      return body;
    }

    const prefix = match[1];
    lines[index] = `${prefix}${marker}${line.slice(prefix.length + 1)}`;
    return lines.join("\n");
  }

  return null;
}
