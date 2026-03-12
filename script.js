document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("menu-toggle");
    const navLinks = document.getElementById("nav-links");
    const navLinkItems = document.querySelectorAll(".nav-link");
    const sections = Array.from(document.querySelectorAll("section[id]"));
    const yearElement = document.getElementById("year");

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    function closeMenu() {
        if (!toggle || !navLinks) {
            return;
        }

        navLinks.classList.remove("active");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
    }

    if (toggle && navLinks) {
        toggle.addEventListener("click", () => {
            const isOpen = navLinks.classList.toggle("active");
            toggle.classList.toggle("open");
            toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        });
    }

    navLinkItems.forEach((link) => {
        link.addEventListener("click", () => closeMenu());
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".navbar")) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMenu();
        }
    });

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (event) => {
            const targetId = anchor.getAttribute("href");
            const targetSection = targetId ? document.querySelector(targetId) : null;

            if (!targetSection) {
                return;
            }

            event.preventDefault();
            targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });

    function updateActiveNav() {
        if (!sections.length) {
            return;
        }

        const scrollPosition = window.scrollY + 140;
        let currentId = sections[0].id;

        sections.forEach((section) => {
            if (scrollPosition >= section.offsetTop) {
                currentId = section.id;
            }
        });

        navLinkItems.forEach((link) => {
            const isCurrent = link.getAttribute("href") === `#${currentId}`;
            link.classList.toggle("is-current", isCurrent);

            if (isCurrent) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    }

    updateActiveNav();
    window.addEventListener("scroll", updateActiveNav, { passive: true });
});
