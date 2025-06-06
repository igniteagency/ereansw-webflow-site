// ─── INTERFACES ──────────────────────────────────────────────────────
interface SchoolObject {
  name: string;
  id: string;
  element: HTMLElement;
}

// ─── USER TUNABLES ───────────────────────────────────────────────────
// Gap between labels as fraction of circumference:
const gapPct: number = 0.001;
// Animation settings:
const animDur: number = 0.8; // seconds per scroll
const autoDelay: number = 5000; // ms between auto-advances
const alignOffsetPct: number = -0.0002; // small fraction to nudge active left

// FONT-SIZE CLAMP in CSS px (on-screen):
const minFontPx: number = 12; // never smaller than 12 px
const maxFontPx: number = 18; // never larger than 18 px
const pxRatio: number = 0.02; // "preferred" = 2% of viewport width
// ────────────────────────────────────────────────────────────────────

const svg = document.getElementById('hero-svg') as SVGSVGElement | null;
const path = document.getElementById('textpath') as SVGPathElement | null;

if (!svg || !path) {
  throw new Error('Required SVG elements not found');
}

const L: number = path.getTotalLength(); // full circle length in VB units
const baseStart: number = L * 0.25; // nominal "6 o'clock" point
const alignOffset: number = L * alignOffsetPct; // small nudge along the path
const start: number = baseStart + alignOffset;
const gap: number = L * gapPct; // gap in VB units

// ─── PROGRESS CIRCLE SETUP ────────────────────────────────────────────
const progressCircle = document.getElementById('progress-circle') as SVGCircleElement | null;

if (!progressCircle) {
  throw new Error('Progress circle element not found');
}

const circleLength: number = progressCircle.getTotalLength();
let progressTween: gsap.core.Tween | null = null;
// initialize dasharray & dashoffset so the circle is empty
progressCircle.style.strokeDasharray = circleLength.toString();
progressCircle.style.strokeDashoffset = circleLength.toString();

// ─── 0) PULL NAMES & IMAGE ELEMENTS FROM WEBFLOW CMS ────────────────
const schoolEls: HTMLElement[] = Array.from(
  document.querySelectorAll('#hero-school-list .hero_background_image-wrapper')
) as HTMLElement[];

const schoolObjs: SchoolObject[] = schoolEls.map((el) => ({
  name: el.dataset.schoolName || '',
  id: el.dataset.schoolId || '',
  element: el,
}));

const ORIGINAL: string[] = schoolObjs.map((obj) => obj.name);
const n: number = ORIGINAL.length;

// ─── STATE ───────────────────────────────────────────────────────────
let display: string[] = ORIGINAL.concat(ORIGINAL, ORIGINAL);
let active: number = n; // point into the middle block
let autoTimer: number | null = null;

const group: SVGGElement = document.createElementNS(svg.namespaceURI, 'g') as SVGGElement;
group.id = 'schools-group';
svg.appendChild(group);

let baseOffsets: number[] = [];
let textPaths: SVGTextPathElement[] = [];
let texts: SVGTextElement[] = [];

// ─── HELPERS FOR CLONE DETECTION ────────────────────────────────────
function needClone(idx: number): -1 | 0 | 1 {
  if (idx < n) return -1;
  if (idx >= display.length - n) return 1;
  return 0;
}

function applyClone(direction: -1 | 1): void {
  if (direction === -1) {
    display = ORIGINAL.concat(display.slice(0, display.length - n));
    active += n;
  } else if (direction === 1) {
    display = display.slice(n).concat(ORIGINAL);
    active -= n;
  }
}

// ─── 1) COMPUTE TARGET PX & CONVERT TO VB ────────────────────────────
function computeFontVB(): number {
  if (!svg) throw new Error('SVG element not available');

  // a) Decide desired on-screen px size:
  const vw: number = window.innerWidth;
  const rawPx: number = vw * pxRatio;
  const targetPx: number = Math.min(maxFontPx, Math.max(minFontPx, rawPx));
  // b) Measure SVG rendered width in px:
  const svgRect: DOMRect = svg.getBoundingClientRect();
  const svgPx: number = svgRect.width;
  // c) Convert: 1 VB-unit = (svgPx / 100) screen px
  //    so fontVB = (targetPx * 100) / svgPx
  return (targetPx * 100) / svgPx;
}

// ─── 2) RENDER + MEASURE CURVED TEXT ─────────────────────────────────
function renderDisplay(): void {
  if (!svg) throw new Error('SVG element not available');

  // remove old <text> elements
  while (group.firstChild) {
    group.removeChild(group.firstChild);
  }

  // compute font-size in VB units
  const fontVB: number = computeFontVB();

  // recreate each <text> + <textPath>
  display.forEach((name: string, i: number) => {
    const txt: SVGTextElement = document.createElementNS(
      svg.namespaceURI,
      'text'
    ) as SVGTextElement;
    txt.setAttribute('class', 'hero-svg-text');
    txt.setAttribute('font-size', fontVB.toString()); // VB units, no "px"
    txt.setAttribute('text-anchor', 'middle');
    txt.style.cursor = 'pointer';
    txt.addEventListener('click', () => setActive(i));

    const tp: SVGTextPathElement = document.createElementNS(
      svg.namespaceURI,
      'textPath'
    ) as SVGTextPathElement;
    tp.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#textpath');
    tp.setAttribute('startOffset', '0');
    tp.textContent = name;

    txt.appendChild(tp);
    group.appendChild(txt);
  });

  // measure each <text>'s length (in VB units)
  const textElements = Array.from(group.querySelectorAll('text'));
  texts = textElements as SVGTextElement[];
  const widths: number[] = texts.map((t) => t.getComputedTextLength());

  // compute total span = sum(widths) + gaps
  const totalW: number = widths.reduce((sum, w) => sum + w, 0);
  const blockSpan: number = totalW + gap * (texts.length - 1);

  // centre that block at "start"
  const blockStart: number = start - blockSpan / 2;
  let cursor: number = blockStart;

  baseOffsets = [];
  textPaths = [];

  texts.forEach((txt: SVGTextElement, i: number) => {
    cursor += widths[i] / 2;
    const tp = txt.querySelector('textPath');
    if (!tp) throw new Error('TextPath element not found');

    const pos: number = (cursor + L) % L;
    tp.setAttribute('startOffset', pos.toString());

    baseOffsets.push(pos);
    textPaths.push(tp as SVGTextPathElement);

    cursor += widths[i] / 2 + gap;
  });
}

// ─── 3) ALIGN & ANIMATE ACTIVE CURVED TEXT ──────────────────────────
function alignActive(): void {
  const current: number = baseOffsets[active];
  const delta: number = start - current;

  textPaths.forEach((tp: SVGTextPathElement, i: number) => {
    const target: number = (baseOffsets[i] + delta + L) % L;
    gsap.to(tp, {
      attr: { startOffset: target },
      duration: animDur,
      ease: 'power4.out',
    });
  });

  texts.forEach((txt: SVGTextElement, i: number) => {
    txt.classList.toggle('active', i === active);
  });

  // show only the active school's image wrapper
  const origIndex: number = active % n;
  schoolObjs.forEach((obj: SchoolObject, i: number) => {
    obj.element.classList.toggle('active', i === origIndex);
  });
}

// ─── 4) ALIGN ACTIVE INSTANTLY (NO ANIMATION) ───────────────────────
function alignActiveInstant(): void {
  const current: number = baseOffsets[active];
  const delta: number = start - current;

  textPaths.forEach((tp: SVGTextPathElement, i: number) => {
    const target: number = (baseOffsets[i] + delta + L) % L;
    tp.setAttribute('startOffset', target.toString());
  });

  texts.forEach((txt: SVGTextElement, i: number) => {
    txt.classList.toggle('active', i === active);
  });

  const origIndex: number = active % n;
  schoolObjs.forEach((obj: SchoolObject, i: number) => {
    obj.element.classList.toggle('active', i === origIndex);
  });
}

// ─── 5) ANIMATE THE PROGRESS CIRCLE ─────────────────────────────────
function animateProgress(): void {
  if (!progressCircle) throw new Error('Progress circle element not available');

  if (progressTween) {
    gsap.killTweensOf(progressCircle);
  }
  progressCircle.style.strokeDashoffset = circleLength.toString();
  progressTween = gsap.to(progressCircle, {
    strokeDashoffset: 0,
    duration: autoDelay / 1000,
    ease: 'none',
  }) as gsap.core.Tween;
}

// ─── 6) AUTO-ADVANCE SCHEDULING ───────────────────────────────────────
function scheduleNext(): void {
  if (autoTimer !== null) {
    clearTimeout(autoTimer);
  }
  autoTimer = window.setTimeout(() => setActive(active + 1), autoDelay);
}

// ─── 7) PUBLIC: setActive ─────────────────────────────────────────────
function setActive(idx: number): void {
  const direction: -1 | 0 | 1 = needClone(idx);
  active = idx;

  alignActive();
  animateProgress();
  scheduleNext();

  if (direction !== 0) {
    setTimeout(() => {
      applyClone(direction);
      renderDisplay();
      alignActiveInstant();
    }, animDur * 1000);
  }
}

// Make setActive available globally
(window as any).setActive = setActive;

// ─── 8) RESPOND TO RESIZE ─────────────────────────────────────────────
window.addEventListener('resize', (): void => {
  renderDisplay();
  alignActiveInstant();
  animateProgress();
});

// ─── INITIALIZE ON PAGE LOAD ─────────────────────────────────────────
renderDisplay();
alignActiveInstant();
// Start the progress circle and timer on load:
animateProgress();
scheduleNext();
