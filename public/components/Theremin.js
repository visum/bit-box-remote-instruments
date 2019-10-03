import { render, html } from "../lib/lit-html/lit-html.js";
import { numbersToNotes } from "../lib/noteHelpers.js";

const noteMin = 50;
const noteMax = 90;
const noteRange = noteMax - noteMin;

const accelMin = -10;
const accelMax = 10;
const accelRange = accelMax - accelMin;

const getNoteFromAccel = accel => {
  const percentage = (accel + 10) / accelRange;
  const noteNumber = Math.round(noteRange * percentage) + noteMin;
  return noteNumber;
};

class Theremin extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    render(this.render(), this.shadowRoot);

    this.button = this.shadowRoot.querySelector("#big-button");
    this.noteName = this.shadowRoot.querySelector("#note-name");

    this.socket = new WebSocket(
      `wss://${window.location.hostname}:8080`,
      "instrument-protocol"
    );
    this.playing = false;
    this.accelerometer = null;

    this.button.addEventListener("touchstart", () => {
      const noteNumber = getNoteFromAccel(this.accelerometer.y);
      const message = { type: "play", noteNumber };
      this.socket.send(JSON.stringify(message));
      this.button.classList.add("active");
      this.playing = true;
      this.noteName.textContent = numbersToNotes[noteNumber];
    });

    this.button.addEventListener("touchend", () => {
      const message = { type: "stop" };
      this.socket.send(JSON.stringify(message));
      this.button.classList.remove("active");
      this.playing = false;
    });

    try {
      this.accelerometer = new Accelerometer({
        referenceFrame: "device",
        frequency: 30
      });

      this.accelerometer.start();
      this.accelerometer.addEventListener("reading", () => {
        const noteNumber = getNoteFromAccel(this.accelerometer.y);
        if (this.playing) {
          this.socket.send(JSON.stringify({ type: "slide", noteNumber }));
        }
        this.noteName.textContent = numbersToNotes[noteNumber];
      });
    } catch (e) {
      console.error(e);
    }
  }

  render() {
    return html`
      <style>
        * {
          box-sizing: border-box;
        }

        :host {
          width: 100%;
          height: 100%;
        }

        #big-button {
          width: 400px;
          height: 400px;
          background-color: yellow;
        }

        #big-button.active {
          background-color: blue;
        }

        #note-name {
          user-select: none;
        }
      </style>
      <div id="big-button"></div>
      <span id="note-name"></span>
    `;
  }
}

window.customElements.define("bb-theremin", Theremin);
