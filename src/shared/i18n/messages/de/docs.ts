import type { Translation } from "../../translate";
import type en from "../en/docs";

const messages: Translation<typeof en> = {
  title: "Hilfe",
  why: {
    title: "Warum mempoolxch.space",
    intro:
      "Einige Dinge, die diese Version kann und die andere Chia-Explorer, mit denen wir sie verglichen haben, beim letzten Check nicht konnten:",
    sage: "Eine Wallet-Seite in der Sage-App: Ihre ausstehenden Transaktionen auf der Übersicht mit Position in der Warteschlange und einem Bestätigungston.",
    projected:
      "Voraussichtliche nächste Blöcke, gepackt so, wie der Node sie tatsächlich füllt (nach Kosten sortiert), statt nur einer Warteschlangenlänge.",
    cats: "Jeder CAT erhält Namen und Icon aus der Dexie-Registry, auf jeder Seite, die ihn zeigt, nicht nur auf einer Nachschlageseite.",
    a11y: "Barrierefreiheit auf jeder Route geprüft: automatisierte axe-AA-Prüfungen und ein vollständiger Tastaturdurchlauf in der Testsuite, nicht nur behauptet.",
    openSource:
      "Open Source unter MIT, ein Docker-Image, bereitgestellt genau so, wie es im Repository dokumentiert ist.",
    comparison:
      "Der vollständige Vergleich Funktion für Funktion, einschließlich dessen, worin die Konkurrenz noch vorn liegt, wird in der <link>Wettbewerbsmatrix</link> (Wiki) aktuell gehalten.",
  },
  reading: {
    title: "Die Übersicht lesen",
    projected: {
      q: "Was sind die Blöcke links der gepunkteten Linie?",
      a: "Es gibt sie noch nicht. Sie sind die nächsten Transaktionsblöcke, so wie das Netzwerk sie voraussichtlich füllen wird: jedes ausstehende Spend Bundle, sortiert nach der Gebühr, die es pro Kosteneinheit zahlt, gepackt in Blöcke mit 11 Milliarden Kosten. Der Block direkt an der Linie ist der nächste; die weiter links folgen danach. Jeder zeigt den typischen Gebührensatz darin, die Gebührenspanne, die Gesamtgebühren, wie viele Spend Bundles er enthält und ungefähr, wann er gefarmt wird. Klicken Sie auf einen, um seinen Inhalt zu sehen.",
    },
    confirmed: {
      q: "Und die Blöcke rechts?",
      a: "Die gerade bestätigten Transaktionsblöcke, neueste zuerst, mit ihren Gebühren, Belohnungs-Claims, ihrem Alter und dem Farmer, der sie gewonnen hat. Chia farmt etwa alle 19 Sekunden einen Block, aber nur jeder dritte enthält Transaktionen; die kleinen +N-Markierungen zählen die leeren dazwischen.",
    },
    zeroFee: {
      q: "Warum ist die Gebührenschätzung meist 0?",
      a: "Chia ist nicht Bitcoin. Gebühren werden pro Einheit CLVM-Kosten gezahlt, und der Mempool nimmt Ausgaben ganz ohne Gebühr an, solange er Platz hat. Der Kapazitätsbalken zeigt, wie voll er ist (Kosten im Umfang von zehn Blöcken). Wenn er sich füllt, bringt Sie eine Gebühr am gebührenfreien Rückstau vorbei, und die Karten zeigen den Satz, mit dem Sie in den nächsten Block kommen, in fünf oder in zehn Minuten.",
    },
    nextBlock: {
      q: "Was zeigt „Nächster Block“?",
      a: "Die Zusammensetzung des Blocks, der als Nächstes gefarmt wird: eine Zelle pro Spend Bundle, in der Größe nach seinen Kosten, eingefärbt nach Gebührenband, umrandet nach Asset-Art. Mit den Chips heben Sie XCH-, CAT-, NFT-, Offer- oder DID-Ausgaben hervor. Fahren Sie über eine Zelle für Details, klicken Sie, um die Transaktion zu öffnen.",
    },
    graph: {
      q: "Was ist das Mempool-Diagramm?",
      a: "Wie viel an Kosten wartet, aufgeteilt nach Gebührenband, über die letzten zwei Stunden. Es wird von Ihrem Browser erfasst, solange die Seite offen ist, und beginnt daher mit dem ersten Öffnen der App.",
    },
  },
  search: {
    title: "Ihre Transaktion finden",
    paste: {
      q: "Was kann ich in das Suchfeld einfügen?",
      a: "Eine Transaktions-ID (Spend Bundle), eine Blockhöhe oder einen Header-Hash, eine xch- oder txch-Adresse, eine Coin-ID, eine CAT-Asset-ID, eine nft1-ID oder eine did:chia:-ID. Ein einfaches Wort wird als XCHandles-Handle nachgeschlagen und gleichzeitig als NFT- oder Kollektionsname gesucht. Drücken Sie überall <kbd>/</kbd>, um zum Suchfeld zu springen. Wenn eine 64-stellige Hex-ID mehreres sein könnte, prüft die App Mempool, Transaktionen, Coins und Blöcke und zeigt Ihnen die Kandidaten.",
    },
    handle: {
      q: "Was ist ein Handle?",
      a: "XCHandles (xchandles.com) ist ein Namensregister auf Chia: Ein Handle wie <mono>@maximedogawa</mono> ist ein Registereintrag, der auf ein Namens-NFT verweist, und die Adresse dieses NFTs ist das Ziel einer Zahlung an den Namen. Seine Seite zeigt, worauf er heute verweist, wer ihn hält und wann die Registrierung ausläuft, und er lässt sich wie eine Adresse beobachten. Handle-Daten stammen aus der eigenen, schreibgeschützten API des Registers, nur im Mainnet.",
    },
    sent: {
      q: "Ich habe eine Transaktion gesendet. Wo ist sie?",
      a: "Fügen Sie ihre ID oder Ihre Adresse ein. Eine ausstehende Transaktion zeigt, in welchem voraussichtlichen Block sie liegt, und eine geschätzte Zeit; nach der Bestätigung zeigt sie den Block, die Bestätigungen und was zwischen welchen Adressen bewegt wurde. Die Adressseite listet Ihre ausstehenden Transaktionen oben auf und aktualisiert sich von selbst.",
    },
    notClassified: {
      q: "Warum steht auf einer Coin-Seite „nicht klassifiziert“?",
      a: "Die Klassifizierung stammt aus Coinsets Coin-Details, die nicht immer verfügbar sind. Einfache XCH-Coins brauchen selten eine; CAT- und NFT-Coins verlinken in der Transaktionsansicht trotzdem auf ihre Asset-Seiten.",
    },
  },
  sage: {
    title: "Nutzung in der Sage-Wallet",
    install: {
      q: "Wie installiere ich es?",
      a: "Öffnen Sie in Sage 0.13 oder neuer <em>Apps → Install from URL</em> und fügen Sie <mono>{site}</mono> ein. Sage lädt die App herunter und prüft sie; danach folgt sie dem Netzwerk und Design Ihrer Wallet, und ein Eintrag <em>Meine Wallet</em> öffnet Ihre eigene Adressseite, sobald Sie ihr erlauben, Ihre Empfangsadresse zu lesen.",
    },
    network: {
      q: "Warum sieht der Netzwerkschalter deaktiviert aus?",
      a: "In Sage zeigt die App immer das Netzwerk, in dem sich Ihre Wallet befindet.",
    },
    data: {
      q: "Woher kommen die Daten in Sage?",
      a: "Alles, was Ihnen gehört, kommt aus der Wallet selbst: Guthaben, Sync-Status, ausstehende und vergangene Transaktionen, Ihre Coins, ob eine Adresse Ihnen gehört, und der XCH-Preis. Sage ist eine Light-Wallet, und ihre App-Bridge bietet keine Node-Abfragen (keine Abfragen von Peak, Mempool oder Blöcken), daher kommen Mempool, Blöcke und die Adressen anderer weiterhin vom Chain-Endpunkt in den Einstellungen – standardmäßig Coinset oder ein Node, den Sie freigeben.",
    },
  },
  customNode: {
    title: "Einen eigenen Node verwenden",
    need: {
      q: "Brauche ich einen Node?",
      a: "Nein. Standardmäßig kommt alles vom öffentlichen Chia Full Node von Coinset und dessen Index, der auch die Live-Updates, die Adresshistorie und die CAT-/NFT-Seiten speist.",
    },
    mine: {
      q: "Ich möchte trotzdem meinen eigenen verwenden.",
      a: "Einstellungen → Full-Node-RPC-Endpunkte akzeptiert jeden Chia-Full-Node-RPC über HTTPS. Ein Standard-Node lauscht auf <mono>https://localhost:8555</mono> mit Client-Zertifikat-TLS und ohne CORS-Header, womit ein Browser nicht direkt sprechen kann; setzen Sie daher einen kleinen Proxy davor:",
    },
    changes: {
      q: "Was ändert sich mit meinem eigenen Node?",
      a: "Die App fragt regelmäßig ab, statt zu streamen, und holt den rohen Mempool selbst. Funktionen, die nur Coinset bietet (semantische Transaktionszusammenfassungen, Adresshistorie, CAT- und NFT-Historie), werden mit einem Hinweis ausgeblendet. Alles rund um Blöcke, Coins und den Mempool funktioniert weiter.",
    },
    channels: {
      q: "Woher kommen Live-Updates?",
      a: "Die Verbindungsanzeige (mit der Maus darüberfahren), die Fußzeile und die Einstellungen nennen den Kanal, den Ihr Tab nutzt. Dazwischen gibt es keinen Server: Diese Website hostet nur die App selbst, und jeder Tab spricht direkt mit dem Chain-Endpunkt.",
      socket:
        "<strong>Coinset-Socket</strong>: Ihr Tab streamt Peak-Höhe und Transaktionsereignisse direkt über den WebSocket von Coinset. Der normale Modus auf mempoolxch.space und im In-App-Snapshot von Sage.",
      polling:
        "<strong>Polling</strong>: Es ist kein Stream verfügbar, daher fragt der Tab den Endpunkt alle paar Sekunden ab. Immer der Fall bei einem eigenen Node und der Fallback, wenn der Socket keine Verbindung herstellen kann.",
    },
  },
  more: {
    title: "Mehr",
    api: "API-Referenz: jeder Coinset-Aufruf, den diese App macht, mit Beispielen",
    install: "Installation und Nutzung",
    customNode: "Eigener oder lokaler Node, auch mit nginx",
    overview: "Wie es unter der Haube funktioniert",
    load: "Last auf den Datenquellen und langfristige Optionen",
    source: "Quellcode auf GitHub (MIT)",
  },
};

export default messages;
