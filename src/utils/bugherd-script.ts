/**
 * Injects the BugHerd script only on webflow.io staging domains
 */
export function initBugHerd(): void {
  const currentHostname = window.location.hostname;

  // Only inject on webflow.io domains
  if (currentHostname.includes('webflow.io')) {
    window
      .loadScript('https://www.bugherd.com/sidebarv2.js?apikey=rmeamxf2wjzg5kxaaybjuw', {
        placement: 'body',
        defer: true,
      })
      .then(() => {
        console.log('BugHerd script loaded successfully');
      })
      .catch((error) => {
        console.error('Failed to load BugHerd script:', error);
      });
  }
}
