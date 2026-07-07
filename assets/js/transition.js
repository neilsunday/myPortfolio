(function () {
    const TRANSITION_DURATION = 760;
    const overlayClass = 'transition-overlay';
    const overlayLineClass = 'transition-overlay__line';
    const overlayTextClass = 'transition-overlay__text';
    const bodyTransitionClass = 'is-transitioning';
    const pageEnterClass = 'is-entering';
    const shellExitClass = 'is-exiting';
    let transitionActive = false;
    let clickSound = null;

    const createSound = () => {
        if (!clickSound) {
            clickSound = new Audio('assets/sounds/click.mp3');
            clickSound.preload = 'auto';
        }
        return clickSound;
    };

    const playClickSound = () => {
        const sound = createSound();
        if (!sound) {
            return;
        }

        sound.currentTime = 0;
        sound.play().catch(() => {
            // Ignore autoplay restrictions.
        });
    };

    const createOverlay = (label) => {
        const overlay = document.createElement('div');
        overlay.className = overlayClass;
        overlay.setAttribute('aria-hidden', 'true');
        overlay.innerHTML = `
            <div class="${overlayTextClass}">${label}</div>
            <div class="${overlayLineClass}"></div>
        `;

        document.body.appendChild(overlay);
        return overlay;
    };

    const beginTransition = (event, targetUrl, label) => {
        if (transitionActive) {
            event.preventDefault();
            return;
        }

        transitionActive = true;
        event.preventDefault();
        playClickSound();

        document.body.classList.add(bodyTransitionClass);
        document.body.style.pointerEvents = 'none';

        const shell = document.querySelector('.menu-shell, .page-shell');
        if (shell) {
            shell.classList.add(shellExitClass);
        }

        const title = document.querySelector('.game-title, .page-title');
        if (title) {
            title.classList.add('is-exiting');
        }

        const itemNodes = document.querySelectorAll('.menu-item, .page-nav-link');
        itemNodes.forEach((item) => item.classList.add('is-fading'));

        const overlay = createOverlay(label);
        requestAnimationFrame(() => {
            overlay.classList.add('is-visible');
            const line = overlay.querySelector(`.${overlayLineClass}`);
            if (line) {
                requestAnimationFrame(() => {
                    line.style.transform = 'scaleX(1)';
                });
            }
        });

        window.setTimeout(() => {
            window.location.href = targetUrl;
        }, TRANSITION_DURATION);
    };

    const handleLinkClick = (event) => {
        const link = event.target.closest('a');

        if (!link) {
            return;
        }

        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
            return;
        }

        const absoluteHref = new URL(href, window.location.href);
        const isSameOrigin = absoluteHref.origin === window.location.origin;
        if (!isSameOrigin) {
            return;
        }

        const label = link.dataset.transitionLabel || link.dataset.transitionText || link.textContent.trim() || 'INITIALIZING...';
        beginTransition(event, absoluteHref.pathname, label.toUpperCase());
    };

    const initEntryAnimation = () => {
        const shell = document.querySelector('.menu-shell, .page-shell');
        if (shell) {
            shell.classList.add(pageEnterClass);
        }

        const title = document.querySelector('.game-title, .page-title');
        if (title) {
            title.classList.add('is-entering');
        }

        requestAnimationFrame(() => {
            document.body.classList.add('has-entered');
        });
    };

    document.addEventListener('click', handleLinkClick);
    document.addEventListener('DOMContentLoaded', initEntryAnimation);
    window.addEventListener('pageshow', initEntryAnimation);
})();
