# Remote Instruments for BitBox

Play BitBox instruments from your phone using websockets. A fun companion for [BitBox](https://github.com/visum/bit-box).

## Notes
The Theremin instrument depends on the device Accelerometer which is only made available in Chrome on Android, and then only when the page is loaded from a secure connection, thus the goofy self-signed cert.

iPhones should be able to play the drums, but I've had reports that this doesn't work and I've not had the time (or an iPhone) to investigate.

## Instructions

### Clone, install, start

If you haven't already, clone BitBox to your local machine (link above). Then,
clone this repo to your local machine, install modules and start it up:

```sh
> cd path/to/bit-box-remote-instruments
> npm i
> npm start
```

This should start the websocket server.

### Accept self-signed cert in your browser.

Before the BitBox `WebSocketInput` component can connect to the websocket server, you have to accept the self-signed cert.

The server's public address will be output when it starts. Navigate to that address (not on localhost), and tell Chrome you're really okay with this shady certificate. When you're done with that you should see a page with a QR code on it. You have to do this _before_ pointing the `WebSocktInput` at the socket server (next step). 

### Launch BitBox

Get BitBox running in a browser window as described in the BitBox readme.

Load the "sockets" pre-defined program in from the drop-down box or set up your own program with the `WebSocketInput` plugin.

Configure the `WebSocketInput` plugin to point to the address where the websocket server is running (use wss:// for the scheme instead of https://). If it connects correctly, you should see "incoming request" log out in the terminal where you started the socket server (the one from this repo).

### Connect instruments

On your phone, use a QR code reader to read the code on the page you opened above or type in the address displayed. You should see the same page. Select one of the instruments, and start mashing the buttons that appear. If everything is working you should hear BitBox make some noise.



