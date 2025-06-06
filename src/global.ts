import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { animatedDetailsAccordions } from '$components/accordions';
import '$components/dialog';
import { setSearchDialogTrigger } from '$components/search-dialog';
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
  fadeUp();
});
