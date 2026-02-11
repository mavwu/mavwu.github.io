document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("menu-toggle");
    const navLinks = document.getElementById("nav-links");
    const navLinkItems = document.querySelectorAll(".nav-link");

    function closeMenu() {
        navLinks.classList.remove("active");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("active");
        toggle.classList.toggle("open");
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Close menu after clicking a link (mobile)
    navLinkItems.forEach((link) => {
        link.addEventListener("click", () => closeMenu());
    });

    // close menu when clicking outside
    document.addEventListener("click", (e) => {
        const clickedInsideNav = e.target.closest(".navbar");
        if (!clickedInsideNav) closeMenu();
    });

    // ===== Smooth scroll for all anchor links =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetSection = document.querySelector(this.getAttribute('href'));
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});