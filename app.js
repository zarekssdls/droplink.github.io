/* ================================================
   DROPLINK — APP.JS
   Landing page interactions + auth awareness
   ================================================ */

'use strict';

// ─── NAV: SCROLL STATE ────────────────────────────
const navWrapper = document.getElementById('nav');

function handleNavScroll() {
  if (window.scrollY > 20) {
    navWrapper.classList.add('scrolled');
  } else {
    navWrapper.classList.remove('scrolled');
  }
}

window.addEventListener('scroll', handleNavScroll, { passive: true });
handleNavScroll();

// ─── NAV: MOBILE TOGGLE ───────────────────────────
const mobileToggle = document.getElementById('mobileToggle');
const navLinks     = document.getElementById('navLinks');

mobileToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  mobileToggle.classList.toggle('active', isOpen);
  mobileToggle.setAttribute('aria-expanded', String(isOpen));
});

// Close mobile nav on link click
navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    mobileToggle.classList.remove('active');
    mobileToggle.setAttribute('aria-expanded', 'false');
  });
});

// ─── SCROLL ANIMATIONS ────────────────────────────
const scrollObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger children within grids/lists
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        scrollObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

// Stagger grid items
function staggerChildren(selector, parentSelector, delayIncrement = 80) {
  document.querySelectorAll(parentSelector).forEach(parent => {
    parent.querySelectorAll(selector).forEach((child, i) => {
      child.dataset.delay = i * delayIncrement;
    });
  });
}

staggerChildren('.feature-card', '.features-grid', 100);
staggerChildren('.step-card',    '.steps-grid',    120);
staggerChildren('.panel-tag',    '.panels-tags',    40);

document.querySelectorAll('.animate-on-scroll').forEach(el => {
  scrollObserver.observe(el);
});

// ─── SMOOTH SCROLL FOR ANCHOR LINKS ──────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const navHeight = navWrapper.offsetHeight;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ─── CHECK AUTH STATE — update CTAs ─────────────────
// If already logged in, send CTAs directly to dashboard
(async function checkAuth() {
  try {
    const res = await fetch('/auth/me', { credentials: 'include' });
    if (res.ok) {
      // User is logged in — update all CTA buttons
      const ctaLinks = [
        document.getElementById('heroStartFree'),
        document.getElementById('ctaCreateAccount'),
        document.getElementById('pricingFreeBtn'),
        document.getElementById('navCTA')
      ];
      ctaLinks.forEach(el => {
        if (el) {
          el.href = '/dashboard';
          if (el.id === 'navCTA') el.textContent = 'Go to Dashboard';
        }
      });
    } else {
      // Not logged in — point to Discord OAuth
      const ctaLinks = [
        document.getElementById('heroStartFree'),
        document.getElementById('ctaCreateAccount'),
        document.getElementById('pricingFreeBtn'),
        document.getElementById('navCTA')
      ];
      ctaLinks.forEach(el => { if (el) el.href = '/login'; });
    }
  } catch { /* server might not be running in static preview */ }
})();

// ─── WAITLIST BUTTON ──────────────────────────────
const waitlistBtn  = document.getElementById('waitlistBtn');
const proNotifyBtn = document.getElementById('pricingProBtn');

function handleWaitlist(e) {
  e.preventDefault();
  showToast('📬 You\'ll be notified when Pro launches!');
}

if (waitlistBtn)  waitlistBtn.addEventListener('click', handleWaitlist);

// ─── TOAST NOTIFICATION ───────────────────────────
function showToast(message) {
  // Remove existing toast
  const existing = document.querySelector('.droplink-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'droplink-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = `
    <span class="toast-icon">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </span>
    <span class="toast-text">${message}</span>
  `;
  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.add('toast-visible');
  });

  // Auto-remove after 3.5s
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// ─── INJECT TOAST STYLES ──────────────────────────
const toastStyles = document.createElement('style');
toastStyles.textContent = `
  .droplink-toast {
    position: fixed;
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: #1A1A1A;
    border: 1px solid rgba(192, 198, 206, 0.25);
    border-radius: 10px;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Inter', sans-serif;
    font-size: 0.88rem;
    color: #D6DAE0;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    opacity: 0;
    transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.4,0,0.2,1);
    z-index: 9999;
    white-space: nowrap;
  }
  .droplink-toast.toast-visible {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  .toast-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    background: rgba(192,198,206,0.10);
    border-radius: 50%;
    color: #C0C6CE;
    flex-shrink: 0;
  }
`;
document.head.appendChild(toastStyles);

// ─── STATS COUNTER (simple one-time count-up) ────
// Optional: can be wired to real stats later
// Currently used for hero "credibility" text if needed

// ─── ACTIVE NAV LINK ON SCROLL ───────────────────
const sections = document.querySelectorAll('section[id]');
const navLinkEls = document.querySelectorAll('.nav-link[href^="#"]');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinkEls.forEach(link => {
          link.classList.toggle(
            'nav-link--active',
            link.getAttribute('href') === `#${id}`
          );
        });
      }
    });
  },
  { threshold: 0.4 }
);

sections.forEach(section => sectionObserver.observe(section));

// Inject active link style
const navActiveStyle = document.createElement('style');
navActiveStyle.textContent = `
  .nav-link--active {
    color: #E2E5EA !important;
    background: rgba(192, 198, 206, 0.07) !important;
  }
`;
document.head.appendChild(navActiveStyle);

// ─── KEYBOARD ACCESSIBILITY ───────────────────────
// Trap focus in mobile menu when open
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navLinks.classList.contains('open')) {
    navLinks.classList.remove('open');
    mobileToggle.classList.remove('active');
    mobileToggle.setAttribute('aria-expanded', 'false');
    mobileToggle.focus();
  }
});
