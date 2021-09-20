window.onload = () => {
  hide_elems(['div-error', 'div-ballot']);
  document.getElementById("file-ballot")
    .addEventListener("change", handle_file);
};

async function handle_file(ev) {
  const file = ev.target.files[0];
  ev.target.hidden = true;

  console.log('Handling file: ' + file.name);
  const text = await file.text();
  const doc = JSON.parse(text);
  render_ballot_json(doc);
}

function render_ballot_json(doc) {
  const divballot = document.getElementById('div-ballot');
  append_children(
    divballot,
    [
      ['div', {}, [
        'ZEC Coin Polling Ballot ' + doc['zec-coin-polling-ballet'],
      ]],
    ]
  );
  divballot.hidden = false;
}

function mk_elem(tag, attrs, children) {
  const elem = document.createElement(tag);
  for_each_kv(
    (attrs === undefined) ? {} : attrs,
    (k, v) => {
      elem.setAttribute(k, v)
    }
  );
  append_children(elem, (children === undefined) ? [] : children);
  return elem;
}

function append_children(elem, children) {
  function mk_child(entry) {
    if (entry instanceof HTMLElement) {
      return entry;

    } else if (typeof entry === 'string') {
      return document.createTextNode(entry);

    } else if (Array.isArray(entry) && entry.length > 0 && entry.length <= 3) {
      if (entry.length < 2) {
        entry.push({});
      }
      if (entry.length < 3) {
        entry.push([]);
      }
      return mk_elem.apply(null, entry);

    } else {
      set_error('Invalid Child Entry: ' + entry);
      throw entry;
    }
  }

  children.forEach((c) => elem.appendChild(mk_child(c)));
}

function set_error(msg) {
  const errmsg = 'ERROR: ' + msg
  console.log(errmsg);
  const diverror = document.getElementById('div-error');
  diverror.textContent = errmsg;
  diverror.hidden = false;
}

function hide_elems(ids) {
  ids.forEach((id) => { document.getElementById(id).hidden = true });
}

function for_each_kv(obj, cb) {
  for (const k in obj) {
    cb(k, obj[k]);
  }
}
