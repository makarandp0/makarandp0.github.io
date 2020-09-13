import { createElement } from './createElement.js';

export default function createLabeledStat(container, label, { id, className, useValueToStyle = false }) {
  const el = createElement(container, { type: 'p', id, classNames: [className, 'labeledStat'] });
  let lastText = null;
  return {
    setText: text => {
      if (useValueToStyle && lastText !== null) {
        el.classList.remove(`${className}_${lastText}`);
      }
      el.textContent = label + ': ' + text;
      if (useValueToStyle) {
        el.classList.add(`${className}_${text}`);
        lastText = text;
      }
    }
  };
}
