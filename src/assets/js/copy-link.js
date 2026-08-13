(function () {
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        var ok = document.execCommand("copy");
        ok ? resolve() : reject(new Error("copy failed"));
      } catch (err) {
        reject(err);
      }
      document.body.removeChild(ta);
    });
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".copy-link-btn");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    var block = btn.closest(".image-card[id],.intro-block[id],.extra-block[id],.tip-block[id],.all-description[id]");
    if (!block) return;
    var url = window.location.origin + window.location.pathname + window.location.search + "#" + block.id;
    copyText(url).then(function () {
      btn.setAttribute("data-state", "copied");
      btn.setAttribute("aria-label", "Ссылка скопирована");
      clearTimeout(btn._copyTimer);
      btn._copyTimer = setTimeout(function () {
        btn.removeAttribute("data-state");
        btn.setAttribute("aria-label", "Скопировать ссылку на этот блок");
      }, 2000);
    }).catch(function () {});
  });
})();
