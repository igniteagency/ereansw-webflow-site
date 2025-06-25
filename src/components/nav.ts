const NAVBAR = document.querySelector('.navbar_component');
const NAVBAR_HIDDEN_CLASS = 'is-hidden';
const HERO_SECTION = document.getElementById('hero-section');
const ANIMATION_DURATION: number = 0.5; // Duration in seconds
const ANIMATION_EASE: string = 'power4.inOut'; // Easing function

const SCROLL_DEBOUNCE_MS = 50;
const BOX_SHADOW_OFFSET = 8; // Extra pixels to account for box shadow

function updateNavbarHeightVar(isHidden: boolean = false) {
  const navbar = document.querySelector('#navbar');
  if (!navbar) return;

  // Let browser recalc layout if needed
  requestAnimationFrame(() => {
    const fullNavbarHeight = navbar.offsetHeight;
    const navbarComponentHeight = NAVBAR ? NAVBAR.offsetHeight : 0;

    let targetHeight: number;
    if (isHidden) {
      // When hidden, subtract the navbar component height from the full navbar height
      targetHeight = fullNavbarHeight - navbarComponentHeight;
    } else {
      // When visible, use the full navbar height
      targetHeight = fullNavbarHeight;
    }

    // Animate the CSS variable with GSAP using the same properties as the navbar animation
    window.gsap.to(document.documentElement, {
      '--navbar-height': `${targetHeight}px`,
      duration: ANIMATION_DURATION,
      ease: ANIMATION_EASE,
    });
  });
}

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
        const navbar = document.querySelector('#navbar');
        const fullNavbarHeight = navbar ? navbar.offsetHeight : 0;
        const hideDistance = fullNavbarHeight + BOX_SHADOW_OFFSET;

        window.gsap.to(NAVBAR, {
          y: -hideDistance,
          duration: ANIMATION_DURATION,
          ease: ANIMATION_EASE,
        });

        NAVBAR?.classList.add(NAVBAR_HIDDEN_CLASS);

        // Update CSS variable for hidden state
        updateNavbarHeightVar(true);
      }, SCROLL_DEBOUNCE_MS);
    } else {
      // Scrolling up
      if (scrollTimeout) clearTimeout(scrollTimeout);
      window.gsap.to(NAVBAR, {
        y: 0,
        duration: ANIMATION_DURATION,
        ease: ANIMATION_EASE,
      });

      NAVBAR?.classList.remove(NAVBAR_HIDDEN_CLASS);

      // Update CSS variable for visible state
      updateNavbarHeightVar(false);
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

export function initNavbarHeightVar() {
  // Initial run (navbar starts visible)
  updateNavbarHeightVar(false);

  // On resize - maintain current state
  window.addEventListener('resize', () => {
    // Check if navbar is currently hidden by checking its transform
    const currentTransform = window.getComputedStyle(NAVBAR).transform;
    const isCurrentlyHidden =
      currentTransform.includes('matrix') && currentTransform !== 'matrix(1, 0, 0, 1, 0, 0)';
    updateNavbarHeightVar(isCurrentlyHidden);
  });

  // Listen for dialog open/close events in the navbar
  const navbarDialogs = document.querySelectorAll('#navbar dialog');
  navbarDialogs.forEach((dialog) => {
    // Dialog opened - recalculate height
    dialog.addEventListener('open', () => {
      const currentTransform = window.getComputedStyle(NAVBAR).transform;
      const isCurrentlyHidden =
        currentTransform.includes('matrix') && currentTransform !== 'matrix(1, 0, 0, 1, 0, 0)';
      updateNavbarHeightVar(isCurrentlyHidden);
    });

    // Dialog closed - recalculate height
    dialog.addEventListener('close', () => {
      const currentTransform = window.getComputedStyle(NAVBAR).transform;
      const isCurrentlyHidden =
        currentTransform.includes('matrix') && currentTransform !== 'matrix(1, 0, 0, 1, 0, 0)';
      updateNavbarHeightVar(isCurrentlyHidden);
    });
  });
}
