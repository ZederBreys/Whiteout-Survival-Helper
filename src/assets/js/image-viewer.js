import PhotoSwipeLightbox from './photoswipe/photoswipe-lightbox.esm.js';

var galleryImages = [];
var imgIndexMap = new WeakMap();
var lightbox = null;

function buildGallery() {
  galleryImages = [];
  var imgs = document.querySelectorAll('.image-card img, .gallery img, .cover-image img');
  for (var i = 0; i < imgs.length; i++) {
    imgIndexMap.set(imgs[i], i);
    galleryImages.push({
      src: imgs[i].currentSrc || imgs[i].src,
      width: imgs[i].naturalWidth || parseInt(imgs[i].getAttribute('width'), 10) || 800,
      height: imgs[i].naturalHeight || parseInt(imgs[i].getAttribute('height'), 10) || 600,
      alt: imgs[i].alt || '',
      element: imgs[i]
    });
  }
}

function initLightbox() {
  buildGallery();

  lightbox = new PhotoSwipeLightbox({
    dataSource: galleryImages,
    pswpModule: function () {
      return import('./photoswipe/photoswipe.esm.js');
    },
    bgOpacity: 0.9,
    showHideAnimationType: 'fade',
    showAnimationDuration: 180,
    hideAnimationDuration: 180,
    zoom: true,
    loop: false,
    allowPanToNext: true,
    arrowKeys: true,
    escKey: true,
    closeOnVerticalDrag: true,
    wheelToZoom: true,
    pinchToClose: true,
    clickToCloseNonZoomable: true,
    closeOnOutsideClick: true,
    preload: [1, 1],
    errorMsg: '\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435',
    mainClass: 'pswp--wos'
  });

  lightbox.addFilter('thumbEl', function (thumbEl, slideData, index) {
    var data = galleryImages[index];
    if (data && data.element) {
      return data.element;
    }
    return thumbEl;
  });

  lightbox.addFilter('placeholderSrc', function (placeholderSrc, slideData) {
    var data = galleryImages[slideData.index];
    if (data && data.element) {
      return data.element.currentSrc || data.element.src;
    }
    return placeholderSrc;
  });

  lightbox.on('close', function () {
    lightbox.pswp.options.showHideAnimationType = 'fade';
  });

  lightbox.init();
}

function init() {
  if (!document.querySelector('.image-card img, .gallery img, .cover-image img')) {
    return;
  }

  initLightbox();

  var main = document.querySelector('main');
  if (!main) return;

  main.addEventListener('click', function (e) {
    var img = e.target.closest('img');
    if (!img) return;
    var card = img.closest('.image-card, .gallery, .cover-image');
    if (!card) return;
    if (img.closest('a')) return;

    e.preventDefault();

    var index = imgIndexMap.get(img);
    if (index !== undefined && lightbox) {
      lightbox.loadAndOpen(index);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
