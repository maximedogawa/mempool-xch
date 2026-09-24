import type { Translation } from "../../translate";
import type en from "../en/prefarm";

const messages: Translation<(typeof en)["messages"]> = {
  title: "Prefarm-Tracker",
  tooltip:
    "Chia Network hat vor dem ersten Block 21 Millionen XCH erzeugt. Sie liegen in vier Verwahrungs-Vaults (kalt und warm, in den USA und der Schweiz) mit veröffentlichten Prüfregeln. Diese Seite liest die Coins der Vaults direkt aus der Chain; sie schätzt nichts.",
  mainnetOnly:
    "Die Prefarm-Vaults gibt es nur im Mainnet; wechseln Sie das Netzwerk, um sie zu sehen.",
  tracked: "On-Chain erfasst",
  trackedSub: "{percent} der Prefarm von {total} XCH",
  trackedHint:
    "Summe der Singleton-Coins der vier Vaults und der nicht ausgegebenen Coins an ihren bekannten Puzzle-Hashes.",
  cold: "Kalte Vaults",
  coldSub: "Verwahrung mit 90 Tagen Clawback",
  warm: "Warme Vaults",
  warmSub: "Verwahrung mit 24 Stunden Clawback",
  elsewhere: "Nicht an diesen Adressen",
  elsewhereSub: "ausgegeben, verkauft oder an Adressen bewegt, die diese Seite nicht kennt",
  elsewhereHint:
    "Die Prefarm hat seit 2021 Käufe, Market Making und Förderungen finanziert, und ein Rekey ändert den Puzzle-Hash eines Vaults. Was nicht an den bekannten Adressen liegt, wird hier ausgewiesen, nicht geschätzt.",
  tier: {
    cold: "kalt",
    warm: "warm",
  },
  readError: "Die Coins dieses Vaults konnten gerade nicht gelesen werden.",
  coins: { one: "{count} Coin", other: "{count} Coins" },
  lastMovement: " · letzte Bewegung {age}",
  custody: "Verwahrung",
  launcher: "Launcher",
  singletonAt: "· Singleton-Coin bei #{height}",
  addresses: "Adressen",
  footnote:
    "Die Vault-Launcher-IDs sind die, die Chia Network für seine eigenen Prüfwerkzeuge veröffentlicht (<alert>prefarm-alert</alert>); die Verwahrungsregeln beschreibt der <guide>Prefarm-Audit-Leitfaden</guide>. Ein Vault-Rekey verschiebt Mittel an einen neuen Puzzle-Hash; dann sinkt das Guthaben hier, bis die neue Adresse ergänzt ist. Deshalb wird der Wert „Nicht an diesen Adressen“ separat gezeigt und nicht in eine Summe eingerechnet.",
};

export default messages;
