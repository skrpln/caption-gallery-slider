// Documentation: [[documentation/architecture]]

import { MarkdownRenderChild, setIcon } from "obsidian";
import type { GalleryConfig } from "../parser/galleryBlockParser";
import type { GalleryItem } from "../media/mediaTypes";
import { createGalleryState, goToIndex, nextIndex, previousIndex, type GalleryState } from "../state/galleryState";

export interface GalleryRendererOptions {
  config: GalleryConfig;
  items: GalleryItem[];
  getResourcePath(path: string): string | null;
}

export class GalleryRenderer extends MarkdownRenderChild {
  private readonly config: GalleryConfig;
  private readonly items: GalleryItem[];
  private readonly getResourcePath: (path: string) => string | null;
  private state: GalleryState;
  private rootEl: HTMLElement | null = null;
  private viewportEl: HTMLElement | null = null;
  private fullscreenButtonEl: HTMLButtonElement | null = null;
  private mediaEl: HTMLImageElement | null = null;
  private dotEls: HTMLButtonElement[] = [];
  private pointerStartX: number | null = null;
  private lastWheelNavigationAt = 0;
  private inputActive = false;

  constructor(containerEl: HTMLElement, options: GalleryRendererOptions) {
    super(containerEl);
    this.config = options.config;
    this.items = options.items;
    this.getResourcePath = options.getResourcePath;
    this.state = createGalleryState(options.items.length);
  }

  onload(): void {
    this.render();
  }

  private render(): void {
    this.containerEl.empty();

    const root = document.createElement("div");
    root.className = `og-gallery og-gallery--fit-${this.config.fit}`;
    root.style.height = `${this.config.height}px`;
    this.rootEl = root;
    this.containerEl.appendChild(root);

    if (this.items.length === 0) {
      root.appendChild(createMessage("No supported image files found."));
      return;
    }

    const fullscreenButton = this.createFullscreenButton();
    const navEl = this.createNavigation();
    const viewportEl = this.createViewport();
    const controlsEl = this.createControls();

    root.append(fullscreenButton, navEl, viewportEl, controlsEl);
    this.updateView();
  }

  private createFullscreenButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "og-gallery__fullscreen";
    button.setAttribute("aria-label", "Open gallery fullscreen");
    this.fullscreenButtonEl = button;
    this.updateFullscreenButtonIcon();
    this.registerDomEvent(button, "click", () => this.toggleFullscreen());
    this.registerDomEvent(document, "fullscreenchange", () => this.updateFullscreenButtonIcon());
    return button;
  }

  private createNavigation(): HTMLElement {
    const navEl = document.createElement("div");
    navEl.className = "og-gallery__nav";
    navEl.setAttribute("aria-label", "Gallery navigation");
    this.dotEls = [];

    this.items.forEach((item, index) => {
      const dotEl = document.createElement("button");
      dotEl.type = "button";
      dotEl.className = "og-gallery__dot";
      dotEl.setAttribute("aria-label", `Show ${item.name}`);
      this.registerDomEvent(dotEl, "click", () => this.goTo(index));
      navEl.appendChild(dotEl);
      this.dotEls.push(dotEl);
    });

    return navEl;
  }

  private createViewport(): HTMLElement {
    const viewportEl = document.createElement("div");
    viewportEl.className = "og-gallery__viewport";
    viewportEl.tabIndex = 0;
    viewportEl.setAttribute("aria-label", "Gallery viewport");
    this.viewportEl = viewportEl;

    this.mediaEl = document.createElement("img");
    this.mediaEl.className = "og-gallery__media";
    this.mediaEl.loading = "lazy";
    this.mediaEl.decoding = "async";

    this.registerDomEvent(viewportEl, "pointerdown", (event: PointerEvent) => {
      this.setInputActive(true);
      this.pointerStartX = event.clientX;
    });

    this.registerDomEvent(viewportEl, "click", () => this.setInputActive(true));

    this.registerDomEvent(document, "pointerdown", (event: PointerEvent) => {
      if (!this.rootEl || !(event.target instanceof Node)) {
        return;
      }

      this.setInputActive(this.rootEl.contains(event.target));
    });

    this.registerDomEvent(viewportEl, "wheel", (event: WheelEvent) => {
      if (!this.inputActive) {
        return;
      }

      const primaryDelta = Math.abs(event.deltaX) >= Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (Math.abs(primaryDelta) < 12) {
        return;
      }

      const now = Date.now();
      if (now - this.lastWheelNavigationAt < 220) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      this.lastWheelNavigationAt = now;
      if (primaryDelta > 0) {
        this.next();
      } else {
        this.previous();
      }
    });

    this.registerDomEvent(viewportEl, "pointerup", (event: PointerEvent) => {
      if (this.pointerStartX === null) {
        return;
      }

      const delta = event.clientX - this.pointerStartX;
      this.pointerStartX = null;

      if (Math.abs(delta) < 40) {
        return;
      }

      if (delta < 0) {
        this.next();
      } else {
        this.previous();
      }
    });

    viewportEl.append(this.mediaEl);
    return viewportEl;
  }

  private createControls(): HTMLElement {
    const controlsEl = document.createElement("div");
    controlsEl.className = "og-gallery__controls";

    const previousButton = createArrowButton("Previous image", "left");
    const nextButton = createArrowButton("Next image", "right");
    this.registerDomEvent(previousButton, "click", () => this.previous());
    this.registerDomEvent(nextButton, "click", () => this.next());

    controlsEl.append(previousButton, nextButton);
    return controlsEl;
  }

  private setInputActive(active: boolean): void {
    if (this.inputActive === active) {
      if (active) {
        this.viewportEl?.focus({ preventScroll: true });
      }
      return;
    }

    this.inputActive = active;
    if (active) {
      this.viewportEl?.focus({ preventScroll: true });
    }
  }

  private async toggleFullscreen(): Promise<void> {
    if (!this.rootEl) {
      return;
    }

    try {
      if (document.fullscreenElement === this.rootEl) {
        await document.exitFullscreen();
        this.updateFullscreenButtonIcon();
        return;
      }

      await this.rootEl.requestFullscreen();
      this.setInputActive(true);
      this.updateFullscreenButtonIcon();
    } catch {
      // Fullscreen can be blocked by the host app or OS permissions.
    }
  }

  private updateFullscreenButtonIcon(): void {
    if (!this.fullscreenButtonEl) {
      return;
    }

    this.fullscreenButtonEl.empty();
    const isFullscreen = document.fullscreenElement === this.rootEl;
    this.fullscreenButtonEl.setAttribute(
      "aria-label",
      isFullscreen ? "Exit gallery fullscreen" : "Open gallery fullscreen",
    );
    setIcon(this.fullscreenButtonEl, isFullscreen ? "minimize-2" : "maximize-2");
  }

  private next(): void {
    this.state.currentIndex = nextIndex(this.state);
    this.updateView();
  }

  private previous(): void {
    this.state.currentIndex = previousIndex(this.state);
    this.updateView();
  }

  private goTo(index: number): void {
    this.state.currentIndex = goToIndex(this.state, index);
    this.updateView();
  }

  private updateView(): void {
    const item = this.items[this.state.currentIndex];

    if (!item || !this.mediaEl) {
      return;
    }

    const resourcePath = this.getResourcePath(item.path);
    if (!resourcePath) {
      this.mediaEl.removeAttribute("src");
      this.mediaEl.alt = `Unable to load ${item.name}`;
      return;
    }

    this.mediaEl.src = resourcePath;
    this.mediaEl.alt = item.name;

    this.dotEls.forEach((dotEl, index) => {
      dotEl.classList.toggle("is-active", index === this.state.currentIndex);
      dotEl.setAttribute("aria-current", index === this.state.currentIndex ? "true" : "false");
    });
  }
}

function createArrowButton(label: string, direction: "left" | "right"): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `og-gallery__arrow og-gallery__arrow--${direction === "left" ? "previous" : "next"}`;
  button.setAttribute("aria-label", label);

  for (let index = 0; index < 3; index += 1) {
    const iconEl = document.createElement("span");
    iconEl.className = "og-gallery__arrow-icon";
    setIcon(iconEl, direction === "left" ? "chevron-left" : "chevron-right");
    button.appendChild(iconEl);
  }

  return button;
}

function createMessage(message: string): HTMLElement {
  const messageEl = document.createElement("div");
  messageEl.className = "og-gallery__message";
  messageEl.textContent = message;
  return messageEl;
}
