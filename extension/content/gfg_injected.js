// Runs in page context. Hooks fetch + XHR and posts a window message on Accepted.

(function () {
  function looksAcceptedJson(data) {
    try {
      if (!data) return false;
      const msg = (data.message || data.msg || data.status_msg || data.verdict || data.result || "").toString();

      if (/correct answer/i.test(msg)) return true;
      if (/all test cases passed/i.test(msg)) return true;
      if (/accepted/i.test(msg)) return true;

      if (data.isCorrect === true) return true;
      if (data.status && String(data.status).toLowerCase() === "success") return true;
      if (String(data.verdict || "").toUpperCase() === "AC") return true;
      if (String(data.result || "").toUpperCase() === "SUCCESS") return true;

      if (Array.isArray(data.results)) {
        if (
          data.results.some((r) =>
            /accepted|correct answer|all test cases passed/i.test(String(r?.message || r?.verdict || ""))
          )
        ) return true;
      }
    } catch {}
    return false;
  }

  function looksAcceptedText(text) {
    try { return /Correct Answer|All test cases passed|Accepted/i.test(text || ""); } catch { return false; }
  }

  function isGfgJudgeUrl(u) {
    try {
      const url = String(u);
      if (!/geeksforgeeks\.org|practice\.geeksforgeeks\.org/i.test(url)) return false;
      return /(submit|submission|evaluate|check|run|compile)/i.test(url);
    } catch { return false; }
  }

  // fetch hook
  const _fetch = window.fetch;
  window.fetch = function () {
    try {
      const args = arguments;
      const url = args[0];
      if (isGfgJudgeUrl(url)) {
        return _fetch.apply(this, args).then((res) => {
          try {
            const clone = res.clone();
            const ct = clone.headers.get("content-type") || "";
            if (/json/i.test(ct)) {
              clone.json().then((data) => {
                if (looksAcceptedJson(data)) window.postMessage({ type: "GFG_ACCEPTED" }, "*");
              }).catch(() => {});
            } else {
              clone.text().then((text) => {
                if (looksAcceptedText(text)) window.postMessage({ type: "GFG_ACCEPTED" }, "*");
              }).catch(() => {});
            }
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
        if (this._url && isGfgJudgeUrl(this._url)) {
          const ct = this.getResponseHeader("content-type") || "";
          if (/json/i.test(ct)) {
            try {
              const data = JSON.parse(this.responseText);
              if (looksAcceptedJson(data)) window.postMessage({ type: "GFG_ACCEPTED" }, "*");
            } catch {}
          } else {
            const text = this.responseText;
            if (looksAcceptedText(text)) window.postMessage({ type: "GFG_ACCEPTED" }, "*");
          }
        }
      } catch {}
    });
    return _send.apply(this, arguments);
  };
})();
