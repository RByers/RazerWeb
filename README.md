# Razer Web Configurator

A vanilla Web HID application for configuring Razer mice directly from your web browser. Served from [razerweb.rbyers.ca](https://razerweb.rbyers.ca/). Vibe coded with Antigravity/Gemini and Claude Code, not well tested and likely fully of bugs.

## Architecture

This application consists of a simple Vanilla JS stack (no dependencies):
- `index.html`: Layout and semantic structure. Contains a sidebar for controls and a main area for real-time debug logging.
- `style.css`: Premium dark mode UI featuring CSS grid/flexbox, custom animations, and a glassmorphism aesthetic tailored to the Razer brand.
- `app.js`: The application logic layer. 
  - **Connection Management:** Uses the Web HID API `navigator.hid.requestDevice` filtered to Razer's Vendor ID (`0x1532`).
  - **Protocol Encoder/Decoder:** Implements the OpenRazer HID protocol. It wraps commands into a 90-byte report, generates the XOR CRC checksum, and tracks transaction IDs.
  - **DOM Binding:** Automatically binds UI events (like changing colors or DPI) to the HID protocol encoder and logs raw hex payloads.

## Protocol Details

The protocol implementation is based on the OpenRazer Linux drivers. Communication is achieved by sending and receiving 90-byte Feature/Output reports over USB HID.

A detailed, byte-by-byte breakdown of the protocol is available in [PROTOCOL.md](./PROTOCOL.md).

## Usage

1. Serve this directory using any local web server. (e.g. `npx serve .` or `python3 -m http.server`)
2. Open `index.html` in a WebHID-compatible browser (e.g., Google Chrome, Microsoft Edge).
3. Click **Connect Device** and select your Razer mouse from the browser prompt.
4. Modify lighting or performance parameters and click Apply.
5. Watch the raw HID hex payloads being transmitted and received in the Debug panel.

## Acknowledgements and Licensing

The protocol implementation in this application was made possible by studying the [OpenRazer](https://github.com/openrazer/openrazer) project. RazerWeb is licensed under the **GNU General Public License v2.0 (GPLv2)**. See the [LICENSE](./LICENSE) file for the full text.
