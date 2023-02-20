(function(d) {
  const n = 3; // find a container that has at least n "slides"
  let p = d.body;  // container of slides; assume <body> for now
  // add 'slide' class to the frontmatter div and toc
  ['.frontmatter', '#TOC'].forEach(s => {
    const fm = p.querySelector(s);
    fm && fm.classList.add('slide');
  });
  const s1 = ':scope > hr:not([class])', s2 = ':scope > h2';
  function findContainer(s) {
    if (p.querySelectorAll(s).length >= n) return true;
    // if body doesn't contain headers or <hr>s, look into children
    for (let i = 0; i < p.children.length; i++) {
      if (p.children[i].querySelectorAll(s).length >= n) {
        p = p.children[i]; break;
      }
    }
    return false;
  }
  function newEl(tag, cls) {
    const el = d.createElement(tag);
    if (cls) el.className = cls;
    return el;
  }
  if (!findContainer(s1)) {
    // if not enough <hr>s found in children; look for <h2> instead
    if (p.tagName === 'BODY') {
      // not enough h2 found, this page is not appropriate for slides
      if (!findContainer(s2) && p.tagName === 'BODY') {
        return d.querySelectorAll('.slide').forEach(el => el.classList.remove('slide'));
      }
      p.querySelectorAll(s2).forEach(h2 => h2.before(newEl('hr')));
    }
  }
  p.classList.add('slide-container');

  function newSlide() {
    return newEl('div', 'slide');
  }
  function isSep(el) {
    return el.tagName === 'HR' && el.attributes.length === 0;
  }
  let el = p.firstElementChild; if (isSep(el)) el.remove();
  el = p.firstElementChild; if (!el) return;
  let s = newSlide(); el.before(s);
  while (true) {
    let el = s.nextSibling;
    if (!el) break;
    // remove slide separators (<hr>) and create new slide
    if (isSep(el)) {
      s = newSlide(); el.before(s); el.remove();
    } else if (el.classList?.contains('slide')) {
      if (s.innerText !== '') s = newSlide();
      el.after(s);
    } else {
      s.append(el);
    }
  }
  function setAttr(el, attr) {
    const m = newEl('div');
    m.innerHTML = '<div ' + attr + '></div>';
    const attrs = m.firstElementChild.attributes;
    for (let i = 0; i < attrs.length; i++) {
      let a = attrs[i];
      el.setAttribute(a.name, a.value);
    }
    m.remove();
  }
  const slides = d.querySelectorAll('div.slide'), N = slides.length,
        tm = d.querySelector('span.timer');
  slides.forEach((s, i) => {
    // add a timer
    s.append(tm ? tm.cloneNode() : newEl('span', 'timer'));
    // add page numbers
    const n = newEl('span', 'page-number');
    n.innerText = i + 1 + '/' + N;
    n.onclick = e => location.hash = i + 1;
    s.append(n);
    // apply slide attributes in <!--# -->
    for (let k in s.childNodes) {
      const node = s.childNodes[k];
      if (node.nodeType !== Node.COMMENT_NODE) continue;
      let t = node.textContent;
      if (!/^#/.test(t)) continue;
      t = t.replace(/^#/, '');
      const r = /[\s\n]class="([^"]+)"/, m = t.match(r);
      if (m) {
        t = t.replace(r, '').trim();
        s.className += ' ' + m[1];
      }
      if (t) setAttr(s, t);
      break;
    }
    s.classList.contains('extend') && s.append(newEl('div', 'spacer fade'));
    location.hash === ('#' + (i + 1)) && s.scrollIntoView();
    s.addEventListener('click', e => {
      if (!e.altKey) return;
      d.body.classList.toggle('overview');
      setTimeout(() => e.target.scrollIntoView(), 100);
    });
  });
  if (tm) tm.remove();
  const tms = d.querySelectorAll('span.timer'), t1 = 1000 * tms[0].dataset.total;
  let t0;
  function startTimers() {
    t0 = new Date();
    setInterval(setTimers, 1000);
  }
  function setTimers() {
    let t = (new Date() - t0);
    if (t1) t = t1 - t;
    const t2 = new Date(Math.abs(t)).toISOString().substr(11, 8).replace(/^00:/, '');
    tms.forEach(el => {
      el.innerText = t2;
      if (t < 0) el.style.display = el.style.display === 'none' ? '' : 'none';
    });
  }
  // press f for fullscreen mode
  d.addEventListener('keyup', (e) => {
    e.key === 'f' && d.documentElement.requestFullscreen();
    e.key === 'o' && d.body.classList.toggle('overview');
    e.key === 'm' && d.body.classList.toggle('mirrored');
    sessionStorage.setItem('body-class', d.body.className);
  });
  // start timer on fullscreen
  d.onfullscreenchange = (e) => d.fullscreenElement && !t0 && startTimers();
  tms.forEach(el => el.addEventListener('click', e => startTimers()));
  // restore previsouly saved body class
  const bc = sessionStorage.getItem('body-class');
  if (bc) d.body.className += ' ' + bc;
})(document);
