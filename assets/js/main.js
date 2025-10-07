document.addEventListener('DOMContentLoaded', () => {
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.getElementById('primary-navigation');

  if (navToggle && navLinks) {
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

  const teamGrid = document.querySelector('.team-grid');
  if (teamGrid) {
    const cardElements = Array.from(teamGrid.children).filter(
      (node) => node instanceof HTMLElement && node.classList.contains('team-card'),
    );

    const founderCard = cardElements.find((card) => card.classList.contains('card-founder'));

    if (founderCard) {
      cardElements.forEach((card) => card.classList.remove('team-card--solo'));

      const otherCards = cardElements.filter((card) => card !== founderCard);

      for (let i = otherCards.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherCards[i], otherCards[j]] = [otherCards[j], otherCards[i]];
      }

      const orderedCards = [founderCard];

      if (otherCards.length) {
        orderedCards.push(otherCards.shift());
      }

      orderedCards.push(...otherCards);

      if (orderedCards.length % 2 !== 0) {
        orderedCards[orderedCards.length - 1].classList.add('team-card--solo');
      }

      const fragment = document.createDocumentFragment();
      orderedCards.forEach((card) => {
        fragment.appendChild(card);
      });

      teamGrid.innerHTML = '';
      teamGrid.appendChild(fragment);
    }
  }
});
