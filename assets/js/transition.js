(function () {
    const TRANSITION_DURATION = 150;
    const bodyTransitionClass = 'is-transitioning';
    const cursorClass = 'terminal-cursor';
    const contentClass = 'is-visible';
    let transitionActive = false;
    let cursorElement = null;
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

    const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

    const getCursor = () => {
        if (!cursorElement) {
            cursorElement = document.createElement('span');
            cursorElement.className = cursorClass;
            cursorElement.setAttribute('aria-hidden', 'true');
            cursorElement.textContent = '_';
            document.body.appendChild(cursorElement);
        }
        return cursorElement;
    };

    const showCursor = (target) => {
        const cursor = getCursor();
        if (target) {
            positionCursor(target);
        }
        cursor.classList.add('is-visible');
    };

    const hideCursor = () => {
        const cursor = getCursor();
        cursor.classList.remove('is-visible');
    };

    const positionCursor = (target) => {
        const cursor = getCursor();
        if (!target) {
            return;
        }

        const rect = target.getBoundingClientRect();
        cursor.style.left = `${window.scrollX + rect.right + 6}px`;
        cursor.style.top = `${window.scrollY + rect.top + rect.height / 2 - 10}px`;
    };

    const setTextContent = (element, value) => {
        if (!element) {
            return;
        }

        element.textContent = value;
    };

    const saveOriginalText = (element) => {
        if (!element || element.dataset.transitionOriginal) {
            return element?.dataset.transitionOriginal || '';
        }

        const value = element.textContent.trim();
        element.dataset.transitionOriginal = value;
        return value;
    };

    function typeText(element, targetText, speed = 28) {
        if (!element) {
            return Promise.resolve();
        }

        const value = targetText || saveOriginalText(element) || '';
        setTextContent(element, '');
        showCursor(element);

        return new Promise((resolve) => {
            let index = 0;

            const step = () => {
                if (index <= value.length) {
                    setTextContent(element, value.slice(0, index));
                    positionCursor(element);
                    index += 1;
                    window.setTimeout(step, speed);
                    return;
                }

                resolve();
            };

            step();
        });
    }

    function backspaceText(element, speed = 24) {
        if (!element) {
            return Promise.resolve();
        }

        const value = saveOriginalText(element) || '';
        let currentLength = element.textContent.length || value.length;
        showCursor(element);

        return new Promise((resolve) => {
            const step = () => {
                if (currentLength > 0) {
                    const nextValue = value.slice(0, currentLength - 1);
                    setTextContent(element, nextValue);
                    currentLength -= 1;
                    positionCursor(element);
                    window.setTimeout(step, speed);
                    return;
                }

                setTextContent(element, '');
                positionCursor(element);
                resolve();
            };

            step();
        });
    }

    const getEraseTargets = (selectedItem) => {
        const targets = [];

        if (selectedItem) {
            const selectedSubtitle = selectedItem.querySelector('.menu-item__subtitle');
            const selectedTitle = selectedItem.querySelector('.menu-item__title');
            if (selectedSubtitle) {
                targets.push(selectedSubtitle);
            }
            if (selectedTitle) {
                targets.push(selectedTitle);
            }
        }

        document.querySelectorAll('.menu-item').forEach((item) => {
            if (selectedItem && item === selectedItem) {
                return;
            }

            const title = item.querySelector('.menu-item__title');
            const subtitle = item.querySelector('.menu-item__subtitle');
            if (title) {
                targets.push(title);
            }
            if (subtitle) {
                targets.push(subtitle);
            }
        });

        document.querySelectorAll('.hud').forEach((hud) => {
            if (hud.textContent.trim()) {
                targets.push(hud);
            }
        });

        document.querySelectorAll('.back-link, .portfolio-label, .page-heading__subtitle').forEach((element) => {
            if (element.textContent.trim()) {
                targets.push(element);
            }
        });

        const mainTitle = document.querySelector('.game-title, .page-heading__title');
        if (mainTitle && mainTitle.textContent.trim()) {
            targets.push(mainTitle);
        }

        return targets;
    };

    const getEntryTargets = () => {
        const targets = [];
        const mainTitle = document.querySelector('.game-title, .page-heading__title');
        if (mainTitle) {
            targets.push(mainTitle);
        }

        document.querySelectorAll('.portfolio-label, .page-heading__subtitle, .back-link, .hud').forEach((element) => {
            if (element.textContent.trim()) {
                targets.push(element);
            }
        });

        document.querySelectorAll('.menu-item__title, .menu-item__subtitle').forEach((element) => {
            if (element.textContent.trim()) {
                targets.push(element);
            }
        });

        return targets;
    };

    async function erasePage(selectedItem) {
        if (transitionActive) {
            return;
        }

        transitionActive = true;
        document.body.classList.add(bodyTransitionClass);
        document.body.style.pointerEvents = 'none';
        document.body.classList.add('is-terminal-transition');
        document.documentElement.classList.add('is-terminal-transition');

        document.querySelectorAll('.menu-item').forEach((item) => item.classList.remove('is-active'));
        if (selectedItem) {
            selectedItem.classList.add('is-active');
        }

        document.querySelectorAll('a, button, input, select, textarea, .project-card, .resume-card, .skill-item, .certificate-card, .profile-card, .contact-card').forEach((element) => {
            element.classList.add('is-disabled');
        });

        const targets = getEraseTargets(selectedItem);
        showCursor(targets[0]);

        for (const target of targets) {
            await backspaceText(target, 24);
            await wait(12);
        }

        hideCursor();
        await wait(150);

        return true;
    }

    async function typePage() {
        document.body.classList.add('is-terminal-transition');
        document.documentElement.classList.add('is-terminal-transition');

        const targets = getEntryTargets();
        const cardNodes = document.querySelectorAll('.project-card, .resume-card, .skill-item, .certificate-card, .profile-card, .contact-card, .action-btn');

        targets.forEach((element) => {
            saveOriginalText(element);
            setTextContent(element, '');
        });

        for (const target of targets) {
            await typeText(target, target.dataset.transitionOriginal || '', 26);
            await wait(22);
        }

        cardNodes.forEach((node, index) => {
            window.setTimeout(() => {
                node.classList.add(contentClass);
            }, 80 + index * 70);
        });

        await wait(120 + cardNodes.length * 70);
    }

    const beginTransition = async (event, link, targetUrl, target) => {
        if (transitionActive) {
            event.preventDefault();
            return;
        }

        event.preventDefault();
        playClickSound();

        const selectedItem = link.closest('.menu-item');
        const started = await erasePage(selectedItem);
        if (!started) {
            return;
        }

        if (target === '_blank') {
            window.open(targetUrl, '_blank', 'noopener,noreferrer');
        } else {
            window.location.assign(targetUrl);
        }
    };

    const handleLinkClick = (event) => {
        const targetElement = event.target;
        const link = targetElement && typeof targetElement.closest === 'function'
            ? targetElement.closest('a')
            : null;

        if (!link) {
            return;
        }

        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
            return;
        }

        const absoluteHref = new URL(href, window.location.href);
        const shouldOpenInNewTab = link.getAttribute('target') === '_blank';
        beginTransition(event, link, absoluteHref.href, shouldOpenInNewTab ? '_blank' : 'self');
    };

    const initEntryAnimation = () => {
        document.body.classList.add('is-terminal-transition');
        document.documentElement.classList.add('is-terminal-transition');
        document.querySelectorAll('.hud-top-right, .hud-bottom-left').forEach((hud) => {
            if (!hud.dataset.defaultText) {
                hud.dataset.defaultText = hud.textContent.trim();
            }
        });
        typePage();
    };

    document.addEventListener('click', handleLinkClick);
    document.addEventListener('DOMContentLoaded', initEntryAnimation);
    window.addEventListener('pageshow', initEntryAnimation);
})();
