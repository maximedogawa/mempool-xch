/* Mempool occupancy from get_blockchain_state: bundles, cost used of the node's capacity, fees. */
(function () {
  var E = window.Embed;
  function load() {
    E.rpc("get_blockchain_state")
      .then(function (r) {
        var s = r.blockchain_state;
        var ratio = s.mempool_max_total_cost
          ? Math.min(1, s.mempool_cost / s.mempool_max_total_cost)
          : 0;
        E.el("count").textContent = (s.mempool_size || 0).toLocaleString("en-US");
        E.el("fill").textContent = E.pct(ratio);
        E.el("cost").textContent =
          E.cost(s.mempool_cost || 0) + " of " + E.cost(s.mempool_max_total_cost || 0);
        E.el("fees").textContent = E.xch(s.mempool_fees || 0);
        var minFee = s.mempool_min_fees && s.mempool_min_fees.cost_5000000;
        E.el("min").textContent = minFee
          ? "min " + minFee + " mojo/cost to enter"
          : "no minimum fee";
        var bar = E.el("bar");
        bar.style.width = Math.max(ratio > 0 ? 2 : 0, ratio * 100) + "%";
        bar.className = "fill " + (ratio > 0.9 ? "hot" : ratio > 0.6 ? "warm" : "");
        E.el("meter").setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
        E.el("foot").textContent =
          "Peak #" +
          s.peak.height.toLocaleString("en-US") +
          " · " +
          (s.sync && s.sync.synced ? "synced" : "syncing") +
          " · refreshes every 15 s";
      })
      .catch(function (e) {
        E.fail("Could not reach Coinset (" + e.message + ").");
      });
  }
  load();
  setInterval(load, 15000);
})();
