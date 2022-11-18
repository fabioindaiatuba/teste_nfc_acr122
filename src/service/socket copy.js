const WebSocket = require("ws");

var sockets = [];

class SocketServer extends EventEmitter {}{
  data = {};

  constructor() {
    this.server = new WebSocket.Server({
      port: 8080,
    });

    this.server.on("connection", function (socket) {
      // Adicionamos cada nova conexão/socket ao array `sockets`
      sockets.push(socket);

      socket.on("close", function () {
        if (sockets.length > 0) {
          sockets = sockets.filter((s) => s !== socket);
        }
      });
    });
  }

  send = (data) => {
    this.data = data;
    if (sockets.length > 0) {
      sockets.forEach((s) => s.send(JSON.stringify(this.data)));
    }
  };
}

module.exports = new SocketServer();
