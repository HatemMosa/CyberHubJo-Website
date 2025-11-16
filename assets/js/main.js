const OPENALEX_CONFIG = {
  apiBase: 'https://api.openalex.org',
  contactEmail: 'info@cyberhubjo.com',
  authors: [
    { name: 'Hatem Mosa', id: 'A5115965220' },
    { name: 'Ebtehal Omoush', id: 'A5093415323' },
    { name: 'Amro Saleh', id: 'A5113872280' },
    { name: 'Eman Alnagi', id: 'A5109521563' },
    { name: 'Eman Alnagi (PSUT)', id: 'A5017666311' },
    { name: 'AbedlRahman Almodawar', id: 'A5093711030' },
    { name: 'Yasmeen Alslman', id: 'A5023891726' }
  ],
  highlightYears: [2025, 2024, 2023]
};

const publicationNumberFormatter = new Intl.NumberFormat('en-US');

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

function normaliseAuthorId(rawId) {
  if (!rawId) {
    return null;
  }
  const trimmed = String(rawId).trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.split('/').pop();
  }
  const upper = trimmed.toUpperCase();
  return upper.startsWith('A') ? upper : `A${upper}`;
}

async function requestOpenAlex(path, params = {}) {
  const url = new URL(path, OPENALEX_CONFIG.apiBase);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  if (OPENALEX_CONFIG.contactEmail) {
    url.searchParams.set('mailto', OPENALEX_CONFIG.contactEmail);
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`OpenAlex request failed (${response.status})`);
  }

  return response.json();
}

async function fetchWorksForAuthor(authorId) {
  const works = [];
  let cursor = '*';

  while (cursor) {
    const data = await requestOpenAlex('/works', {
      filter: `authorships.author.id:${authorId}`,
      select: 'id,display_name,publication_year,cited_by_count,type,type_crossref,primary_location',
      sort: 'publication_year:desc',
      'per-page': 200,
      cursor
    });

    works.push(...(data?.results ?? []));
    cursor = data?.meta?.next_cursor;

    if (!cursor) {
      break;
    }
  }

  return works;
}

async function loadAllOpenAlexWorks() {
  const workMap = new Map();

  await Promise.all(
    OPENALEX_CONFIG.authors.map(async (researcher) => {
      const authorId = normaliseAuthorId(researcher.id);
      if (!authorId) {
        return;
      }

      try {
        const works = await fetchWorksForAuthor(authorId);
        works.forEach((work) => {
          if (!work?.id || workMap.has(work.id)) {
            return;
          }
          workMap.set(work.id, work);
        });
      } catch (error) {
        console.warn(`Failed to load works for ${researcher.name}`, error);
      }
    })
  );

  return Array.from(workMap.values());
}

function aggregateYearMetrics(works) {
  return works.reduce((acc, work) => {
    const year = Number(work?.publication_year);
    if (!Number.isFinite(year)) {
      return acc;
    }

    const entry = acc.get(year) ?? { publications: 0, citations: 0 };
    entry.publications += 1;
    entry.citations += Number(work?.cited_by_count ?? 0);
    acc.set(year, entry);
    return acc;
  }, new Map());
}

function updateHeadlineMetrics(works, totalCitations) {
  const totalPublicationsEl = document.getElementById('total-publications');
  const totalCitationsEl = document.getElementById('total-citations');

  if (totalPublicationsEl) {
    totalPublicationsEl.textContent = publicationNumberFormatter.format(works.length);
  }

  if (totalCitationsEl) {
    totalCitationsEl.textContent = publicationNumberFormatter.format(totalCitations);
  }
}

function updateHighlightCards(yearMetrics) {
  OPENALEX_CONFIG.highlightYears.forEach((year) => {
    const element = document.getElementById(`publications-${year}`);
    if (!element) {
      return;
    }
    const metrics = yearMetrics.get(year) ?? { publications: 0 };
    element.textContent = publicationNumberFormatter.format(metrics.publications ?? 0);
  });
}

async function initPublicationsDashboard() {
  if (!document.body.classList.contains('page-publications')) {
    return;
  }

  const loadingBanner = document.getElementById('publication-loading');
  const errorBanner = document.getElementById('publication-error');
  const lastUpdated = document.getElementById('last-updated');

  try {
    const works = await loadAllOpenAlexWorks();

    if (!works.length) {
      throw new Error('No publications found for the configured authors.');
    }

    const totalCitations = works.reduce((sum, work) => sum + Number(work?.cited_by_count ?? 0), 0);
    const yearMetrics = aggregateYearMetrics(works);
    updateHeadlineMetrics(works, totalCitations);
    updateHighlightCards(yearMetrics);

    if (lastUpdated) {
      lastUpdated.textContent = new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'long',
        timeStyle: 'short'
      }).format(new Date());
    }
  } catch (error) {
    console.error(error);
    if (errorBanner) {
      errorBanner.hidden = false;
      errorBanner.textContent = error.message || 'Unable to load publication data right now.';
    }
  } finally {
    if (loadingBanner) {
      loadingBanner.hidden = true;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  updateFooterYear();
  initNavigation();
  initPhotoModal();
  initPublicationsDashboard();
});
