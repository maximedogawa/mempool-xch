import type { Translation } from "../../translate";
import type en from "../en/blocktime";

const messages: Translation<(typeof en)["messages"]> = {
  title: "Blockzeit",
  hint: "Chia erzeugt etwa alle 18,75 Sekunden einen Block, aber nur ungefähr jeder dritte enthält Transaktionen. Der Balken zählt bis zum erwarteten Abstand zwischen Transaktionsblöcken hoch.",
  sinceLast: "Seit dem letzten Transaktionsblock",
  expectedGap: "Erwarteter Abstand",
  progressLabel: "Fortschritt bis zum erwarteten nächsten Transaktionsblock",
  avgBlock: "Ø Block",
  seconds: "{seconds} s",
  txBlocks: "Tx-Blöcke",
  observedGap: "Beobachteter Abstand",
  netspace: "Netspace",
  pushedTitle: "Von Coinset übermittelt {age} · Schwierigkeit {difficulty}",
  fromState: "Aus get_blockchain_state",
  footer: {
    one: "Spitze {peak} · letzter Transaktionsblock {last} · Fenster von {count} Block",
    other: "Spitze {peak} · letzter Transaktionsblock {last} · Fenster von {count} Blöcken",
  },
  reorgRecent: {
    one: "Reorg {age} ({count} Block bei #{height})",
    other: "Reorg {age} ({count} Blöcke bei #{height})",
  },
  reorgLast: {
    one: "letzte Reorg {age} ({count} Block bei #{height})",
    other: "letzte Reorg {age} ({count} Blöcke bei #{height})",
  },
};

export default messages;
