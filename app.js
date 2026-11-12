(() => {
  const tabs = [...document.querySelectorAll('.tool-tab')];
  const source = document.getElementById('source');
  const output = document.getElementById('output');
  const title = document.getElementById('toolTitle');
  const description = document.getElementById('toolDescription');
  const number = document.getElementById('toolNumber');
  const run = document.getElementById('runTool');
  const hint = document.getElementById('toolHint');
  const message = document.getElementById('message');
  const examples = {
    json: '{"developer":"Muzammil","stack":["HTML","CSS","JavaScript"],"learning":true,"projects":3}',
    url: 'https://example.com/search?q=web development&sort=recent',
    base64: 'Hello, developer! 👋'
  };
  const settings = {
    json: { number:'TOOL 01 / DATA', title:'JSON formatter', description:'Turn compact JSON into readable, validated data.', action:'Format JSON', hint:'JSON is parsed before it is formatted, so invalid input will show a useful error.' },
    url: { number:'TOOL 02 / WEB', title:'URL encoder & decoder', description:'Safely encode or decode text used in URL components.', action:'Encode URL', hint:'Encoding uses encodeURIComponent. Decoding expects a component that was encoded using the same convention.' },
    base64: { number:'TOOL 03 / TEXT', title:'Base64 converter', description:'Convert UTF-8 text to Base64 or decode Base64 back to text.', action:'Encode Base64', hint:'Base64 is an encoding format, not encryption. Do not use it to protect secrets.' }
  };
  let active = 'json';
  let mode = 'encode';
  const toggleMode = document.getElementById('toggleMode');

  function setMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle('error', isError);
  }
  function activate(tool) {
    active = tool;
    tabs.forEach((tab) => {
      const selected = tab.dataset.tool === tool;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-pressed', String(selected));
    });
    const config = settings[tool];
    number.textContent = config.number;
    title.textContent = config.title;
    description.textContent = config.description;
    mode = 'encode';
    run.firstChild.textContent = config.action + ' ';
    toggleMode.hidden = tool === 'json';
    toggleMode.textContent = 'Switch to decode';
    hint.textContent = config.hint;
    source.value = examples[tool];
    output.value = '';
    setMessage('');
  }

  function runActive() {
    const value = source.value;
    try {
      let converted = '';
      if (mode === 'decode') return decodeActive();
      if (active === 'json') converted = JSON.stringify(JSON.parse(value), null, 2);
      if (active === 'url') converted = encodeURIComponent(value);
      if (active === 'base64') {
        const bytes = new TextEncoder().encode(value);
        let binary = '';
        bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
        converted = btoa(binary);
      }
      output.value = converted;
      setMessage('Completed successfully.');
    } catch (error) {
      if (active === 'json') setMessage(`Invalid JSON: ${error.message}`, true);
      else if (active === 'base64') setMessage('Could not encode the text. Check the input and try again.', true);
      else setMessage('Could not encode this URL component.', true);
      output.value = '';
    }
  }

  function decodeActive() {
    const value = source.value;
    try {
      let converted = '';
      if (active === 'url') converted = decodeURIComponent(value);
      else if (active === 'base64') {
        const binary = atob(value.trim());
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
        converted = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      } else return runActive();
      output.value = converted;
      setMessage('Decoded successfully.');
    } catch (error) {
      setMessage(active === 'url' ? 'Invalid encoded URL component.' : 'Invalid Base64 or unsupported text encoding.', true);
      output.value = '';
    }
  }

  tabs.forEach((tab) => tab.addEventListener('click', () => activate(tab.dataset.tool)));
  run.addEventListener('click', runActive);
  document.getElementById('loadExample').addEventListener('click', () => { source.value = examples[active]; output.value = ''; setMessage('Example loaded.'); });
  document.getElementById('clearTool').addEventListener('click', () => { source.value = ''; output.value = ''; setMessage('Cleared.'); source.focus(); });
  document.getElementById('copyOutput').addEventListener('click', async () => {
    if (!output.value) return setMessage('There is no output to copy.', true);
    try { await navigator.clipboard.writeText(output.value); setMessage('Output copied.'); }
    catch { output.focus(); output.select(); setMessage('Select the output and copy it manually.', true); }
  });
  toggleMode.addEventListener('click', () => {
    mode = mode === 'encode' ? 'decode' : 'encode';
    toggleMode.textContent = mode === 'encode' ? 'Switch to decode' : 'Switch to encode';
    run.firstChild.textContent = mode === 'encode' ? settings[active].action + ' ' : (active === 'url' ? 'Decode URL ' : 'Decode Base64 ');
    setMessage(mode === 'decode' ? 'Decode mode selected.' : 'Encode mode selected.');
  });
  document.getElementById('year').textContent = new Date().getFullYear();
  activate('json');
})();
