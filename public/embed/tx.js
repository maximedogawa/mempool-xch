/* Transaction status: pending (in the mempool), confirmed or removed (Coinset index), unknown. */
(function () {
  var E = window.Embed;
  var id = (E.params.get("id") || "").trim().toLowerCase().replace(/^0x/, "");
  var pill = E.el("pill");
  var link = E.el("link");
  if (!/^[0-9a-f]{64}$/.test(id)) {
    pill.textContent = "No transaction id";
    E.fail("Pass ?id=<64 hex characters>.");
    return;
  }
  link.textContent = id.slice(0, 10) + "…" + id.slice(-6);
  link.href = E.site + "/tx/" + id;
  function set(status, text, detail) {
    pill.className = "pill " + status;
    pill.textContent = text;
    E.el("detail").textContent = detail || "";
  }
  function load() {
    Promise.all([
      E.rpc("get_mempool_item_by_tx_id", { tx_id: "0x" + id }).catch(function () {
        return null;
      }),
      E.rpc("get_transaction", { tx_id: id }).catch(function () {
        return null;
      }),
    ]).then(function (res) {
      var item = res[0] && res[0].mempool_item;
      var tx = res[1] && res[1].transaction;
      if (tx && tx.status === "confirmed")
        return set(
          "confirmed",
          "Confirmed",
          "in block #" +
            Number(tx.confirmed_height).toLocaleString("en-US") +
            (tx.confirmed_at_ms ? " · " + E.age(tx.confirmed_at_ms) : "")
        );
      if (item)
        return set(
          "pending",
          "Pending",
          "in the mempool · " + E.cost(item.cost) + " cost · fee " + E.xch(item.fee)
        );
      if (tx && tx.status === "removed")
        return set("removed", "Removed", "left the mempool without confirming");
      if (tx) return set("pending", "Pending", "seen by Coinset");
      set("unknown", "Not found", "no pending or confirmed transaction with this id");
    });
  }
  load();
  setInterval(load, 15000);
})();
