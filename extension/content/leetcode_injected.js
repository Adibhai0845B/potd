(function () {
  function accepted(data) {
    try {
      if (!data) return false;
      if (data.status_msg === "Accepted") return true;
      if (data.state === "SUCCESS" && Number(data.status) === 10) return true;
    } catch {}
    return false;
  }
  const _fetch = window.fetch;
  window.fetch = function () {
    try {
      const args = arguments;
      const url = args[0];
      if (typeof url === "string" && /\/submissions\/detail\/\d+\/check\//.test(url)) {
        return _fetch.apply(this, args).then((res) => {
          try {
            res.clone().json().then((data) => {
              if (accepted(data)) window.postMessage({ type: "LC_ACCEPTED" }, "*");
            }).catch(() => {});
          } catch {}
          return res;
        });
      }
    } catch {}
    return _fetch.apply(this, arguments);
  };

  // XHR hook
  const _open = XMLHttpRequest.prototype.open;
  const _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    try { this._url = url; } catch {}
    return _open.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    this.addEventListener("load", function () {
      try {
        if (this._url && /\/submissions\/detail\/\d+\/check\//.test(String(this._url))) {
          try {
            const data = JSON.parse(this.responseText);
            if (accepted(data)) window.postMessage({ type: "LC_ACCEPTED" }, "*");
          } catch {}
        }
      } catch {}
    });
    return _send.apply(this, arguments);
  };
})();
