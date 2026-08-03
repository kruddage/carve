/**
 * Building elements without a framework.
 *
 * #9 asks for a DOM overlay that "feels like a native web app", and the panels
 * are a tree outliner, a parameter list and a row of buttons. That is not
 * enough UI to justify a framework, a build-time template step or a virtual
 * DOM, and every one of those would be a dependency on the critical path of a
 * project whose actual difficulty is elsewhere entirely.
 *
 * What it does justify is not writing `document.createElement` four hundred
 * times. `el` is the whole abstraction: tag, attributes, children.
 *
 * Two rules the rest of `src/ui/` follows, and this file makes cheap:
 *
 *   - **Text goes in through `textContent`, never `innerHTML`.** A node's name
 *     is user input and lands in a saved file that can be opened from anywhere.
 *     `el` only ever accepts strings as text children, so there is no path from
 *     a document into markup.
 *   - **Icons are the one exception, and they are not user data.** The
 *     registry's `PrimitiveIcon` is a viewBox and a list of path `d` strings
 *     declared in `src/core/primitives.ts`; `svgIcon` builds real SVG elements
 *     from them rather than pasting a string.
 */

/** Attribute values. `false` and `null` remove the attribute, which is what a toggle wants. */
type AttrValue = string | number | boolean | null | undefined;

export type Child = Node | string | null | undefined | false;

export interface ElementOptions {
  readonly class?: string;
  readonly text?: string;
  readonly title?: string;
  readonly attrs?: Readonly<Record<string, AttrValue>>;
  readonly dataset?: Readonly<Record<string, string>>;
  readonly on?: Readonly<Record<string, (event: Event) => void>>;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: ElementOptions = {},
  children: readonly Child[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (options.class !== undefined) node.className = options.class;
  if (options.text !== undefined) node.textContent = options.text;
  if (options.title !== undefined) node.title = options.title;
  for (const [name, value] of Object.entries(options.attrs ?? {})) {
    if (value === false || value === null || value === undefined) node.removeAttribute(name);
    else node.setAttribute(name, String(value));
  }
  for (const [name, value] of Object.entries(options.dataset ?? {})) node.dataset[name] = value;
  for (const [type, listener] of Object.entries(options.on ?? {})) {
    node.addEventListener(type, listener);
  }
  append(node, children);
  return node;
}

export function append(parent: Node, children: readonly Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    parent.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
}

export function clear(node: Node): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/** A `<button type="button">`, because a bare `<button>` inside a form submits it. */
export function button(
  label: string,
  onClick: () => void,
  options: ElementOptions = {},
): HTMLButtonElement {
  return el('button', {
    ...options,
    text: label,
    attrs: { type: 'button', ...options.attrs },
    on: { click: () => onClick(), ...options.on },
  });
}

/** Add or remove a class without the caller writing the ternary each time. */
export function setClass(node: Element, name: string, on: boolean): void {
  node.classList.toggle(name, on);
}

/** An `<svg>` built from a registry icon. See the note about `innerHTML` above. */
export function svgIcon(icon: {
  readonly viewBox: string;
  readonly paths: readonly string[];
}): SVGSVGElement {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', icon.viewBox);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.4');
  svg.setAttribute('stroke-linejoin', 'round');
  for (const d of icon.paths) {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
  }
  return svg;
}
