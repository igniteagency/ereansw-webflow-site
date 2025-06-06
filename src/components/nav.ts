const NAVBAR = document.querySelector('.navbar_component') as HTMLElement;
const HERO_SECTION = document.getElementById('hero-section');
const ANIMATION_DURATION: number = 0.5; // Duration in seconds
const ANIMATION_EASE: string = 'power4.inOut'; // Easing function

const SCROLL_DEBOUNCE_MS = 50;

export function navHideShow() {
  let lastScrollTop: number = 0;
  let scrollTimeout: number | undefined;

  const handleScroll = (): void => {
    const scrollTop: number = window.scrollY || document.documentElement.scrollTop;
    const scrollDelta: number = scrollTop - lastScrollTop;

    // Animate navbar based on scroll direction
    if (scrollDelta > 0) {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        window.gsap.to(NAVBAR, {
          yPercent: -180,
          duration: ANIMATION_DURATION,
          ease: ANIMATION_EASE,
        });
      }, SCROLL_DEBOUNCE_MS);
    } else {
      // Scrolling up
      if (scrollTimeout) clearTimeout(scrollTimeout);
      window.gsap.to(NAVBAR, {
        yPercent: 0,
        duration: ANIMATION_DURATION,
        ease: ANIMATION_EASE,
      });
    }

    // Check if the hero section is out of view and remove the .is-hero class if it exists
    // NOTE: Poor performance to be calculating element boundary on every scroll event execution since it causes reflow
    if (HERO_SECTION) {
      const HERO_SECTIONRect: DOMRect = HERO_SECTION.getBoundingClientRect();
      if (HERO_SECTIONRect.bottom <= 0) {
        if (NAVBAR.classList.contains('is-hero')) {
          NAVBAR.classList.remove('is-hero');
        }
      } else {
        if (!NAVBAR.classList.contains('is-hero')) {
          NAVBAR.classList.add('is-hero');
        }
      }
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  };

  window.addEventListener('scroll', () => {
    // Debounce the scroll event handler
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = window.setTimeout(handleScroll, SCROLL_DEBOUNCE_MS);
  });
}
