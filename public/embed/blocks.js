/* Block queue: the projected next blocks (from mempool cost) and the last confirmed blocks. */
(function () {
  var E = window.Embed;
  var BLOCK_MAX = 11e9;
  function render(state, records) {
    var container = E.el("blocks");
    container.innerHTML = "";
    var mempoolCost = state.mempool_cost || 0;
    var queued = Math.max(1, Math.ceil(mempoolCost / BLOCK_MAX));
    var projected = Math.min(2, queued);
    for (var i = projected - 1; i >= 0; i -= 1) {
      var remaining = mempoolCost - i * BLOCK_MAX;
      var fill = Math.max(0, Math.min(1, remaining / BLOCK_MAX));
      var d = document.createElement("div");
      d.className = "block projected";
      var eta = Math.round(((i + 1) * (state.average_block_time || 18.75)) / 0.36);
      d.innerHTML =
        '<div class="h">next' +
        (i > 0 ? " +" + i : "") +
        '</div><div class="s tabular">' +
        E.pct(fill) +
        " full</div>" +
        '<div class="s">in ~' +
        (eta >= 60 ? Math.round(eta / 60) + " min" : eta + " s") +
        "</div>";
      container.appendChild(d);
    }
    var tx = records
      .filter(function (r) {
        return r.timestamp;
      })
      .sort(function (a, b) {
        return b.height - a.height;
      })
      .slice(0, 3);
    tx.forEach(function (r) {
      var d = document.createElement("div");
      d.className = "block";
      d.innerHTML =
        '<div class="h tabular">#' +
        r.height.toLocaleString("en-US") +
        '</div><div class="s tabular">' +
        E.xch(r.fees || 0) +
        ' fees</div><div class="s">' +
        E.age(r.timestamp * 1000) +
        "</div>";
      container.appendChild(d);
    });
    E.el("foot").textContent =
      "Peak #" +
      state.peak.height.toLocaleString("en-US") +
      " · " +
      (state.mempool_size || 0) +
      " bundles waiting · " +
      E.cost(mempoolCost) +
      " cost";
  }
  function load() {
    E.rpc("get_blockchain_state")
      .then(function (r) {
        var s = r.blockchain_state;
        return E.rpc("get_block_records", {
          start: Math.max(0, s.peak.height - 24),
          end: s.peak.height + 1,
        }).then(function (b) {
          render(s, b.block_records || []);
        });
      })
      .catch(function (e) {
        E.fail("Could not reach Coinset (" + e.message + ").");
      });
  }
  load();
  setInterval(load, 20000);
})();
