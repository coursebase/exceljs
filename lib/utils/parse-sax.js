const {SaxesParser} = require('saxes');
const {bufferToString} = require('./browser-buffer-decode');

const cleanNode = value =>
  value && value.name
  ? {
    ...value,
    name: value.name.startsWith('x:') ? value.name.slice(2) : value.name
  }
  : value;

module.exports = async function* (iterable) {
  const saxesParser = new SaxesParser();

  let error;
  saxesParser.on('error', err => {
    error = err;
  });

  let events = [];
  saxesParser.on('opentag', value =>
    events.push({
      eventType: 'opentag',
      value: cleanNode(value)
    })
  );
  saxesParser.on('text', value =>
    events.push({
      eventType: 'text',
      value: cleanNode(value)
    })
  );
  saxesParser.on('closetag', value =>
    events.push({
      eventType: 'closetag',
      value: cleanNode(value)
    })
  );

  for await (const chunk of iterable) {
    saxesParser.write(bufferToString(chunk));
    // saxesParser.write and saxesParser.on() are synchronous,
    // so we can only reach the below line once all events have been emitted
    if (error) throw error;
    // As a performance optimization, we gather all events instead of passing
    // them one by one, which would cause each event to go through the event queue
    yield events;
    events = [];
  }
};
