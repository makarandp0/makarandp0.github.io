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
