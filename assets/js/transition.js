(function () {
    const TRANSITION_DURATION = 640;
    const HOLD_ACTIVE_DURATION = 100;
    const SHATTER_STAGGER = 24;
    const SHATTER_PAUSE = 150;
    const bodyTransitionClass = 'is-transitioning';
    const contentClass = 'is-visible';
    const typingSpeed = 34;
    const typingPause = 360;
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

    const wait = (duration) => new Promise((resolve) => {
        const startedAt = performance.now();
        const tick = (now) => {
            if (now - startedAt >= duration) {
                resolve();
                return;
            }
            window.requestAnimationFrame(tick);
        };
        window.requestAnimationFrame(tick);
    });

    const setTextContent = (element, value) => {
        if (!element) {
            return;
        }

        element.textContent = value;
        element.classList.add('terminal-animated-text');
    };

    const saveOriginalText = (element) => {
        if (!element || element.dataset.transitionOriginal) {
            return element?.dataset.transitionOriginal || '';
        }

        const value = element.textContent.trim();
        element.dataset.transitionOriginal = value;
        return value;
    };

    const applyTextReveal = (element, phase) => {
        if (!element) {
            return;
        }

        element.classList.remove('is-typing', 'is-erasing');
        if (phase === 'typing') {
            element.classList.add('is-typing');
            element.style.opacity = '0.96';
            window.requestAnimationFrame(() => {
                if (element.isConnected) {
                    element.style.opacity = '1';
                }
            });
            return;
        }

        if (phase === 'erasing') {
            element.classList.add('is-erasing');
            element.style.opacity = '0.9';
            window.requestAnimationFrame(() => {
                if (element.isConnected) {
                    element.style.opacity = '0.82';
                }
            });
        }
    };

    const finishTextReveal = (element) => {
        if (!element) {
            return;
        }

        element.classList.remove('is-typing', 'is-erasing');
        element.style.opacity = '';
    };

    function typeText(element, targetText, speed = typingSpeed) {
        if (!element) {
            return Promise.resolve();
        }

        const value = targetText || saveOriginalText(element) || '';
        element.classList.add('terminal-animated-text');
        setTextContent(element, '');

        return new Promise((resolve) => {
            let index = 0;
            let nextFrameAt = performance.now();

            const step = (now) => {
                if (now < nextFrameAt) {
                    window.requestAnimationFrame(step);
                    return;
                }

                if (index < value.length) {
                    setTextContent(element, value.slice(0, index + 1));
                    applyTextReveal(element, 'typing');
                    index += 1;
                    nextFrameAt = now + speed;
                    window.requestAnimationFrame(step);
                    return;
                }

                finishTextReveal(element);
                resolve();
            };

            window.requestAnimationFrame(step);
        });
    }

    const getShatterTargets = (selectedItem) => {
        const targets = [];
        const pushText = (element) => {
            if (!element || !element.isConnected) {
                return;
            }

            const text = (element.textContent || '').trim();
            if (text) {
                targets.push(element);
            }
        };

        if (selectedItem) {
            pushText(selectedItem.querySelector('.menu-item__title'));
            pushText(selectedItem.querySelector('.menu-item__subtitle'));
        }

        document.querySelectorAll('.menu-item').forEach((item) => {
            if (selectedItem && item === selectedItem) {
                return;
            }

            pushText(item.querySelector('.menu-item__title'));
            pushText(item.querySelector('.menu-item__subtitle'));
        });

        document.querySelectorAll('.hud').forEach((hud) => pushText(hud));
        document.querySelectorAll('.back-link, .portfolio-label, .page-heading__subtitle').forEach((element) => pushText(element));

        const mainTitle = document.querySelector('.game-title, .page-heading__title');
        pushText(mainTitle);

        return targets.filter((element, index, array) => array.indexOf(element) === index);
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

    const ensureShatterLayer = () => {
        let layer = document.querySelector('.transition-shatter-layer');
        if (!layer) {
            layer = document.createElement('div');
            layer.className = 'transition-shatter-layer';
            layer.setAttribute('aria-hidden', 'true');
            document.body.appendChild(layer);
        }
        return layer;
    };

    const createShatterFragments = (element, layer) => {
        const rect = element.getBoundingClientRect();
        const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text || (!rect.width && !rect.height)) {
            return [];
        }

        const style = window.getComputedStyle(element);
        const fragments = [];
        const chars = Array.from(text);
        let cursorX = 0;

        chars.forEach((char) => {
            if (char === ' ') {
                cursorX += 8;
                return;
            }

            const fragment = document.createElement('span');
            fragment.className = 'transition-shatter-fragment';
            fragment.textContent = char;
            fragment.style.position = 'absolute';
            fragment.style.left = '0px';
            fragment.style.top = '0px';
            fragment.style.color = style.color;
            fragment.style.font = style.font;
            fragment.style.fontFamily = style.fontFamily;
            fragment.style.fontSize = style.fontSize;
            fragment.style.fontWeight = style.fontWeight;
            fragment.style.fontStyle = style.fontStyle;
            fragment.style.letterSpacing = style.letterSpacing;
            fragment.style.textTransform = style.textTransform;
            fragment.style.lineHeight = style.lineHeight;
            layer.appendChild(fragment);

            const width = fragment.getBoundingClientRect().width || 8;
            fragment.style.left = `${rect.left + cursorX}px`;
            fragment.style.top = `${rect.top}px`;
            cursorX += width + 2;

            fragments.push(fragment);
        });

        return fragments;
    };

    const hideTransitionTarget = (element) => {
        if (!element) {
            return;
        }

        element.style.visibility = 'hidden';
        element.style.opacity = '0';
    };

    async function shatterPage(selectedItem) {
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

        const layer = ensureShatterLayer();
        const targets = getShatterTargets(selectedItem);
        targets.forEach(hideTransitionTarget);

        const groups = [
            targets.filter((element) => element.classList.contains('game-title') || element.classList.contains('page-heading__title')),
            targets.filter((element) => element.classList.contains('menu-item__subtitle') || element.classList.contains('portfolio-label') || element.classList.contains('page-heading__subtitle')),
            targets.filter((element) => element.classList.contains('menu-item__title')),
            targets.filter((element) => element.classList.contains('hud')),
            targets.filter((element) => element.classList.contains('back-link'))
        ];

        const fragmentsByGroup = groups.map((group) => group.flatMap((target) => createShatterFragments(target, layer)));
        const fragmentGroups = fragmentsByGroup.filter((group) => group.length > 0);

        fragmentGroups.forEach((group, index) => {
            window.setTimeout(() => {
                group.forEach((fragment) => {
                    const x = (Math.random() * 120 - 60);
                    const y = (Math.random() * 120 - 60);
                    const rotation = (Math.random() * 50 - 25);
                    fragment.style.setProperty('--dx', `${x}px`);
                    fragment.style.setProperty('--dy', `${y}px`);
                    fragment.style.setProperty('--rotation', `${rotation}deg`);
                    fragment.classList.add('is-shattering');
                });
            }, index * SHATTER_STAGGER);
        });

        await wait(TRANSITION_DURATION + SHATTER_PAUSE + (fragmentGroups.length - 1) * SHATTER_STAGGER);
        layer.remove();
        return true;
    }

    async function typePage() {
        document.body.classList.add('is-terminal-transition');
        document.documentElement.classList.add('is-terminal-transition');

        const targets = getEntryTargets();
        const menuTargets = targets.filter((element) => element.closest('.menu-item'));
        const otherTargets = targets.filter((element) => !element.closest('.menu-item'));
        const cardNodes = document.querySelectorAll('.project-card, .resume-card, .skill-item, .certificate-card, .profile-card, .contact-card, .action-btn');

        targets.forEach((element) => {
            saveOriginalText(element);
            setTextContent(element, '');
        });

        if (menuTargets.length) {
            await Promise.all(menuTargets.map((target, index) => (async () => {
                await wait(index * 50);
                await typeText(target, target.dataset.transitionOriginal || '', typingSpeed);
            })()));
        }

        for (const target of otherTargets) {
            await typeText(target, target.dataset.transitionOriginal || '', typingSpeed);
            await wait(typingPause);
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
        const started = await shatterPage(selectedItem);
        if (!started) {
            return;
        }

        await wait(HOLD_ACTIVE_DURATION);

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
