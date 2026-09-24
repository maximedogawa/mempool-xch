import type { Translation } from "../../translate";
import type en from "../en/handle";

const messages: Translation<(typeof en)["messages"]> = {
  status: {
    active: "Registriert",
    expired: "Abgelaufen",
    unknown: "Nicht registriert",
    syncing: "Registry wird synchronisiert",
    unavailable: "Registry nicht erreichbar",
  },
  invalidTitle: "Kein gültiger Handle",
  invalidDescription:
    "Ein XCHandles-Handle besteht aus 3 bis 63 Kleinbuchstaben und Ziffern, geschrieben als @name, ohne Punkte oder Bindestriche. Erhalten: {raw}",
  empty: "(leer)",
  mainnetTitle: "Handles sind eine Mainnet-Registry",
  mainnetDescription:
    "XCHandles läuft nur im Mainnet. Wechseln Sie zurück ins Mainnet, um einen Handle aufzulösen.",
  title: "Handle",
  artAlt: "Namens-NFT von {handle}",
  handle: "Handle",
  resolvesTo: "Verweist auf",
  nobodyRegistered: "Niemand hat diesen Handle registriert.",
  noAddress: "Keine Adresse hinterlegt.",
  expired: "Abgelaufen",
  expires: "Läuft ab",
  nameNft: "Namens-NFT",
  ownerLauncherId: "Launcher-ID des Besitzers",
  syncing:
    "Der Registry-Index hinkt der Chain hinterher und meldet das lieber, als aus veraltetem Stand zu antworten. Versuchen Sie es gleich noch einmal.",
  unreachable: "Die XCHandles-Registry ist nicht erreichbar.",
  retry: "Erneut versuchen",
  registry: "Registry",
  lastAction: "Letzte Aktion",
  confirmedIn: "Bestätigt in",
  block: "Block {height}",
  protocolFee: "Protokollgebühr",
  protocolFeeValue: "{fee} <faint>Mojos des Zahlungs-CAT</faint>",
  notRegisteredTitle: "{handle} ist nicht registriert",
  notRegisteredDescription:
    "Kein aktiver Slot in der Registry löst diesen Handle auf. Er kann auf xchandles.com registriert werden.",
  openOnXchandles: "Auf XCHandles öffnen",
};

export default messages;
