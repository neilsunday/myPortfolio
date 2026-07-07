(function () {
    const TRANSITION_DURATION = 820;
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

    const getHudText = () => {
        const hudTopRight = document.querySelector('.hud-top-right');
        const hudBottomLeft = document.querySelector('.hud-bottom-left');

        return {
            topRight: hudTopRight ? hudTopRight.textContent.trim() : '',
            bottomLeft: hudBottomLeft ? hudBottomLeft.textContent.trim() : ''
        };
    };

    const updateHudState = (isTransitioning) => {
        const hudTopRight = document.querySelector('.hud-top-right');
        const hudBottomLeft = document.querySelector('.hud-bottom-left');

        if (!hudTopRight || !hudBottomLeft) {
            return;
        }

        if (isTransitioning) {
            hudTopRight.textContent = 'CONNECTING...';
            hudBottomLeft.textContent = 'INITIALIZING...';
            hudTopRight.classList.add('is-transitioning');
            hudBottomLeft.classList.add('is-transitioning');
        } else {
            hudTopRight.textContent = hudTopRight.dataset.defaultText || 'ONLINE';
            hudBottomLeft.textContent = hudBottomLeft.dataset.defaultText || 'SYSTEM READY';
            hudTopRight.classList.remove('is-transitioning');
            hudBottomLeft.classList.remove('is-transitioning');
        }
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

    const prepareExitState = (selectedItem, label) => {
        document.body.classList.add(bodyTransitionClass);
        document.body.style.pointerEvents = 'none';
        updateHudState(true);

        const shell = document.querySelector('.menu-shell, .page-shell');
        if (shell) {
            shell.classList.add(shellExitClass);
        }

        const title = document.querySelector('.game-title, .page-heading__title');
        if (title) {
            title.classList.add('is-exiting');
        }

        document.querySelectorAll('.hud').forEach((hud) => hud.classList.add('is-transitioning'));

        if (selectedItem) {
            document.querySelectorAll('.menu-item').forEach((item) => {
                item.classList.add('is-fading');
                item.classList.remove('is-active');
            });

            selectedItem.classList.remove('is-fading');
            selectedItem.classList.add('is-active');

            const subtitle = selectedItem.querySelector('.menu-item__subtitle');
            if (subtitle) {
                subtitle.textContent = label;
                subtitle.classList.add('is-loading');
            }
        }
    };

    const beginTransition = (event, targetUrl, label) => {
        if (transitionActive) {
            event.preventDefault();
            return;
        }

        transitionActive = true;
        event.preventDefault();
        playClickSound();

        const selectedItem = event.target.closest('.menu-item');
        prepareExitState(selectedItem, label);

        const overlay = createOverlay(label);
        requestAnimationFrame(() => {
            overlay.classList.add('is-visible');
            const line = overlay.querySelector(`.${overlayLineClass}`);
            if (line) {
                requestAnimationFrame(() => {
                    line.style.transform = 'translateX(-50%) scaleX(1)';
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

    const animateIntoView = () => {
        const shell = document.querySelector('.menu-shell, .page-shell');
        if (shell) {
            shell.classList.add(pageEnterClass);
        }

        const title = document.querySelector('.game-title, .page-heading__title');
        if (title) {
            title.classList.add('is-entering');
        }

        const subtitles = document.querySelectorAll('.portfolio-label, .page-heading__subtitle, .back-link');
        subtitles.forEach((element, index) => {
            window.setTimeout(() => {
                element.classList.add('is-visible');
            }, index * 70);
        });

        const hudNodes = document.querySelectorAll('.hud');
        hudNodes.forEach((hud, index) => {
            window.setTimeout(() => {
                hud.classList.add('is-visible');
            }, 120 + index * 70);
        });

        const contentNodes = document.querySelectorAll('.project-card, .resume-card, .skill-item, .certificate-card, .profile-card, .contact-card, .action-btn');
        contentNodes.forEach((node, index) => {
            window.setTimeout(() => {
                node.classList.add('is-visible');
            }, 220 + index * 70);
        });

        requestAnimationFrame(() => {
            document.body.classList.add('has-entered');
        });
    };

    const initEntryAnimation = () => {
        document.querySelectorAll('.hud-top-right, .hud-bottom-left').forEach((hud) => {
            if (!hud.dataset.defaultText) {
                hud.dataset.defaultText = hud.textContent.trim();
            }
        });

        updateHudState(false);
        animateIntoView();
    };

    document.addEventListener('click', handleLinkClick);
    document.addEventListener('DOMContentLoaded', initEntryAnimation);
    window.addEventListener('pageshow', initEntryAnimation);
})();
