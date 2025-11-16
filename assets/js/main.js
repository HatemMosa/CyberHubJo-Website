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
  highlightYears: [2025, 2024, 2023],
  maxYearRows: 12,
  chartYearSpan: 10
};

const publicationNumberFormatter = new Intl.NumberFormat('en-US');
let publicationsChartInstance = null;

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

function determineTypeLabel(work) {
  const candidates = [work?.type, work?.type_crossref, work?.primary_location?.source?.type];
  const value = candidates.find((item) => typeof item === 'string' && item.trim().length > 0);

  if (!value) {
    return 'Journal Papers';
  }

  const normalised = value.toLowerCase();
  if (normalised.includes('journal')) return 'Journal Articles';
  if (normalised.includes('conference') || normalised.includes('proceeding')) return 'Conference Papers';
  if (normalised.includes('book')) return 'Books & Chapters';
  if (normalised.includes('thesis')) return 'Theses';
  if (normalised.includes('report')) return 'Reports';
  return 'Journal Papers';
}

function summariseTypes(works) {
  const counts = new Map();
  works.forEach((work) => {
    const label = determineTypeLabel(work);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
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

function renderTypeList(typeSummary) {
  const list = document.getElementById('type-list');
  const emptyState = document.getElementById('types-empty');
  if (!list || !emptyState) {
    return;
  }

  list.innerHTML = '';

  if (!typeSummary.length) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  typeSummary.forEach((item) => {
    const li = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = item.label;
    const value = document.createElement('strong');
    value.textContent = publicationNumberFormatter.format(item.count);
    li.appendChild(label);
    li.appendChild(value);
    list.appendChild(li);
  });
}

function renderYearTable(yearMetrics) {
  const tbody = document.getElementById('yearly-body');
  const emptyState = document.getElementById('yearly-empty');
  if (!tbody || !emptyState) {
    return;
  }

  tbody.innerHTML = '';
  const entries = Array.from(yearMetrics.entries()).sort((a, b) => b[0] - a[0]);

  if (!entries.length) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  entries.slice(0, OPENALEX_CONFIG.maxYearRows).forEach(([year, data]) => {
    const row = document.createElement('tr');
    const yearCell = document.createElement('td');
    yearCell.textContent = year;
    const pubCell = document.createElement('td');
    pubCell.textContent = publicationNumberFormatter.format(data.publications ?? 0);
    const citationCell = document.createElement('td');
    citationCell.textContent = publicationNumberFormatter.format(data.citations ?? 0);
    row.appendChild(yearCell);
    row.appendChild(pubCell);
    row.appendChild(citationCell);
    tbody.appendChild(row);
  });
}

function renderPublicationsChart(yearMetrics) {
  const canvas = document.getElementById('publications-chart');
  const emptyState = document.getElementById('publications-chart-empty');

  if (!canvas || !emptyState) {
    return;
  }

  const entries = Array.from(yearMetrics.entries())
    .filter(([year]) => Number.isFinite(year))
    .sort((a, b) => a[0] - b[0])
    .slice(-OPENALEX_CONFIG.chartYearSpan);

  if (!entries.length || typeof window.Chart === 'undefined') {
    canvas.hidden = true;
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  canvas.hidden = false;

  const labels = entries.map(([year]) => year);
  const dataPoints = entries.map(([, data]) => data.publications ?? 0);

  if (publicationsChartInstance) {
    publicationsChartInstance.destroy();
  }

  publicationsChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Publications',
          data: dataPoints,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          borderWidth: 3,
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#1d4ed8'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: '#475569' },
          grid: { color: 'rgba(148, 163, 184, 0.25)' }
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#475569' },
          grid: { color: 'rgba(148, 163, 184, 0.25)' }
        }
      }
    }
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
    const typeSummary = summariseTypes(works);

    updateHeadlineMetrics(works, totalCitations);
    updateHighlightCards(yearMetrics);
    renderTypeList(typeSummary);
    renderYearTable(yearMetrics);
    renderPublicationsChart(yearMetrics);

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
