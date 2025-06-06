const SEARCH_DIALOG_TRIGGER_SELECTOR = '[data-el="search-dialog-trigger"]';
const SEARCH_DIALOG_SELECTOR = '[data-el="search-dialog"]';

export function setSearchDialogTrigger() {
  const searchDialog = document.querySelector<HTMLDialogElement>(SEARCH_DIALOG_SELECTOR);
  const searchDialogTrigger = document.querySelector<HTMLButtonElement>(
    SEARCH_DIALOG_TRIGGER_SELECTOR
  );

  searchDialogTrigger?.addEventListener('click', () => {
    searchDialog?.showModal();
  });
}
