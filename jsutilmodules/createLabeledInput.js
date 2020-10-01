import { createElement } from './createElement.js';

export function createLabeledInput({ container, labelText, placeHolder, labelClasses = [], inputType = 'input', inputClasses = [] }) {
  const identityLabel = createElement(container, { type: 'label', classNames: labelClasses });
  identityLabel.innerHTML = labelText;
  const localIdentity = createElement(container, { type: inputType, classNames: inputClasses });
  localIdentity.placeholder = placeHolder;
  return localIdentity;
}
