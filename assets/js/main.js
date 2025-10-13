function initNavigation() {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.getElementById('primary-navigation');

  if (!navToggle || !navLinks) {
    return;
  }

  const closeNavigation = () => {
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  };

  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    navLinks.classList.toggle('is-open');
    document.body.classList.toggle('nav-open', !expanded);
  });

  navLinks.addEventListener('click', (event) => {
    if (event.target instanceof HTMLElement && event.target.matches('a')) {
      closeNavigation();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navLinks.classList.contains('is-open')) {
      closeNavigation();
      navToggle.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900 && navLinks.classList.contains('is-open')) {
      closeNavigation();
    }
  });
}

function updateFooterYear() {
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

function initPhotoModal() {
  const modal = document.getElementById('photo-modal');
  if (!modal) {
    return;
  }

  const modalImage = modal.querySelector('.modal__image');
  const closeTriggers = modal.querySelectorAll('[data-modal-close]');
  const photoButtons = document.querySelectorAll('.photo-card__trigger');

  if (!modalImage || photoButtons.length === 0) {
    return;
  }

  let lastFocusedElement = null;

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  };

  const openModal = (imageSrc, imageAlt, trigger) => {
    modalImage.src = imageSrc;
    modalImage.alt = imageAlt || '';
    lastFocusedElement = trigger;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    modal.querySelector('.modal__close').focus();
  };

  photoButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const imageSrc = button.dataset.image;
      const imageAlt = button.dataset.alt || button.querySelector('img')?.alt || '';

      if (imageSrc) {
        openModal(imageSrc, imageAlt, button);
      }
    });
  });

  closeTriggers.forEach((trigger) => {
    trigger.addEventListener('click', closeModal);
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  updateFooterYear();
  initNavigation();
  initPhotoModal();
});
