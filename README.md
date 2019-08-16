# fastify-se

Fastify plugin for handle Server-sent Events. https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events

## INSTALATION

`npm i fastify-se`

### USAGE

```javascript
const fastify_se = require("fastify-se");

const SE = new fastify_se.SE(opts);

fastify.register(SE.plugin);
```

### OPTIONS

```javascript
this["seidGenerator"] = opts.seidGenerator || defaultSeidGenerator;
this["stream"] = opts.stream || stream.PassThrough;
this["streamOptions"] = opts.streamOptions || {};
this["clients"] = {};
```

- `seidGenerator` : **S**erver **e**vent **ID** for `clients` key.
- `reply` in `this[clients]`.  
- `stream` : Stream class will be passing to `reply.send(stream)`.  
- `streamOptions` : Options for create new stream, `new stream(streamOptions)`.
- `clients` : All active `reply` will be store in this object with `seidGenerator` as a key.The `reply` will deleted after connection closed.

### METHODS

- `reply.sendEvent(data, ?event, ?id)` :
    - `data` : Data will send to client.
    - `event`(Optional) : Event name will emit in client.
    - `id`(Optional) : ID for every event action.
- `reply.sendEventById(seid, data, ?event, ?id)` :
    - `seid` : **S**erver **e**vent **ID**, you can get it on `req.seid` in every `http.get` request.
- `reply.end()` : To close the connection and delete `reply` value in `clients` object with key same as `req.seid` value.