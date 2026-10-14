// MyOS Music — play local audio files (nothing is uploaded).
const audio = document.getElementById('mu-audio');
const listEl = document.getElementById('mu-list');
const nowEl = document.getElementById('mu-now');
const fileIn = document.getElementById('mu-file');

if (audio) {
  const tracks = []; // { name, url }
  let current = -1;

  function renderList() {
    listEl.replaceChildren();
    tracks.forEach((t, i) => {
      const li = document.createElement('li');
      li.textContent = t.name;
      if (i === current) li.className = 'playing';
      li.addEventListener('click', () => play(i));
      listEl.appendChild(li);
    });
  }
  function play(i) {
    if (i < 0 || i >= tracks.length) return;
    current = i; audio.src = tracks[i].url; audio.play().catch(() => {});
    nowEl.textContent = '▶ ' + tracks[i].name; renderList();
  }

  fileIn.addEventListener('change', () => {
    const start = tracks.length;
    Array.from(fileIn.files).forEach((f) => tracks.push({ name: f.name, url: URL.createObjectURL(f) }));
    renderList();
    if (current === -1 && tracks.length) play(start);
    fileIn.value = '';
  });
  document.getElementById('mu-prev').addEventListener('click', () => play((current - 1 + tracks.length) % Math.max(tracks.length, 1)));
  document.getElementById('mu-next').addEventListener('click', () => play((current + 1) % Math.max(tracks.length, 1)));
  audio.addEventListener('ended', () => { if (tracks.length) play((current + 1) % tracks.length); });
}
