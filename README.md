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
this["streamOptions"] = opts.streamOptions || { allowHalfOpen: false };
this["autoGenerateId"] = opts.autoGenerateId || true;
this["clients"] = {};
```

- `seidGenerator` : Return a `seid` (**S**erver **e**vent **ID**) for object key to store `reply` in `clients` object, `clients[seid]= reply;`.
- `stream` : Stream class will be passing to `reply.send(stream)`.
- `streamOptions` : Options for create new stream, `new stream(streamOptions)`.
- `autoGenerateId` : If `true`. The library will automatically create `id` in every `sendEvent`.
- `clients` : All active `reply` will be store in this object with `seid` as a key. The `reply` will deleted after connection closed.

### METHODS

- **`reply.sendEvent(data, ?event, ?id, ?retry)` :**

  - `data` : Data will send to client, `string` or `object`.
  - `event` _(Optional)_ : Event name will emit in client.
  - `id` _(Optional)_ : ID for every event action.
  - `retry` _(Optional)_ : Interval time to reconnecting to server if connection lost (In **ms**).

- **`reply.sendEventBySeid(seid, data, ?event, ?id, ?retry)` :**
  - `seid` : **S**erver **e**vent **ID**, you can get it on `req.seid` in every `http.get` request.
- **`reply.endEvent()` :** To close the connection and delete `reply` value in `clients` object with key same as `req.seid` value.

You can see more information about `data`, `event`, `id` and`retry` in : [Server-sent Events - Fields](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Fields).

### EXAMPLE

```javascript
fastify.get("/events", function(request, reply) {
  reply.sendEvent("hello world", "greeting");

  // OR data with type object

  reply.sendEvent(
    {
      from: "@other_people",
      message: "hey guy",
      date: "x-x-x-x"
    },
    "new_private_message"
  );

  // If you want to trigger event for other client

  reply.sendEventBySeid(
    "@my_friend", // Your custom seid
    {
      from: "@my_friend",
      message: "my name is x"
    },
    "send_new_message"
  );

  // Important
  reply.endEvent();

  // reply.sendEvent will throw error if you call it in here
  reply.sendEvent("hello world", "greeting");

});
```
