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

async function loadGalleryAlbum() {
  const albumContainer = document.querySelector('[data-album-container]');

  if (!albumContainer) {
    return;
  }

  const statusElement = albumContainer.querySelector('.album-status');
  const apiKey = 'f6c2cdc1bf67b426cfe9a3394a83f439';
  const albumId = 'Z68PBT';
  const endpoint = `https://api.imgbb.com/1/album/${albumId}?key=${apiKey}`;

  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const images = Array.isArray(payload?.data?.images)
      ? payload.data.images
      : [];

    albumContainer.innerHTML = '';

    if (!images.length) {
      albumContainer.innerHTML =
        '<p class="album-status">No images are available right now. Please check back soon!</p>';
      return;
    }

    const sortedImages = images
      .slice()
      .sort((a, b) => (b.time || 0) - (a.time || 0));

    const fragment = document.createDocumentFragment();

    for (const image of sortedImages) {
      const fullImageUrl =
        image?.url || image?.image?.url || image?.url_viewer || image?.display_url;
      const displayUrl = image?.display_url || fullImageUrl;

      if (!displayUrl) {
        continue;
      }

      const article = document.createElement('article');
      article.className = 'card photo-card';
      article.setAttribute('role', 'listitem');

      const figure = document.createElement('figure');

      const link = document.createElement('a');
      link.href = fullImageUrl || displayUrl;
      link.target = '_blank';
      link.rel = 'noopener';
      link.setAttribute(
        'aria-label',
        image?.title
          ? `Open full-size image: ${image.title}`
          : 'Open full-size CyberHubJo album image'
      );

      const img = document.createElement('img');
      img.src = displayUrl;
      img.alt = image?.title
        ? `${image.title} – CyberHubJo`
        : 'CyberHubJo album image';
      img.loading = 'lazy';

      link.appendChild(img);
      figure.appendChild(link);

      const titleText = image?.title?.trim();
      if (titleText) {
        const figcaption = document.createElement('figcaption');
        figcaption.textContent = titleText;
        figure.appendChild(figcaption);
      }

      article.appendChild(figure);
      fragment.appendChild(article);
    }

    if (!fragment.childNodes.length) {
      albumContainer.innerHTML =
        '<p class="album-status">We could not display the album images right now. Please try again later.</p>';
      return;
    }

    albumContainer.appendChild(fragment);
  } catch (error) {
    console.error('Unable to load CyberHubJo album images:', error);

    const message =
      'We were unable to load the CyberHubJo photo album. Please refresh to try again.';

    if (statusElement && albumContainer.contains(statusElement)) {
      statusElement.textContent = message;
    } else {
      albumContainer.innerHTML = `<p class="album-status">${message}</p>`;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  updateFooterYear();
  initNavigation();
  loadGalleryAlbum();
});
