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
      assert(false, 'Invalid Child Entry: ' + entry);
    }
  }

  children.forEach((c) => elem.appendChild(mk_child(c)));
}

function set_error(msg) {
  const errmsg = 'ERROR: ' + msg
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

  function PredicateFailure(value, reason) {
    this.value = value;
    this.reason = reason;
    this.path = [];
  }

  function predicate(p, reason) {
    return (v) => {
      if (!p(v)) {
        throw new PredicateFailure(v, reason)
      }
    };
  }

  function and(a, b, more___) {
    if (arguments.length > 2) {
      return and(
        a,
        and.apply(null, Array.prototype.slice.call(arguments, 1)),
      );
    } else {
      return (v) => {
        a(v);
        b(v);
      };
    }
  }

  function or(a, b, more___) {
    if (arguments.length > 2) {
      return or(
        a,
        or.apply(null, Array.prototype.slice.call(arguments, 1)),
      );
    } else {
      return (v) => {
        try {
          a(v);
        } catch (ea) {
          if (!(ea instanceof PredicateFailure)) {
            throw ea;
          }

          try {
            b(v);
          } catch (eb) {
            if (!(eb instanceof PredicateFailure)) {
              throw eb;
            }

            throw new PredicateFailure(v, ea.reason + ' AND ' + eb.reason);
          }
        }
      }
    }
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
      predicate((v) => v > 1412345, 'in the past'),
      predicate((v) => v < 4123456, 'too far in the future'),
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

  function validate_schema(thing, schema) {
    if (typeof schema == 'function') {
      schema(thing);

    } else if (Array.isArray(schema)) {
      validate_schema_array(thing, schema);

    } else if (typeof schema == 'object') {
      validate_schema_object(thing, schema);

    } else {
      assert(false, 'unknown schema type: ' + schema);
    }
  }

  function validate_schema_array(thing, schema) {
    assert(schema.length == 1);
    const elemschema = schema[0];
    validate_schema(thing, predicate(Array.isArray, 'not an array'));
    thing.forEach((x, i) => {
      annotate_path('[' + i + ']', validate_schema, x, elemschema);
    });
  }

  function validate_schema_object(thing, schema) {
    const unprocessed = {};
    Object.getOwnPropertyNames(thing).forEach((k) => {
      unprocessed[k] = null;
    });

    const parsed = {};
    for (const field in schema) {
      annotate_path(
        '.' + field,
        validate_schema,
        thing[field],
        schema[field],
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
    );
  }

  function annotate_path(pathcomponent, f, args__) {
    const args = Array.prototype.slice.call(arguments, 2);
    try {
      f.apply(null, args);
    } catch (e) {
      if (e instanceof PredicateFailure) {
        e.path.unshift(pathcomponent);
      }
      throw e;
    }
  }

  try {
    validate_schema(doc, SCHEMA);
  } catch (e) {
    if (e instanceof PredicateFailure) {
      set_error('Invalid Ballot JSON at ' + e.path.join('').substring(1) + ': ' + e.reason + ' for value ' + e.value);
    } else {
      throw e;
    }
  }
}

function default_value(v, def) {
  return (v === undefined) ? def : v;
}

function assert(cond, msg) {
  if (!cond) {
    throw set_error('Internal assertion failure: ' + msg);
  }
}
