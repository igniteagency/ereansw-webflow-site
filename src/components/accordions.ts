const ITEM_SELECTOR = 'details';
const TOGGLE_SELECTOR = 'summary';
const CONTENT_SELECTOR = 'summary + div';

const ANIMATION_DURATION_IN_MS = 300;
/**
 * If set to true, will close all other accordions when one is opened
 */
const CLOSE_OTHER_ACCORDIONS = true;

class AnimatedAccordion {
  private accordion: HTMLDetailsElement;
  private accordionToggleEl: HTMLElement;
  private accordionContentEl: HTMLElement;
  private accordionsList: NodeListOf<HTMLDetailsElement>;

  constructor(accordion: HTMLDetailsElement, accordionsList: NodeListOf<HTMLDetailsElement>) {
    this.accordion = accordion;
    this.accordionsList = accordionsList;
    this.accordionToggleEl = accordion.querySelector(TOGGLE_SELECTOR) as HTMLElement;
    this.accordionContentEl = accordion.querySelector(CONTENT_SELECTOR) as HTMLElement;

    if (!this.accordionToggleEl || !this.accordionContentEl) {
      console.error(
        'Accordion toggle or content not found',
        this.accordionToggleEl,
        this.accordionContentEl
      );
      return;
    }

    // Attach methods to the element instance for external use
    this.accordion.openAnimated = this.openAnimated;
    this.accordion.closeAnimated = this.closeAnimated;

    this.accordionToggleEl.addEventListener('click', this.handleClick);
  }

  private openAnimated = () => {
    if (this.accordion.open) {
      return;
    }

    this.accordion.open = true;
    const height = this.accordionContentEl.scrollHeight;
    this.accordionContentEl.style.height = '0px';
    this.accordionContentEl.animate([{ height: '0px' }, { height: `${height}px` }], {
      duration: ANIMATION_DURATION_IN_MS,
      fill: 'forwards',
    }).onfinish = () => {
      this.accordionContentEl.style.height = 'auto';
    };

    if (CLOSE_OTHER_ACCORDIONS) {
      this.accordionsList.forEach((otherAccordion) => {
        if (otherAccordion !== this.accordion && otherAccordion.open) {
          otherAccordion.closeAnimated?.();
        }
      });
    }
  };

  private closeAnimated = () => {
    if (!this.accordion.open) {
      return;
    }

    const height = this.accordionContentEl.scrollHeight;
    const animation = this.accordionContentEl.animate(
      [{ height: `${height}px` }, { height: '0px' }],
      {
        duration: ANIMATION_DURATION_IN_MS,
        fill: 'forwards',
      }
    );

    animation.onfinish = () => {
      this.accordion.open = false;
      this.accordionContentEl.style.height = '';
    };
  };

  private handleClick = (event: MouseEvent) => {
    event.preventDefault();
    if (!this.accordion.open) {
      this.openAnimated();
    } else {
      this.closeAnimated();
    }
  };
}

export function animatedDetailsAccordions() {
  const accordionsList = document.querySelectorAll<HTMLDetailsElement>(ITEM_SELECTOR);
  accordionsList.forEach((accordion) => {
    new AnimatedAccordion(accordion, accordionsList);
  });
}
