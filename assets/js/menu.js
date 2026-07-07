const hoverSound = new Audio('assets/sounds/hover.mp3');
const clickSound = new Audio('assets/sounds/click.mp3');
const interactiveElements = document.querySelectorAll('.menu-item, .back-link, .action-btn, .project-card, .resume-card, .skill-item, .certificate-card, .profile-card, .contact-card');
const cursorGlow = document.querySelector('.cursor-glow');
const clock = document.getElementById('clock');

const playSound = (sound) => {
    sound.currentTime = 0;
    sound.play().catch(() => {
        // Ignore autoplay restrictions.
    });
};

const updateClock = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    if (clock) {
        clock.textContent = timeString;
    }
};

interactiveElements.forEach((item) => {
    item.addEventListener('mouseenter', () => {
        document.body.classList.add('menu-hover');
        playSound(hoverSound);
    });

    item.addEventListener('mouseleave', () => {
        document.body.classList.remove('menu-hover');
    });

    item.addEventListener('click', () => {
        playSound(clickSound);
        if (item.classList.contains('menu-item')) {
            document.querySelectorAll('.menu-item').forEach((entry) => entry.classList.remove('is-active'));
            item.classList.add('is-active');
        }
    });
});

window.addEventListener('mousemove', (event) => {
    if (!cursorGlow) {
        return;
    }

    cursorGlow.style.left = `${event.clientX}px`;
    cursorGlow.style.top = `${event.clientY}px`;
    cursorGlow.style.opacity = '0.95';
});

window.addEventListener('mouseleave', () => {
    if (cursorGlow) {
        cursorGlow.style.opacity = '0';
    }
});

window.addEventListener('mouseenter', () => {
    if (cursorGlow) {
        cursorGlow.style.opacity = '0.95';
    }
});

updateClock();
setInterval(updateClock, 1000);
