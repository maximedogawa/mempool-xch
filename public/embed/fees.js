/* Fee cards: the node's own get_fee_estimate for a reference transfer, per target time. */
(function () {
  var E = window.Embed;
  var COST = 6000000;
  var TARGETS = [60, 300, 600];
  function rate(mojos) {
    var r = mojos / COST;
    return (r < 0.001 && r > 0 ? "<0.001" : r.toFixed(r >= 10 ? 0 : 3)) + " mojo/cost";
  }
  function load() {
    E.rpc("get_fee_estimate", { cost: COST, target_times: TARGETS })
      .then(function (r) {
        TARGETS.forEach(function (t, i) {
          var m = Number(r.estimates[i] || 0);
          E.el("f" + t).textContent = rate(m);
          E.el("s" + t).textContent = m > 0 ? E.xch(m) : "no fee needed";
        });
        E.el("foot").textContent =
          "Mempool " +
          E.cost(r.mempool_size || 0) +
          " of " +
          E.cost(r.mempool_max_size || 0) +
          " cost · last block paid " +
          E.xch(r.fees_last_block || 0) +
          " · refreshes every 45 s";
      })
      .catch(function (e) {
        E.fail("Could not reach Coinset (" + e.message + ").");
      });
  }
  load();
  setInterval(load, 45000);
})();
