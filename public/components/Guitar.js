import { render, html } from "../lib/lit-html/lit-html.js";

const LOCKOUT_DURATION = 400;
const ACCEL_THRESHOLD = 20;
const ACCEL_SAMPLE_RATE = 15;

const chords = {
  C: {
    I: ["C3", "E3", "G3", "C4"],
    IV: ["F3", "A3", "C4", "F4"],
    V: ["G3", "B3", "D4", "G4"],
    V7: ["G3", "B3", "D4", "F4"],
    vi: ["A3", "C4", "E4", "A4"]
  },
  "C#": {
    I: ["C#3", "F3", "G#3", "C#4"],
    IV: ["F#3", "A#3", "C#4", "F#4"],
    V: ["G#3", "C4", "D#4", "G#4"],
    V7: ["G#3", "C4", "D#4", "F#4"],
    vi: ["A#3", "C#4", "F4", "A#4"]
  },
  "D": {
    I: ["D3", "F#3", "A3", "D4"],
    IV: ["G3", "B3", "D4", "G4"],
    V: ["A3", "C#4", "E4", "A4"],
    V7: ["A3", "C#4", "E4", "G4"],
    vi: ["B3", "D4", "F#4", "B4"]
  },
  "Eb": {
    I: ["Eb3", "G3", "Bb3", "Eb4"],
    IV: ["Ab3", "C4", "Eb4", "Ab4"],
    V: ["Bb3", "D4", "F4", "Bb4"],
    V7: ["Bb3", "D4", "F4", "Ab4"],
    vi: ["C3", "Eb3", "G3", "C4"]
  },
  "E":{
    I: ["E3", "G#3", "B3", "E4"],
    IV: ["A3", "C#4", "E4", "A4"],
    V: ["B3", "D#4", "F#4", "B4"],
    V7: ["B3", "D#4", "F#4", "A4"],
    vi: ["C#3", "E3", "G#3", "C#4"]
  },
  "F": {
    I: ["F3", "A3", "C4", "F4"],
    IV: ["Bb3", "D4", "F4", "Bb4"],
    V: ["C3", "E3", "G3", "C4"],
    V7: ["C3", "E3", "G3", "Bb3"],
    vi: ["D3", "F3", "A3", "D4"]
  },
  "F#": {
    I: ["F#3", "A#3", "C#4", "F#4"],
    IV: ["B3", "D#4", "F#4", "B4"],
    V: ["C#3", "E#3", "G#3", "C#4"],
    V7: ["C#3", "E#3", "G#3", "B3"],
    vi: ["D#3", "F#3", "A#3", "D#4"]
  },
  "G": {
    I: ["G3", "B3", "D4", "G4"],
    IV: ["C3", "E3", "G3", "C4"],
    V: ["D3", "F#3", "A3", "D4"],
    V7: ["D3", "F#3", "A3", "C4"],
    vi: ["E3", "G3", "B3", "E4"]
  },
  "Ab": {
    I: ["Ab3", "C4", "Eb4", "Ab4"],
    IV: ["Db3", "F3", "Ab3", "Db4"],
    V: ["Eb3", "G3", "Bb3", "Eb4"],
    V7: ["Eb3", "G3", "Bb3", "Db4"],
    vi: ["F3", "Ab3", "C4", "F4"]
  },
  "A": {
    I: ["A3", "C#4", "E4", "A4"],
    IV: ["D3", "F#3", "A3", "D4"],
    V: ["E3", "G#3", "B3", "E4"],
    V7: ["E3", "G#3", "B3", "D4"],
    vi: ["F#3", "A3", "C#4", "F#4"]
  },
  "Bb": {
    I: ["Bb3", "D4", "F4", "Bb4"],
    IV: ["Eb3", "G3", "Bb3", "Eb4"],
    V: ["F3", "A3", "C4", "F4"],
    V7: ["F3", "A3", "C4", "Eb4"],
    vi: ["C3", "Eb3", "G3", "C4"]
  },
};

class Guitar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.activeButtons = {
      I: false,
      IV: false,
      V: false,
      V7: false,
      iv: false
    };

    this.lockout = false;

    this.socket = new WebSocket(
      `wss://${window.location.hostname}:8080`,
      "instrument-protocol"
    );

    this.accelerometer = null;

    try {
      this.accelerometer = new Accelerometer({
        referenceFrame: "device",
        frequency: ACCEL_SAMPLE_RATE
      });

      this.accelerometer.start();
      this.accelerometer.addEventListener("reading", () => {
        if (this.lockout) {
          return;
        }
        const {x, y, z} = this.accelerometer;
        if (Math.abs(x) > ACCEL_THRESHOLD || Math.abs(y) > ACCEL_THRESHOLD || Math.abs(z) > ACCEL_THRESHOLD) {
          this.strum();
          this.lockout = true;
          setTimeout(() => {
            this.lockout = false;
          }, LOCKOUT_DURATION);
        }
      });
    } catch(e) {
      console.error(e);
    }
  }

  connectedCallback() {
    this.render();
    this.select("#strum").addEventListener("touchstart", () => {
      this.strum();
    });
    this.attachEventListeners();
  }

  attachEventListeners() {
    [...this.shadowRoot.querySelectorAll(".button")].forEach(element => {
      element.addEventListener("touchstart", event => {
        const chordType = event.target.innerText;
        this.activeButtons[chordType] = true;
        event.target.style.backgroundColor = "yellow";
      });
      element.addEventListener("touchend", event => {
        const chordType = event.target.innerText;
        this.activeButtons[chordType] = false;
        event.target.style.backgroundColor = "";
      });
    });
  }

  select(selector) {
    return this.shadowRoot.querySelector(selector);
  }

  getActiveButton() {
    const buttonEntries = Object.entries(this.activeButtons);
    for (let i = 0; i < buttonEntries.length; i++) {
      if (buttonEntries[i][1]) {
        return buttonEntries[i][0];
      }
    }
    return null;
  }

  strum() {
    const key = this.select("#key").value;
    const chord = this.getActiveButton();
    if (!chord) {
      return;
    }

    const notes = chords[key][chord];
    const message = { type: "strum", notes };

    this.socket.send(JSON.stringify(message));
  }

  render() {
    const content = html`
      <style>
        .button {
          user-select: none;
          width: 100%;
          height: 70px;
          border: 1px solid grey;
          background-color: beige;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        #top {
          display: flex;
          width: 100%;
        }

        #strum {
          height: 60px;
        }
      </style>
      <div id="top">
        <select id="key">
          <option>A</option>
          <option>Bb</option>
          <option>B</option>
          <option>C</option>
          <option>C#</option>
          <option>D</option>
          <option>Eb</option>
          <option>E</option>
          <option>F</option>
          <option>F#</option>
          <option>G</option>
          <option>Ab</option>
        </select>
        <button id="strum">Strum!</button>
      </div>
      <div class="button">I</div>
      <div class="button">IV</div>
      <div class="button">V</div>
      <div class="button">V7</div>
      <div class="button">vi</div>
      <p>
      <ul>
        <li>Lock your device in portrait mode.</li>
        <li>Select a key in the dropdown.</li>
        <li>Hold down one of the chords (I, IV, V, V7, vi), hold the phone with the screen facing away from you and swing your hand down as in a strumming motion</li>
        <li>If your phone doesn't have accelerometer support, hold a chord and tap the "strum" button</ul>
          </ul>
      </p>
    `;

    render(content, this.shadowRoot);
  }
}

window.customElements.define("bb-guitar", Guitar);
