export default function createButton(text, container, onClick) {
  const btn = document.createElement('button');
  btn.innerHTML = text;
  btn.onclick = onClick;
  container.appendChild(btn);
  return {
    btn,
    show: visible => { btn.style.display = visible ? 'inline-block' : 'none'; },
    text: newText => { btn.innerHTML = newText; },
    click: () => onClick(),
    enable: () => { btn.disabled = false; },
    disable: () => { btn.disabled = true; }
  };
}
