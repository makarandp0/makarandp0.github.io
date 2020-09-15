import { createElement } from './createElement.js';

export function createLabeledCheckbox({ container, labelText, id }) {
  const checkbox = createElement(container, { type: 'input', id });
  checkbox.setAttribute('type', 'checkbox');

  const label = createElement(container, { type: 'label' });
  label.innerHTML = labelText;
  label.setAttribute('for', id);
  return checkbox;
}
