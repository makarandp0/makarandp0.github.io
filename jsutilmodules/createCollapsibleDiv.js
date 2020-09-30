import createButton from './button.js';
import { createDiv } from './createDiv.js';

export function createCollapsibleDiv({ container, headerText, divClass }) {
  const collapsibleDiv = createDiv(container, ['collapsible']);
  const headerDiv = createDiv(collapsibleDiv, 'roomHeaderDiv');
  const innerDiv = createDiv(collapsibleDiv, divClass);
  let display = null;
  const showHideButton = createButton(`hide: ${headerText}`, headerDiv, () => {
    if (innerDiv.style.display === 'none') {
      innerDiv.style.display = display;
      showHideButton.text(`hide: ${headerText}`);
    } else {
      display = innerDiv.style.display;
      innerDiv.style.display = 'none';
      showHideButton.text(`show: ${headerText}`);
    }
  });
  return innerDiv;
}
