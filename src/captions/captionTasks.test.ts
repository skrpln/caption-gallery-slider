import { describe, expect, it } from "vitest";
import { countCaptionTasks, toggleCaptionTask } from "./captionTasks";

describe("countCaptionTasks", () => {
  it("counts only task lines", () => {
    const body = "intro\n- [ ] first\n- plain item\n- [x] second\n# heading";
    expect(countCaptionTasks(body)).toBe(2);
  });
});

describe("toggleCaptionTask", () => {
  it("checks the requested task", () => {
    const body = "- [ ] first\n- [ ] second";
    expect(toggleCaptionTask(body, 1, true)).toBe("- [ ] first\n- [x] second");
  });

  it("unchecks the requested task", () => {
    const body = "- [x] first\n- [x] second";
    expect(toggleCaptionTask(body, 0, false)).toBe("- [ ] first\n- [x] second");
  });

  it("keeps indentation, list markers, and trailing text", () => {
    const body = "  * [ ] nested task with [[link]]";
    expect(toggleCaptionTask(body, 0, true)).toBe("  * [x] nested task with [[link]]");
  });

  it("supports ordered list tasks", () => {
    const body = "1. [ ] ordered";
    expect(toggleCaptionTask(body, 0, true)).toBe("1. [x] ordered");
  });

  it("returns the same body when the state already matches", () => {
    const body = "- [x] done";
    expect(toggleCaptionTask(body, 0, true)).toBe(body);
  });

  it("returns null when the task index is out of range", () => {
    expect(toggleCaptionTask("- [ ] only", 3, true)).toBeNull();
    expect(toggleCaptionTask("no tasks here", 0, true)).toBeNull();
    expect(toggleCaptionTask("- [ ] only", -1, true)).toBeNull();
  });

  it("ignores non-task lines when counting the index", () => {
    const body = "note\n- plain\n- [ ] first\ntext\n- [ ] second";
    expect(toggleCaptionTask(body, 1, true)).toBe("note\n- plain\n- [ ] first\ntext\n- [x] second");
  });
});
