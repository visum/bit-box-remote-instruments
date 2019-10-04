import { render, html } from "../lib/lit-html/lit-html.js";

class Drums extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    render(this.render(), this.shadowRoot);

    this.socket = new WebSocket(
      `wss://${window.location.hostname}:8080`,
      "instrument-protocol"
    );

    [
      ["#bass", "bass"],
      ["#snare", "snare"],
      ["#hi-hat", "hiHat"],
      ["#pop", "pop"]
    ].forEach(([id, subType]) => {
      this.shadowRoot.querySelector(id).addEventListener("touchstart", event => {
        const element = event.target;
        element.style.backgroundColor = "black";
        setTimeout(() => {
          element.style.backgroundColor = null;
        }, 100);
        this.send({ type: "drum", subType });
      });
    });
  }

  send(message) {
    this.socket.send(JSON.stringify(message));
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

        .button {
          width: 300px;
          height: 150px;
        }

        #bass {
          background-color: red;
        }

        #snare {
          background-color: blue;
        }

        #hi-hat {
          background-color: green;
        }

        #pop {
          background-color: yellow;
        }
      </style>

      <div id="bass" class="button">Bass</div>
      <div id="snare" class="button">Snare</div>
      <div id="hi-hat" class="button">HiHat</div>
      <div id="pop" class="button">Pop</div>
    `;
  }
}

window.customElements.define("bb-drums", Drums);
