// ===================================
// SURYA'S CAR TOWN - JAVASCRIPT
// Interactive Features
// ===================================

// ===================================
// SURYA'S CAR TOWN - JAVASCRIPT
// V15 - Fleet Filtering (Pills)
function filterFleet(category) {
    // Buttons
    document.querySelectorAll('.pill-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Cards
    const cards = document.querySelectorAll('.fleet-card');
    cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}
// ===================================

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function () {
    initFleetFilter();
    initFAQ();
    initSmoothScroll();
    initMobileMenu();
});

// ===================================
// FLEET CATEGORY FILTER
// ===================================
function initFleetFilter() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const carCards = document.querySelectorAll('.car-card');

    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            const category = this.getAttribute('data-category');

            // Update active tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Filter cars
            carCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');

                if (category === 'all') {
                    card.classList.add('active');
                } else if (cardCategory === category) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });
        });
    });
}

// ===================================
// FAQ ACCORDION
// ===================================
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', function () {
            // Close other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });

            // Toggle current item
            item.classList.toggle('active');
        });
    });
}

// ===================================
// SMOOTH SCROLL NAVIGATION
// ===================================
function initSmoothScroll() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===================================
// MOBILE MENU TOGGLE
// ===================================
function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.nav');

    if (mobileMenuBtn && nav) {
        mobileMenuBtn.addEventListener('click', function () {
            nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';

            // Update mobile menu for responsive display
            if (window.innerWidth <= 768) {
                if (nav.style.display === 'flex') {
                    nav.style.position = 'absolute';
                    nav.style.top = '100%';
                    nav.style.left = '0';
                    nav.style.right = '0';
                    nav.style.backgroundColor = 'var(--color-bg-primary)';
                    nav.style.flexDirection = 'column';
                    nav.style.padding = 'var(--spacing-md)';
                    nav.style.borderTop = '1px solid rgba(255, 255, 255, 0.1)';
                }
            }
        });
    }
}

// ===================================
// COPY PHONE NUMBER TO CLIPBOARD
// ===================================
function copyPhone() {
    const phoneNumber = '+919876543210';

    // Create temporary input element
    const tempInput = document.createElement('input');
    tempInput.value = phoneNumber;
    document.body.appendChild(tempInput);

    // Select and copy
    tempInput.select();
    tempInput.setSelectionRange(0, 99999); // For mobile devices

    try {
        document.execCommand('copy');

        // Show feedback
        const copyBtn = document.querySelector('.copy-btn');
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '✓';
        copyBtn.style.backgroundColor = 'var(--color-accent-blue-bright)';

        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.backgroundColor = '';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
    }

    // Remove temporary input
    document.body.removeChild(tempInput);
}

// ===================================
// HEADER SCROLL EFFECT
// ===================================
let lastScroll = 0;
window.addEventListener('scroll', function () {
    const header = document.querySelector('.header');
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
    } else {
        header.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
});

// ===================================
// INTERSECTION OBSERVER FOR ANIMATIONS
// ===================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function (entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for fade-in animation
document.addEventListener('DOMContentLoaded', function () {
    const animateElements = document.querySelectorAll('.step, .car-card, .faq-item');

    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// ===================================
// V17 - HERO CAROUSEL
// ===================================
function startHeroCarousel() {
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length === 0) return;

    let currentSlide = 0;

    // Ensure first slide is visible initially
    slides[0].classList.add('active');

    setInterval(() => {
        // Remove active from current
        slides[currentSlide].classList.remove('active');

        // Next index
        currentSlide = (currentSlide + 1) % slides.length;

        // Add active to next
        slides[currentSlide].classList.add('active');
    }, 4000); // Change every 4 seconds
}

// Start Carousel
document.addEventListener('DOMContentLoaded', () => {
    startHeroCarousel();
});
