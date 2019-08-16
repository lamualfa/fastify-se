const stream = require("stream");

const fastify_plugin = require("fastify-plugin");

class SE {
  constructor(opts = {}) {
    const defaultSeidGenerator = (req, rep, callback) => {
      if (this._lastId) {
        callback(this._lastId++);
      } else {
        this["_lastId"] = 0;

        callback(0);
      }

      return;
    };

    this["seidGenerator"] = opts.seidGenerator || defaultSeidGenerator;
    this["stream"] = opts.stream || stream.PassThrough;
    this["streamOptions"] = opts.streamOptions || {};
    this["clients"] = {};

    this["plugin"] = fastify_plugin((instance, opts, done) => {
      const self = this;

      instance.addHook("preHandler", function(req, rep, next) {
        self.seidGenerator(req, rep, function(seid) {
          req["seid"] = seid;

          rep["eventStream"] = new self.stream(self.streamOptions);
          rep["headersSent"] = false;

          self.clients[seid] = rep;

          next();
        });
      });

      function sendEvent(rep, data, event, id) {
        if (!rep.headersSent) {
          rep.type("text/event-stream");
          rep.header("Connection", "keep-alive");

          rep.send(rep.eventStream);

          rep.headersSent = true;
        }

        let parseId = "";
        let parseData = "";
        let parseEvent = "";

        if (typeof data === "object") {
          if (data.id) {
            parseId = data.id;
          }

          if (data.data) {
            if (typeof data.data) {
              parseData = JSON.stringify(data.data);
            } else {
              parseData = data.data;
            }
          }

          if (data.event) {
            parseEvent = data.event;
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
        }

        let responseString = "";

        if (parseId) {
          responseString += `id: ${parseId}\n`;
        }

        if (parseEvent) {
          responseString += `event: ${parseEvent}\n`;
        }

        if (parseData) {
          responseString += `data: ${parseData}\n\n`;
        }

        rep.eventStream.write(responseString);
      }

      instance.decorateReply("sendEvent", function(data, event, id) {
        sendEvent(this, data, event, id);
      });

      instance.decorateReply("sendEventById", function(seid, data, event, id) {
        const rep = self.clients[seid];

        if (rep) {
          sendEvent(rep, data, event, id);
        } else {
          return false;
        }
      });

      instance.decorateReply("endEvent", function() {
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
