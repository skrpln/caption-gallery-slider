// Documentation: [[documentation/architecture]]

import { MarkdownRenderChild } from "obsidian";
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
  private mediaEl: HTMLImageElement | null = null;
  private dotEls: HTMLButtonElement[] = [];
  private pointerStartX: number | null = null;

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
    root.className = "og-gallery";
    root.style.height = `${this.config.height}px`;
    this.containerEl.appendChild(root);

    if (this.items.length === 0) {
      root.appendChild(createMessage("No supported image files found."));
      return;
    }

    const navEl = this.createNavigation();
    const viewportEl = this.createViewport();

    root.append(navEl, viewportEl);
    this.updateView();
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

    const previousButton = createArrowButton("Previous image", "<", "og-gallery__arrow--previous");
    const nextButton = createArrowButton("Next image", ">", "og-gallery__arrow--next");
    this.registerDomEvent(previousButton, "click", () => this.previous());
    this.registerDomEvent(nextButton, "click", () => this.next());

    this.mediaEl = document.createElement("img");
    this.mediaEl.className = "og-gallery__media";
    this.mediaEl.loading = "lazy";
    this.mediaEl.decoding = "async";

    this.registerDomEvent(viewportEl, "pointerdown", (event: PointerEvent) => {
      this.pointerStartX = event.clientX;
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

    viewportEl.append(this.mediaEl, previousButton, nextButton);
    return viewportEl;
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

function createArrowButton(label: string, text: string, modifierClass: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `og-gallery__arrow ${modifierClass}`;
  button.setAttribute("aria-label", label);
  button.textContent = text;
  return button;
}

function createMessage(message: string): HTMLElement {
  const messageEl = document.createElement("div");
  messageEl.className = "og-gallery__message";
  messageEl.textContent = message;
  return messageEl;
}
