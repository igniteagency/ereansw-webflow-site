const COMPONENT_SELECTOR = '[data-accordion-autoplay-el="component"]';
const AUTOPLAY_TIMER_ATTR = 'data-accordion-autoplay-time-seconds';

const AUTOPLAY_DEFAULT_TIME_IN_SECONDS = 6;
const AUTOPLAY_TIME_CSS_VAR = '--_autoplay-time';

class AccordionAutoplay {
  private componentEl: HTMLElement;
  private accordions: HTMLDetailsElement[] = [];
  private autoplayTime: number = AUTOPLAY_DEFAULT_TIME_IN_SECONDS;
  private currentIndex = -1;
  private autoplayInterval?: ReturnType<typeof setInterval>;
  private intersectionObserver?: IntersectionObserver;
  private isInView: boolean = false;

  constructor(element: HTMLElement) {
    this.componentEl = element;

    // Only run autoplay if device has a fine pointer (e.g., mouse)
    if (!window.matchMedia('(pointer: fine)').matches) {
      return;
    }

    const autoplayTimer = this.componentEl.getAttribute(AUTOPLAY_TIMER_ATTR);
    this.autoplayTime = autoplayTimer
      ? parseInt(autoplayTimer, 10)
      : AUTOPLAY_DEFAULT_TIME_IN_SECONDS;

    this.componentEl.style.setProperty(AUTOPLAY_TIME_CSS_VAR, `${this.autoplayTime}s`);

    this.accordions = Array.from(
      this.componentEl.querySelectorAll('details')
    ) as HTMLDetailsElement[];

    if (this.accordions.length === 0) {
      return;
    }

    this.addEventListeners();
    this.setupIntersectionObserver();
  }

  private setupIntersectionObserver() {
    this.intersectionObserver = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.isInView = true;
            this.startAutoplay();
          } else {
            this.isInView = false;
            this.stopAutoplay();
          }
        });
      },
      {
        threshold: 0.2, // At least 20% in view to trigger
      }
    );
    this.intersectionObserver.observe(this.componentEl);
  }

  private playNext = () => {
    this.currentIndex = (this.currentIndex + 1) % this.accordions.length;
    this.accordions[this.currentIndex].openAnimated();
  };

  private startAutoplay = () => {
    if (!this.isInView) return;
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
    }
    this.playNext(); // Immediately play the first/next one
    this.autoplayInterval = setInterval(this.playNext, this.autoplayTime * 1000);
  };

  private stopAutoplay = () => {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = undefined;
    }
  };

  private handleClick = (event: MouseEvent) => {
    if (!event.isTrusted) {
      return;
    }

    const clickedAccordion = event.currentTarget as HTMLDetailsElement;
    const clickedIndex = this.accordions.indexOf(clickedAccordion);

    if (clickedIndex > -1) {
      this.currentIndex = clickedIndex;
      if (this.autoplayInterval) {
        clearInterval(this.autoplayInterval);
      }
      // Only restart autoplay if in view
      if (this.isInView) {
        this.autoplayInterval = setInterval(this.playNext, this.autoplayTime * 1000);
      }
    }
  };

  private addEventListeners() {
    this.accordions.forEach((accordion) => {
      accordion.addEventListener('click', this.handleClick);
    });
  }
}

export function accordionsAutoplay() {
  document.querySelectorAll(COMPONENT_SELECTOR).forEach((componentEl) => {
    new AccordionAutoplay(componentEl as HTMLElement);
  });
}
