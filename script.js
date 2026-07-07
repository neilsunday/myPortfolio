const hoverSound = new Audio('assets/sounds/hover.mp3');
const clickSound = new Audio('assets/sounds/click.mp3');
const cursorGlow = document.querySelector('.cursor-glow');
const clock = document.getElementById('clock');
const buttons = document.querySelectorAll('.menu-btn');

const updateClock = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    clock.textContent = timeString;
};

const playSound = (sound) => {
    sound.currentTime = 0;
    sound.play().catch(() => {
    });
};

buttons.forEach((button) => {
    button.addEventListener('mouseenter', () => {
        document.body.classList.add('button-hover');
        playSound(hoverSound);
    });

    button.addEventListener('mouseleave', () => {
        document.body.classList.remove('button-hover');
    });

    button.addEventListener('click', () => {
        playSound(clickSound);
        buttons.forEach((item) => item.classList.remove('is-active'));
        button.classList.add('is-active');
    });
});

window.addEventListener('mousemove', (event) => {
    cursorGlow.style.left = `${event.clientX}px`;
    cursorGlow.style.top = `${event.clientY}px`;
});

window.addEventListener('mouseleave', () => {
    cursorGlow.style.opacity = '0';
});

window.addEventListener('mouseenter', () => {
    cursorGlow.style.opacity = '0.9';
});

updateClock();
setInterval(updateClock, 1000);