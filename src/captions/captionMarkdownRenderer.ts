// Documentation: [[documentation/phase-2-captions]]

import { App, Component, Keymap, MarkdownRenderer } from "obsidian";

export async function renderCaptionMarkdown(
  app: App,
  markdown: string,
  containerEl: HTMLElement,
  sourcePath: string,
  component: Component,
  hoverSource: string,
): Promise<void> {
  containerEl.classList.add("markdown-rendered");
  await MarkdownRenderer.render(app, markdown, containerEl, sourcePath, component);
  compactCaptionMarkdown(containerEl);

  containerEl.querySelectorAll<HTMLElement>("a.internal-link").forEach((linkEl) => {
    component.registerDomEvent(linkEl, "click", (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const linktext = linkEl.getAttribute("href") ?? linkEl.getAttribute("data-href");
      if (linktext) {
        void app.workspace.openLinkText(linktext, sourcePath, Keymap.isModEvent(event));
      }
    });

    component.registerDomEvent(linkEl, "mouseover", (event: MouseEvent) => {
      event.preventDefault();

      const linktext = linkEl.getAttribute("href") ?? linkEl.getAttribute("data-href");
      if (!linktext) {
        return;
      }

      app.workspace.trigger("hover-link", {
        event,
        source: hoverSource,
        hoverParent: component,
        targetEl: event.currentTarget,
        linktext,
        sourcePath,
      });
    });
  });
}

function compactCaptionMarkdown(containerEl: HTMLElement): void {
  const compactBlockSelector = [
    "p",
    "ul",
    "ol",
    "blockquote",
    "pre",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    ".el-p",
    ".el-ul",
    ".el-ol",
    ".el-blockquote",
    ".el-pre",
    ".el-h1",
    ".el-h2",
    ".el-h3",
    ".el-h4",
    ".el-h5",
    ".el-h6",
    ".markdown-preview-section",
    ".markdown-preview-section > div",
  ].join(",");

  containerEl.querySelectorAll<HTMLElement>(compactBlockSelector).forEach((blockEl) => {
    blockEl.style.marginBlock = "0";
    blockEl.style.lineHeight = "var(--og-caption-line-height)";
    blockEl.style.minHeight = "0";
  });
}
