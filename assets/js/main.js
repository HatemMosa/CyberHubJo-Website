(function () {
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
    const founderCard = teamGrid.querySelector('.card-founder');
    if (founderCard) {
      const otherCards = Array.from(
        teamGrid.querySelectorAll('.team-card')
      ).filter((card) => card !== founderCard);

      for (let i = otherCards.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherCards[i], otherCards[j]] = [otherCards[j], otherCards[i]];
      }

      otherCards.forEach((card) => {
        teamGrid.appendChild(card);
      });

      teamGrid.insertBefore(founderCard, teamGrid.firstChild);
    }
  }
})();
