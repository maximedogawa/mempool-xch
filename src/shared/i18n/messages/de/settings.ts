import type { Translation } from "../../translate";
import type en from "../en/settings";

const messages: Translation<(typeof en)["messages"]> = {
  title: "Einstellungen",
  channel:
    "<strong>Live-Kanal: {name}.</strong> {detail} Alle Daten werden direkt vom Endpunkt gelesen.",
  network: {
    title: "Netzwerk",
    active: "Aktives Netzwerk",
    intro:
      "Die gesamte App folgt dem aktiven Netzwerk: Adresspräfixe, Explorer-Links, der Live-Stream und die Mempool-Zusammenfassung. Aktiver Endpunkt: <endpoint>{url}</endpoint>",
  },
  endpoints: {
    title: "Full-Node-RPC-Endpunkte",
    sage: "<strong>In Sage:</strong> Ihr Guthaben, Ihre Coins und Transaktionen stammen aus der Wallet selbst. Die App-Bridge von Sage bietet keinen Node-RPC (keine Abfragen zu Peak, Mempool oder Blöcken), daher kommen netzwerkweite Daten vom unten stehenden Endpunkt; ein eigener Endpunkt wird beim Speichern in Sage freigegeben.",
    intro:
      "Standardmäßig liest mempoolxch.space die Chain über den öffentlichen Full-Node-RPC von <coinset>Coinset</coinset> – direkt aus Ihrem Browser, ganz ohne eigenen Node. Sie können jedes Netzwerk stattdessen auf einen beliebigen HTTPS-Endpunkt richten, der mit dem Chia-Full-Node-RPC kompatibel ist. Funktionen, die nur Coinset bietet (semantische Transaktionszusammenfassungen, Adresshistorie und der WebSocket-Stream), werden bei eigenen Endpunkten automatisch abgeschaltet; die App fragt dann regelmäßig ab und lädt den rohen Mempool im Browser.",
    ownNode:
      "<strong>Eigenen Node verwenden?</strong> Ein normaler Chia Full Node lauscht auf <code>https://localhost:8555</code> mit gegenseitigem TLS: Er verlangt das Client-Zertifikat des Nodes, das ein Browser nicht vorweisen kann, und sendet keine CORS-Header. Setzen Sie einen kleinen Reverse Proxy davor, der TLS mit dem Client-Zertifikat terminiert und <code>Access-Control-Allow-Origin</code> ergänzt, und tragen Sie dann hier die Proxy-URL ein. <guide>Schritt-für-Schritt-Anleitung</guide>.",
    nodexch:
      "<strong>nodexch?</strong> Ein nodexch-Gateway spricht Coinsets Dialekt vor seinem eigenen Full Node: Full-Node-RPC, die indexierte API und der WebSocket auf einem Host. Wählen Sie die Vorgabe oder markieren Sie Ihr eigenes Gateway als nodexch; ein öffentlicher Schlüssel (<code>nxp_…</code>), gebunden an die Herkunft dieser Seite, wird bei jedem Aufruf mitgeschickt. Tragen Sie hier nie einen geheimen Schlüssel ein.",
  },
  endpoint: {
    addresses: "({prefix}-Adressen)",
    coinsetDefault: "Coinset-Standard",
    customNode: "Eigener Node",
    test: "Verbindung testen",
    save: "Speichern",
    reset: "Auf Coinset zurücksetzen",
    ok: "Spitze {height} in {ms} ms",
    okCustom:
      "Spitze {height} in {ms} ms · eigener Node: indexierte API, WebSocket und Summary-API aus",
    sageHttpsOnly: "In Sage können nur https-Endpunkte freigegeben werden.",
    sageRefused: "Sage hat diesen Host nicht zugelassen; der Endpunkt wurde nicht gespeichert.",
    sageAllowed: "Sage hat diesen Host zugelassen.",
    nodexch: "nodexch",
    nodexchPreset: "nodexch.space verwenden",
    nodexchToggle: "Dieser Endpunkt ist ein nodexch-Gateway",
    apiKey: "Öffentlicher Schlüssel",
    apiKeyHint: "nxp_… (für die nodexch.space-Vorgabe optional)",
    apiKeyInvalid: "In einen Browser gehört nur ein öffentlicher Schlüssel (nxp_…).",
    okNodexch: "Peak {height} in {ms} ms · nodexch: indexierte API und WebSocket an",
  },
  appearance: {
    title: "Darstellung",
    theme: "Design",
    dark: "Dunkel",
    darkHint: "mempool.space-Stil",
    light: "Hell",
    lightHint: "hell und klar",
    system: "System",
    systemHint: "folgt Ihrem Gerät",
    sageLocked:
      "In Sage folgt die App dem Design der Wallet (aktuell {theme}). Ändern Sie es in den Einstellungen von Sage.",
    language: "Sprache",
    languageAuto: "Automatisch (Browsersprache)",
    chime: "Bestätigungston",
    chimeHint:
      "Ein leiser Münzklang, wenn eine Transaktion Ihrer Wallet in einem Block landet (nur in Sage).",
    recentBlocks: "Letzte Blöcke in der Übersicht",
  },
  resetAll: "Alle Einstellungen zurücksetzen",
};

export default messages;
