// Documentation: [[documentation/architecture]]

import { MarkdownRenderChild, setIcon, setTooltip } from "obsidian";
import type { GalleryConfig } from "../parser/galleryBlockParser";
import type { GalleryItem } from "../media/mediaTypes";
import { createGalleryState, goToIndex, nextIndex, previousIndex, type GalleryState } from "../state/galleryState";
import type { CaptionState } from "../captions/obsidianCaptionService";
import {
  chooseTopNavigationLayout,
  navigationPointerToIndex,
  type TopNavigationLayout,
} from "./navigationLayout";
import {
  AUTO_HIDING_TOOLTIP_CLASS,
  registerAutoHidingTooltip,
  setTooltipLabel,
} from "./autoHidingTooltip";

export interface GalleryRendererOptions {
  config: GalleryConfig;
  items: GalleryItem[];
  getResourcePath(path: string): string | null;
  getCaption?(item: GalleryItem): Promise<CaptionState>;
  saveCaption?(item: GalleryItem, body: string): Promise<CaptionState>;
  rotateCaption?(item: GalleryItem, rotation: number): Promise<CaptionState>;
  openCaption?(item: GalleryItem): Promise<void>;
  renderCaptionMarkdown?(
    markdown: string,
    containerEl: HTMLElement,
    sourcePath: string,
    component: MarkdownRenderChild,
  ): Promise<void>;
}

export class GalleryRenderer extends MarkdownRenderChild {
  private readonly config: GalleryConfig;
  private readonly items: GalleryItem[];
  private readonly getResourcePath: (path: string) => string | null;
  private readonly getCaption: ((item: GalleryItem) => Promise<CaptionState>) | null;
  private readonly saveCaption: ((item: GalleryItem, body: string) => Promise<CaptionState>) | null;
  private readonly rotateCaption: ((item: GalleryItem, rotation: number) => Promise<CaptionState>) | null;
  private readonly openCaption: ((item: GalleryItem) => Promise<void>) | null;
  private readonly renderCaptionMarkdown: GalleryRendererOptions["renderCaptionMarkdown"] | null;
  private state: GalleryState;
  private rootEl: HTMLElement | null = null;
  private viewportEl: HTMLElement | null = null;
  private captionEl: HTMLElement | null = null;
  private captionContentEl: HTMLElement | null = null;
  private captionOpenButtonEl: HTMLButtonElement | null = null;
  private captionState: CaptionState | null = null;
  private fullscreenButtonEl: HTMLButtonElement | null = null;
  private rotateButtonEl: HTMLButtonElement | null = null;
  private mediaEl: HTMLImageElement | null = null;
  private navEl: HTMLElement | null = null;
  private navRailEl: HTMLElement | null = null;
  private navThumbEl: HTMLElement | null = null;
  private dotEls: HTMLButtonElement[] = [];
  private previewButtonEls: HTMLButtonElement[] = [];
  private navigationLayout: TopNavigationLayout = "dots";
  private navigationResizeObserver: ResizeObserver | null = null;
  private draggingNavigation = false;
  private pointerStartX: number | null = null;
  private lastWheelNavigationAt = 0;
  private currentRotation = 0;
  private inputActive = false;
  private captionEditing = false;
  private captionRenderToken = 0;
  private captionSaveToken = 0;

  constructor(containerEl: HTMLElement, options: GalleryRendererOptions) {
    super(containerEl);
    this.config = options.config;
    this.items = options.items;
    this.getResourcePath = options.getResourcePath;
    this.getCaption = options.getCaption ?? null;
    this.saveCaption = options.saveCaption ?? null;
    this.rotateCaption = options.rotateCaption ?? null;
    this.openCaption = options.openCaption ?? null;
    this.renderCaptionMarkdown = options.renderCaptionMarkdown ?? null;
    this.state = createGalleryState(options.items.length);
  }

  onload(): void {
    this.render();
  }

  private render(): void {
    this.containerEl.empty();

    const root = document.createElement("div");
    root.className = `og-gallery og-gallery--view-${this.config.view}`;
    root.style.setProperty("--og-view-height", `${this.config.viewHeight}px`);
    root.style.setProperty("--og-caption-height", `${this.config.captionHeight}px`);
    this.rootEl = root;
    this.containerEl.appendChild(root);

    if (this.items.length === 0) {
      root.appendChild(createMessage("No supported image files found."));
      return;
    }

    const navEl = this.createNavigation();
    const viewportEl = this.createViewport();
    const controlsEl = this.createControls();
    const captionEl = this.config.caption ? this.createCaption() : null;

    viewportEl.appendChild(navEl);
    root.append(viewportEl, controlsEl);
    if (captionEl) {
      root.appendChild(captionEl);
    }
    this.updateView();
  }

  private createFullscreenButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "og-gallery__fullscreen";
    this.setButtonLabel(button, "fullscreen");
    button.textContent = "⛶";
    this.fullscreenButtonEl = button;
    this.registerDomEvent(button, "click", () => this.toggleFullscreen());
    return button;
  }

  private createRotateButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "og-gallery__rotate";
    this.setButtonLabel(button, "rotate");
    button.textContent = "↻";
    this.rotateButtonEl = button;
    this.registerDomEvent(button, "click", (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      void this.rotateCurrentMedia();
    });
    return button;
  }

  private createNavigation(): HTMLElement {
    const navEl = document.createElement("div");
    navEl.className = "og-gallery__nav";
    this.setAccessibleTooltip(navEl, "gallery navigation");
    this.navEl = navEl;
    this.dotEls = [];
    this.previewButtonEls = [];

    const previewEl = document.createElement("div");
    previewEl.className = "og-gallery__preview";
    this.registerDomEvent(previewEl, "wheel", (event: WheelEvent) => {
      const primaryDelta = Math.abs(event.deltaX) >= Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (Math.abs(primaryDelta) < 1) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      previewEl.scrollLeft += primaryDelta;
    });

    this.items.forEach((item, index) => {
      const previewButtonEl = document.createElement("button");
      previewButtonEl.type = "button";
      previewButtonEl.className = "og-gallery__preview-item";
      this.setButtonLabel(previewButtonEl, `item ${index + 1}`);
      this.registerDomEvent(previewButtonEl, "click", () => this.goTo(index));

      const resourcePath = item.kind === "image" ? this.getResourcePath(item.path) : null;
      if (resourcePath) {
        const imageEl = document.createElement("img");
        imageEl.src = resourcePath;
        imageEl.alt = "";
        imageEl.loading = "lazy";
        imageEl.decoding = "async";
        previewButtonEl.appendChild(imageEl);
      } else {
        const placeholderEl = document.createElement("span");
        placeholderEl.textContent = item.kind === "video" ? "vid" : item.name.slice(0, 3);
        previewButtonEl.appendChild(placeholderEl);
      }

      previewEl.appendChild(previewButtonEl);
      this.previewButtonEls.push(previewButtonEl);
    });

    this.items.forEach((_item, index) => {
      const dotEl = document.createElement("button");
      dotEl.type = "button";
      dotEl.className = "og-gallery__dot";
      this.setButtonLabel(dotEl, `item ${index + 1}`);
      this.registerDomEvent(dotEl, "click", () => this.goTo(index));
      navEl.appendChild(dotEl);
      this.dotEls.push(dotEl);
    });

    const railEl = document.createElement("div");
    railEl.className = "og-gallery__nav-rail";
    railEl.setAttribute("role", "slider");
    this.setAccessibleTooltip(railEl, "gallery position");
    railEl.setAttribute("aria-valuemin", "1");
    railEl.setAttribute("aria-valuemax", String(this.items.length));
    railEl.tabIndex = 0;

    const thumbEl = document.createElement("div");
    thumbEl.className = "og-gallery__nav-thumb";
    railEl.appendChild(thumbEl);
    navEl.appendChild(railEl);
    this.navRailEl = railEl;
    this.navThumbEl = thumbEl;

    this.registerDomEvent(railEl, "pointerdown", (event: PointerEvent) => {
      event.preventDefault();
      this.draggingNavigation = true;
      railEl.setPointerCapture(event.pointerId);
      this.goToIndexFromNavigationPointer(event);
    });

    this.registerDomEvent(railEl, "pointermove", (event: PointerEvent) => {
      if (!this.draggingNavigation) {
        return;
      }

      event.preventDefault();
      this.goToIndexFromNavigationPointer(event);
    });

    this.registerDomEvent(railEl, "pointerup", (event: PointerEvent) => {
      this.draggingNavigation = false;
      if (railEl.hasPointerCapture(event.pointerId)) {
        railEl.releasePointerCapture(event.pointerId);
      }
    });

    this.registerDomEvent(railEl, "pointercancel", (event: PointerEvent) => {
      this.draggingNavigation = false;
      if (railEl.hasPointerCapture(event.pointerId)) {
        railEl.releasePointerCapture(event.pointerId);
      }
    });

    this.registerDomEvent(railEl, "keydown", (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        this.previous();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        this.next();
      }
    });

    this.observeNavigationSize();
    this.updateNavigationLayout();
    navEl.prepend(previewEl);
    return navEl;
  }

  private createViewport(): HTMLElement {
    const viewportEl = document.createElement("div");
    viewportEl.className = "og-gallery__viewport";
    viewportEl.tabIndex = 0;
    this.setAccessibleTooltip(viewportEl, "gallery viewport");
    this.viewportEl = viewportEl;

    this.mediaEl = document.createElement("img");
    this.mediaEl.className = "og-gallery__media";
    this.mediaEl.loading = "lazy";
    this.mediaEl.decoding = "async";
    const fullscreenButton = this.createFullscreenButton();
    const rotateButton = this.createRotateButton();

    this.registerDomEvent(viewportEl, "pointerdown", (event: PointerEvent) => {
      this.setInputActive(true);
      this.pointerStartX = event.clientX;
    });

    this.registerDomEvent(viewportEl, "click", () => this.setInputActive(true));

    this.registerDomEvent(document, "pointerdown", (event: PointerEvent) => {
      if (!this.viewportEl || !(event.target instanceof Node)) {
        return;
      }

      this.setInputActive(this.viewportEl.contains(event.target));
    });

    this.registerDomEvent(viewportEl, "wheel", (event: WheelEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest(".og-gallery__preview")) {
        return;
      }

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

    viewportEl.append(this.mediaEl, fullscreenButton, rotateButton);
    return viewportEl;
  }

  private createControls(): HTMLElement {
    const controlsEl = document.createElement("div");
    controlsEl.className = "og-gallery__controls";

    const previousButton = createArrowButton("previous", "left");
    const nextButton = createArrowButton("next", "right");
    this.setAccessibleTooltip(previousButton, "previous");
    this.setAccessibleTooltip(nextButton, "next");
    this.registerDomEvent(previousButton, "click", () => this.previous());
    this.registerDomEvent(nextButton, "click", () => this.next());

    controlsEl.append(previousButton, nextButton);
    return controlsEl;
  }

  private createCaption(): HTMLElement {
    const captionEl = document.createElement("div");
    captionEl.className = "og-gallery__caption";
    this.setAccessibleTooltip(captionEl, "gallery caption");
    this.captionEl = captionEl;

    const contentEl = document.createElement("div");
    contentEl.className = "og-gallery__caption-content";
    contentEl.tabIndex = 0;
    this.captionContentEl = contentEl;

    const openButtonEl = document.createElement("button");
    openButtonEl.type = "button";
    openButtonEl.className = "og-gallery__caption-open";
    this.setButtonLabel(openButtonEl, "caption");
    setIcon(openButtonEl, "file-text");
    this.captionOpenButtonEl = openButtonEl;

    this.registerDomEvent(contentEl, "click", (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("a.internal-link")) {
        return;
      }

      this.startCaptionEditing();
    });

    this.registerDomEvent(contentEl, "input", () => {
      void this.saveCaptionEdit();
    });

    this.registerDomEvent(contentEl, "blur", () => {
      void this.finishCaptionEditing();
    });

    this.registerDomEvent(openButtonEl, "click", (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      void this.openCurrentCaption();
    });

    captionEl.append(contentEl, openButtonEl);
    return captionEl;
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
        return;
      }

      await this.rootEl.requestFullscreen();
      this.setInputActive(true);
    } catch {
      // Fullscreen can be blocked by the host app or OS permissions.
    }
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

  private observeNavigationSize(): void {
    if (!this.navEl || !this.rootEl || typeof ResizeObserver === "undefined") {
      return;
    }

    this.navigationResizeObserver?.disconnect();
    this.navigationResizeObserver = new ResizeObserver(() => {
      this.updateNavigationLayout();
      this.applyRotation(this.currentRotation);
    });
    this.navigationResizeObserver.observe(this.rootEl);
    this.register(() => {
      this.navigationResizeObserver?.disconnect();
      this.navigationResizeObserver = null;
    });
  }

  private updateNavigationLayout(): void {
    if (!this.navEl) {
      return;
    }

    const nextLayout = chooseTopNavigationLayout(
      this.config.navigation,
      this.items.length,
      this.getNavigationAvailableWidth(),
    );
    this.navigationLayout = nextLayout;
    this.navEl.classList.toggle("is-rail", nextLayout === "rail");
    this.navEl.classList.toggle("is-dots", nextLayout === "dots");
    this.navEl.classList.toggle("is-preview", nextLayout === "preview");
    this.updateNavigationPosition();
  }

  private getNavigationAvailableWidth(): number {
    const rootWidth = this.rootEl?.clientWidth ?? 0;
    if (rootWidth > 0) {
      return Math.max(0, rootWidth - 96);
    }

    return this.navEl?.clientWidth ?? 0;
  }

  private updateNavigationPosition(): void {
    if (!this.navRailEl || !this.navThumbEl) {
      return;
    }

    const maxIndex = Math.max(0, this.items.length - 1);
    const progress = maxIndex === 0 ? 0 : this.state.currentIndex / maxIndex;
    this.navThumbEl.style.setProperty("--og-nav-progress", String(progress));
    this.navRailEl.setAttribute("aria-valuenow", String(this.state.currentIndex + 1));
  }

  private goToIndexFromNavigationPointer(event: PointerEvent): void {
    if (!this.navRailEl || this.items.length <= 1) {
      return;
    }

    const rect = this.navRailEl.getBoundingClientRect();
    this.goTo(navigationPointerToIndex(this.items.length, event.clientX - rect.left, rect.width));
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
    this.applyRotation(0);

    this.dotEls.forEach((dotEl, index) => {
      dotEl.classList.toggle("is-active", index === this.state.currentIndex);
      dotEl.setAttribute("aria-current", index === this.state.currentIndex ? "true" : "false");
    });
    this.previewButtonEls.forEach((buttonEl, index) => {
      const active = index === this.state.currentIndex;
      buttonEl.classList.toggle("is-active", active);
      buttonEl.setAttribute("aria-current", active ? "true" : "false");
      if (active && this.navigationLayout === "preview") {
        buttonEl.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    });
    this.updateNavigationPosition();

    void this.updateCaption(item);
  }

  private async updateCaption(item: GalleryItem): Promise<void> {
    if (!this.captionEl || !this.captionContentEl) {
      return;
    }

    const token = (this.captionRenderToken += 1);
    this.captionEditing = false;
    this.captionState = null;
    this.captionContentEl.contentEditable = "false";
    this.captionContentEl.classList.remove("markdown-rendered");
    this.captionContentEl.removeAttribute("data-placeholder");
    this.captionContentEl.empty();
    this.captionContentEl.textContent = "Loading caption...";
    this.captionEl.classList.remove("is-disabled", "is-editing", "is-empty");
    this.captionOpenButtonEl?.classList.add("is-hidden");

    const caption = await this.getCaption?.(item);
    if (token !== this.captionRenderToken || !this.captionEl || !this.captionContentEl) {
      return;
    }

    this.captionState = caption ?? {
      status: "unconfigured",
      path: null,
      body: "",
      exists: false,
      rotation: 0,
    };

    if (!caption || caption.status === "unconfigured") {
      delete this.captionEl.dataset.captionPath;
      this.captionEl.classList.add("is-disabled", "is-empty");
      this.captionContentEl.empty();
      appendEmphasisLine(this.captionContentEl, "choose directory for gallery captions storage");
      appendEmphasisLine(this.captionContentEl, "Settings > Community plugins > Obsidian Gallery > Caption folder");
      this.applyRotation(0);
      return;
    }

    this.applyRotation(caption.rotation);
    this.captionEl.dataset.captionPath = caption.path;
    this.captionOpenButtonEl?.classList.remove("is-hidden");

    if (!caption.body) {
      this.captionEl.classList.add("is-empty");
      this.captionContentEl.empty();
      const placeholderEl = document.createElement("em");
      placeholderEl.textContent = "insert caption";
      this.captionContentEl.appendChild(placeholderEl);
      return;
    }

    this.captionEl.classList.remove("is-empty");
    this.captionContentEl.empty();

    if (this.renderCaptionMarkdown) {
      await this.renderCaptionMarkdown(caption.body, this.captionContentEl, caption.path, this);
      return;
    }

    this.captionContentEl.textContent = caption.body;
  }

  private startCaptionEditing(): void {
    const item = this.items[this.state.currentIndex];
    if (!this.captionEl || !this.captionContentEl || !item || this.captionEditing) {
      return;
    }

    if (!this.captionState || this.captionState.status === "unconfigured") {
      return;
    }

    this.captionEditing = true;
    this.captionEl.classList.add("is-editing");
    this.captionEl.classList.remove("is-empty");
    this.captionContentEl.contentEditable = "true";
    this.captionContentEl.classList.remove("markdown-rendered");
    this.captionContentEl.empty();
    this.captionContentEl.textContent = this.captionState.body;
    this.captionContentEl.focus({ preventScroll: true });
    placeCaretAtEnd(this.captionContentEl);
  }

  private async saveCaptionEdit(): Promise<void> {
    const item = this.items[this.state.currentIndex];
    if (!this.captionEditing || !this.captionContentEl || !item || !this.saveCaption || !this.captionState) {
      return;
    }

    if (this.captionState.status === "unconfigured") {
      return;
    }

    const body = readEditableText(this.captionContentEl);
    if (!this.captionState.exists && body.length === 0) {
      return;
    }

    const token = (this.captionSaveToken += 1);
    const nextState = await this.saveCaption(item, body);
    if (token !== this.captionSaveToken) {
      return;
    }

    this.captionState = nextState;
    this.captionOpenButtonEl?.classList.remove("is-hidden");
    if (this.captionEl && nextState.path) {
      this.captionEl.dataset.captionPath = nextState.path;
    }
  }

  private async finishCaptionEditing(): Promise<void> {
    if (!this.captionEditing) {
      return;
    }

    this.captionEditing = false;
    this.captionEl?.classList.remove("is-editing");
    if (this.captionContentEl) {
      this.captionContentEl.contentEditable = "false";
    }

    const item = this.items[this.state.currentIndex];
    if (item) {
      await this.updateCaption(item);
    }
  }

  private async openCurrentCaption(): Promise<void> {
    const item = this.items[this.state.currentIndex];
    if (!item || !this.openCaption) {
      return;
    }

    await this.openCaption(item);
  }

  private async rotateCurrentMedia(): Promise<void> {
    const item = this.items[this.state.currentIndex];
    if (!item || !this.rotateCaption) {
      return;
    }

    const currentRotation = this.captionState?.rotation ?? 0;
    const nextRotation = (currentRotation + 90) % 360;
    this.applyRotation(nextRotation);
    const nextState = await this.rotateCaption(item, nextRotation);
    if (nextState.status === "unconfigured") {
      this.applyRotation(0);
      return;
    }

    this.captionState = nextState;
    this.applyRotation(nextState.rotation);
    this.captionOpenButtonEl?.classList.remove("is-hidden");
    if (this.captionEl && nextState.path) {
      this.captionEl.dataset.captionPath = nextState.path;
    }
  }

  private applyRotation(rotation: number): void {
    if (!this.mediaEl) {
      return;
    }

    this.currentRotation = rotation;
    this.mediaEl.style.setProperty("--og-media-rotation", `${rotation}deg`);
    const rotatedQuarter = rotation % 180 !== 0;
    this.mediaEl.classList.toggle("is-rotated-quarter", rotatedQuarter);

    if (rotatedQuarter && this.viewportEl) {
      this.mediaEl.style.setProperty("--og-media-box-width", `${this.viewportEl.clientHeight}px`);
      this.mediaEl.style.setProperty("--og-media-box-height", `${this.viewportEl.clientWidth}px`);
    } else {
      this.mediaEl.style.removeProperty("--og-media-box-width");
      this.mediaEl.style.removeProperty("--og-media-box-height");
    }
  }

  private setButtonLabel(button: HTMLButtonElement, label: string): void {
    setButtonLabel(button, label);
    this.setAccessibleTooltip(button, label);
  }

  private setAccessibleTooltip(element: HTMLElement, label: string): void {
    const tooltip = registerAutoHidingTooltip(element, label, window, (targetEl, tooltipLabel) => {
      setTooltip(targetEl, tooltipLabel, { classes: [AUTO_HIDING_TOOLTIP_CLASS] });
    });
    this.register(tooltip.destroy);
  }
}

function createArrowButton(label: string, direction: "left" | "right"): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `og-gallery__arrow og-gallery__arrow--${direction === "left" ? "previous" : "next"}`;
  setButtonLabel(button, label);

  for (let index = 0; index < 3; index += 1) {
    const iconEl = document.createElement("span");
    iconEl.className = "og-gallery__arrow-icon";
    setIcon(iconEl, direction === "left" ? "chevron-left" : "chevron-right");
    button.appendChild(iconEl);
  }

  return button;
}

function setButtonLabel(button: HTMLButtonElement, label: string): void {
  setTooltipLabel(button, label);
}

function createMessage(message: string): HTMLElement {
  const messageEl = document.createElement("div");
  messageEl.className = "og-gallery__message";
  messageEl.textContent = message;
  return messageEl;
}

function appendEmphasisLine(containerEl: HTMLElement, text: string): void {
  const lineEl = document.createElement("div");
  const emphasisEl = document.createElement("em");
  emphasisEl.textContent = text;
  lineEl.appendChild(emphasisEl);
  containerEl.appendChild(lineEl);
}

function readEditableText(contentEl: HTMLElement): string {
  return contentEl.innerText.replace(/\n$/, "");
}

function placeCaretAtEnd(contentEl: HTMLElement): void {
  const selection = window.getSelection();
  if (!selection) {
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(contentEl);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}
