/* Shared helpers of the embeds: theme, endpoint, tiny RPC client and formatters. No framework. */
(function () {
  var params = new URLSearchParams(location.search);
  var theme = params.get("theme") === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", theme);
  var network = params.get("network") === "testnet11" ? "testnet11" : "mainnet";
  var base =
    network === "testnet11" ? "https://testnet11.api.coinset.org" : "https://api.coinset.org";
  var site = location.origin;

  function rpc(method, body) {
    return fetch(base + "/" + method, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body || {}),
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }
  function xch(mojos) {
    var n = Number(mojos) / 1e12;
    if (n === 0) return "0 XCH";
    if (n < 0.0001) return Number(mojos).toLocaleString("en-US") + " mojo";
    return n.toLocaleString("en-US", { maximumFractionDigits: n < 1 ? 6 : 3 }) + " XCH";
  }
  function cost(c) {
    if (c >= 1e9) return (c / 1e9).toFixed(2) + "B";
    if (c >= 1e6) return (c / 1e6).toFixed(1) + "M";
    if (c >= 1e3) return (c / 1e3).toFixed(0) + "K";
    return String(c);
  }
  function pct(r) {
    return Math.round(r * 100) + "%";
  }
  function age(ms) {
    var s = Math.max(0, Math.round((Date.now() - ms) / 1000));
    if (s < 60) return s + "s ago";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    return Math.floor(s / 86400) + "d ago";
  }
  function el(id) {
    return document.getElementById(id);
  }
  function fail(message) {
    var e = el("error");
    if (e) e.textContent = message;
  }
  var brand = document.querySelector(".brand");
  if (brand)
    brand.href = site + (params.get("network") === "testnet11" ? "/?network=testnet11" : "/");

  window.Embed = {
    params: params,
    theme: theme,
    network: network,
    base: base,
    site: site,
    rpc: rpc,
    xch: xch,
    cost: cost,
    pct: pct,
    age: age,
    el: el,
    fail: fail,
  };
})();
