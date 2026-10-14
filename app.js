// MyOS Music — local audio player with playlist management, and a controller
// exposed on window.MyOS.music so the taskbar mini-player can drive it.
const audio = document.getElementById('mu-audio');
const listEl = document.getElementById('mu-list');
const nowEl = document.getElementById('mu-now');
const fileIn = document.getElementById('mu-file');
const countEl = document.getElementById('mu-count');

if (audio) {
  const MyOS = (window.MyOS = window.MyOS || {});
  let tracks = [];      // { name, url }
  let current = -1;
  let shuffle = false;
  let repeat = 'off';   // off | all | one

  const getState = () => ({
    track: current >= 0 ? tracks[current].name : null,
    playing: current >= 0 && !audio.paused,
    index: current,
    count: tracks.length
  });
  const emit = () => window.dispatchEvent(new CustomEvent('myos:music', { detail: getState() }));

  function ctrlBtn(txt, fn, cls) {
    const b = document.createElement('button');
    b.className = 'mu-li-btn' + (cls ? ' ' + cls : '');
    b.textContent = txt;
    b.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
    return b;
  }

  function renderList() {
    listEl.replaceChildren();
    tracks.forEach((t, i) => {
      const li = document.createElement('li');
      if (i === current) li.className = 'playing';
      const name = document.createElement('span');
      name.className = 'mu-name'; name.textContent = t.name; name.title = t.name;
      name.addEventListener('click', () => play(i));
      li.append(name, ctrlBtn('▲', () => move(i, -1)), ctrlBtn('▼', () => move(i, 1)), ctrlBtn('✕', () => remove(i), 'mu-del'));
      listEl.appendChild(li);
    });
    countEl.textContent = tracks.length + (tracks.length === 1 ? ' track' : ' tracks');
  }

  function play(i) {
    if (i < 0 || i >= tracks.length) return;
    current = i;
    audio.src = tracks[i].url;
    audio.play().catch(() => {});
    nowEl.textContent = tracks[i].name;
    renderList(); emit();
  }
  function toggle() {
    if (current < 0) { if (tracks.length) play(0); return; }
    if (audio.paused) audio.play().catch(() => {}); else audio.pause();
  }
  function next() {
    if (!tracks.length) return;
    play(shuffle ? Math.floor(Math.random() * tracks.length) : (current + 1) % tracks.length);
  }
  function prev() {
    if (!tracks.length) return;
    play((current - 1 + tracks.length) % tracks.length);
  }
  function move(i, d) {
    const j = i + d;
    if (j < 0 || j >= tracks.length) return;
    [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
    if (current === i) current = j; else if (current === j) current = i;
    renderList();
  }
  function remove(i) {
    URL.revokeObjectURL(tracks[i].url);
    tracks.splice(i, 1);
    if (i === current) { current = -1; audio.pause(); audio.removeAttribute('src'); nowEl.textContent = 'No track loaded'; }
    else if (i < current) current--;
    renderList(); emit();
  }

  fileIn.addEventListener('change', () => {
    const start = tracks.length;
    Array.from(fileIn.files).forEach((f) => tracks.push({ name: f.name, url: URL.createObjectURL(f) }));
    renderList();
    if (current === -1 && tracks.length) play(start);
    fileIn.value = '';
  });

  document.getElementById('mu-prev').addEventListener('click', prev);
  document.getElementById('mu-next').addEventListener('click', next);
  document.getElementById('mu-play').addEventListener('click', toggle);

  document.getElementById('mu-sort').addEventListener('click', () => {
    const cur = current >= 0 ? tracks[current] : null;
    tracks.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    current = cur ? tracks.indexOf(cur) : -1;
    renderList();
  });
  document.getElementById('mu-clear').addEventListener('click', () => {
    tracks.forEach((t) => URL.revokeObjectURL(t.url));
    tracks = []; current = -1; audio.pause(); audio.removeAttribute('src');
    nowEl.textContent = 'No track loaded'; renderList(); emit();
  });

  const shBtn = document.getElementById('mu-shuffle');
  shBtn.addEventListener('click', () => { shuffle = !shuffle; shBtn.classList.toggle('on', shuffle); });
  const rpBtn = document.getElementById('mu-repeat');
  rpBtn.addEventListener('click', () => {
    repeat = repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off';
    rpBtn.classList.toggle('on', repeat !== 'off');
    rpBtn.textContent = repeat === 'one' ? '🔂' : '🔁';
    rpBtn.title = 'Repeat: ' + repeat;
  });

  audio.addEventListener('play', emit);
  audio.addEventListener('pause', emit);
  audio.addEventListener('ended', () => {
    if (repeat === 'one') { play(current); return; }
    if (!shuffle && repeat === 'off' && current === tracks.length - 1) { current = -1; renderList(); emit(); return; }
    next();
  });

  // Controller for the taskbar mini-player.
  MyOS.music = { toggle, next, prev, getState };
  renderList();
  emit();
}
