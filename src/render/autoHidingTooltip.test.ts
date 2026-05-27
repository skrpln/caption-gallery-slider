import { describe, expect, it, vi } from "vitest";
import {
  AUTO_HIDING_TOOLTIP_CLASS,
  registerAutoHidingTooltip,
  setTooltipLabel,
  TOOLTIP_VISIBLE_MS,
} from "./autoHidingTooltip";

class FakeTooltipElement extends EventTarget {
  readonly attributes = new Map<string, string>();

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  hasAttribute(name: string): boolean {
    return this.attributes.has(name);
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name);
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
}

describe("auto hiding tooltip labels", () => {
  it("registers the native tooltip hook immediately", () => {
    const element = new FakeTooltipElement() as unknown as HTMLElement;
    const setNativeTooltip = vi.fn();

    const handle = registerAutoHidingTooltip(element, "rotate", globalThis, setNativeTooltip);

    expect(setNativeTooltip).toHaveBeenCalledWith(element, "rotate");
    handle.destroy();
  });

  it("removes the visible tooltip label five seconds after hover", () => {
    vi.useFakeTimers();
    const element = new FakeTooltipElement() as unknown as HTMLElement;
    const handle = registerAutoHidingTooltip(element, "fullscreen");

    element.dispatchEvent(new Event("mouseenter"));
    expect(element.getAttribute("aria-label")).toBe("fullscreen");

    vi.advanceTimersByTime(TOOLTIP_VISIBLE_MS - 1);
    expect(element.getAttribute("aria-label")).toBe("fullscreen");

    vi.advanceTimersByTime(1);
    expect(element.hasAttribute("aria-label")).toBe(false);

    handle.destroy();
    vi.useRealTimers();
  });

  it("restores the accessible label when hover ends", () => {
    vi.useFakeTimers();
    const element = new FakeTooltipElement() as unknown as HTMLElement;
    const handle = registerAutoHidingTooltip(element, "caption");

    element.dispatchEvent(new Event("mouseenter"));
    vi.advanceTimersByTime(TOOLTIP_VISIBLE_MS);
    element.dispatchEvent(new Event("mouseleave"));

    expect(element.getAttribute("aria-label")).toBe("caption");

    handle.destroy();
    vi.useRealTimers();
  });

  it("keeps native titles disabled", () => {
    const element = new FakeTooltipElement() as unknown as HTMLElement;

    element.setAttribute("title", "caption");
    setTooltipLabel(element, "caption");

    expect(element.getAttribute("aria-label")).toBe("caption");
    expect(element.hasAttribute("title")).toBe(false);
  });

  it("removes a matching visible Obsidian tooltip after the lifetime", () => {
    vi.useFakeTimers();
    const tooltipEl = {
      classList: { contains: (className: string) => className === AUTO_HIDING_TOOLTIP_CLASS },
      remove: vi.fn(),
      textContent: "rotate",
    };
    const ownerDocument = {
      body: {},
      defaultView: undefined,
      querySelectorAll: vi.fn(() => [tooltipEl]),
    };
    const element = new FakeTooltipElement() as unknown as HTMLElement;
    Object.defineProperty(element, "ownerDocument", { value: ownerDocument });
    const handle = registerAutoHidingTooltip(element, "rotate");

    element.dispatchEvent(new Event("mouseenter"));
    vi.advanceTimersByTime(TOOLTIP_VISIBLE_MS);

    expect(tooltipEl.remove).toHaveBeenCalledOnce();

    handle.destroy();
    vi.useRealTimers();
  });
});
