const stream = require("stream");

const fastify_plugin = require("fastify-plugin");

class SE {
  constructor(opts = {}) {
    const defaultSeidGenerator = (req, rep, callback) => {
      if (this.lastIndexSeid) {
        callback(this.lastIndexSeid++);
      } else {
        this["lastIndexSeid"] = 0;

        callback(0);
      }

      return;
    };

    this["seidGenerator"] = opts.seidGenerator || defaultSeidGenerator;
    this["stream"] = opts.stream || stream.PassThrough;
    this["streamOptions"] = opts.streamOptions || { allowHalfOpen: false };
    this["autoGenerateId"] = opts.autoGenerateId || true;
    this["clients"] = {};

    this["plugin"] = fastify_plugin((instance, opts, done) => {
      const self = this;

      instance.addHook("preHandler", function(req, rep, next) {
        self.seidGenerator(req, rep, function(seid) {
          req["seid"] = seid;

          rep["eventStream"] = new self.stream(self.streamOptions);
          rep["headersSent"] = false;

          if (self.autoGenerateId) {
            rep["lastId"] = 0;
          }

          self.clients[seid] = rep;

          next();
        });
      });

      function sendEvent(rep, data, event, id, retry) {
        if (!rep.headersSent) {
          rep.type("text/event-stream");
          rep.header("Connection", "keep-alive");
          rep.header("Cache-Control", "no-cache");

          rep.send(rep.eventStream);

          rep.headersSent = true;
        }

        let parseId = "";
        let parseData = "";
        let parseEvent = "";
        let parseRetry = "";

        if (self.autoGenerateId) {
          parseId = rep.lastId++;
        }

        if (typeof data === "object") {
          if (data.id) {
            parseId = data.id;
          }

          if (data.data) {
            if (typeof data.data === "object") {
              parseData = JSON.stringify(data.data);
            } else {
              parseData = data.data;
            }
          }

          if (data.event) {
            parseEvent = data.event;
          }

          if (data.retry) {
            parseRetry = data.retry;
          }
        } else {
          if (data) {
            parseData = data;
          }

          if (event) {
            parseEvent = event;
          }

          if (id) {
            parseId = id;
          }

          if (retry) {
            parseRetry = retry;
          }
        }

        let responseString = "";

        if (parseId || parseId === 0) {
          responseString += `id:${parseId}\n`;
        }

        if (parseEvent) {
          responseString += `event:${parseEvent}\n`;
        }

        if (parseRetry) {
          responseString += `retry:${parseRetry}\n`;
        }

        if (parseData) {
          responseString += `data:${parseData}\n\n`;
        }

        rep.eventStream.write(responseString);
      }

      instance.decorateReply("sendEvent", function(data, event, id, retry) {
        sendEvent(this, data, event, id, retry);
      });

      instance.decorateReply("sendEventBySeid", function(
        seid,
        data,
        event,
        id,
        retry
      ) {
        const rep = self.clients[seid];

        if (rep) {
          sendEvent(rep, data, event, id, retry);
        } else {
          return false;
        }
      });

      instance.decorateReply("endEvent", function() {
        this.eventStream.ended = true;
        this.eventStream.end();

        delete self.clients[this.request.seid];

        return;
      });

      done();
    });

    return this;
  }
}

module.exports = {
  SE: SE
};
