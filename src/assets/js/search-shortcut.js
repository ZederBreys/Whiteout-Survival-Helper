document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K' || e.key === '\u043A' || e.key === '\u041A')) {
    e.preventDefault();
    var btn = document.querySelector('.search-btn');
    if (btn) btn.click();
  }
});
