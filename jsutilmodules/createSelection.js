
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
