// Documentation: [[documentation/phase-3-top-navigation]]

export const TOOLTIP_VISIBLE_MS = 5000;
export const AUTO_HIDING_TOOLTIP_CLASS = "og-gallery__tooltip";

export interface AutoHidingTooltipHandle {
  destroy(): void;
  hide(): void;
  restore(): void;
}

export type NativeTooltipSetter = (element: HTMLElement, label: string) => void;

interface TimerApi {
  clearTimeout(timeoutId: ReturnType<typeof setTimeout>): void;
  setTimeout(callback: () => void, delay: number): ReturnType<typeof setTimeout>;
}

export function setTooltipLabel(element: HTMLElement, label: string): void {
  element.setAttribute("aria-label", label);
  element.removeAttribute("title");
}

export function registerAutoHidingTooltip(
  element: HTMLElement,
  label: string,
  timers: TimerApi = globalThis,
  setNativeTooltip?: NativeTooltipSetter,
): AutoHidingTooltipHandle {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const clearTimer = (): void => {
    if (timeoutId !== null) {
      timers.clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const hide = (): void => {
    element.removeAttribute("aria-label");
    element.removeAttribute("title");
    closeVisibleTooltip(element, label);
    timeoutId = null;
  };

  const restore = (): void => {
    clearTimer();
    setTooltipLabel(element, label);
    setNativeTooltip?.(element, label);
  };

  const scheduleHide = (): void => {
    restore();
    timeoutId = timers.setTimeout(hide, TOOLTIP_VISIBLE_MS);
  };

  restore();
  element.addEventListener("mouseenter", scheduleHide);
  element.addEventListener("focus", scheduleHide);
  element.addEventListener("mouseleave", restore);
  element.addEventListener("blur", restore);

  return {
    destroy(): void {
      clearTimer();
      element.removeEventListener("mouseenter", scheduleHide);
      element.removeEventListener("focus", scheduleHide);
      element.removeEventListener("mouseleave", restore);
      element.removeEventListener("blur", restore);
    },
    hide,
    restore,
  };
}

function closeVisibleTooltip(element: HTMLElement, label: string): void {
  const ownerDocument = element.ownerDocument;
  if (!ownerDocument) {
    return;
  }

  const MouseEventCtor = ownerDocument.defaultView?.MouseEvent;
  if (MouseEventCtor) {
    element.dispatchEvent(new MouseEventCtor("mouseout", { bubbles: true, relatedTarget: ownerDocument.body }));
  }

  ownerDocument.querySelectorAll(".tooltip").forEach((tooltipEl) => {
    const text = tooltipEl.textContent?.trim();
    if (tooltipEl.classList.contains(AUTO_HIDING_TOOLTIP_CLASS) || text === label) {
      tooltipEl.remove();
    }
  });
}
