import { createElement } from './createElement.js';

export function createDiv(container, divClass, id) {
  divClass = Array.isArray(divClass) ? divClass : [divClass];
  return createElement(container, { type: 'div', classNames: divClass, id });
}
