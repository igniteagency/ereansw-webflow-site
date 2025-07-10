// ─── HERO CAROUSEL CLASS ─────────────────────────────────────────────
interface SchoolObject {
  name: string;
  id: string;
  element: HTMLElement;
}

class HeroCarousel {
  // Tunable parameters
  private readonly gapPct = 0.001;
  private readonly animDur = 0.8;
  private readonly autoDelay = 5000;
  private readonly alignOffsetPct = -0.0002;
  private readonly minFontPx = 12;
  private readonly maxFontPx = 18;
  private readonly pxRatio = 0.02;

  // DOM references
  private svg: SVGSVGElement;
  private path: SVGPathElement;
  private progressCircle: SVGCircleElement;
  private group: SVGGElement;

  // Carousel data
  private schools: SchoolObject[];
  private display: SchoolObject[];
  private n: number;
  private active: number = 0;
  private autoTimer: number | null = null;
  private progressTween: gsap.core.Tween | null = null;

  // SVG geometry
  private L: number;
  private baseStart: number;
  private alignOffset: number;
  private start: number;
  private gap: number;
  private circleLength: number;

  // SVG text elements
  private texts: SVGTextElement[] = [];
  private textPaths: SVGTextPathElement[] = [];
  private baseOffsets: number[] = [];

  // Event handlers (for cleanup)
  private resizeHandler: () => void;

  constructor() {
    // Get DOM elements
    const svgEl = document.getElementById('hero-svg');
    const pathEl = document.getElementById('textpath');
    const progressCircleEl = document.getElementById('progress-circle');
    if (!svgEl || !(svgEl instanceof SVGSVGElement)) {
      throw new Error('Required SVGSVGElement not found');
    }
    if (!pathEl || !(pathEl instanceof SVGPathElement)) {
      throw new Error('Required SVGPathElement not found');
    }
    if (!progressCircleEl || !(progressCircleEl instanceof SVGCircleElement)) {
      throw new Error('Required SVGCircleElement not found');
    }
    this.svg = svgEl;
    this.path = pathEl;
    this.progressCircle = progressCircleEl;

    // SVG geometry
    this.L = this.path.getTotalLength();
    this.baseStart = this.L * 0.25;
    this.alignOffset = this.L * this.alignOffsetPct;
    this.start = this.baseStart + this.alignOffset;
    this.gap = this.L * this.gapPct;

    // Progress circle
    this.circleLength = this.progressCircle.getTotalLength();
    this.progressCircle.style.strokeDasharray = this.circleLength.toString();
    this.progressCircle.style.strokeDashoffset = this.circleLength.toString();

    // School data
    const schoolEls: HTMLElement[] = Array.from(
      document.querySelectorAll('#hero-school-list .hero_background_image-wrapper')
    ) as HTMLElement[];
    this.schools = schoolEls.map((el) => ({
      name: el.dataset.schoolName || '',
      id: el.dataset.schoolId || '',
      element: el,
    }));
    this.n = this.schools.length;
    // Always triple the names for display
    this.display = ([] as SchoolObject[]).concat(this.schools, this.schools, this.schools);
    this.active = this.n; // Start at the middle block

    // SVG group for text
    this.group = document.createElementNS(this.svg.namespaceURI, 'g') as SVGGElement;
    this.group.id = 'schools-group';
    this.svg.appendChild(this.group);

    // Bind event handler for cleanup
    this.resizeHandler = this.onResize.bind(this);
    window.addEventListener('resize', this.resizeHandler);

    // Initialize
    this.createTextElements();
    this.renderDisplay();
    this.alignActiveInstant();
    this.animateProgress();
    this.scheduleNext();
  }

  // Create SVG text elements once and reuse
  private createTextElements() {
    // Remove old
    while (this.group.firstChild) this.group.removeChild(this.group.firstChild);
    this.texts = [];
    this.textPaths = [];
    for (let i = 0; i < this.display.length; i++) {
      const txt = document.createElementNS(this.svg.namespaceURI, 'text') as SVGTextElement;
      txt.setAttribute('class', 'hero-svg-text');
      txt.style.cursor = 'pointer';
      txt.addEventListener('click', () => this.setActive(i));
      const tp = document.createElementNS(this.svg.namespaceURI, 'textPath') as SVGTextPathElement;
      tp.setAttribute('href', '#textpath');
      tp.setAttribute('startOffset', '0');
      txt.appendChild(tp);
      this.group.appendChild(txt);
      this.texts.push(txt);
      this.textPaths.push(tp);
    }
  }

  // Compute font size in VB units
  private computeFontVB(): number {
    const vw = window.innerWidth;
    const rawPx = vw * this.pxRatio;
    const targetPx = Math.min(this.maxFontPx, Math.max(this.minFontPx, rawPx));
    const svgRect = this.svg.getBoundingClientRect();
    const svgPx = svgRect.width;
    return (targetPx * 100) / svgPx;
  }

  // Render the display (update text content, measure, layout)
  private renderDisplay() {
    const fontVB = this.computeFontVB();
    if ((window as any).IS_DEBUG_MODE) console.debug('fontVB', fontVB);
    this.group.style.fontSize = `${fontVB}px`;
    // Set text content
    for (let i = 0; i < this.display.length; i++) {
      this.textPaths[i].textContent = this.display[i].name;
    }
    // Wait for fonts, then measure and layout
    document.fonts.ready.then(() => {
      requestAnimationFrame(() => {
        const widths = this.texts.map((t) => t.getComputedTextLength());
        const totalW = widths.reduce((sum, w) => sum + w, 0);
        const blockSpan = totalW + this.gap * (this.display.length - 1);
        const blockStart = this.start - blockSpan / 2;
        let cursor = blockStart;
        this.baseOffsets = [];
        for (let i = 0; i < this.display.length; i++) {
          cursor += widths[i] / 2;
          const pos = (cursor + this.L) % this.L;
          this.textPaths[i].setAttribute('startOffset', pos.toString());
          this.baseOffsets.push(pos);
          cursor += widths[i] / 2 + this.gap;
        }
        if ((window as any).IS_DEBUG_MODE) console.debug('SVG text widths:', widths);
        this.group.style.textAnchor = 'middle';
      });
    });
  }

  // Align and animate active text
  private alignActive() {
    const current = this.baseOffsets[this.active];
    const delta = this.start - current;
    for (let i = 0; i < this.display.length; i++) {
      const target = (this.baseOffsets[i] + delta + this.L) % this.L;
      gsap.to(this.textPaths[i], {
        attr: { startOffset: target },
        duration: this.animDur,
        ease: 'power4.out',
      });
      this.texts[i].classList.toggle('active', i === this.active);
    }
    this.updateActiveImage();
  }

  // Align instantly (no animation)
  private alignActiveInstant() {
    const current = this.baseOffsets[this.active];
    const delta = this.start - current;
    for (let i = 0; i < this.display.length; i++) {
      const target = (this.baseOffsets[i] + delta + this.L) % this.L;
      this.textPaths[i].setAttribute('startOffset', target.toString());
      this.texts[i].classList.toggle('active', i === this.active);
    }
    this.updateActiveImage();
  }

  // Show only the active school's image
  private updateActiveImage() {
    // Only one original school should be active
    const origIndex = this.active % this.n;
    for (let i = 0; i < this.schools.length; i++) {
      this.schools[i].element.classList.toggle('active', i === origIndex);
    }
  }

  // Animate the progress circle
  private animateProgress() {
    if (this.progressTween) {
      gsap.killTweensOf(this.progressCircle);
    }
    this.progressCircle.style.strokeDashoffset = this.circleLength.toString();
    this.progressTween = gsap.to(this.progressCircle, {
      strokeDashoffset: 0,
      duration: this.autoDelay / 1000,
      ease: 'none',
    }) as gsap.core.Tween;
  }

  // Schedule the next auto-advance
  private scheduleNext() {
    if (this.autoTimer !== null) {
      clearTimeout(this.autoTimer);
    }
    this.autoTimer = window.setTimeout(() => this.setActive(this.active + 1), this.autoDelay);
  }

  // Set the active index (public)
  public setActive(idx: number) {
    // Use object destructuring for linter compliance
    const { display, n, animDur } = this;
    const total = display.length;
    const newIdx = ((idx % total) + total) % total;
    this.active = newIdx;
    this.alignActive();
    this.animateProgress();
    this.scheduleNext();
    // If we are near the start or end, jump to the middle block for seamless looping
    if (newIdx < n || newIdx >= total - n) {
      setTimeout(() => {
        this.active = newIdx < n ? newIdx + n : newIdx - n;
        this.alignActiveInstant();
      }, animDur * 1000);
    }
  }

  // Handle window resize
  private onResize() {
    this.renderDisplay();
    this.alignActiveInstant();
    this.animateProgress();
  }

  // Cleanup (public)
  public destroy() {
    if (this.autoTimer !== null) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
    if (this.progressTween) {
      gsap.killTweensOf(this.progressCircle);
      this.progressTween = null;
    }
    window.removeEventListener('resize', this.resizeHandler);
    // Remove SVG group
    if (this.group.parentNode) {
      this.group.parentNode.removeChild(this.group);
    }
    // Remove active class from images
    for (let i = 0; i < this.schools.length; i++) {
      this.schools[i].element.classList.remove('active');
    }
  }
}

// ─── INITIALIZE ON PAGE LOAD ─────────────────────────────────────────
void new HeroCarousel();
