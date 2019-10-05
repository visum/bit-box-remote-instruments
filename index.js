const http = require("https");
const WebSocketServer = require("websocket").server;
const fs = require("fs");
const express = require("express");
const app = express();
const os = require('os');
const QRCode = require('qrcode');
const port = 8080;
const server = http.createServer(
  {
    key: fs.readFileSync("./certs/server.key"),
    cert: fs.readFileSync("./certs/server.cert")
  },
  app
);

let connectionCounter = 0;
const getConnectionNumber = () => {
  return connectionCounter++;
}

app.get("/qrcode", (req, res) => {
  QRCode.toDataURL(`https://${getNetworkAddress()}:${port}`, (error, data) => {
    res.set()
    res.send(data);
  });
});

app.use(express.static("public"));


const interfaces = os.networkInterfaces();
const getNetworkAddress = () => {
	for (const name of Object.keys(interfaces)) {
		for (const interface of interfaces[name]) {
			const {address, family, internal} = interface;
			if (family === 'IPv4' && !internal) {
				return address;
			}
		}
	}
};

server.listen(port, function() {
  console.log("listening on https://" + getNetworkAddress() + ":" + port);
});

let receiverConnection = null;

wsServer = new WebSocketServer({
  httpServer: server,
  autoAcceptConnections: false
});

const getMessageHandler = (connectionNumber) => {
  return (message) => {
    if (receiverConnection) {
      const data = JSON.parse(message.utf8Data);
      data.clientId = connectionNumber;
      receiverConnection.sendUTF(JSON.stringify(data));
    }
  };
};

wsServer.on("request", function(request) {
  console.log("incoming request");

  if (request.requestedProtocols.indexOf("instrument-protocol") > -1) {
    const connection = request.accept("instrument-protocol", request.origin);
    connection.on("message", getMessageHandler(getConnectionNumber()));
  } else if (request.requestedProtocols.indexOf("receiver-protocol") > -1) {
    receiverConnection = request.accept("receiver-protocol", request.origin);
  }
});


