interface SplitTextInstance {
  words: HTMLElement[];
  chars: HTMLElement[];
  lines: HTMLElement[];
}

interface SplitTextConstructor {
  create(
    element: Element | Element[],
    options: {
      type: string;
      mask?: string;
      wordsClass?: string;
      charsClass?: string;
      linesClass?: string;
    }
  ): SplitTextInstance;
}

/**
 * Initialize word reveal animations for elements with data-word-reveal attribute
 */
export const initializeWordRevealAnimations = (): void => {
  const { gsap } = window;
  const { ScrollTrigger } = window;
  const SplitText = window.SplitText as SplitTextConstructor;

  if (!gsap || !ScrollTrigger || !SplitText) {
    console.warn('GSAP, ScrollTrigger, or SplitText not available');
    return;
  }

  // Find all elements with word reveal animation
  const textElements = document.querySelectorAll<HTMLElement>('[data-word-reveal]');

  textElements.forEach((text: HTMLElement) => {
    // Use children if they exist (rich text), otherwise use the element itself (regular heading)
    const targetElements = text.children.length > 0 ? Array.from(text.children) : [text];

    // Create split text instance
    const split = SplitText.create(targetElements, {
      type: 'words, chars',
      mask: 'words',
      wordsClass: 'word',
      charsClass: 'char',
    });

    // Create timeline with scroll trigger
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: text,
        start: 'top bottom',
        end: 'top 80%',
        toggleActions: 'none play none reset',
      },
    });

    // Animate words
    tl.from(split.words, {
      yPercent: 110,
      delay: 0.2,
      duration: 0.8,
      stagger: { amount: 0.5 },
    });

    // Make text visible
    gsap.set(text, { visibility: 'visible' });
  });
};

/**
 * Initialize letter reveal animations for elements with data-letter-reveal attribute
 */
export const initializeLetterRevealAnimations = (): void => {
  const { gsap } = window;
  const { ScrollTrigger } = window;
  const SplitText = window.SplitText as SplitTextConstructor;

  if (!gsap || !ScrollTrigger || !SplitText) {
    console.warn('GSAP, ScrollTrigger, or SplitText not available');
    return;
  }

  // Find all elements with letter reveal animation
  const textElements = document.querySelectorAll<HTMLElement>('[data-letter-reveal]');

  textElements.forEach((text: HTMLElement) => {
    // Use children if they exist (rich text), otherwise use the element itself (regular heading)
    const targetElements = text.children.length > 0 ? Array.from(text.children) : [text];

    // Create split text instance for characters
    const split = SplitText.create(targetElements, {
      type: 'words, chars',
      mask: 'chars',
      wordsClass: 'word',
      charsClass: 'char',
    });

    // Create timeline with scroll trigger
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: text,
        start: 'top bottom',
        end: 'top 80%',
        toggleActions: 'none play none reset',
      },
    });

    // Animate characters
    tl.from(split.chars, {
      yPercent: 110,
      delay: 0.1,
      duration: 0.6,
      stagger: { amount: 0.8 },
    });

    // Make text visible
    gsap.set(text, { visibility: 'visible' });
  });
};

/**
 * Initialize line reveal animations for elements with data-line-reveal attribute
 */
export const initializeLineRevealAnimations = (): void => {
  if (!gsap || !ScrollTrigger || !SplitText) {
    console.warn('GSAP, ScrollTrigger, or SplitText not available');
    return;
  }

  // Find all elements with line reveal animation
  const textElements = document.querySelectorAll<HTMLElement>('[data-line-reveal]');

  textElements.forEach((text: HTMLElement) => {
    // Use children if they exist (rich text), otherwise use the element itself (regular heading)
    const targetElements = text.children.length > 0 ? Array.from(text.children) : [text];

    // Create split text instance for lines
    const split = SplitText.create(targetElements, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'line',
    });

    // Create timeline with scroll trigger
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: text,
        start: 'top bottom',
        end: 'top 85%',
        toggleActions: 'none play none reset',
      },
    });

    // Animate lines
    tl.from(split.lines, {
      yPercent: 110,
      delay: 0.3,
      duration: 0.8,
      ease: 'power4.out',
      stagger: { amount: 0.1 },
    });

    // Make text visible
    gsap.set(text, { visibility: 'visible' });
  });
};

/**
 * Initialize all text animations (word, letter, and line reveals) after fonts are loaded
 */
export const initializeTextAnimations = () => {
  document.fonts.ready.then(() => {
    initializeWordRevealAnimations();
    initializeLetterRevealAnimations();
    initializeLineRevealAnimations();
  });
};
