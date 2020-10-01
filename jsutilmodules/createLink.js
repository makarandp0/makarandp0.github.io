import { createElement } from './createElement.js';

export function createLink({ container, linkText, linkUrl, newTab }) {
  var a = createElement(container, { type: 'a' });
  a.appendChild(document.createTextNode(linkText));
  a.title = linkText;
  a.href = linkUrl;
  if (newTab) {
    a.target = '_blank';
  }
  return a;
}
