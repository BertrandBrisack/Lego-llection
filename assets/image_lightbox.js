// image_lightbox.js - Affiche une image en grand sur un fond assombri
(function () {
    function injectLightboxStyles() {
        if (document.getElementById('image-lightbox-styles')) return;

        const style = document.createElement('style');
        style.id = 'image-lightbox-styles';
        style.textContent = `
#imageLightboxOverlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.85);
    opacity: 0;
    visibility: hidden;
    transition: opacity .25s ease, visibility .25s ease;
    z-index: 2000;
    padding: 1rem;
}
#imageLightboxOverlay.visible {
    opacity: 1;
    visibility: visible;
}
.image-lightbox-backdrop {
    position: absolute;
    inset: 0;
    cursor: pointer;
}
.image-lightbox-content {
    position: relative;
    max-width: calc(100% - 2rem);
    max-height: calc(100% - 2rem);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
}
.image-lightbox-img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 0.75rem;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.35);
    background: #111;
}
.image-lightbox-close {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    width: 2.5rem;
    height: 2.5rem;
    border: none;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    font-size: 1.35rem;
    line-height: 1;
    cursor: pointer;
    z-index: 2;
}
.image-lightbox-close:hover {
    background: rgba(0, 0, 0, 0.85);
}
`;
        document.head.appendChild(style);
    }

    function createLightboxOverlay() {
        let overlay = document.getElementById('imageLightboxOverlay');
        if (overlay) return overlay;

        overlay = document.createElement('div');
        overlay.id = 'imageLightboxOverlay';
        overlay.innerHTML = `
            <div class="image-lightbox-backdrop" data-lightbox-close></div>
            <div class="image-lightbox-content">
                <button type="button" class="image-lightbox-close" aria-label="Fermer la vue agrandie">×</button>
                <img class="image-lightbox-img" alt="Aperçu de l'image">
            </div>
        `;

        overlay.addEventListener('click', function (event) {
            if (event.target === overlay || event.target.hasAttribute('data-lightbox-close') || event.target.classList.contains('image-lightbox-close')) {
                closeLightbox();
            }
        });

        document.body.appendChild(overlay);
        return overlay;
    }

    function openLightbox(src, alt) {
        if (!src) return;
        const overlay = createLightboxOverlay();
        const img = overlay.querySelector('.image-lightbox-img');
        img.src = src;
        img.alt = alt || 'Image agrandie';
        overlay.classList.add('visible');
    }

    function closeLightbox() {
        const overlay = document.getElementById('imageLightboxOverlay');
        if (!overlay) return;
        overlay.classList.remove('visible');
        const img = overlay.querySelector('.image-lightbox-img');
        if (img) {
            setTimeout(() => {
                img.src = '';
            }, 250);
        }
    }

    function initImageLightbox() {
        injectLightboxStyles();

        document.body.addEventListener('click', function (event) {
            const target = event.target.closest('img.set-image, img.recent-set-image, img.set-hero-image');
            if (!target) return;

            event.preventDefault();
            event.stopPropagation();
            openLightbox(target.src, target.alt || target.title || 'Image agrandie');
        });
    }

    document.addEventListener('DOMContentLoaded', initImageLightbox);

    window.initImageLightbox = initImageLightbox;
})();
