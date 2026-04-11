import { getStoredTheme } from "@/hooks/use-theme"

export const getWidgetFrameCode = ({ widgetCode, title }: { widgetCode: string, title: string }) => {
  const currentTheme = getStoredTheme()
  const baseWidgetCode = `
  <!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Visualize Widget</title>
    <style id="mcp-host-variables">
      :root {
        --color-background-primary: light-dark(rgba(255, 255, 255, 1), rgba(48, 48, 46, 1));
        --color-background-secondary: light-dark(rgba(245, 244, 237, 1), rgba(38, 38, 36, 1));
        --color-background-tertiary: light-dark(rgba(250, 249, 245, 1), rgba(20, 20, 19, 1));
        --color-background-inverse: light-dark(rgba(20, 20, 19, 1), rgba(250, 249, 245, 1));
        --color-background-ghost: light-dark(rgba(255, 255, 255, 0), rgba(48, 48, 46, 0));
        --color-background-info: light-dark(rgba(214, 228, 246, 1), rgba(37, 62, 95, 1));
        --color-background-danger: light-dark(rgba(247, 236, 236, 1), rgba(96, 42, 40, 1));
        --color-background-success: light-dark(rgba(233, 241, 220, 1), rgba(27, 70, 20, 1));
        --color-background-warning: light-dark(rgba(246, 238, 223, 1), rgba(72, 58, 15, 1));
        --color-background-disabled: light-dark(rgba(255, 255, 255, 0.5), rgba(48, 48, 46, 0.5));
        --color-text-primary: light-dark(rgba(20, 20, 19, 1), rgba(250, 249, 245, 1));
        --color-text-secondary: light-dark(rgba(61, 61, 58, 1), rgba(194, 192, 182, 1));
        --color-text-tertiary: light-dark(rgba(115, 114, 108, 1), rgba(156, 154, 146, 1));
        --color-text-inverse: light-dark(rgba(255, 255, 255, 1), rgba(20, 20, 19, 1));
        --color-text-info: light-dark(rgba(50, 102, 173, 1), rgba(128, 170, 221, 1));
        --color-text-danger: light-dark(rgba(127, 44, 40, 1), rgba(238, 136, 132, 1));
        --color-text-success: light-dark(rgba(38, 91, 25, 1), rgba(122, 185, 72, 1));
        --color-text-warning: light-dark(rgba(90, 72, 21, 1), rgba(209, 160, 65, 1));
        --color-text-disabled: light-dark(rgba(20, 20, 19, 0.5), rgba(250, 249, 245, 0.5));
        --color-text-ghost: light-dark(rgba(115, 114, 108, 0.5), rgba(156, 154, 146, 0.5));
        --color-border-primary: light-dark(rgba(31, 30, 29, 0.4), rgba(222, 220, 209, 0.4));
        --color-border-secondary: light-dark(rgba(31, 30, 29, 0.3), rgba(222, 220, 209, 0.3));
        --color-border-tertiary: light-dark(rgba(31, 30, 29, 0.15), rgba(222, 220, 209, 0.15));
        --color-border-inverse: light-dark(rgba(255, 255, 255, 0.3), rgba(20, 20, 19, 0.15));
        --color-border-ghost: light-dark(rgba(31, 30, 29, 0), rgba(222, 220, 209, 0));
        --color-border-info: light-dark(rgba(70, 130, 213, 1), rgba(70, 130, 213, 1));
        --color-border-danger: light-dark(rgba(167, 61, 57, 1), rgba(205, 92, 88, 1));
        --color-border-success: light-dark(rgba(67, 116, 38, 1), rgba(89, 145, 48, 1));
        --color-border-warning: light-dark(rgba(128, 92, 31, 1), rgba(168, 120, 41, 1));
        --color-border-disabled: light-dark(rgba(31, 30, 29, 0.1), rgba(222, 220, 209, 0.1));
        --color-ring-primary: light-dark(rgba(20, 20, 19, 0.7), rgba(250, 249, 245, 0.7));
        --color-ring-secondary: light-dark(rgba(61, 61, 58, 0.7), rgba(194, 192, 182, 0.7));
        --color-ring-inverse: light-dark(rgba(255, 255, 255, 0.7), rgba(20, 20, 19, 0.7));
        --color-ring-info: light-dark(rgba(50, 102, 173, 0.5), rgba(128, 170, 221, 0.5));
        --color-ring-danger: light-dark(rgba(167, 61, 57, 0.5), rgba(205, 92, 88, 0.5));
        --color-ring-success: light-dark(rgba(67, 116, 38, 0.5), rgba(89, 145, 48, 0.5));
        --color-ring-warning: light-dark(rgba(128, 92, 31, 0.5), rgba(168, 120, 41, 0.5));
        --font-sans: "Space Grotesk", "Geist Variable", sans-serif;
        --font-mono: ui-monospace, monospace;
        --font-weight-normal: 400;
        --font-weight-medium: 500;
        --font-weight-semibold: 600;
        --font-weight-bold: 700;
        --font-text-xs-size: 12px;
        --font-text-sm-size: 14px;
        --font-text-md-size: 16px;
        --font-text-lg-size: 20px;
        --font-heading-xs-size: 12px;
        --font-heading-sm-size: 14px;
        --font-heading-md-size: 16px;
        --font-heading-lg-size: 20px;
        --font-heading-xl-size: 24px;
        --font-heading-2xl-size: 28px;
        --font-heading-3xl-size: 36px;
        --font-text-xs-line-height: 1.4;
        --font-text-sm-line-height: 1.4;
        --font-text-md-line-height: 1.4;
        --font-text-lg-line-height: 1.25;
        --font-heading-xs-line-height: 1.4;
        --font-heading-sm-line-height: 1.4;
        --font-heading-md-line-height: 1.4;
        --font-heading-lg-line-height: 1.25;
        --font-heading-xl-line-height: 1.25;
        --font-heading-2xl-line-height: 1.1;
        --font-heading-3xl-line-height: 1;
        --border-radius-xs: 4px;
        --border-radius-sm: 6px;
        --border-radius-md: 8px;
        --border-radius-lg: 10px;
        --border-radius-xl: 12px;
        --border-radius-full: 9999px;
        --border-width-regular: 0.5px;
        --shadow-hairline: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
        --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
        --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
      }</style>

    <style>
      :root {
        color-scheme: light dark;
        --font-serif: 'Space Grotesk', 'Geist Variable', Georgia, 'Times New Roman', serif;
      }
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      input,
      select,
      textarea,
      button {
        font-family: inherit;
      }
      body {
        font-family:
          'Space Grotesk', 'Geist Variable', -apple-system,
          BlinkMacSystemFont,
          'Segoe UI',
          sans-serif;
        background: transparent;
      }
      /* Iframe height is externally managed — host sets iframe.style.height to
 * match body.getBoundingClientRect().height via postMessage. During the
 * 1-frame lag (and the 0.25s initial transition), body > viewport triggers
 * a transient scrollbar that steals ~15px width, reflowing flex content.
 * Zero-width scrollbar = zero layout shift. Wheel/keyboard scroll still
 * work if ever needed. */
      html,
      body {
        scrollbar-width: none;
      }
      html::-webkit-scrollbar,
      body::-webkit-scrollbar {
        width: 0;
        height: 0;
      }
      /* Short var aliases — saves ~5 tokens per reference */
      :root {
        --p: var(--color-text-primary);
        --s: var(--color-text-secondary);
        --t: var(--color-text-tertiary);
        --bg2: var(--color-background-secondary);
        --b: var(--color-border-secondary);
      }

      /* SVG utility classes — use class="t" instead of repeating font/fill attrs */
      .t {
        font-size: 14px;
        fill: var(--p);
      }
      .ts {
        font-size: 12px;
        fill: var(--s);
      }
      .th {
        font-size: 14px;
        fill: var(--p);
        font-weight: 500;
      }
      .box {
        fill: var(--bg2);
        stroke: var(--b);
      }
      .arr {
        stroke: var(--t);
        fill: none;
        stroke-width: 1.5;
      }
      .node {
        cursor: pointer;
      }
      .node:hover rect,
      .node:hover .box {
        filter: brightness(0.97);
      }
      .node:hover text {
        opacity: 0.8;
      }

      /* Form element defaults — model writes bare <input>, styling is automatic */
      input:not([type='range']):not([type='checkbox']):not([type='radio']),
      select,
      textarea {
        width: 100%;
        height: 36px;
        padding: 8px 12px;
        font-size: 16px;
        background: var(--color-background-primary);
        color: var(--color-text-primary);
        border: 0.5px solid var(--color-border-tertiary);
        border-radius: 6px;
        outline: none;
        transition:
          border-color 0.15s,
          box-shadow 0.15s;
      }
      textarea {
        height: auto;
        min-height: 80px;
        resize: vertical;
      }
      input:not([type='range']):not([type='checkbox']):not([type='radio']):hover,
      select:hover,
      textarea:hover {
        border-color: var(--color-border-secondary);
      }
      input:not([type='range']):not([type='checkbox']):not([type='radio']):focus,
      select:focus,
      textarea:focus {
        border-color: var(--color-border-info);
        box-shadow: 0 0 0 3px var(--color-background-info);
      }
      select {
        cursor: pointer;
      }

      /* Range slider — model writes bare <input type="range">, styling automatic */
      input[type='range'] {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 4px;
        background: light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.1));
        border-radius: 2px;
        outline: none;
      }
      input[type='range']::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--color-background-primary);
        border: 1px solid var(--color-border-secondary);
        cursor: pointer;
        transition:
          border-color 0.15s,
          transform 0.15s;
      }
      input[type='range']:hover::-webkit-slider-thumb {
        border-color: var(--color-border-primary);
        transform: scale(1.1);
      }
      input[type='range']::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--color-background-primary);
        border: 1px solid var(--color-border-secondary);
        cursor: pointer;
      }

      /* Button defaults — model writes bare <button>, interaction states automatic */
      button:not(#action-btns button) {
        padding: 8px 16px;
        font-size: 14px;
        background: transparent;
        color: var(--color-text-primary);
        border: 0.5px solid var(--color-border-secondary);
        border-radius: var(--border-radius-md);
        cursor: pointer;
        transition:
          background 0.15s,
          transform 0.1s;
      }
      button:not(#action-btns button):hover {
        background: var(--color-background-secondary);
      }
      button:not(#action-btns button):active {
        background: var(--color-border-tertiary);
        transform: scale(0.98);
      }

      /* Headings — bare tags get correct color in both modes */
      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        color: var(--color-text-primary);
      }

      .leader {
        stroke: var(--t);
        stroke-width: 0.5;
        stroke-dasharray: 4 3;
        fill: none;
      }

      /* Color ramp classes — apply to <g> or shape element (rect/ellipse/circle/polygon), never <path>.
   light-dark() responds to ancestor color-scheme, not just OS preference. */
      g.c-purple > rect,
      g.c-purple > ellipse,
      g.c-purple > circle,
      g.c-purple > polygon,
      rect.c-purple,
      ellipse.c-purple,
      circle.c-purple,
      polygon.c-purple {
        fill: light-dark(#eeedfe, #3c3489);
        stroke: light-dark(#534ab7, #afa9ec);
      }
      .c-purple > .th,
      .c-purple > .t {
        fill: light-dark(#3c3489, #cecbf6);
      }
      .c-purple > .ts {
        fill: light-dark(#534ab7, #afa9ec);
      }
      g.c-teal > rect,
      g.c-teal > ellipse,
      g.c-teal > circle,
      g.c-teal > polygon,
      rect.c-teal,
      ellipse.c-teal,
      circle.c-teal,
      polygon.c-teal {
        fill: light-dark(#e1f5ee, #085041);
        stroke: light-dark(#0f6e56, #5dcaa5);
      }
      .c-teal > .th,
      .c-teal > .t {
        fill: light-dark(#085041, #9fe1cb);
      }
      .c-teal > .ts {
        fill: light-dark(#0f6e56, #5dcaa5);
      }
      g.c-coral > rect,
      g.c-coral > ellipse,
      g.c-coral > circle,
      g.c-coral > polygon,
      rect.c-coral,
      ellipse.c-coral,
      circle.c-coral,
      polygon.c-coral {
        fill: light-dark(#faece7, #712b13);
        stroke: light-dark(#993c1d, #f0997b);
      }
      .c-coral > .th,
      .c-coral > .t {
        fill: light-dark(#712b13, #f5c4b3);
      }
      .c-coral > .ts {
        fill: light-dark(#993c1d, #f0997b);
      }
      g.c-pink > rect,
      g.c-pink > ellipse,
      g.c-pink > circle,
      g.c-pink > polygon,
      rect.c-pink,
      ellipse.c-pink,
      circle.c-pink,
      polygon.c-pink {
        fill: light-dark(#fbeaf0, #72243e);
        stroke: light-dark(#993556, #ed93b1);
      }
      .c-pink > .th,
      .c-pink > .t {
        fill: light-dark(#72243e, #f4c0d1);
      }
      .c-pink > .ts {
        fill: light-dark(#993556, #ed93b1);
      }
      g.c-gray > rect,
      g.c-gray > ellipse,
      g.c-gray > circle,
      g.c-gray > polygon,
      rect.c-gray,
      ellipse.c-gray,
      circle.c-gray,
      polygon.c-gray {
        fill: light-dark(#f1efe8, #444441);
        stroke: light-dark(#5f5e5a, #b4b2a9);
      }
      .c-gray > .th,
      .c-gray > .t {
        fill: light-dark(#444441, #d3d1c7);
      }
      .c-gray > .ts {
        fill: light-dark(#5f5e5a, #b4b2a9);
      }
      g.c-blue > rect,
      g.c-blue > ellipse,
      g.c-blue > circle,
      g.c-blue > polygon,
      rect.c-blue,
      ellipse.c-blue,
      circle.c-blue,
      polygon.c-blue {
        fill: light-dark(#e6f1fb, #0c447c);
        stroke: light-dark(#185fa5, #85b7eb);
      }
      .c-blue > .th,
      .c-blue > .t {
        fill: light-dark(#0c447c, #b5d4f4);
      }
      .c-blue > .ts {
        fill: light-dark(#185fa5, #85b7eb);
      }
      g.c-green > rect,
      g.c-green > ellipse,
      g.c-green > circle,
      g.c-green > polygon,
      rect.c-green,
      ellipse.c-green,
      circle.c-green,
      polygon.c-green {
        fill: light-dark(#eaf3de, #27500a);
        stroke: light-dark(#3b6d11, #97c459);
      }
      .c-green > .th,
      .c-green > .t {
        fill: light-dark(#27500a, #c0dd97);
      }
      .c-green > .ts {
        fill: light-dark(#3b6d11, #97c459);
      }
      g.c-amber > rect,
      g.c-amber > ellipse,
      g.c-amber > circle,
      g.c-amber > polygon,
      rect.c-amber,
      ellipse.c-amber,
      circle.c-amber,
      polygon.c-amber {
        fill: light-dark(#faeeda, #633806);
        stroke: light-dark(#854f0b, #ef9f27);
      }
      .c-amber > .th,
      .c-amber > .t {
        fill: light-dark(#633806, #fac775);
      }
      .c-amber > .ts {
        fill: light-dark(#854f0b, #ef9f27);
      }
      g.c-red > rect,
      g.c-red > ellipse,
      g.c-red > circle,
      g.c-red > polygon,
      rect.c-red,
      ellipse.c-red,
      circle.c-red,
      polygon.c-red {
        fill: light-dark(#fcebeb, #791f1f);
        stroke: light-dark(#a32d2d, #f09595);
      }
      .c-red > .th,
      .c-red > .t {
        fill: light-dark(#791f1f, #f7c1c1);
      }
      .c-red > .ts {
        fill: light-dark(#a32d2d, #f09595);
      }

      /* Mermaid class/ER diagrams — match house aesthetic.
   Mermaid v11 class/ER renderers use <path> (not <rect>) with inline stroke/fill
   attrs that IGNORE themeVariables mainBkg/nodeBorder. Labels are
   <foreignObject><div><span class="nodeLabel"><p>text</p> — NOT <text>. All style
   fixes require !important to beat inline attrs + mermaid\'s inline <style>.
   Selectors target .classDiagram/.erDiagram SVG root classes (always present)
   rather than a .mermaid wrapper (which the model sometimes omits). */
      svg.classDiagram,
      svg.erDiagram {
        font-size: 13px;
        max-width: 100%;
        height: auto;
      }
      /* Mermaid sizes foreignObject to fit measured text width. If we upsize post-render,
   text clips. So: overflow visible on FO, and widen inner div past its max-width. */
      svg.classDiagram foreignObject,
      svg.erDiagram foreignObject {
        overflow: visible;
      }
      svg.classDiagram foreignObject > div,
      svg.erDiagram foreignObject > div {
        max-width: none !important;
      }
      /* Body text: members, methods, attribute rows */
      svg.classDiagram .nodeLabel,
      svg.erDiagram .nodeLabel,
      svg.classDiagram .label foreignObject div,
      svg.erDiagram .label foreignObject div {
        font-family: var(--font-sans) !important;
        font-size: 13px !important;
        font-weight: 400 !important;
        color: var(--color-text-secondary) !important;
      }
      /* Titles: classDiagram wraps in .label-group; erDiagram wraps in .name */
      svg.classDiagram .label-group .nodeLabel,
      svg.erDiagram .name .nodeLabel {
        font-size: 14px !important;
        font-weight: 500 !important;
        color: var(--color-text-primary) !important;
      }
      /* Kill mermaid\'s inline style="font-weight: bolder" on the .label wrapper */
      svg.classDiagram .label-group .label {
        font-weight: 500 !important;
      }
      /* Edge labels (relationship verbs + cardinality) */
      svg.classDiagram .edgeLabel,
      svg.classDiagram .edgeLabel span,
      svg.classDiagram .edgeTerminals foreignObject div,
      svg.erDiagram .edgeLabel,
      svg.erDiagram .edgeLabel span {
        font-size: 11px !important;
        color: var(--color-text-tertiary) !important;
      }
      /* Box outlines, row stripes, dividers — all rendered as <path> with inline attrs.
   Mermaid\'s \'#id .node path { fill:... }\' CSS beats fill="none" attr — force fill:none. */
      svg.classDiagram .node path[stroke]:not([stroke='none']),
      svg.classDiagram .divider path,
      svg.erDiagram .node path[stroke]:not([stroke='none']),
      svg.erDiagram .divider path {
        stroke: var(--color-border-tertiary) !important;
        stroke-width: 0.5px !important;
        fill: none !important;
      }
      /* classDiagram: box fill (inside .basic.label-container). Mermaid\'s inline CSS
   \'#id .node path { stroke:... }\' beats the stroke="none" attr (SVG attrs have
   lowest specificity), and the fill path is open (no Z) so the phantom stroke
   only paints top/right/bottom — left edge looks darker. Kill the stroke. */
      svg.classDiagram .node .basic path[fill]:not([fill='none']) {
        fill: var(--color-background-primary) !important;
        stroke: none !important;
        stroke-width: 0 !important;
      }
      /* erDiagram: header row (anonymous first-child <g>) uses secondary bg */
      svg.erDiagram .node > g:first-child > path[fill]:not([fill='none']) {
        fill: var(--color-background-secondary) !important;
      }
      /* erDiagram: row stripes */
      svg.erDiagram .row-rect-odd path[fill]:not([fill='none']) {
        fill: var(--color-background-primary) !important;
      }
      svg.erDiagram .row-rect-even path[fill]:not([fill='none']) {
        fill: var(--color-background-secondary) !important;
      }
      /* Connector lines */
      svg.erDiagram .relationshipLine,
      svg.classDiagram .relation {
        stroke: var(--color-text-tertiary) !important;
        stroke-width: 1px !important;
      }
      svg.classDiagram .marker,
      svg.classDiagram marker path,
      svg.erDiagram .marker,
      svg.erDiagram marker path {
        stroke: var(--color-text-tertiary) !important;
        stroke-width: 1px !important;
      }
      svg.classDiagram marker path[fill]:not([fill='none']):not([fill='transparent']),
      svg.erDiagram marker path[fill]:not([fill='none']):not([fill='transparent']) {
        fill: var(--color-text-tertiary) !important;
      }
      /* Relationship label background — kill default 0.7 opacity */
      svg.classDiagram .labelBkg,
      svg.erDiagram .labelBkg {
        background-color: var(--color-background-primary) !important;
        opacity: 1 !important;
      }

      body {
        position: relative;
      }
      #vis-container {
        width: 100%;
        position: relative;
        overflow: hidden;
      }
      #vis-container > svg {
        display: block;
        margin-inline: auto;
        max-width: 100%;
        height: auto;
        overflow: visible;
      }

      /* Action buttons group.
   hidden attr is removed on tool-input (final) so buttons never show during streaming.
   Popover items: Copy to clipboard, Download file, Save as artifact. */
      #action-btns {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 2147483647;
        display: flex;
        gap: 4px;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      /* display:flex above would override UA [hidden] — restore it */
      #action-btns[hidden] {
        display: none;
      }
      body:hover #action-btns {
        opacity: 1;
      }
      /* 28×28 chip style for the ⋯ trigger.
   bg-100 at rest (visible over widget content), bg-300 on hover.
   No border — bg change is enough hover feedback. Transparent border stays
   for layout stability. Fallback light-dark() values match the design-system
   --bg-100/--bg-300 tokens (widget iframe doesn\'t receive them via host
   context, only --color-background-* semantic vars). */
      #action-btns > button {
        width: 28px;
        height: 28px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--border-radius-sm, 6px);
        background: var(--bg-100, light-dark(#faf9f5, #262624));
        border: 1px solid transparent;
        color: var(--color-text-secondary, #3d3d3a);
        cursor: pointer;
        transition: background 0.15s ease;
      }
      #action-btns > button:hover {
        background: var(--bg-300, light-dark(#f0eee6, #141413));
      }
      /* Popover — drops down-left from the trigger.
   Styled to match the native Radix dropdown: white bg, backdrop
   blur, 0.5px border, subtle shadow. Items are single-line icon + label,
   matching the conversation menu (Star/Rename/Add to project). */
      #more-popover {
        position: absolute;
        top: calc(100% + 4px);
        right: 0;
        min-width: 8rem;
        padding: 6px;
        border-radius: 12px;
        background: var(--color-background-primary, #fff);
        border: 0.5px solid var(--color-border-secondary, rgba(0, 0, 0, 0.1));
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        box-shadow: 0 2px 8px light-dark(rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.24));
        font-family: var(--font-sans, system-ui);
        color: var(--color-text-secondary, #3d3d3a);
        opacity: 0;
        visibility: hidden;
        transform: translateY(-4px);
        transition:
          opacity 0.15s ease,
          transform 0.15s ease,
          visibility 0s linear 0.15s;
      }
      /* Reveal only when hovering the ⋯ trigger or the popover itself. A 4px
   dead-zone between trigger and popover would close it, so
   #more-popover:hover keeps it open during the crossing. */
      #more-btn:hover ~ #more-popover,
      #more-popover:hover {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
        transition:
          opacity 0.15s ease,
          transform 0.15s ease,
          visibility 0s;
      }
      /* Popover items — single-line icon + label, matching native dropdown menu */
      .more-item {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 8px;
        border: none;
        background: transparent;
        border-radius: 8px;
        cursor: pointer;
        text-align: left;
        font-family: var(--font-sans, system-ui) !important;
        color: inherit;
        transition: background 0.1s ease;
        white-space: nowrap;
      }
      .more-item:hover {
        background: var(--color-background-secondary, #f5f4ed);
        color: var(--color-text-primary, #141413);
      }
      .more-item-icon {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .more-item-icon svg {
        width: 20px;
        height: 20px;
      }
      .more-item-label {
        font-family: var(--font-sans, system-ui) !important;
        font-size: 14px;
        line-height: 1.3;
        white-space: nowrap;
      }
      #copy-toast {
        position: fixed;
        top: 12px;
        left: 50%;
        transform: translateX(-50%) translateY(-20px);
        background: var(--color-background-danger, #f7ecec);
        color: var(--color-text-danger, #7f2c28);
        border: 1px solid var(--color-border-danger, #a73d39);
        font-family: var(--font-sans, system-ui);
        font-size: 13px;
        padding: 8px 14px;
        border-radius: var(--border-radius-md, 8px);
        pointer-events: none;
        opacity: 0;
        transition:
          opacity 0.2s ease,
          transform 0.2s ease;
        z-index: 2147483647;
        white-space: nowrap;
      }
      #copy-toast.visible {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }

      /* HTML scripts-loading shimmer */
      #vis-container.scripts-loading {
        pointer-events: none;
        opacity: 0.7;
      }
      #vis-container.scripts-loading::after {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 10000;
        overflow: hidden;
      }
      #vis-container.scripts-loading::before {
        content: '';
        position: absolute;
        top: -50%;
        left: 0;
        width: 60%;
        height: 200%;
        z-index: 10001;
        background: linear-gradient(
          90deg,
          transparent 0%,
          light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)) 50%,
          transparent 100%
        );
        animation: scriptsShimmer 2s ease-in-out infinite;
      }
      @keyframes scriptsShimmer {
        0% {
          transform: translateX(-100%) rotate(25deg);
        }
        100% {
          transform: translateX(200%) rotate(25deg);
        }
      }
    </style>
    <style id="entry-animation">
      /* Entry animation for streaming SVG elements.
   Scoped to #vis-container.streaming — widget-main.ts adds the class on first
   tool-input-partial and removes it on tool-input. After streaming, scripts
   that rebuild SVG via innerHTML (e.g. slider-driven charts) won\'t trigger this.
   Uses CSS individual transform property (scale) to avoid conflicts with SVG transform attribute.
   Excludes elements with transform/opacity attributes to prevent CSS overriding SVG values. */
      @keyframes svgFadeInScale {
        from {
          opacity: 0;
          scale: 0.95;
        }
        to {
          opacity: 1;
          scale: 1;
        }
      }
      #vis-container.streaming
        :where(svg, circle, rect, path, polygon, polyline, line, ellipse, g, text):not(
          [transform]
        ):not([opacity]) {
        transition:
          fill 0.4s ease-out,
          stroke 0.4s ease-out,
          opacity 0.4s ease-out;
        animation: svgFadeInScale 0.5s ease-out;
        transform-origin: center;
      }
    </style>
  </head>
  <body>
    \x3c!-- Pre-defined SVG markers — available to all SVGs via url(#arrow) --\x3e
    <svg style="position: absolute; width: 0; height: 0" aria-hidden="true">
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path
            d="M2 1L8 5L2 9"
            fill="none"
            stroke="context-stroke"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </marker>
      </defs>
    </svg>
    <div id="vis-container">
    </div>
    <script type="module">
      "use strict";
      (() => {
        var __create = Object.create;
        var __defProp = Object.defineProperty;
        var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
        var __getOwnPropNames = Object.getOwnPropertyNames;
        var __getProtoOf = Object.getPrototypeOf;
        var __hasOwnProp = Object.prototype.hasOwnProperty;
        var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
          get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
        }) : x)(function(x) {
          if (typeof require !== "undefined") return require.apply(this, arguments);
          throw Error(\'Dynamic require of "\' + x + \'" is not supported\');
        });
        var __copyProps = (to, from, except, desc) => {
          if (from && typeof from === "object" || typeof from === "function") {
            for (let key of __getOwnPropNames(from))
              if (!__hasOwnProp.call(to, key) && key !== except)
                __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
          }
          return to;
        };
        var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
          // If the importer is in node compatibility mode or this is not an ESM
          // file that has been converted to a CommonJS file using a Babel-
          // compatible transform (i.e. "__esModule" has not been set), then set
          // "default" to the CommonJS "module.exports" for node compatibility.
          isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
          mod
        ));

        // src/scripts/mcp-app-helper.ts
        var app2 = /* @__PURE__ */ (() => {
          let nextId = 100;
          return {
            sendRequest({ method, params }) {
              const id = nextId++;
              window.parent.postMessage({ jsonrpc: "2.0", id, method, params }, "*");
              return new Promise((resolve, reject) => {
                window.addEventListener(
                  "message",
                  function listener(event) {
                    if (event.data?.id === id) {
                      window.removeEventListener("message", listener);
                      if (event.data?.result) {
                        resolve(event.data.result);
                      } else if (event.data?.error) {
                        const e = event.data.error;
                        reject(
                          new Error(
                            typeof e === "string" ? e : e.message || JSON.stringify(e)
                          )
                        );
                      }
                    }
                  }
                );
              });
            },
            sendNotification({ method, params }) {
              window.parent.postMessage({ jsonrpc: "2.0", method, params }, "*");
            },
            onNotification(method, handler) {
              window.addEventListener(
                "message",
                function listener(event) {
                  if (event.data?.method === method) {
                    handler(event.data.params);
                  }
                }
              );
            },
            setupAutoResize() {
              new ResizeObserver(() => {
                const { body, documentElement: html } = document;
                const htmlStyle = getComputedStyle(html);
                const rect = body.getBoundingClientRect();
                const width = Math.ceil(rect.width);
                const height = Math.ceil(
                  rect.height + (parseFloat(htmlStyle.borderTop) || 0) + (parseFloat(htmlStyle.borderBottom) || 0)
                );
                this.sendNotification({
                  method: "ui/notifications/size-changed",
                  params: { width, height }
                });
              }).observe(document.body);
            }
          };
        })();
        window.app = app2;

        // src/scripts/streaming-morph.ts
        function createStreamingRenderer2(options = {}) {
          const {
            stripScripts = false,
            widgetName = "Widget",
            shouldRender = () => true,
            onFirstRender
          } = options;
          let didFirstRender = false;
          const markFirstRender2 = () => {
            if (!didFirstRender) {
              didFirstRender = true;
              onFirstRender?.();
            }
          };
          let parserModules = null;
          let morphdomModule = null;
          let streamingParser = null;
          let prevCode = "";
          async function renderPartial(container2, code) {
            if (!code) return;
            if (!parserModules || !morphdomModule) {
              try {
                const [htmlparser2, domhandler, domSerializer, morphdom] = await Promise.all([
                  import("https://esm.sh/htmlparser2@9.1.0"),
                  import("https://esm.sh/domhandler@5.0.3"),
                  import("https://esm.sh/dom-serializer@2.0.0"),
                  import("https://esm.sh/morphdom@2.7.4")
                ]);
                parserModules = {
                  Parser: htmlparser2.Parser,
                  DomHandler: domhandler.DomHandler,
                  render: domSerializer.default
                };
                morphdomModule = morphdom.default;
              } catch (err) {
                console.warn(
                  \`[\${widgetName}] CDN failed, falling back to innerHTML:\`,
                  err
                );
                container2.innerHTML = code;
                markFirstRender2();
                return;
              }
            }
            if (code.length < prevCode.length || !streamingParser) {
              const handler = new parserModules.DomHandler();
              streamingParser = {
                parser: new parserModules.Parser(handler, {
                  decodeEntities: false,
                  lowerCaseAttributeNames: false,
                  lowerCaseTags: false,
                  recognizeSelfClosing: true
                }),
                handler,
                write(chunk) {
                  this.parser.write(chunk);
                },
                serialize() {
                  return parserModules.render(this.handler.root.children, {
                    encodeEntities: false
                  });
                }
              };
              prevCode = "";
            }
            const newChunk = code.substring(prevCode.length);
            if (newChunk) {
              streamingParser.write(newChunk);
              prevCode = code;
            }
            let serialized = streamingParser.serialize();
            if (serialized) {
              if (stripScripts) {
                serialized = serialized.replace(/<script[\\s\\S]*?<\\/script>/gi, "");
              }
              if (shouldRender(serialized)) {
                const tempContainer = container2.cloneNode(false);
                tempContainer.innerHTML = serialized;
                morphdomModule(container2, tempContainer, { childrenOnly: true });
                markFirstRender2();
              }
            }
          }
          return { renderPartial };
        }
        window.createStreamingRenderer = createStreamingRenderer2;

        // src/scripts/clipboard-copy.ts
        var htmlToImage = null;
        async function loadHtmlToImage() {
          if (!htmlToImage) {
            htmlToImage = await import("https://esm.sh/html-to-image@1.11.11");
          }
          return htmlToImage;
        }
        async function copyToClipboard2(_container) {
          const lib = await loadHtmlToImage();
          const target = document.body;
          const width = target.scrollWidth || 700;
          const height = target.scrollHeight || 400;
          const blob = await lib.toBlob(target, {
            pixelRatio: 2,
            width,
            height,
            filter: (node) => !(node instanceof HTMLElement && (node.id === "action-btns" || node.id === "copy-toast"))
          });
          if (!blob) throw new Error("Failed to create PNG");
          const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
          if (isSafari) {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": Promise.resolve(blob) })
            ]);
          } else {
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          }
        }
        window.copyToClipboard = copyToClipboard2;

        // src/scripts/host-init.ts
        function initHostContext2(result) {
          const hostContext = result.hostContext;
          if (!hostContext) return;
          const styles = hostContext.styles;
          if (!styles) return;
          const css = styles.css;
          if (css?.fonts) {
            const fontStyle = document.getElementById("mcp-host-fonts");
            if (fontStyle) {
              fontStyle.textContent = css.fonts;
            }
          }
          const variables = styles.variables;
          if (variables) {
            const style = document.createElement("style");
            style.id = "mcp-host-variables";
            style.textContent = ":root {\
      " + Object.entries(variables).map(([key, value]) => "  " + key + ": " + value + ";").join("\
      ") + "\
      }";
            document.head.appendChild(style);
          }
          applyHostStrings(hostContext._hostStrings);
        }
        function applyHostStrings(hostStrings) {
          if (!hostStrings || typeof hostStrings !== "object") return;
          const strings = hostStrings;
          document.querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.dataset.i18n;
            const val = key ? strings[key] : void 0;
            if (val && val.trim()) el.textContent = val;
          });
          window.__hostStrings = strings;
        }
        window.addEventListener("message", (event) => {
          const data = event.data;
          if (data?.method === "ui/notifications/host-context-changed") {
            applyHostStrings(data.params?._hostStrings);
          }
        });
        window.initHostContext = initHostContext2;

        // src/scripts/send-prompt.ts
        window.sendPrompt = function sendPrompt(text) {
          app.sendRequest({
            method: "ui/message",
            params: { role: "user", content: [{ type: "text", text }] }
          });
        };

        // src/scripts/open-link.ts
        window.openLink = function openLink(url) {
          return app.sendRequest({
            method: "ui/open-link",
            params: { url }
          });
        };
        document.getElementById("vis-container").addEventListener("click", (e) => {
          const anchor = e.target?.closest?.("a[href]");
          if (!anchor) return;
          const href = anchor.getAttribute("href");
          if (!href) return;
          if (href.startsWith("#") || href.startsWith("javascript:")) return;
          let url;
          try {
            url = new URL(href, window.location.href).href;
          } catch {
            return;
          }
          if (!/^https?:/.test(url)) return;
          e.preventDefault();
          window.openLink(url);
        });

        // src/scripts/svg-text-occlusion.ts
        function fixSvgTextOcclusion2(container2) {
          try {
            const svg = container2.querySelector("svg");
            if (!svg) return;
            const NS = "http://www.w3.org/2000/svg";
            const PAD_X = 4;
            const PAD_Y = 2;
            const MIN_CONNECTOR_LEN = 15;
            const textRects = [];
            svg.querySelectorAll("text").forEach((t) => {
              if (t.closest("defs, mask, clipPath, marker")) return;
              try {
                const bb = t.getBBox();
                if (bb.width < 1 || bb.height < 1) return;
                textRects.push({
                  x: bb.x - PAD_X,
                  y: bb.y - PAD_Y,
                  w: bb.width + 2 * PAD_X,
                  h: bb.height + 2 * PAD_Y
                });
              } catch {
              }
            });
            if (!textRects.length) return;
            const candidates = [];
            svg.querySelectorAll("line, path, polyline").forEach((el) => {
              if (el.closest("defs, mask, clipPath, marker")) return;
              if (el.tagName.toLowerCase() === "path") {
                const fill = el.getAttribute("fill") || getComputedStyle(el).fill;
                if (fill && fill !== "none" && fill !== "transparent" && !/^rgba\\([^)]*,\\s*0\\)$/.test(fill))
                  return;
              }
              const geom = el;
              try {
                const len = geom.getTotalLength();
                if (len < MIN_CONNECTOR_LEN) return;
                candidates.push({ el: geom, len });
              } catch {
              }
            });
            if (!candidates.length) return;
            const inRect = (px, py, r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
            const intersecting = [];
            for (const { el, len } of candidates) {
              const step = Math.max(2, len / 80);
              let hit = false;
              for (let d = 0; d <= len && !hit; d += step) {
                const pt = el.getPointAtLength(d);
                for (const r of textRects) {
                  if (inRect(pt.x, pt.y, r)) {
                    hit = true;
                    break;
                  }
                }
              }
              if (hit) intersecting.push(el);
            }
            if (!intersecting.length) return;
            let defs = svg.querySelector(":scope > defs");
            if (!defs) {
              defs = document.createElementNS(NS, "defs");
              svg.insertBefore(defs, svg.firstChild);
            }
            const maskId = \`imagine-text-gaps-\${Math.random().toString(36).slice(2, 8)}\`;
            const mask = document.createElementNS(NS, "mask");
            mask.setAttribute("id", maskId);
            mask.setAttribute("maskUnits", "userSpaceOnUse");
            const vb = (svg.getAttribute("viewBox") || "").trim().split(/[\\s,]+/).map(Number);
            const [vx, vy, vw, vh] = vb.length === 4 && vb.every((n) => Number.isFinite(n)) ? vb : (() => {
              const bb = svg.getBBox();
              return [bb.x, bb.y, bb.width, bb.height];
            })();
            const bg = document.createElementNS(NS, "rect");
            bg.setAttribute("x", String(vx));
            bg.setAttribute("y", String(vy));
            bg.setAttribute("width", String(vw));
            bg.setAttribute("height", String(vh));
            bg.setAttribute("fill", "white");
            mask.appendChild(bg);
            for (const r of textRects) {
              const hole = document.createElementNS(NS, "rect");
              hole.setAttribute("x", String(r.x));
              hole.setAttribute("y", String(r.y));
              hole.setAttribute("width", String(r.w));
              hole.setAttribute("height", String(r.h));
              hole.setAttribute("fill", "black");
              hole.setAttribute("rx", "2");
              mask.appendChild(hole);
            }
            defs.appendChild(mask);
            for (const el of intersecting) {
              el.setAttribute("mask", \`url(#\${maskId})\`);
            }
          } catch {
          }
        }
        window.fixSvgTextOcclusion = fixSvgTextOcclusion2;

        // src/scripts/svg-clip-fix.ts
        function fixSvgClipping2(container2) {
          try {
            const svg = container2.querySelector("svg");
            if (!svg) return;
            const vb = svg.getAttribute("viewBox");
            if (!vb) return;
            const [vbX, vbY, vbW, vbH] = vb.split(/[\\s,]+/).map(Number);
            if (![vbX, vbY, vbW, vbH].every(Number.isFinite)) return;
            let maxY = -Infinity;
            svg.querySelectorAll(
              ":scope > :not(defs):not(style):not(title):not(desc):not(metadata)"
            ).forEach((el) => {
              try {
                const bb = el.getBBox();
                if (bb.width < 0.5 && bb.height < 0.5) return;
                maxY = Math.max(maxY, bb.y + bb.height);
              } catch {
              }
            });
            if (maxY === -Infinity) return;
            const PAD = 10;
            const vbBottom = vbY + vbH;
            if (maxY + PAD <= vbBottom + 1) return;
            const newH = maxY + PAD - vbY;
            svg.setAttribute("viewBox", \`\${vbX} \${vbY} \${vbW} \${round(newH)}\`);
            const hAttr = svg.getAttribute("height");
            if (hAttr) {
              const px = parseFloat(hAttr);
              if (Number.isFinite(px)) {
                svg.setAttribute("height", String(round(px * (newH / vbH))));
              }
            }
          } catch {
          }
        }
        function round(n) {
          return Math.round(n * 100) / 100;
        }
        globalThis.fixSvgClipping = fixSvgClipping2;

        // src/scripts/svg-text-edge-fix.ts
        function fixSvgTextEdgeClip2(container2) {
          try {
            const svg = container2.querySelector("svg");
            if (!svg) return;
            const vb = svg.getAttribute("viewBox");
            if (!vb) return;
            const [vbX, , vbW] = vb.split(/[\\s,]+/).map(Number);
            if (!Number.isFinite(vbX) || !Number.isFinite(vbW)) return;
            const vbRight = vbX + vbW;
            const byKey = /* @__PURE__ */ new Map();
            svg.querySelectorAll("text").forEach((text) => {
              if (text.closest("svg") !== svg) return;
              if (text.closest("g[transform]")) return;
              if (text.hasAttribute("transform")) return;
              if (text.querySelector("tspan[x]")) return;
              const p = text.parentElement;
              if (p && p !== svg) {
                const hasBox = Array.from(
                  p.querySelectorAll(
                    ":scope > rect, :scope > circle, :scope > ellipse"
                  )
                ).some((shape) => {
                  try {
                    return shape.getBBox().width > 10;
                  } catch {
                    return true;
                  }
                });
                if (hasBox) return;
              }
              const anchor = text.getAttribute("text-anchor") || getComputedStyle(text).textAnchor || "start";
              if (anchor !== "start" && anchor !== "end") return;
              let bb;
              try {
                bb = text.getBBox();
              } catch {
                return;
              }
              if (bb.width < 1) return;
              const xAttr = text.getAttribute("x");
              if (!xAttr || /[\\s,]/.test(xAttr)) return;
              const x = parseFloat(xAttr);
              if (!Number.isFinite(x)) return;
              const overflow = anchor === "start" ? bb.x + bb.width - vbRight : vbX - bb.x;
              const key = \`\${anchor}:\${x}\`;
              const group = byKey.get(key) ?? [];
              group.push({ text, x, anchor, overflow, width: bb.width });
              byKey.set(key, group);
            });
            byKey.forEach((group) => {
              const overflowing = group.filter((g) => g.overflow > 2);
              if (!overflowing.length) return;
              const worst = overflowing.reduce(
                (a, b) => a.overflow > b.overflow ? a : b
              );
              if (worst.overflow > worst.width * 0.5) return;
              const shift = group[0].anchor === "start" ? -worst.overflow : worst.overflow;
              group.forEach(
                ({ text, x }) => text.setAttribute("x", String(round2(x + shift)))
              );
            });
          } catch {
          }
        }
        function round2(n) {
          return Math.round(n * 100) / 100;
        }
        globalThis.fixSvgTextEdgeClip = fixSvgTextEdgeClip2;

        // src/scripts/widget-main.ts
        var IMPLEMENTATION = { name: "visualize widget", version: "1.0.0" };
        var container = document.getElementById("vis-container");
        var isSvgCode = (code) => code.trimStart().startsWith("<svg");
        var hasSvgVisuals = (code) => code && /<(rect|circle|ellipse|line|polyline|polygon|path|text|image|use|g|foreignObject)[\\s>]/i.test(
          code.replace(/<style[\\s\\S]*?<\\/style>/gi, "").replace(/<defs[\\s\\S]*?<\\/defs>/gi, "")
        );
        var hasHtmlVisuals = (code) => code && code.replace(/<style[\\s\\S]*?<\\/style>/gi, "").replace(/<script[\\s\\S]*?<\\/script>/gi, "").replace(/\x3c!--[\\s\\S]*?--\x3e/g, "").trim().length > 0;
        var executeScripts = async () => {
          const scripts = Array.from(container.querySelectorAll("script"));
          for (const oldScript of scripts) {
            const newScript = document.createElement("script");
            Array.from(oldScript.attributes).forEach(
              (attr) => newScript.setAttribute(attr.name, attr.value)
            );
            newScript.textContent = oldScript.textContent;
            const hasSrc = newScript.hasAttribute("src");
            const loaded = hasSrc ? new Promise((resolve) => {
              newScript.onload = () => resolve();
              newScript.onerror = () => resolve();
            }) : Promise.resolve();
            oldScript.parentNode?.replaceChild(newScript, oldScript);
            await loaded;
          }
        };
        var vizTitle = "visualize";
        var iframeStartTime = performance.now();
        var firstRenderSent = false;
        var sendTiming = (event) => app.sendNotification({
          method: "notifications/message",
          params: {
            level: "info",
            logger: "viz:timing",
            data: {
              event,
              iframe_ms: Math.round(performance.now() - iframeStartTime)
            }
          }
        });
        var markFirstRender = () => {
          if (!firstRenderSent) {
            firstRenderSent = true;
            sendTiming("firstrender");
          }
        };
        var svgRenderer = createStreamingRenderer({
          widgetName: "VisualizeWidget-SVG",
          shouldRender: hasSvgVisuals,
          onFirstRender: markFirstRender
        });
        var htmlRenderer = createStreamingRenderer({
          widgetName: "VisualizeWidget-HTML",
          stripScripts: true,
          shouldRender: hasHtmlVisuals,
          onFirstRender: markFirstRender
        });
        var renderFinal = async (code) => {
          container.classList.remove("streaming");
          if (isSvgCode(code)) {
            if (hasSvgVisuals(code)) {
              container.innerHTML = code;
              markFirstRender();
              fixSvgClipping(container);
              fixSvgTextEdgeClip(container);
              fixSvgTextOcclusion(container);
            }
          } else {
            if (hasHtmlVisuals(code)) {
              container.innerHTML = code;
              markFirstRender();
              await executeScripts();
              container.classList.remove("scripts-loading");
            }
          }
          window.dispatchEvent(
            new CustomEvent("viz:complete", {
              detail: { code, title: vizTitle }
            })
          );
          sendTiming("complete");
        };
        var renderPartialCode = (code) => {
          container.classList.add("streaming");
          if (isSvgCode(code)) {
            void svgRenderer.renderPartial(container, code);
          } else {
            void htmlRenderer.renderPartial(container, code);
            if (code.includes("<script") && hasHtmlVisuals(code)) {
              container.classList.add("scripts-loading");
            }
          }
        };
        var nextRequestId = 1;
        async function connectToHost() {
          try {
            window.addEventListener("message", (event) => {
              try {
                const data = event.data;
                if (data && data.jsonrpc === "2.0") {
                  if (data.id === 1 && data.result) {
                    initHostContext(data.result);
                    window.parent.postMessage(
                      {
                        jsonrpc: "2.0",
                        method: "ui/notifications/initialized",
                        params: {}
                      },
                      "*"
                    );
                  }
                }
              } catch (err) {
                console.error("[VisualizeWidget] Error handling message:", err);
              }
            });
            app.onNotification("ui/notifications/tool-input-partial", (params) => {
              const args = params?.arguments ?? {};
              if (typeof args.title === "string" && args.title) vizTitle = args.title;
              const code = args.widget_code ?? args.code;
              if (code) renderPartialCode(code);
            });
            app.onNotification("ui/notifications/tool-input", (params) => {
              const args = params?.arguments ?? {};
              if (typeof args.title === "string" && args.title) vizTitle = args.title;
              const code = args.widget_code ?? args.code;
              if (code) {
                void renderFinal(code);
                document.getElementById("action-btns")?.removeAttribute("hidden");
              }
            });
            app.setupAutoResize();
            const hostStr = (key) => {
              const s = window.__hostStrings;
              const v = s?.[key];
              return v && v.trim() ? v : void 0;
            };
            const FREEZE_PROPS = [
              "fill",
              "stroke",
              "color",
              "stroke-width",
              "stroke-dasharray",
              "stroke-linecap",
              "stroke-linejoin",
              "opacity",
              "font-family",
              "font-size",
              "font-weight",
              "font-style",
              "text-anchor",
              "dominant-baseline"
            ];
          } catch (err) {
            console.error("[VisualizeWidget] Failed to connect:", err);
          }
        }
        connectToHost();
        
        const initialCode = ${JSON.stringify(widgetCode || "").replace(/</g, "\\u003c")};
        if (initialCode) {
          vizTitle = ${JSON.stringify(title || "").replace(/</g, "\\u003c")};
          setTimeout(() => {
            void renderFinal(initialCode);
            document.getElementById("action-btns")?.removeAttribute("hidden");
          }, 0);
        }
      })();
    </script>
  </body>
</html>
  `

  return <iframe
    srcDoc={baseWidgetCode}
    className="w-full h-[400px] border-0"
    sandbox="allow-scripts allow-same-origin allow-forms"
    allow="clipboard-write *"
    style={{ width: '100%', border: 'none', backgroundColor: 'transparent' }}
    title={typeof title === 'string' ? title : 'Widget'}
  />
}