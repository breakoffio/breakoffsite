// Dynamic copyright year
document.querySelectorAll('.footer-year').forEach(el => {
    el.textContent = new Date().getFullYear();
});

// Mobile menu toggle
const toggle = document.querySelector('.nav-mobile-toggle');
const mobileMenu = document.querySelector('.mobile-menu');

if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        toggle.classList.toggle('active');
    });

    // Close menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            toggle.classList.remove('active');
        });
    });
}

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Add fade-in class to animatable elements
document.addEventListener('DOMContentLoaded', () => {
    const selectors = [
        '.feature-card-large',
        '.feature-card',
        '.step-card',
        '.cta-content',
        '.section-header'
    ];

    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.classList.add('fade-in');
            observer.observe(el);
        });
    });
});

// Smooth nav background on scroll
const nav = document.querySelector('.nav');

window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    if (currentScroll > 10) {
        nav.style.borderBottomColor = 'rgba(0, 0, 0, 0.08)';
    } else {
        nav.style.borderBottomColor = 'rgba(0, 0, 0, 0.04)';
    }
}, { passive: true });
