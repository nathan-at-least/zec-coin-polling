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
  validate_ballot_json(doc);
  render_ballot(doc);
}

function render_ballot(doc) {
  const divballot = document.getElementById('div-ballot');
  append_children(
    divballot,
    [
      ['div', {}, [
        'ZEC Coin Polling Ballot ' + doc['zec-coin-polling-ballet'] + ': ' + doc['title']
      ]],
      ['div', {}, [
        'Cut-off Height ' + doc['cut-off-height'],
      ]],
      ['div', {}, [
        ['div', {}, [
          'Reception Z-Address: ',
          ['input',
            {
              'type': 'text',
              'editable': false,
              'value': doc['vote-reception-address'],
            },
            [],
          ]
        ]],
        ['div', {}, [
          'Reception Viewing Key: ',
          ['input',
            {
              'type': 'text',
              'editable': false,
              'value': doc['vote-reception-viewing-key'],
            },
            [],
          ],
        ]]
      ]],
      ['div', {},
        doc['poll-questions'].map((pq, ix) => {
          const responses = pq['fixed-responses'].map((r) => {
            return {
              'resp': r,
              'other': false,
            }
          });
          const oprompt = pq['other-prompt'];
          if (oprompt != null) {
            responses.push({
              'resp': oprompt + ': ',
              'other': true,
            });
          }

          return ['ul', {}, [
            ['li', {}, [
              'Question ' + (ix+1) + ': ' + pq['question'],
              ['div', {},
                responses.map((r, rix) => {
                  const id = 'response-q' + ix + 'r' + rix;
                  return ['div', {}, [
                    ['input',
                      {
                        'type': 'radio',
                        'id': id,
                        'name': 'response-q' + ix,
                        'value': '' + rix,
                      },
                      [],
                    ],
                    ['label',
                      {'for': id},
                      (r.other) ? [
                        r.resp,
                        ['input', {'type': 'text'}],
                      ] : [
                        r.resp,
                      ],
                    ],
                  ]];
                }),
              ],
            ]],
          ]];
        }),
      ]
    ]
  );
  divballot.hidden = false;
}

function mk_elem(tag, attrs, children) {
  const elem = document.createElement(tag);
  for_each_kv(
    default_value(attrs, {}),
    (k, v) => {
      elem.setAttribute(k, v)
    }
  );
  append_children(elem, default_value(children, []))
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
  throw errmsg;
}

function hide_elems(ids) {
  ids.forEach((id) => { document.getElementById(id).hidden = true });
}

function for_each_kv(obj, cb) {
  for (const k in obj) {
    cb(k, obj[k]);
  }
}

function validate_ballot_json(doc) {
  console.log('Validating Ballot JSON', doc);

  function predicate(p, desc) {
    p.predicate_description = desc;
    return p;
  }

  function and(a, b) {
    return predicate(
      (v) => a(v) && b(v),
      a.predicate_description + ' and ' + b.predicate_description,
    );
  }

  function or(a, b) {
    return predicate(
      (v) => a(v) || b(v),
      a.predicate_description + ' or ' + b.predicate_description,
    );
  }

  const is_type = (t) => predicate((v) => typeof v == t, 'not a ' + t);

  const SCHEMA = {
    "zec-coin-polling-ballet": predicate(
      (v) => v == 'v1',
      'unknown version',
    ),
    "title": is_type('string'),
    "cut-off-height": and(
      is_type('number'),
      predicate((v) => Number.isInteger(v), 'not an integer'),
    ),
    "vote-reception-address": is_type('string'),
    "vote-reception-viewing-key": is_type('string'),
    "poll-questions": [
      {
        "question": is_type('string'),
        "other-prompt": or(
          predicate((v) => v === null, 'null'),
          is_type('string'),
        ),
        "fixed-responses": [ is_type('string') ],
      }
    ]
  };

  function validate_schema(thing, schema, path) {
    if (typeof schema == 'function') {
      validate_schema_predicate(thing, schema, path);

    } else if (Array.isArray(schema)) {
      validate_schema_array(thing, schema, path);

    } else if (typeof schema == 'object') {
      validate_schema_object(thing, schema, path);

    } else {
      assert(false, 'unknown schema type: ' + schema);
    }
  }

  function validate_schema_predicate(thing, pred, path) {
    if (!pred(thing)) {
      const desc = pred.predicate_description;
      assert(desc !== undefined, 'schema.predicate_description undefined');
      set_error('' + path + ' is ' + desc + ': ' + thing);
    }
  }

  function validate_schema_array(thing, schema, path) {
    assert(schema.length == 1);
    const elemschema = schema[0];
    validate_schema(thing, predicate(Array.isArray, 'not an array'));
    thing.forEach((x, i) => validate_schema(x, elemschema, path + '[' + i + ']'));
  }

  function validate_schema_object(thing, schema, path) {
    const unprocessed = {};
    Object.getOwnPropertyNames(thing).forEach((k) => {
      unprocessed[k] = null;
    });

    const parsed = {};
    for (const field in schema) {
      validate_schema(
        thing[field],
        schema[field],
        path + '.' + field,
      );
      delete unprocessed[field];
    }

    // Anything left on thing is unknown:
    validate_schema(
      Object.getOwnPropertyNames(unprocessed),
      predicate(
        (a) => a.length == 0,
        'unknown fields',
      ),
      path,
    );
  }

  validate_schema(doc, SCHEMA, '<Ballot JSON>');
}

function default_value(v, def) {
  return (v === undefined) ? def : v;
}

function assert(cond, msg) {
  if (!cond) {
    set_error('Internal assertion failure: ' + msg);
  }
}
