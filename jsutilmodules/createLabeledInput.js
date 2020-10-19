import { createElement } from './createElement.js';

export function createLabeledInput({ container, labelText, placeHolder, initialValue, labelClasses = [], inputType = 'input', inputClasses = [] }) {
  let identityLabel = null;
  if (typeof labelText === 'string')  {
    identityLabel = createElement(container, { type: 'label', classNames: labelClasses });
    identityLabel.innerHTML = labelText;
  } else {
    identityLabel = labelText;
  }

  const inputElement = createElement(container, { type: inputType, classNames: inputClasses });
  inputElement.placeholder = placeHolder;
  if (initialValue) {
    inputElement.value = initialValue;
  }

  return inputElement;
}
