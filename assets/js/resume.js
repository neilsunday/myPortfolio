document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.resume-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${0.08 * index}s`;
        card.classList.add('is-visible');
    });
});
