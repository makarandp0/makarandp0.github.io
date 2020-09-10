
export function createElement(container, { type, id, classNames }) {
  const el = document.createElement(type);
  if (id) {
    el.id = id;
  }
  if (classNames) {
    el.classList.add(...classNames);
  }

  container.appendChild(el);
  return el;
}

export function createDiv(container, divClass, id) {
  divClass = Array.isArray(divClass) ? divClass : [divClass];
  return createElement(container, { type: 'div', classNames: divClass, id });
}

export function createButton(text, container, onClick) {
  const btn = createElement(container, { type: 'button', classNames: ['btn', 'btn-outline-primary', 'btn-sm'] });
  btn.innerHTML = text;
  btn.onclick = onClick;
  return {
    btn,
    show: visible => {
      btn.style.display = visible ? 'inline-block' : 'none';
    },
    text: newText => {
      btn.innerHTML = newText;
    },
    click: () => onClick(),
  };
}

export function createLabeledCheckbox({ container, labelText, id }) {
  const checkbox = createElement(container, { type: 'input', id });
  checkbox.setAttribute('type', 'checkbox');

  const label = createElement(container, { type: 'label' });
  label.innerHTML = labelText;
  label.setAttribute('for', id);
  return checkbox;
}


// styleMap uses the values to decide the style.
export function createLabeledStat(container, label, { id, className, useValueToStyle = false }) {
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
    },
  };
}

export function createSelection({ id, container, options = ['dog', 'cat', 'parrot', 'rabbit'], title = 'Pets', onChange = () => { } }) {
  var select = document.createElement('select');
  select.id = id;

  for (const val of options) {
    var option = document.createElement('option');
    option.value = val;
    option.text = val;
    select.appendChild(option);
  }

  var label = document.createElement('label');
  label.innerHTML = title;
  label.htmlFor = select.id;

  select.addEventListener('change', onChange);

  // var x = document.getElementById("mySelect").value
  container.appendChild(label).appendChild(select);
  return {
    select,
    getValue: () => { return select.value; },
    setValue: value => { select.value = value; /* not if the value is not one of the options then a blank value gets selected */ }
  };
}

