// Documentation: [[documentation/architecture]], [[documentation/phase-4-video]], [[documentation/widget-size-controls]], [[documentation/keyboard-navigation-backlog]]

import { MarkdownRenderChild, setIcon, setTooltip } from "obsidian";
import type { GalleryConfig } from "../parser/galleryBlockParser";
import type { GallerySizeOption } from "../parser/galleryBlockEditor";
import type { GalleryItem } from "../media/mediaTypes";
import { createGalleryState, goToIndex, nextIndex, previousIndex, type GalleryState } from "../state/galleryState";
import type { CaptionState } from "../captions/obsidianCaptionService";
import { DEFAULT_VIDEO_PLAYBACK, type CaptionVideoPlayback } from "../captions/captionMarkdown";
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
import type { GalleryKeyboardTarget } from "./keyboardNavigation";
import {
  clampVideoRangeEdge,
  formatVideoProgressTime,
  normalizeVideoTimeRange,
  videoProgressPointerTime,
  videoTimeToProgress,
  type VideoTimeRange,
} from "./videoProgressTime";

export interface GalleryRendererOptions {
  config: GalleryConfig;
  items: GalleryItem[];
  getResourcePath(path: string): string | null;
  getCaption?(item: GalleryItem): Promise<CaptionState>;
  saveCaption?(item: GalleryItem, body: string): Promise<CaptionState>;
  rotateCaption?(item: GalleryItem, rotation: number): Promise<CaptionState>;
  saveVideoPlayback?(item: GalleryItem, playback: CaptionVideoPlayback): Promise<CaptionState>;
  openCaption?(item: GalleryItem): Promise<void>;
  saveSizeOption?(option: GallerySizeOption, value: number): Promise<void>;
  renderCaptionMarkdown?(
    markdown: string,
    containerEl: HTMLElement,
    sourcePath: string,
    component: MarkdownRenderChild,
  ): Promise<void>;
  activateKeyboardTarget?(target: GalleryKeyboardTarget): void;
}

interface GalleryResizeState {
  option: GallerySizeOption;
  pointerId: number;
  handleEl: HTMLElement;
  startY: number;
  startHeight: number;
}

type VideoRangeEdge = "start" | "end";

const MIN_VIEW_HEIGHT = 120;
const MIN_CAPTION_HEIGHT = 28;
const MAX_GALLERY_SIZE = 1400;
let videoProgressLabelId = 0;

export class GalleryRenderer extends MarkdownRenderChild implements GalleryKeyboardTarget {
  private readonly config: GalleryConfig;
  private readonly items: GalleryItem[];
  private readonly getResourcePath: (path: string) => string | null;
  private readonly getCaption: ((item: GalleryItem) => Promise<CaptionState>) | null;
  private readonly saveCaption: ((item: GalleryItem, body: string) => Promise<CaptionState>) | null;
  private readonly rotateCaption: ((item: GalleryItem, rotation: number) => Promise<CaptionState>) | null;
  private readonly saveVideoPlayback: ((item: GalleryItem, playback: CaptionVideoPlayback) => Promise<CaptionState>) | null;
  private readonly openCaption: ((item: GalleryItem) => Promise<void>) | null;
  private readonly saveSizeOption: ((option: GallerySizeOption, value: number) => Promise<void>) | null;
  private readonly renderCaptionMarkdown: GalleryRendererOptions["renderCaptionMarkdown"] | null;
  private readonly activateKeyboardTarget: ((target: GalleryKeyboardTarget) => void) | null;
  private state: GalleryState;
  private rootEl: HTMLElement | null = null;
  private viewportEl: HTMLElement | null = null;
  private captionEl: HTMLElement | null = null;
  private captionContentEl: HTMLElement | null = null;
  private captionOpenButtonEl: HTMLButtonElement | null = null;
  private captionState: CaptionState | null = null;
  private fullscreenButtonEl: HTMLButtonElement | null = null;
  private rotateButtonEl: HTMLButtonElement | null = null;
  private mediaEl: HTMLImageElement | HTMLVideoElement | null = null;
  private videoControlsEl: HTMLElement | null = null;
  private videoPlayButtonEl: HTMLButtonElement | null = null;
  private videoMuteButtonEl: HTMLButtonElement | null = null;
  private videoLoopButtonEl: HTMLButtonElement | null = null;
  private videoProgressEl: HTMLElement | null = null;
  private videoProgressRangeEl: HTMLElement | null = null;
  private videoProgressStartHandleEl: HTMLElement | null = null;
  private videoProgressEndHandleEl: HTMLElement | null = null;
  private videoProgressTooltipEl: HTMLElement | null = null;
  private navEl: HTMLElement | null = null;
  private navRailEl: HTMLElement | null = null;
  private navThumbEl: HTMLElement | null = null;
  private dotEls: HTMLButtonElement[] = [];
  private previewButtonEls: HTMLButtonElement[] = [];
  private navigationLayout: TopNavigationLayout = "dots";
  private navigationResizeObserver: ResizeObserver | null = null;
  private draggingNavigation = false;
  private draggingVideoProgress = false;
  private draggingVideoRangeEdge: VideoRangeEdge | null = null;
  private pointerStartX: number | null = null;
  private lastWheelNavigationAt = 0;
  private currentRotation = 0;
  private currentPlayback: CaptionVideoPlayback = DEFAULT_VIDEO_PLAYBACK;
  private inputActive = false;
  private pointerInside = false;
  private captionEditing = false;
  private captionRenderToken = 0;
  private captionSaveToken = 0;
  private resizeState: GalleryResizeState | null = null;

  constructor(containerEl: HTMLElement, options: GalleryRendererOptions) {
    super(containerEl);
    this.config = options.config;
    this.items = options.items;
    this.getResourcePath = options.getResourcePath;
    this.getCaption = options.getCaption ?? null;
    this.saveCaption = options.saveCaption ?? null;
    this.rotateCaption = options.rotateCaption ?? null;
    this.saveVideoPlayback = options.saveVideoPlayback ?? null;
    this.openCaption = options.openCaption ?? null;
    this.saveSizeOption = options.saveSizeOption ?? null;
    this.renderCaptionMarkdown = options.renderCaptionMarkdown ?? null;
    this.activateKeyboardTarget = options.activateKeyboardTarget ?? null;
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
    this.registerRootActivation(root);

    if (this.items.length === 0) {
      root.appendChild(createMessage("No supported media files found."));
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

  private registerRootActivation(root: HTMLElement): void {
    this.registerDomEvent(root, "focusin", () => {
      this.setInputActive(true);
      this.activateKeyboardTarget?.(this);
    });

    this.registerDomEvent(root, "pointerenter", () => {
      this.pointerInside = true;
      this.activateKeyboardTarget?.(this);
    });

    this.registerDomEvent(root, "pointerover", () => {
      this.pointerInside = true;
      this.activateKeyboardTarget?.(this);
    });

    this.registerDomEvent(root, "pointerleave", () => {
      this.pointerInside = false;
    });

    this.registerDomEvent(root, "pointerdown", () => {
      this.setInputActive(true);
      this.activateKeyboardTarget?.(this);
    });

    this.registerDomEvent(document, "pointerdown", (event: PointerEvent) => {
      if (!(event.target instanceof Node)) {
        return;
      }

      const inside = root.contains(event.target);
      this.pointerInside = inside;
      this.setInputActive(inside);
    });
  }

  canHandleKeyboard(): boolean {
    return Boolean(this.rootEl?.isConnected)
      && this.items.length > 0
      && !this.captionEditing
      && (this.inputActive || this.pointerInside || this.isRootFullscreen());
  }

  nextFromKeyboard(): void {
    this.next();
  }

  previousFromKeyboard(): void {
    this.previous();
  }

  private isRootFullscreen(): boolean {
    if (!this.rootEl) {
      return false;
    }

    const fullscreenElement = document.fullscreenElement;
    return fullscreenElement === this.rootEl || Boolean(fullscreenElement && this.rootEl.contains(fullscreenElement));
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
      this.registerDomEvent(previewButtonEl, "click", () => this.goTo(index));

      const resourcePath = this.getResourcePath(item.path);
      if (resourcePath) {
        if (item.kind === "video") {
          previewButtonEl.classList.add("is-video");
          const videoEl = document.createElement("video");
          videoEl.src = buildVideoPreviewSrc(resourcePath);
          videoEl.muted = true;
          videoEl.playsInline = true;
          videoEl.preload = "metadata";
          videoEl.setAttribute("aria-hidden", "true");
          const playIconEl = document.createElement("span");
          playIconEl.className = "og-gallery__preview-play";
          setIcon(playIconEl, "play");
          previewButtonEl.append(videoEl, playIconEl);
        } else {
          const imageEl = document.createElement("img");
          imageEl.src = resourcePath;
          imageEl.alt = "";
          imageEl.loading = "lazy";
          imageEl.decoding = "async";
          previewButtonEl.appendChild(imageEl);
        }
      } else {
        const placeholderEl = document.createElement("span");
        placeholderEl.textContent = item.name.slice(0, 3);
        previewButtonEl.appendChild(placeholderEl);
      }

      previewEl.appendChild(previewButtonEl);
      this.previewButtonEls.push(previewButtonEl);
    });

    this.items.forEach((_item, index) => {
      const dotEl = document.createElement("button");
      dotEl.type = "button";
      dotEl.className = "og-gallery__dot";
      this.registerDomEvent(dotEl, "click", () => this.goTo(index));
      navEl.appendChild(dotEl);
      this.dotEls.push(dotEl);
    });

    const railEl = document.createElement("div");
    railEl.className = "og-gallery__nav-rail";
    railEl.setAttribute("role", "slider");
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
    this.viewportEl = viewportEl;

    const fullscreenButton = this.createFullscreenButton();
    const rotateButton = this.createRotateButton();
    const videoControlsEl = this.createVideoControls();
    const resizeHandleEl = this.createResizeHandle("view_height");

    this.registerDomEvent(viewportEl, "pointerdown", (event: PointerEvent) => {
      this.pointerInside = true;
      this.setInputActive(true);
      this.activateKeyboardTarget?.(this);
      this.pointerStartX = event.clientX;
    });

    this.registerDomEvent(viewportEl, "click", (event: MouseEvent) => {
      this.pointerInside = true;
      this.setInputActive(true);
      this.activateKeyboardTarget?.(this);
      if (event.target instanceof HTMLElement && event.target.closest(
        "button, .og-gallery__video-controls, .og-gallery__nav",
      )) {
        return;
      }

      const item = this.items[this.state.currentIndex];
      if (item?.kind === "video") {
        void this.toggleVideoPlayback();
      }
    });

    this.registerDomEvent(viewportEl, "pointermove", () => {
      this.pointerInside = true;
      this.activateKeyboardTarget?.(this);
    });

    this.registerDomEvent(viewportEl, "pointerover", () => {
      this.pointerInside = true;
      this.activateKeyboardTarget?.(this);
    });

    this.registerDomEvent(viewportEl, "pointerenter", () => {
      this.pointerInside = true;
      this.activateKeyboardTarget?.(this);
    });

    this.registerDomEvent(viewportEl, "wheel", (event: WheelEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest(".og-gallery__preview")) {
        return;
      }

      if (event.target instanceof HTMLElement && event.target.closest(".og-gallery__video-controls")) {
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

    viewportEl.append(videoControlsEl, fullscreenButton, rotateButton, resizeHandleEl);
    return viewportEl;
  }

  private createVideoControls(): HTMLElement {
    const controlsEl = document.createElement("div");
    controlsEl.className = "og-gallery__video-controls";
    this.videoControlsEl = controlsEl;

    this.registerDomEvent(controlsEl, "pointerdown", (event: PointerEvent) => {
      event.stopPropagation();
    });

    this.registerDomEvent(controlsEl, "click", (event: MouseEvent) => {
      event.stopPropagation();
    });

    const playButtonEl = this.createVideoButton("play", "play");
    const muteButtonEl = this.createVideoButton("sound off", "volume-x");
    const loopButtonEl = this.createVideoButton("loop", "infinity");
    const progressEl = document.createElement("div");
    progressEl.className = "og-gallery__video-progress";
    progressEl.setAttribute("role", "slider");
    progressEl.setAttribute("aria-valuemin", "0");
    progressEl.setAttribute("aria-valuemax", "1000");
    progressEl.setAttribute("aria-valuenow", "0");
    progressEl.setAttribute("aria-valuetext", "00:00");
    progressEl.tabIndex = 0;
    const progressLabelEl = document.createElement("span");
    videoProgressLabelId += 1;
    progressLabelEl.id = `og-gallery-video-progress-${videoProgressLabelId}`;
    progressLabelEl.className = "og-gallery__visually-hidden";
    progressLabelEl.textContent = "video position";
    progressEl.setAttribute("aria-labelledby", progressLabelEl.id);
    const progressRangeEl = document.createElement("div");
    progressRangeEl.className = "og-gallery__video-progress-range";
    const progressStartHandleEl = document.createElement("div");
    progressStartHandleEl.className = "og-gallery__video-range-handle og-gallery__video-range-handle--start";
    progressStartHandleEl.dataset.edge = "start";
    const progressEndHandleEl = document.createElement("div");
    progressEndHandleEl.className = "og-gallery__video-range-handle og-gallery__video-range-handle--end";
    progressEndHandleEl.dataset.edge = "end";
    const progressThumbEl = document.createElement("div");
    progressThumbEl.className = "og-gallery__video-progress-thumb";
    progressEl.append(progressLabelEl, progressRangeEl, progressStartHandleEl, progressEndHandleEl, progressThumbEl);
    const progressTooltipEl = document.createElement("div");
    progressTooltipEl.className = "og-gallery__video-time-tooltip";
    progressTooltipEl.textContent = "00:00";
    this.rootEl?.appendChild(progressTooltipEl);

    this.videoPlayButtonEl = playButtonEl;
    this.videoMuteButtonEl = muteButtonEl;
    this.videoLoopButtonEl = loopButtonEl;
    this.videoProgressEl = progressEl;
    this.videoProgressRangeEl = progressRangeEl;
    this.videoProgressStartHandleEl = progressStartHandleEl;
    this.videoProgressEndHandleEl = progressEndHandleEl;
    this.videoProgressTooltipEl = progressTooltipEl;

    this.registerDomEvent(playButtonEl, "click", (event: MouseEvent) => {
      event.preventDefault();
      void this.toggleVideoPlayback();
    });

    this.registerDomEvent(muteButtonEl, "click", (event: MouseEvent) => {
      event.preventDefault();
      void this.toggleVideoMuted();
    });

    this.registerDomEvent(loopButtonEl, "click", (event: MouseEvent) => {
      event.preventDefault();
      void this.toggleVideoLoop();
    });

    this.registerVideoRangeHandle(progressStartHandleEl, "start");
    this.registerVideoRangeHandle(progressEndHandleEl, "end");

    this.registerDomEvent(progressEl, "pointerdown", (event: PointerEvent) => {
      event.preventDefault();
      this.draggingVideoProgress = true;
      progressEl.setPointerCapture(event.pointerId);
      this.updateVideoProgressTooltip(event);
      this.seekVideoFromProgressPointer(event);
    });

    this.registerDomEvent(progressEl, "pointerenter", (event: PointerEvent) => {
      this.updateVideoProgressTooltip(event);
    });

    this.registerDomEvent(progressEl, "pointermove", (event: PointerEvent) => {
      this.updateVideoProgressTooltip(event);
      if (this.draggingVideoProgress) {
        event.preventDefault();
        this.seekVideoFromProgressPointer(event);
      }
    });

    this.registerDomEvent(progressEl, "pointerleave", () => {
      if (!this.draggingVideoProgress) {
        this.hideVideoProgressTooltip();
      }
    });

    this.registerDomEvent(progressEl, "pointerup", (event: PointerEvent) => {
      this.draggingVideoProgress = false;
      if (this.isPointerInsideVideoProgress(event)) {
        this.updateVideoProgressTooltip(event);
      } else {
        this.hideVideoProgressTooltip();
      }
      if (progressEl.hasPointerCapture(event.pointerId)) {
        progressEl.releasePointerCapture(event.pointerId);
      }
    });

    this.registerDomEvent(progressEl, "pointercancel", (event: PointerEvent) => {
      this.draggingVideoProgress = false;
      this.hideVideoProgressTooltip();
      if (progressEl.hasPointerCapture(event.pointerId)) {
        progressEl.releasePointerCapture(event.pointerId);
      }
    });

    this.registerDomEvent(progressEl, "keydown", (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        this.seekVideoByStep(-5);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        this.seekVideoByStep(5);
      }
    });

    controlsEl.append(playButtonEl, muteButtonEl, loopButtonEl, progressEl);
    return controlsEl;
  }

  private registerVideoRangeHandle(handleEl: HTMLElement, edge: VideoRangeEdge): void {
    this.registerDomEvent(handleEl, "pointerdown", (event: PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      this.draggingVideoRangeEdge = edge;
      handleEl.setPointerCapture(event.pointerId);
      this.updateVideoRangeEdgeFromPointer(edge, event);
    });

    this.registerDomEvent(handleEl, "pointermove", (event: PointerEvent) => {
      if (this.draggingVideoRangeEdge !== edge) {
        return;
      }

      event.preventDefault();
      this.updateVideoRangeEdgeFromPointer(edge, event);
    });

    this.registerDomEvent(handleEl, "pointerup", (event: PointerEvent) => {
      if (this.draggingVideoRangeEdge === edge) {
        event.preventDefault();
        this.updateVideoRangeEdgeFromPointer(edge, event);
        this.draggingVideoRangeEdge = null;
        void this.persistVideoPlayback(this.currentPlayback);
      }

      if (handleEl.hasPointerCapture(event.pointerId)) {
        handleEl.releasePointerCapture(event.pointerId);
      }
    });

    this.registerDomEvent(handleEl, "pointercancel", (event: PointerEvent) => {
      if (this.draggingVideoRangeEdge === edge) {
        this.draggingVideoRangeEdge = null;
        this.hideVideoProgressTooltip();
        void this.persistVideoPlayback(this.currentPlayback);
      }

      if (handleEl.hasPointerCapture(event.pointerId)) {
        handleEl.releasePointerCapture(event.pointerId);
      }
    });
  }

  private createVideoButton(label: string, icon: string): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "og-gallery__video-button";
    this.setButtonLabel(button, label);
    setIcon(button, icon);
    return button;
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
    this.setAccessibleTooltip(captionEl, "caption");
    this.captionEl = captionEl;

    const contentEl = document.createElement("div");
    contentEl.className = "og-gallery__caption-content";
    contentEl.tabIndex = 0;
    this.captionContentEl = contentEl;

    const openButtonEl = document.createElement("button");
    openButtonEl.type = "button";
    openButtonEl.className = "og-gallery__caption-open";
    this.setButtonLabel(openButtonEl, "caption note");
    setIcon(openButtonEl, "file-text");
    this.captionOpenButtonEl = openButtonEl;
    const resizeHandleEl = this.createResizeHandle("caption_height");

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

    captionEl.append(contentEl, openButtonEl, resizeHandleEl);
    return captionEl;
  }

  private createResizeHandle(option: GallerySizeOption): HTMLElement {
    const handleEl = document.createElement("div");
    handleEl.className = `og-gallery__resize-handle og-gallery__resize-handle--${option === "view_height" ? "view" : "caption"}`;
    handleEl.setAttribute("role", "separator");
    handleEl.setAttribute("aria-orientation", "horizontal");

    this.registerDomEvent(handleEl, "pointerdown", (event: PointerEvent) => this.startResize(option, handleEl, event));
    this.registerDomEvent(handleEl, "pointermove", (event: PointerEvent) => this.updateResize(event));
    this.registerDomEvent(handleEl, "pointerup", (event: PointerEvent) => this.finishResize(event, true));
    this.registerDomEvent(handleEl, "pointercancel", (event: PointerEvent) => this.finishResize(event, false));

    return handleEl;
  }

  private startResize(option: GallerySizeOption, handleEl: HTMLElement, event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const startHeight = option === "view_height" ? this.config.viewHeight : this.config.captionHeight;
    this.resizeState = {
      option,
      pointerId: event.pointerId,
      handleEl,
      startY: event.clientY,
      startHeight,
    };
    this.rootEl?.classList.add("is-resizing");
    handleEl.setPointerCapture(event.pointerId);
  }

  private updateResize(event: PointerEvent): void {
    if (!this.resizeState || event.pointerId !== this.resizeState.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const deltaY = event.clientY - this.resizeState.startY;
    const nextHeight = this.resizeState.option === "view_height"
      ? this.resizeState.startHeight - deltaY
      : this.resizeState.startHeight + deltaY;
    this.applyGallerySize(this.resizeState.option, nextHeight);
  }

  private finishResize(event: PointerEvent, persist: boolean): void {
    if (!this.resizeState || event.pointerId !== this.resizeState.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const { option, handleEl } = this.resizeState;
    const nextValue = option === "view_height" ? this.config.viewHeight : this.config.captionHeight;
    if (handleEl.hasPointerCapture(event.pointerId)) {
      handleEl.releasePointerCapture(event.pointerId);
    }

    this.resizeState = null;
    this.rootEl?.classList.remove("is-resizing");
    if (persist) {
      void this.saveSizeOption?.(option, nextValue);
    }
  }

  private applyGallerySize(option: GallerySizeOption, value: number): void {
    const min = option === "view_height" ? MIN_VIEW_HEIGHT : MIN_CAPTION_HEIGHT;
    const nextValue = Math.round(clamp(value, min, MAX_GALLERY_SIZE));
    if (option === "view_height") {
      this.config.viewHeight = nextValue;
      this.rootEl?.style.setProperty("--og-view-height", `${nextValue}px`);
      this.applyRotation(this.currentRotation);
      return;
    }

    this.config.captionHeight = nextValue;
    this.rootEl?.style.setProperty("--og-caption-height", `${nextValue}px`);
  }

  private setInputActive(active: boolean): void {
    this.inputActive = active;
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
      this.activateKeyboardTarget?.(this);
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

    if (!item) {
      return;
    }

    this.hideVideoProgressTooltip();
    this.pauseCurrentVideo();
    this.ensureMediaElement(item);
    const resourcePath = this.getResourcePath(item.path);
    if (!resourcePath) {
      this.mediaEl?.removeAttribute("src");
      this.mediaEl?.setAttribute("aria-label", `Unable to load ${item.name}`);
      return;
    }

    if (this.mediaEl instanceof HTMLImageElement) {
      this.mediaEl.src = resourcePath;
      this.mediaEl.alt = item.name;
    } else if (this.mediaEl instanceof HTMLVideoElement) {
      this.mediaEl.src = resourcePath;
      this.mediaEl.removeAttribute("aria-label");
      this.mediaEl.load();
    }

    this.applyRotation(0);
    this.applyVideoPlayback(DEFAULT_VIDEO_PLAYBACK);

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

  private ensureMediaElement(item: GalleryItem): void {
    if (!this.viewportEl) {
      return;
    }

    const expectedTag = item.kind === "video" ? "VIDEO" : "IMG";
    if (this.mediaEl?.tagName === expectedTag) {
      this.viewportEl.classList.toggle("is-video", item.kind === "video");
      this.viewportEl.classList.toggle("is-image", item.kind === "image");
      return;
    }

    this.pauseCurrentVideo();
    this.mediaEl?.remove();

    this.mediaEl = item.kind === "video"
      ? this.createVideoElement()
      : this.createImageElement();
    this.viewportEl.prepend(this.mediaEl);
    this.viewportEl.classList.toggle("is-video", item.kind === "video");
    this.viewportEl.classList.toggle("is-image", item.kind === "image");
    this.updateVideoControls();
  }

  private createImageElement(): HTMLImageElement {
    const imageEl = document.createElement("img");
    imageEl.className = "og-gallery__media";
    imageEl.loading = "lazy";
    imageEl.decoding = "async";
    return imageEl;
  }

  private createVideoElement(): HTMLVideoElement {
    const videoEl = document.createElement("video");
    videoEl.className = "og-gallery__media";
    videoEl.preload = "metadata";
    videoEl.controls = false;
    videoEl.playsInline = true;

    this.registerDomEvent(videoEl, "timeupdate", () => this.handleVideoTimeUpdate());
    this.registerDomEvent(videoEl, "durationchange", () => {
      this.syncVideoToPlaybackRange(videoEl);
      this.updateVideoProgress();
    });
    this.registerDomEvent(videoEl, "play", () => this.updateVideoControls());
    this.registerDomEvent(videoEl, "pause", () => this.updateVideoControls());
    this.registerDomEvent(videoEl, "ended", () => this.updateVideoControls());

    return videoEl;
  }

  private async updateCaption(item: GalleryItem): Promise<void> {
    const token = (this.captionRenderToken += 1);
    this.captionEditing = false;
    this.captionState = null;
    if (this.captionEl && this.captionContentEl) {
      this.captionContentEl.contentEditable = "false";
      this.captionContentEl.classList.remove("markdown-rendered");
      this.captionContentEl.removeAttribute("data-placeholder");
      this.captionContentEl.empty();
      this.captionContentEl.textContent = "Loading caption...";
      this.captionEl.classList.remove("is-disabled", "is-editing", "is-empty");
      this.captionOpenButtonEl?.classList.add("is-hidden");
    }

    const caption = await this.getCaption?.(item);
    if (token !== this.captionRenderToken) {
      return;
    }

    this.captionState = caption ?? {
      status: "unconfigured",
      path: null,
      body: "",
      exists: false,
      rotation: 0,
      playback: DEFAULT_VIDEO_PLAYBACK,
    };

    this.applyRotation(this.captionState.rotation);
    this.applyVideoPlayback(this.captionState.playback);

    if (!this.captionEl || !this.captionContentEl) {
      return;
    }

    if (!caption || caption.status === "unconfigured") {
      delete this.captionEl.dataset.captionPath;
      this.captionEl.classList.add("is-disabled", "is-empty");
      this.captionContentEl.empty();
      appendEmphasisLine(this.captionContentEl, "choose directory for gallery captions storage");
      appendEmphasisLine(this.captionContentEl, "Settings > Community plugins > Obsidian Gallery > Caption folder");
      return;
    }

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

  private applyVideoPlayback(playback: CaptionVideoPlayback): void {
    this.currentPlayback = playback;
    const videoEl = this.getCurrentVideoElement();
    if (!videoEl) {
      this.updateVideoControls();
      return;
    }

    videoEl.muted = playback.muted;
    videoEl.loop = false;
    this.syncVideoToPlaybackRange(videoEl);
    if (playback.autoplay) {
      void videoEl.play().catch(() => {
        this.updateVideoControls();
      });
    } else {
      videoEl.pause();
    }
    this.updateVideoControls();
  }

  private async toggleVideoPlayback(): Promise<void> {
    const videoEl = this.getCurrentVideoElement();
    if (!videoEl) {
      return;
    }

    if (videoEl.paused) {
      this.syncVideoToPlaybackRange(videoEl);
      await videoEl.play().catch(() => undefined);
      await this.persistVideoPlayback({ ...this.currentPlayback, autoplay: true });
    } else {
      videoEl.pause();
      await this.persistVideoPlayback({ ...this.currentPlayback, autoplay: false });
    }

    this.updateVideoControls();
  }

  private async toggleVideoMuted(): Promise<void> {
    const videoEl = this.getCurrentVideoElement();
    if (!videoEl) {
      return;
    }

    const playback = { ...this.currentPlayback, muted: !videoEl.muted };
    videoEl.muted = playback.muted;
    await this.persistVideoPlayback(playback);
    this.updateVideoControls();
  }

  private async toggleVideoLoop(): Promise<void> {
    const videoEl = this.getCurrentVideoElement();
    if (!videoEl) {
      return;
    }

    const playback = { ...this.currentPlayback, loop: !this.currentPlayback.loop };
    await this.persistVideoPlayback(playback);
    this.updateVideoControls();
  }

  private async persistVideoPlayback(playback: CaptionVideoPlayback): Promise<void> {
    const item = this.items[this.state.currentIndex];
    this.currentPlayback = playback;
    if (!item || item.kind !== "video" || !this.saveVideoPlayback) {
      return;
    }

    const nextState = await this.saveVideoPlayback(item, playback);
    if (nextState.status === "unconfigured") {
      return;
    }

    this.captionState = nextState;
    this.currentPlayback = nextState.playback;
    this.captionOpenButtonEl?.classList.remove("is-hidden");
    if (this.captionEl && nextState.path) {
      this.captionEl.dataset.captionPath = nextState.path;
    }
  }

  private seekVideoFromProgressPointer(event: PointerEvent): void {
    const videoEl = this.getCurrentVideoElement();
    if (!videoEl || !this.videoProgressEl || !Number.isFinite(videoEl.duration) || videoEl.duration <= 0) {
      return;
    }

    const rect = this.videoProgressEl.getBoundingClientRect();
    const range = this.getCurrentVideoRange(videoEl);
    const pointerTime = videoProgressPointerTime(event.clientX, rect.left, rect.width, videoEl.duration);
    videoEl.currentTime = clamp(pointerTime, range.start, range.end);
    this.updateVideoProgress();
  }

  private updateVideoRangeEdgeFromPointer(edge: VideoRangeEdge, event: PointerEvent): void {
    const videoEl = this.getCurrentVideoElement();
    if (!videoEl || !this.videoProgressEl || !Number.isFinite(videoEl.duration) || videoEl.duration <= 0) {
      this.hideVideoProgressTooltip();
      return;
    }

    const rect = this.videoProgressEl.getBoundingClientRect();
    const currentRange = this.getCurrentVideoRange(videoEl);
    const pointerTime = videoProgressPointerTime(event.clientX, rect.left, rect.width, videoEl.duration);
    const edgeTime = clampVideoRangeEdge(edge, pointerTime, currentRange, videoEl.duration);
    const nextPlayback: CaptionVideoPlayback = {
      ...this.currentPlayback,
      [edge]: edgeTime,
    };
    const nextRange = normalizeVideoTimeRange(videoEl.duration, nextPlayback.start, nextPlayback.end);

    this.currentPlayback = {
      ...nextPlayback,
      start: nextRange.start,
      end: nextRange.end,
    };
    videoEl.currentTime = clamp(videoEl.currentTime, nextRange.start, nextRange.end);
    this.updateVideoProgress();
    this.updateVideoProgressTooltip(event, edgeTime);
  }

  private updateVideoProgressTooltip(event: PointerEvent, explicitTime?: number): void {
    const videoEl = this.getCurrentVideoElement();
    if (
      !videoEl
      || !this.videoProgressEl
      || !this.videoProgressTooltipEl
      || !this.rootEl
      || !Number.isFinite(videoEl.duration)
      || videoEl.duration <= 0
    ) {
      this.hideVideoProgressTooltip();
      return;
    }

    const railRect = this.videoProgressEl.getBoundingClientRect();
    const rootRect = this.rootEl.getBoundingClientRect();
    const time = explicitTime ?? videoProgressPointerTime(event.clientX, railRect.left, railRect.width, videoEl.duration);
    const tooltipX = clamp(event.clientX - rootRect.left, 30, Math.max(30, rootRect.width - 30));
    const tooltipY = clamp(event.clientY - rootRect.top, 20, Math.max(20, rootRect.height - 6));

    this.videoProgressTooltipEl.textContent = formatVideoProgressTime(time);
    this.videoProgressTooltipEl.style.left = `${tooltipX}px`;
    this.videoProgressTooltipEl.style.top = `${tooltipY}px`;
    this.videoProgressTooltipEl.classList.add("is-visible");
  }

  private hideVideoProgressTooltip(): void {
    this.videoProgressTooltipEl?.classList.remove("is-visible");
  }

  private isPointerInsideVideoProgress(event: PointerEvent): boolean {
    if (!this.videoProgressEl) {
      return false;
    }

    const rect = this.videoProgressEl.getBoundingClientRect();
    return event.clientX >= rect.left
      && event.clientX <= rect.right
      && event.clientY >= rect.top
      && event.clientY <= rect.bottom;
  }

  private seekVideoByStep(seconds: number): void {
    const videoEl = this.getCurrentVideoElement();
    if (!videoEl || !Number.isFinite(videoEl.duration) || videoEl.duration <= 0) {
      return;
    }

    const range = this.getCurrentVideoRange(videoEl);
    videoEl.currentTime = clamp(videoEl.currentTime + seconds, range.start, range.end);
    this.updateVideoProgress();
  }

  private handleVideoTimeUpdate(): void {
    const videoEl = this.getCurrentVideoElement();
    if (!videoEl || !Number.isFinite(videoEl.duration) || videoEl.duration <= 0) {
      this.updateVideoProgress();
      return;
    }

    const range = this.getCurrentVideoRange(videoEl);
    if (videoEl.currentTime < range.start) {
      videoEl.currentTime = range.start;
    }

    if (videoEl.currentTime >= range.end) {
      if (this.currentPlayback.loop) {
        videoEl.currentTime = range.start;
        if (videoEl.paused) {
          void videoEl.play().catch(() => undefined);
        }
      } else {
        videoEl.currentTime = range.end;
        if (!videoEl.paused) {
          videoEl.pause();
        }
        if (this.currentPlayback.autoplay) {
          void this.persistVideoPlayback({ ...this.currentPlayback, autoplay: false });
        }
      }
    }

    this.updateVideoProgress();
  }

  private syncVideoToPlaybackRange(videoEl: HTMLVideoElement): void {
    if (!Number.isFinite(videoEl.duration) || videoEl.duration <= 0) {
      return;
    }

    const range = this.getCurrentVideoRange(videoEl);
    videoEl.currentTime = clamp(videoEl.currentTime, range.start, range.end);
    if (videoEl.currentTime === 0 && range.start > 0) {
      videoEl.currentTime = range.start;
    }
  }

  private updateVideoProgress(): void {
    const videoEl = this.getCurrentVideoElement();
    if (!videoEl || !this.videoProgressEl || !Number.isFinite(videoEl.duration) || videoEl.duration <= 0) {
      if (this.videoProgressEl) {
        this.videoProgressEl.style.setProperty("--og-video-progress", "0");
        this.videoProgressEl.style.setProperty("--og-video-range-start", "0");
        this.videoProgressEl.style.setProperty("--og-video-range-end", "1");
        this.videoProgressEl.setAttribute("aria-valuenow", "0");
        this.videoProgressEl.setAttribute("aria-valuetext", "00:00");
      }
      return;
    }

    const range = this.getCurrentVideoRange(videoEl);
    const progress = Math.round((videoEl.currentTime / videoEl.duration) * 1000);
    this.videoProgressEl.style.setProperty("--og-video-progress", String(progress / 1000));
    this.videoProgressEl.style.setProperty("--og-video-range-start", String(videoTimeToProgress(range.start, videoEl.duration)));
    this.videoProgressEl.style.setProperty("--og-video-range-end", String(videoTimeToProgress(range.end, videoEl.duration)));
    this.videoProgressEl.setAttribute("aria-valuenow", String(progress));
    this.videoProgressEl.setAttribute("aria-valuetext", formatVideoProgressTime(videoEl.currentTime));
  }

  private getCurrentVideoRange(videoEl: HTMLVideoElement): VideoTimeRange {
    return normalizeVideoTimeRange(videoEl.duration, this.currentPlayback.start, this.currentPlayback.end);
  }

  private updateVideoControls(): void {
    const videoEl = this.getCurrentVideoElement();
    const isVideo = Boolean(videoEl);
    this.videoControlsEl?.classList.toggle("is-visible", isVideo);

    if (!videoEl) {
      return;
    }

    const playing = !videoEl.paused && !videoEl.ended;
    const muted = videoEl.muted;
    const loop = this.currentPlayback.loop;

    this.videoPlayButtonEl?.empty();
    this.videoMuteButtonEl?.empty();
    this.videoLoopButtonEl?.classList.toggle("is-active", loop);

    if (this.videoPlayButtonEl) {
      setIcon(this.videoPlayButtonEl, playing ? "pause" : "play");
      setTooltipLabel(this.videoPlayButtonEl, playing ? "pause" : "play");
    }

    if (this.videoMuteButtonEl) {
      setIcon(this.videoMuteButtonEl, muted ? "volume-2" : "volume-x");
      setTooltipLabel(this.videoMuteButtonEl, muted ? "sound on" : "sound off");
    }

    if (this.videoLoopButtonEl) {
      setIcon(this.videoLoopButtonEl, "infinity");
      setTooltipLabel(this.videoLoopButtonEl, loop ? "loop on" : "loop off");
    }

    this.updateVideoProgress();
  }

  private getCurrentVideoElement(): HTMLVideoElement | null {
    return this.mediaEl instanceof HTMLVideoElement ? this.mediaEl : null;
  }

  private pauseCurrentVideo(): void {
    if (this.mediaEl instanceof HTMLVideoElement) {
      this.mediaEl.pause();
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

function buildVideoPreviewSrc(resourcePath: string): string {
  return resourcePath.includes("#") ? resourcePath : `${resourcePath}#t=0.001`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
