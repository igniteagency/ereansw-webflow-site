import { animatedDetailsAccordions } from '$components/accordions';
import { accordionsAutoplay } from '$components/accordions-autoplay';
import '$components/dialog';
import { navHideShow } from '$components/nav';
import { setSearchDialogTrigger } from '$components/search-dialog';
import { initializeTextAnimations } from '$components/text-animation';
import { setCurrentYear } from '$utils/current-year';
import '$utils/disable-webflow-scroll';

import { fadeUp } from './fade';

gsap.registerPlugin(ScrollTrigger);

window.Webflow = window.Webflow || [];
window.Webflow?.push(() => {
  // Set current year on respective elements
  setCurrentYear();

  setSearchDialogTrigger();

  animatedDetailsAccordions();

  navHideShow();

  initializeTextAnimations();

  fadeUp();

  accordionsAutoplay();
});
