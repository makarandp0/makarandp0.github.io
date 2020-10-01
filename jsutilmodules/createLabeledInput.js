import { createElement } from './createElement.js';

export function createLabeledInput({ container, labelText, placeHolder, labelClasses = [], inputType = 'input', inputClasses = [] }) {

  let identityLabel = null;
  if (typeof labelText === 'string')  {
    identityLabel = createElement(container, { type: 'label', classNames: labelClasses });
    identityLabel.innerHTML = labelText;
  } else {
    identityLabel = labelText;
  }

  const localIdentity = createElement(container, { type: inputType, classNames: inputClasses });
  localIdentity.placeholder = placeHolder;
  return localIdentity;
}
