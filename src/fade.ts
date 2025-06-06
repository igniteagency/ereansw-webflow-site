const SLIDE_Y_VALUE = 50;

const FADE_ATTR = 'data-fade';
const FADE_ATTR_STILL_VALUE = 'still';
const FADE_ATTR_DOWN_VALUE = 'down';
const FADE_DELAY_ATTR = 'data-fade-delay-ms';
const FADE_STAGGER_ATTR = 'data-fade-stagger';
const FADE_STAGGER_DELAY_ATTR = 'data-fade-stagger-delay-ms';
const FADE_STAGGER_IGNORE_ATTR = 'data-fade-stagger-ignore';

const FADE_DEFAULT_STAGGER_DELAY_MS = 150;

/**
 * Adds fade animation to elements that have the `data-fade` attribute.
 *
 * Default animation applies to the element itself.
 * Add `data-fade=""` to apply fade-up (fade and slide up) on the element.
 * Add `data-fade="still"` to apply fade on the element without any slide.
 * Add `data-fade="down"` to apply fade-down (fade and slide down) on the element.
 * Add `data-fade-delay-ms="100"` to add delay to the animation in 100 milliseconds. Set the delay value as required. No delay by default.
 * Add `data-fade-stagger=""` to apply staggered fade on all its direct children.
 * Add `data-fade-stagger-delay-ms="100"` to control the time between stagger. Defaults to 300ms
 * Add `data-fade-stagger-ignore` to a parent element to have it ignored in a stagger animation, making the stagger apply seamlessly to its children.
 */
export function fadeUp() {
  const fadeUpElList = document.querySelectorAll(`[${FADE_ATTR}]`);
  fadeUpElList.forEach((el) => {
    const isStagger = null !== el.getAttribute(FADE_STAGGER_ATTR) ? true : false;
    const fadeValue = el.getAttribute(FADE_ATTR);
    const isStill = FADE_ATTR_STILL_VALUE === fadeValue ? true : false;
    const isDown = FADE_ATTR_DOWN_VALUE === fadeValue ? true : false;
    const delayValue = el.getAttribute(FADE_DELAY_ATTR);
    const delay = delayValue ? Number(delayValue) / 1000 : false;

    if (!isStagger) {
      fadeUpAnimation(el, undefined, false, isStill, delay, isDown);
    } else {
      // Get all direct children
      let animatingElements = Array.from(el.children);

      // Process children to handle stagger-ignore elements
      animatingElements = processStaggerIgnoreElements(animatingElements);

      fadeUpAnimation(animatingElements, el, true, isStill, delay, isDown);
    }
  });
}

/**
 * Processes elements to handle stagger-ignore attribute
 * If an element has the stagger-ignore attribute, it will be replaced with its children in the array
 * @param elements Array of elements to process
 * @returns Processed array with stagger-ignore elements replaced by their children
 */
function processStaggerIgnoreElements(elements: Element[]): Element[] {
  let result: Element[] = [];

  for (const element of elements) {
    if (element.hasAttribute(FADE_STAGGER_IGNORE_ATTR)) {
      // Add this element's children to the result instead of the element itself
      result = result.concat(Array.from(element.children));

      // Recursively process the children of this element to handle nested stagger-ignore elements
      const childrenToProcess = Array.from(element.children);
      const processedChildren = processStaggerIgnoreElements(childrenToProcess);

      // Replace the original children with the processed ones
      result = result.filter((el) => !Array.from(element.children).includes(el));
      result = result.concat(processedChildren);
    } else {
      result.push(element);
    }
  }

  return result;
}

function fadeUpAnimation(
  el: gsap.TweenTarget,
  parentEl: HTMLElement | undefined = undefined,
  stagger = false,
  still = false,
  delay: false | number = false,
  down = false
) {
  const staggerDelayValue =
    (Number(parentEl?.getAttribute(FADE_STAGGER_DELAY_ATTR)) || FADE_DEFAULT_STAGGER_DELAY_MS) /
    1000;

  window.gsap.set(el, {
    y: still ? 0 : down ? -SLIDE_Y_VALUE : SLIDE_Y_VALUE,
    autoAlpha: 0,
  });

  window.gsap.to(el, {
    y: 0,
    autoAlpha: 1,
    duration: 1,
    ease: 'power2.out',
    stagger: stagger ? staggerDelayValue : 0,
    delay: delay || 0,
    scrollTrigger: {
      trigger: parentEl || ((Array.isArray(el) ? el[0] : el) as Element),
      start: 'top 85%',
      toggleActions: 'play none none none',
      markers: window.IS_DEBUG_MODE,
      once: true,
      invalidateOnRefresh: true,
      id: 'fade',
    },
  });
}
