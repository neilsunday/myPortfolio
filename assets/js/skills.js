document.addEventListener('DOMContentLoaded', () => {
    const items = document.querySelectorAll('.skill-item');
    const fills = document.querySelectorAll('.skill-bar__fill');

    items.forEach((item, index) => {
        item.style.animationDelay = `${0.08 * index}s`;
        item.classList.add('is-visible');
    });

    requestAnimationFrame(() => {
        fills.forEach((fill) => {
            const value = fill.dataset.value || '0';
            fill.style.width = `${value}%`;
        });
    });
});
