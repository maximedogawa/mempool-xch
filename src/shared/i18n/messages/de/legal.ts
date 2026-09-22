import type { Translation } from "../../translate";
import type en from "../en/legal";

const messages: Translation<typeof en> = {
  page: {
    navLabel: "Rechtliche Seiten",
    nav: {
      terms: "Nutzungsbedingungen",
      notice: "Impressum",
      privacy: "Datenschutzerklärung",
      cookies: "Cookie-Richtlinie",
    },
    lastUpdated: "Stand: {date}",
    translationNote:
      "Diese Übersetzung dient nur der Information. Bei Abweichungen gilt die englische Fassung.",
  },
  consent: {
    title: "Cookies und lokaler Speicher",
    intro:
      "Diese Website speichert in Ihrem Browser nur, was sie zum Funktionieren braucht. Nichts für Analyse oder Werbung wird geladen, sofern Sie es hier nicht erlauben.",
    cookiePolicy: "Cookie-Richtlinie",
    privacyPolicy: "Datenschutzerklärung",
    signal:
      "Ihr Browser sendet ein Do-Not-Track- oder Global-Privacy-Control-Signal, daher bleiben Analyse und Werbung deaktiviert.",
    categoriesLegend: "Kategorien",
    categories: {
      necessary: {
        label: "Unbedingt erforderlich",
        detail:
          "Ihre Einstellungen, Caches und diese Auswahl, gespeichert in Ihrem Browser. Immer aktiv.",
      },
      analytics: {
        label: "Analyse",
        detail: "Anonyme Nutzungsstatistiken. Derzeit nicht verwendet.",
      },
      advertising: {
        label: "Werbung",
        detail: "Werbung und Werbemessung. Derzeit nicht verwendet.",
      },
    },
    rejectAll: "Alle ablehnen",
    saveChoice: "Auswahl speichern",
    acceptAll: "Alle akzeptieren",
    close: "Schließen",
    settingsButton: "Cookie-Einstellungen",
  },
  disclaimer: {
    label: "Haftungshinweis",
    text: "Alpha-Software, die sich noch stark verändert. Keine Finanzberatung – prüfen Sie alles in Ihrer eigenen Wallet. <link>Nutzungsbedingungen</link>",
    dismiss: "Haftungshinweis schließen",
  },
  terms: {
    title: "Nutzungsbedingungen",
    intro:
      "Diese Bedingungen gelten für die Website {site}, ihre öffentlichen Datenschnittstellen und die {site}-App in der Sage-Wallet (zusammen der „Dienst“). Der Betreiber ist im <link>Impressum</link> genannt. Mit der Nutzung des Dienstes akzeptieren Sie diese Bedingungen. Wenn Sie sie nicht akzeptieren, nutzen Sie den Dienst bitte nicht.",
    service: {
      title: "1. Was der Dienst ist",
      body: "Der Dienst ist ein unabhängiger, kostenloser, rein lesender Explorer für die öffentliche Chia-Blockchain. Er zeigt Blöcke, Transaktionen, den Mempool, Gebührenschätzungen, Adressen, Coins und Assets an, soweit diese Informationen aus öffentlichen Quellen verfügbar sind.",
      items: {
        funds:
          "Er verwahrt, empfängt oder verwaltet keine Gelder, privaten Schlüssel oder Seed-Phrasen und kann Ihre Coins nicht bewegen.",
        transactions:
          "Er führt keine Transaktionen, Trades oder Aufträge aus, leitet sie nicht weiter und vermittelt sie nicht, und er erhebt keine Gebühr oder Provision.",
        accounts: "Es gibt keine Benutzerkonten.",
        mica: "Er erbringt keine Kryptowerte-Dienstleistungen im Sinne der Verordnung (EU) 2023/1114 (MiCA) und ist keine Börse, kein Broker, keine Verwahrstelle, kein Anlageberater und kein sonstiger regulierter Finanzdienst.",
        sage: "In der Sage-Wallet ist die Wallet die Software von Sage. Diese App liest nur, was Sage nach Ihrer Erlaubnis bereitstellt; alles, was Sie signieren oder senden, signieren oder senden Sie in Sage.",
      },
    },
    noAdvice: {
      title: "2. Keine Beratung",
      body: "Alles im Dienst ist allgemeine Information. Nichts darin ist Finanz-, Anlage-, Steuer- oder Rechtsberatung, eine Empfehlung oder ein Angebot zum Kauf oder Verkauf eines Assets. Kryptowerte sind hochvolatil, und Sie können das gesamte eingesetzte Geld verlieren. Blockchain-Transaktionen können nicht rückgängig gemacht werden. Informieren Sie sich selbst und prüfen Sie Beträge, Adressen, Asset-IDs und Gebühren in Ihrer eigenen Wallet, bevor Sie handeln.",
    },
    data: {
      title: "3. Daten: wie besehen, wie verfügbar",
      intro:
        "Der Dienst zeigt Daten Dritter an (standardmäßig von Coinset, Dexie und MintGarden oder von einem Node, den Sie selbst konfigurieren) sowie daraus abgeleitete Werte wie prognostizierte Blöcke, Gebührenschätzungen, erwartete Bestätigungszeiten, Asset-Namen, Icons und Preise. Diese Informationen:",
      items: {
        delayed: "können verzögert, unvollständig, zwischengespeichert, veraltet oder falsch sein;",
        estimates:
          "enthalten Schätzungen und Prognosen, die anders ausfallen können, zum Beispiel in welchem Block eine Transaktion landet oder welche Gebühr ausreicht;",
        names:
          "enthalten von Dritten gewählte Namen, Ticker, Icons und Bilder, die irreführend sein oder ein anderes Asset nachahmen können. Identifizieren Sie ein Asset immer anhand seiner Asset-ID.",
      },
      asIs: "Der Dienst wird „wie besehen“ und „wie verfügbar“ bereitgestellt. Es wird nicht zugesichert, dass er zu einem bestimmten Zeitpunkt verfügbar, fehlerfrei oder für einen bestimmten Zweck geeignet ist. Er kann jederzeit ohne Ankündigung geändert, eingeschränkt, unterbrochen oder eingestellt werden.",
    },
    use: {
      title: "4. Zulässige Nutzung",
      intro:
        "Sie dürfen den Dienst einschließlich seiner öffentlichen Datenschnittstellen im Rahmen dieser Regeln für private und gewerbliche Zwecke nutzen. Sie dürfen nicht:",
      items: {
        rate: "Anfragen in einer Häufigkeit senden, die den Dienst belastet, Ratenbegrenzungen oder Sperren umgehen oder den Dienst für andere stören;",
        access:
          "versuchen, sich unbefugten Zugang zum Dienst oder zu den dahinterliegenden Systemen zu verschaffen;",
        unlawful:
          "den Dienst für rechtswidrige Zwecke nutzen, einschließlich Betrug, oder um andere über ein Asset oder eine Transaktion zu täuschen;",
        endorse:
          "Ihr eigenes Angebot so darstellen, als werde es von {site} betrieben, unterstützt oder verifiziert.",
      },
      automated:
        "Speichern Sie bei automatisierter Nutzung Antworten zwischen und halten Sie die Anfragehäufigkeit in einem angemessenen Rahmen. Der Dienst kann Datenverkehr, der seine Verfügbarkeit beeinträchtigt, begrenzen oder sperren.",
    },
    thirdParty: {
      title: "5. Inhalte und Links Dritter",
      body: "Asset-Namen, Icons, NFT-Bilder und Metadaten stammen aus der Blockchain und von Dritten. Sie werden vom Betreiber weder erstellt noch geprüft noch unterstützt. Dasselbe gilt für externe Websites, auf die der Dienst verlinkt. Wenn Sie der Ansicht sind, dass im Dienst angezeigte Inhalte rechtswidrig sind oder Ihre Rechte verletzen, schreiben Sie an x.com/MaximEdogawa auf x.com und geben Sie die Seitenadresse und den Grund an; die Inhalte werden nicht mehr angezeigt, sobald der Betreiber von einer Rechtsverletzung Kenntnis erlangt.",
    },
    liability: {
      title: "6. Haftung",
      intro:
        "Der Dienst wird unentgeltlich bereitgestellt. Die Haftung des Betreibers für Schäden, gleich aus welchem Rechtsgrund, ist daher wie folgt beschränkt:",
      items: {
        unlimited:
          "Der Betreiber haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung des Lebens, des Körpers oder der Gesundheit, nach dem Produkthaftungsgesetz, soweit eine Garantie übernommen wurde und soweit ein Mangel arglistig verschwiegen wurde.",
        slight:
          "Bei leichter Fahrlässigkeit haftet der Betreiber nur für die Verletzung einer wesentlichen Pflicht, also einer Pflicht, deren Erfüllung die ordnungsgemäße Nutzung des Dienstes überhaupt erst ermöglicht und auf deren Einhaltung Sie regelmäßig vertrauen dürfen. In diesem Fall ist die Haftung auf den Schaden begrenzt, der bei Ihrer Nutzung des Dienstes typisch und vorhersehbar war.",
        excluded: "Im Übrigen ist die Haftung für leichte Fahrlässigkeit ausgeschlossen.",
        decisions:
          "Vorbehaltlich Ziffer 1 bedeutet dies insbesondere, dass der Betreiber nicht für Verluste haftet, die aus Entscheidungen entstehen, die Sie auf im Dienst angezeigte Informationen stützen, etwa das Senden, Kaufen, Verkaufen oder Halten eines Assets oder die Wahl einer Gebühr, oder daraus, dass der Dienst nicht verfügbar ist.",
        representatives:
          "Diese Beschränkungen gelten auch zugunsten der Vertreter des Betreibers und aller, die beim Betrieb des Dienstes mitwirken.",
      },
    },
    openSource: {
      title: "7. Open Source",
      body: "Die Software hinter dem Dienst ist Open Source unter der MIT-Lizenz, die ihren eigenen Haftungsausschluss für die Software enthält. Diese Bedingungen betreffen den gehosteten Dienst.",
    },
    changes: {
      title: "8. Änderungen",
      body: "Diese Bedingungen können aktualisiert werden, zum Beispiel wenn sich der Dienst ändert. Die Fassung auf dieser Seite mit dem oben angegebenen Datum gilt ab diesem Datum. Wenn Sie den Dienst nach einer Änderung weiter nutzen, gelten für diese Nutzung die aktualisierten Bedingungen.",
    },
    law: {
      title: "9. Anwendbares Recht und Gerichtsstand",
      choice:
        "Für diese Bedingungen gilt das Recht Österreichs unter Ausschluss des Übereinkommens der Vereinten Nationen über Verträge über den internationalen Warenkauf (UN-Kaufrecht). Wenn Sie Verbraucher sind, entzieht Ihnen diese Rechtswahl nicht den Schutz der zwingenden Verbraucherschutzvorschriften des Staates, in dem Sie Ihren gewöhnlichen Aufenthalt haben.",
      venue:
        "Wenn Sie Kaufmann oder eine juristische Person des öffentlichen Rechts sind oder keinen allgemeinen Gerichtsstand in der Europäischen Union haben, sind die Gerichte in Wien, Österreich, zuständig. Zwingende gesetzliche Gerichtsstände bleiben unberührt.",
      disputes:
        "Der Betreiber ist nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
    },
    severability: {
      title: "10. Salvatorische Klausel",
      body: "Ist eine Bestimmung dieser Bedingungen unwirksam, bleiben die übrigen Bestimmungen wirksam, und an die Stelle der unwirksamen Bestimmung treten die gesetzlichen Vorschriften.",
    },
  },
  notice: {
    title: "Impressum",
    intro: "Angaben zum Betreiber (Impressum gemäß § 5 DDG und § 18 MStV).",
    independence: {
      title: "Unabhängigkeit und Marken",
      body: "{site} ist ein unabhängiges Projekt. Es ist nicht mit Chia Network Inc. verbunden und wird von ihr weder unterstützt noch gesponsert. „Chia“ und „XCH“ werden nur zur Beschreibung des Netzwerks verwendet, das der Dienst anzeigt; sie und alle zugehörigen Marken gehören ihren jeweiligen Inhabern. Dasselbe gilt für Sage, Coinset, Dexie, MintGarden und alle anderen im Dienst angezeigten Produkt- oder Asset-Namen.",
    },
    liability: {
      title: "Inhalte und Links",
      content:
        "Die Inhalte dieser Website werden mit Sorgfalt erstellt, doch das meiste, was sie anzeigt, sind Daten aus der öffentlichen Blockchain und von Dritten, die automatisch und ungeprüft dargestellt werden. Für ihre Richtigkeit, Vollständigkeit und Aktualität wird keine Gewähr übernommen; siehe die <link>Nutzungsbedingungen</link>.",
      links:
        "Die Website verlinkt auf externe Websites, deren Inhalte außerhalb der Kontrolle des Betreibers liegen und für die deren Anbieter verantwortlich sind. Zum Zeitpunkt der Verlinkung waren keine Rechtsverstöße auf den verlinkten Seiten erkennbar; ein Link wird entfernt, sobald eine Rechtsverletzung bekannt wird.",
    },
    report: {
      title: "Inhalte melden",
      body: "Um auf dieser Website angezeigte Inhalte zu melden, die Sie für rechtswidrig halten oder die Ihre Rechte verletzen, schreiben Sie an x.com/MaximEdogawa auf x.com. Da es keine Konten gibt, können Serverprotokolle Ihnen nur anhand Ihrer IP-Adresse und des Zeitpunkts Ihres Besuchs zugeordnet werden.",
    },
    attribution: {
      title: "Open Source und Datenquellen",
      items: {
        source: "Quellcode: <link>github.com/maximedogawa/mempool-xch</link> unter der MIT-Lizenz.",
        chain: "Chain-Daten: <link>Coinset</link> oder ein Full Node, den Sie konfigurieren.",
        cats: "CAT-Namen und -Icons: <link>Dexie</link>.",
        nfts: "NFT-Metadaten und -Bilder: <link>MintGarden</link> und die eigenen Links der NFTs.",
        ownership: "NFT-Bilder, CAT-Icons und On-Chain-Inhalte gehören ihren Urhebern.",
      },
    },
    disputes: {
      title: "Verbraucherstreitbeilegung",
      body: "Der Betreiber ist nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
    },
  },
  privacy: {
    title: "Datenschutzerklärung",
    intro:
      "Wie {site} personenbezogene Daten nach der EU-Datenschutz-Grundverordnung (DSGVO) verarbeitet. Kurz gesagt: keine Konten, kein Tracking, keine Analyse und keine Werbung. Ihre Einstellungen bleiben in Ihrem Browser.",
    controller: {
      title: "1. Verantwortlicher",
      body: "Maxim Edogawa. Siehe auch das <link>Impressum</link>.",
    },
    logs: {
      title: "2. Besuch der Website: Serverprotokolle",
      intro:
        "Wenn Sie die Website aufrufen, sendet Ihr Browser technische Daten, die der Server in Zugriffsprotokollen speichert: IP-Adresse, Datum und Uhrzeit, die angeforderte Adresse (die eine Transaktions-ID, einen Block, eine Adresse oder einen Coin enthalten kann, den Sie nachgeschlagen haben), Statuscode, verweisende Seite und Browserkennung.",
      items: {
        purpose:
          "Zweck: Auslieferung der Website, Gewährleistung ihrer Sicherheit und Stabilität sowie Aufklärung von Missbrauch und Fehlern.",
        basis:
          "Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO; das berechtigte Interesse ist der Betrieb einer sicheren Website.",
        retention:
          "Speicherdauer: 14 Tage, länger nur, solange es zur Aufklärung eines konkreten Sicherheitsvorfalls erforderlich ist.",
        hosting: "Hosting: Hetzner als Auftragsverarbeiter nach Art. 28 DSGVO.",
      },
      noProxy:
        "Der Server ruft keine Chain- oder Asset-Daten in Ihrem Auftrag ab: Er liefert nur die Anwendung selbst aus (HTML, Skripte, Styles). Jede Abfrage, die Sie vornehmen, ist eine Anfrage Ihres eigenen Browsers an Coinset, Dexie, MintGarden, XCHandles, öffentliche Marktdatenquellen oder Ihren eigenen Node, wie in den folgenden Abschnitten beschrieben.",
      market:
        "Die Seite „Markt“ liest öffentliche Orderbücher von Gate.io (api.gateio.ws), OKX (www.okx.com) und HTX (api.huobi.pro) sowie öffentliche XCH-Offers für ByteCash (BYC) und wUSDC.b von Dexie. Diese Anfragen enthalten keine Zugangsdaten zu Konten. Eine Quelle kann nicht verfügbar oder ratenbegrenzt sein; die Seite kennzeichnet sie dann als veraltet und nimmt sie aus ihrem Gesamtwert heraus.",
    },
    storage: {
      title: "3. Speicherung in Ihrem Browser",
      body: "Die Website legt einige Einträge im lokalen Speicher Ihres Browsers ab: Ihre Einstellungen (Netzwerk, Node-Adresse, Design, Sprache, Töne, ob Sie Browser-Benachrichtigungen aktiviert haben), einen Cache der Asset-Liste, einen kurzen Mempool-Verlauf, der aufgezeichnet wird, während die Seite geöffnet ist, Ihre Beobachtungsliste mit Adressen und Transaktions-IDs, falls Sie welche hinzufügen, welche Sage-Berechtigungen Sie abgelehnt haben, und Ihre Cookie-Auswahl. Sie bleiben auf Ihrem Gerät und werden nicht an den Betreiber gesendet. Sie sind unbedingt erforderlich, um bereitzustellen, was Sie angefordert haben (§ 25 Abs. 2 Nr. 2 TDDDG). Sie können sie jederzeit in Ihren Browsereinstellungen löschen. Einzelheiten finden Sie in der <link>Cookie-Richtlinie</link>.",
      notifications:
        "Wenn Sie Browser-Benachrichtigungen für Ihre Beobachtungsliste aktivieren, erteilt Ihr Browser diese Berechtigung dieser Website, und Sie können sie dort jederzeit widerrufen; der Betreiber erfährt nie, ob Sie sie aktiviert haben.",
    },
    thirdParties: {
      title: "4. Dienste, die Ihr Browser direkt kontaktiert",
      intro:
        "Jede Seite liest Chain- und Asset-Daten direkt von anderen Diensten, aus Ihrem eigenen Browser, nicht über den Server dieser Website. Wie jeder Webserver erhalten diese Ihre IP-Adresse, Ihre Browserkennung und die Adresse des angeforderten Elements:",
      items: {
        dexie:
          "Dexie (api.dexie.space, icons.dexie.space): die CAT-Token-Liste, Namen, Ticker und Icons.",
        mintgarden:
          "MintGarden (api.mintgarden.io, assets.mainnet.mintgarden.io, ipfs.mintgarden.io): NFT-Metadaten und -Bilder.",
        nftHosts:
          "Hosts, die in den eigenen On-Chain-Metadaten eines NFT genannt sind, wenn MintGarden keine Kopie hat. Welche Hosts das sind, entscheidet der Urheber des NFT.",
        xchandles:
          "XCHandles (api.xchandles.com): nur wenn Sie ein Handle nachschlagen, beobachten oder suchen – worauf dieser Name verweist und wann er abläuft.",
        coinset:
          "Coinset (api.coinset.org): alle Chain-Daten – der Mempool, Blöcke, Transaktionen, Adressen, Coins und Assets, die Sie ansehen, sowie die Live-Aktualisierungen –, sofern Sie unten keinen anderen Node eingeben.",
        node: "Ein Full Node, den Sie in den Einstellungen eingeben: Alle Chain-Daten kommen dann von dort statt von Coinset.",
        map: "Nur während die Seite „Netzwerkkarte“ geöffnet ist: Cloudflare DNS (cloudflare-dns.com, mit dns.google als Ausweichlösung) beantwortet DNS-Anfragen für die Chia-Introducer, und GeoJS (get.geojs.io) schätzt den Standort der Node-Adressen, die diese Antworten enthalten. Zur Abfrage werden nur Node-Adressen gesendet, niemals Ihre; die ermittelten Adressen werden eine Woche lang im lokalen Speicher Ihres Browsers aufbewahrt.",
      },
      basis:
        "Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO; das berechtigte Interesse ist die Anzeige der von Ihnen angeforderten Blockchain-Inhalte. Einige dieser Anbieter verarbeiten Daten möglicherweise außerhalb des Europäischen Wirtschaftsraums, zum Beispiel in den Vereinigten Staaten, wo das Datenschutzniveau niedriger sein kann. Es gelten deren eigene Datenschutzerklärungen.",
      publicData:
        "Adressen, Transaktions-IDs und Coin-IDs sind in der Blockchain öffentlich. Wenn Sie Ihre eigene Adresse nachschlagen, kann der Dienst, der die Abfrage beantwortet, sie möglicherweise mit Ihrer IP-Adresse verknüpfen.",
    },
    sage: {
      title: "5. In der Sage-Wallet",
      body: "In der Sage-App werden Wallet-Informationen (Ihre Empfangsadresse, Guthaben, ausstehende und frühere Transaktionen, Coins) erst nach Ihrer Erlaubnis aus Sage gelesen und auf Ihrem Gerät verarbeitet. Sie werden nicht an den Betreiber gesendet. Um Ihre Adressseite anzuzeigen, fragt die App Ihre öffentliche Adresse bei der Chain-Datenquelle (Coinset oder Ihr Node) ab, genau wie bei jeder Adresssuche.",
    },
    noTracking: {
      title: "6. Keine Cookies, keine Analyse, keine Werbung",
      body: "Die Website setzt keine Cookies und verwendet keine Analyse, kein Tracking und keine Werbung. Sollte sich das ändern, geschieht dies nur mit Ihrer vorherigen Einwilligung über die Cookie-Einstellungen, und diese Datenschutzerklärung wird zuvor aktualisiert.",
    },
    rights: {
      title: "7. Ihre Rechte",
      intro: "Sie haben das Recht,",
      items: {
        access:
          "Auskunft über die zu Ihrer Person gespeicherten personenbezogenen Daten zu erhalten (Art. 15 DSGVO);",
        rectification: "diese berichtigen (Art. 16) oder löschen (Art. 17) zu lassen;",
        restriction:
          "die Einschränkung ihrer Verarbeitung zu verlangen (Art. 18) und sie in einem übertragbaren Format zu erhalten (Art. 20);",
        objection:
          "aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit gegen die Verarbeitung auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO <b>Widerspruch</b> einzulegen (Art. 21);",
        complaint:
          "sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren (Art. 77), insbesondere in dem EU-Staat, in dem Sie leben oder arbeiten.",
      },
      contact:
        "Schreiben Sie an x.com/MaximEdogawa auf x.com. Da es keine Konten gibt, können Serverprotokolle Ihnen nur anhand Ihrer IP-Adresse und des Zeitpunkts Ihres Besuchs zugeordnet werden.",
    },
    other: {
      title: "8. Sonstiges",
      body: "Sie sind nicht verpflichtet, personenbezogene Daten bereitzustellen. Ohne die technischen Daten aus Abschnitt 2 kann die Website nicht ausgeliefert werden. Es findet keine automatisierte Entscheidungsfindung und kein Profiling statt. Diese Datenschutzerklärung wird aktualisiert, wenn sich die Website ändert; das Datum oben zeigt die aktuelle Fassung.",
    },
  },
  cookies: {
    title: "Cookie-Richtlinie",
    intro:
      "{site} setzt keine Cookies. Die Website legt einige Einträge im lokalen Speicher Ihres Browsers ab, für die die Regeln für Cookies (Art. 5 Abs. 3 ePrivacy-Richtlinie, § 25 TDDDG) in gleicher Weise gelten. Diese Seite listet sie auf.",
    categories: {
      title: "Kategorien",
      necessary:
        "<b>Unbedingt erforderlich</b>: immer aktiv. Erforderlich für Funktionen, die Sie nutzen, und von der Einwilligungspflicht ausgenommen (§ 25 Abs. 2 Nr. 2 TDDDG).",
      analytics:
        "<b>Analyse</b>: Nutzungsstatistiken. Derzeit nicht verwendet; würden nur mit Ihrer Einwilligung ausgeführt.",
      advertising:
        "<b>Werbung</b>: Werbung und Werbemessung. Derzeit nicht verwendet; würden nur mit Ihrer Einwilligung ausgeführt.",
    },
    necessary: {
      title: "Unbedingt erforderliche Speicherung",
      columns: {
        key: "Schlüssel",
        purpose: "Zweck",
        kept: "Speicherdauer",
      },
      rows: {
        settings: {
          purpose:
            "Netzwerk, Node-Adresse, Design, Sprache, Anzahl der letzten Blöcke, Töne, ob Browser-Benachrichtigungen aktiviert sind",
          lifetime: "Bis Sie sie zurücksetzen oder löschen",
        },
        tokens: {
          purpose:
            "Zwischengespeicherte Liste der CAT-Namen und -Icons, damit sie nicht bei jedem Besuch heruntergeladen wird",
          lifetime: "Nach 24 Stunden aktualisiert",
        },
        history: {
          purpose:
            "Mempool-Diagramm der letzten zwei Stunden, aufgezeichnet, während die Seite geöffnet ist",
          lifetime: "Einträge, die älter als zwei Stunden sind, werden verworfen",
        },
        snapshot: {
          purpose:
            "Die zuletzt angezeigten ausstehenden Transaktionen (öffentliche Netzwerkdaten), damit der nächste Besuch sie sofort anzeigt und nicht erneut herunterlädt",
          lifetime: "Nach einer Stunde ignoriert, ersetzt, während die Seite geöffnet ist",
        },
        watchlist: {
          purpose: "Adressen und Transaktions-IDs, die Sie beobachten möchten",
          lifetime: "Bis Sie sie entfernen oder löschen",
        },
        sageRefused: {
          purpose:
            "Sage-Berechtigungen, die Sie abgelehnt haben, damit Sie nicht erneut gefragt werden (nur Sage-App)",
          lifetime: "Bis Sie sie löschen",
        },
        consent: {
          purpose: "Ihre Auswahl in den Cookie-Einstellungen",
          lifetime: "12 Monate",
        },
      },
      notShared:
        "Keiner dieser Einträge wird an den Betreiber gesendet oder verwendet, um Sie zu identifizieren oder zu verfolgen.",
    },
    choice: {
      title: "Ihre Auswahl",
      body: "Bei Ihrem ersten Besuch fragt ein Hinweisfeld nach Ihrer Auswahl: Alle ablehnen, Auswahl speichern oder Alle akzeptieren. Ihre Auswahl wird 12 Monate lang gespeichert, danach werden Sie erneut gefragt. Sie können sie jederzeit über „Cookie-Einstellungen“ in der Fußzeile oder hier ändern oder widerrufen:",
      signal:
        "Wenn Ihr Browser ein Do-Not-Track- oder Global-Privacy-Control-Signal sendet, bleiben Analyse und Werbung deaktiviert und Sie werden nicht gefragt.",
    },
    thirdParties: {
      title: "Inhalte anderer Dienste",
      body: "Icons, NFT-Bilder und einige Chain-Daten werden direkt von anderen Diensten geladen, die wie jeder Webserver Ihre IP-Adresse erhalten. Siehe Abschnitt 4 der <link>Datenschutzerklärung</link>. x.com/MaximEdogawa auf x.com. Da es keine Konten gibt, können Serverprotokolle Ihnen nur anhand Ihrer IP-Adresse und des Zeitpunkts Ihres Besuchs zugeordnet werden.",
    },
  },
};

export default messages;
