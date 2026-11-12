# DevKit — Small Tools for Developers

A browser-based collection of small utilities built with vanilla JavaScript. It is intentionally dependency-free and makes no network requests.

## Tools
- **JSON formatter:** parses JSON, shows clear parse errors and formats valid data with two-space indentation.
- **URL component encoder/decoder:** encode text with `encodeURIComponent`; double-click the action button to decode.
- **Base64 text converter:** encode UTF-8 text; double-click the action button to decode Base64. Unicode is supported.

## Run
Open `index.html` in a browser, or serve the directory with VS Code Live Server.

## Deploy
Import the repository into Vercel or publish with GitHub Pages. It is a static site and needs no build command, secrets or API key.

## Privacy and security
All conversions happen locally in the browser. Base64 is encoding, not encryption; it must not be used to protect credentials or other secrets.

## Built with
HTML · CSS · Vanilla JavaScript · JSON API · URL API · TextEncoder/TextDecoder
