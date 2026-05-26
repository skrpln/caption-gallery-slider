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
  await MarkdownRenderer.render(app, markdown, containerEl, sourcePath, component);

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
