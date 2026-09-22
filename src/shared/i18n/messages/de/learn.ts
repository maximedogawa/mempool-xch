import type { Translation } from "../../translate";
import type en from "../en/learn";

const messages: Translation<typeof en> = {
  index: {
    title: "Lernen",
    intro:
      "Kurze Erklärungen zu dem, was dieser Explorer anzeigt – geschrieben für Menschen, die Chia nutzen, nicht entwickeln. Jeder Artikel verlinkt auf die Seite, auf der Sie das Konzept live verfolgen können.",
    alsoWorth:
      "Ebenfalls einen Blick wert: der <prefarm>Prefarm-Tracker</prefarm>, die <docs>Hilfeseite</docs> zu dieser Website und die <status>Statusseite</status> für die Dienste, von denen sie abhängt.",
  },
  article: {
    breadcrumb: "Brotkrumennavigation",
    learn: "Lernen",
    minRead: "{minutes} min Lesezeit",
    moreArticles: "Weitere Artikel",
    allArticles: "Alle Artikel →",
  },
  whatIsChia: {
    title: "Was ist Chia?",
    summary:
      "Eine Blockchain, die durch Speicherplatz statt durch Strom oder Stake gesichert ist, mit Coins, die winzige Programme sind.",
    intro:
      "Chia ist eine öffentliche Blockchain, die 2021 gestartet ist. Ihre native Währung ist XCH. Wie bei Bitcoin entscheidet kein Unternehmen, wer Transaktionen ausführen darf, und jeder Full Node speichert eine Kopie der gesamten Historie. Anders als Bitcoin wird sie nicht durch das Verbrennen von Strom gesichert: Das Netzwerk wird durch <strong>Speicherplatz</strong> gesichert (siehe <pos>Proof of Space and Time</pos>). Jeder mit freiem Speicher kann an der Erzeugung von Blöcken teilnehmen – bei Chia heißt das <em>Farming</em>.",
    coinsTitle: "Coins statt Konten",
    coins:
      "Chia führt keine Guthaben auf Konten. Werte stecken in <strong>Coins</strong>, jeder mit einem Betrag in Mojos (ein XCH sind eine Billion Mojos) und einem <strong>Puzzle-Hash</strong>, dem Hash des kleinen Programms, das festlegt, wie der Coin ausgegeben werden darf. Wer einen Coin ausgibt, vernichtet ihn und erzeugt neue Coins; eine Adresse ist einfach ein Puzzle-Hash in einer lesefreundlicheren Form. Wenn diese Website ein „Adressguthaben“ anzeigt, summiert sie die nicht ausgegebenen Coins mit demselben Puzzle-Hash.",
    programsTitle: "Coins sind Programme",
    programs:
      "Das Programm hinter einem Coin ist in <strong>Chialisp</strong> geschrieben und läuft auf der CLVM, einer winzigen virtuellen Maschine, die jeder Node ausführt. Dadurch sind Token (<tokens>CATs</tokens>), NFTs, dezentrale Identitäten und <offers>Offers</offers> möglich, ohne dass das Protokoll sie gesondert behandeln muss: Es sind einfach Coins mit bestimmten Puzzles. Das erklärt auch das Wort <em>Kosten</em>, das Ihnen hier überall begegnet: Jede Ausgabe hat CLVM-Kosten, und ein Block kann höchstens 11 Milliarden davon aufnehmen.",
    blocksTitle: "Blöcke alle neun Sekunden, Transaktionen in einem Drittel davon",
    blocks:
      "Im Schnitt kommt alle 18,75 Sekunden ein neuer Block, aber nur etwa jeder dritte ist ein <strong>Transaktionsblock</strong>, der tatsächlich Ausgaben enthält; die übrigen tragen nur die Beweise, die die Chain am Laufen halten. Die <dashboard>Übersicht</dashboard> zeigt beide Arten und zählt bis zum nächsten Transaktionsblock herunter.",
    originTitle: "Woher die Coins kommen",
    origin:
      "Jeder Block zahlt 0,5 XCH an den Farmer und 1,5 XCH an den Pool des gewinnenden Plots (mit Halvings im Lauf der Zeit), sodass neue Coins in bekanntem Tempo in Umlauf kommen. Vor dem ersten Block hat Chia Network eine <prefarm>Prefarm</prefarm> von 21 Millionen XCH angelegt, die in öffentlich prüfbaren Verwahrungs-Wallets liegt.",
  },
  proofOfSpaceAndTime: {
    title: "Proof of Space and Time",
    summary:
      "Wie Plots, Challenges und verifizierbare Verzögerungsfunktionen entscheiden, wer den nächsten Block farmt.",
    intro:
      "Chias Konsens beantwortet dieselbe Frage wie das Mining bei Bitcoin – <em>wer darf den nächsten Block anhängen?</em> –, aber mit einer Lotterie, an der man teilnimmt, indem man Daten speichert, statt so schnell wie möglich Hashes zu berechnen.",
    spaceTitle: "Proof of Space",
    space:
      "Ein Farmer füllt Festplatten mit <strong>Plots</strong>: großen Dateien mit vorberechneten Hash-Tabellen. Alle paar Sekunden veröffentlicht das Netzwerk eine zufällige <strong>Challenge</strong>. Jeder Plot wird dagegen geprüft; ein Plot „gewinnt“, wenn er einen Beweis enthält, dessen Qualität eine durch die aktuelle <strong>Schwierigkeit</strong> festgelegte Schwelle übertrifft. Je mehr Speicherplatz Sie haben, desto mehr Lose halten Sie: Ihre Gewinnchance entspricht Ihrem Anteil am gesamten Speicherplatz, dem <em>Netspace</em>, der auf der <dashboard>Übersicht</dashboard> angezeigt wird. Einen Plot zu prüfen ist billig, daher verbraucht Farming etwa so viel Strom wie ein Computer im Leerlauf.",
    timeTitle: "Proof of Time",
    time: "Speicherplatz allein reicht nicht: Ein Farmer mit einer schnellen Maschine könnte versuchen, die Historie umzuschreiben, indem er Alternativen durchprobiert. Chia verzahnt deshalb jeden Block mit einer <strong>verifizierbaren Verzögerungsfunktion</strong> (VDF), die von <em>Timelords</em> berechnet wird. Eine VDF braucht eine feste Menge sequenzieller Rechenzeit, egal wie viele Prozessoren man hat, lässt sich aber schnell überprüfen. Die Chain kommt nur so schnell voran, wie echte Zeit vergeht – und genau das macht die zeitliche Position eines Blocks vertrauenswürdig.",
    signageTitle: "Signage Points und Infusion",
    signage:
      "Die Zeit ist in <strong>Sub-Slots</strong> von jeweils etwa 10 Minuten eingeteilt, die je 64 Signage Points umfassen. Challenges werden an Signage Points ausgegeben; ein gewinnender Beweis muss einige Signage Points später in die Chain <em>infundiert</em> werden, sobald der Timelord die zugehörige VDF erzeugt hat. Deshalb zeigt die Seite eines Blocks einen Signage-Point-Index, und deshalb können mehrere Farmer nahezu denselben Slot gewinnen: Das Protokoll lässt es zu, und die Chain wählt den schwereren Zweig. Wenn zwei Zweige kurz konkurrieren, sehen Sie auf der <blocks>Blöcke-Seite</blocks> einen <strong>Reorg</strong>; bei Chia sind diese meist nur einen Block tief.",
    youTitle: "Warum das für Sie wichtig ist",
    you: "Nichts an Ihrer Transaktion ändert, wie Blöcke gefunden werden. Was Sie steuern, ist die <strong>Gebühr</strong>: Sie entscheidet, wie schnell ein Farmer Ihre Ausgabe aufnimmt, sobald sie im <mempool>Mempool</mempool> liegt.",
  },
  farmingAndPlotting: {
    title: "Farming und Plotting",
    summary:
      "Was ein Plot ist, was ein Farmer alle neun Sekunden tut und welche Rolle Pools spielen.",
    plottingTitle: "Plotting",
    plotting:
      "Ein Plot ist eine Datei, typischerweise rund 100 GB groß, die ein Plotter einmal erzeugt und die dann jahrelang gefarmt wird. Beim Erstellen werden sieben Hash-Tabellen aufgebaut und sortiert, was eine Weile dauert und viel temporären Speicher braucht; diese Arbeit ist der „Proof of Work“, den Chia aus dem laufenden Betrieb herausnimmt, damit die fortlaufenden Kosten des Farmings nahe null liegen. Plots sind an ein <strong>Plot-NFT</strong> oder an Ihre eigenen Schlüssel gebunden – das entscheidet, wer bezahlt wird, wenn der Plot gewinnt.",
    farmingTitle: "Farming",
    farming:
      "Ein Farmer betreibt einen Full Node plus einen <em>Harvester</em> auf jedem Rechner mit Plots. An jedem Signage Point sucht der Harvester die Challenge in jedem Plot, und wenn ein Beweis von ausreichender Qualität existiert, baut der Farmer einen Block und verbreitet ihn. Der Full Node validiert die Blöcke aller anderen und hält die Kopie der Chain, die dieser Explorer über <settings>einen Node oder Coinset</settings> liest.",
    rewardsTitle: "Belohnungen",
    rewards:
      "Jeder Block erzeugt zwei Belohnungs-Coins: eine Farmer-Belohnung und eine Pool-Belohnung (0,25 und 0,75 XCH nach dem dritten Halving 2033, derzeit 0,5 und 1,5). Die <blocks>Block-Seite</blocks> listet die Belohnungs-Claims auf, die ein Transaktionsblock enthält, und die <pools>Pools-Seite</pools> ordnet die Pool-Belohnung dem Pool zu, an den sie ausgezahlt wurde.",
    poolsTitle: "Pools",
    pools:
      "Mit einer kleinen Farm vergehen womöglich Monate ohne Gewinn. Ein <strong>Pool</strong> gleicht das aus: Ihr Plot-NFT verweist auf den Pool, der Pool erhält die Belohnung von 1,5 XCH, sobald irgendein Mitglied gewinnt, und bezahlt die Mitglieder nach ihrem Anteil an eingereichten Teilbeweisen (Partials). Weil Pooling Teil des Protokolls ist, behalten Sie Ihre Schlüssel und wechseln den Pool, indem Sie Ihr Plot-NFT ausgeben – eine normale Transaktion, die Sie wie jede andere im Mempool finden.",
    hereTitle: "Was Sie hier sehen können",
    hereNetspace:
      "<dashboard>Netspace</dashboard>: der gesamte geplottete Speicherplatz, den das Netzwerk aus der jüngsten Schwierigkeit schätzt.",
    herePools: "<pools>Pool-Anteil</pools>: wer die Blöcke des letzten Tages gefarmt hat.",
    hereMap:
      "<map>Node-Karte</map>: wo sich die Full Nodes befinden, die die Introducer herausgeben.",
  },
  whatIsTheMempool: {
    title: "Was ist der Mempool?",
    summary:
      "Wo Spend Bundles warten, wie der Node sie für einen Block auswählt und was diese Website Ihnen darüber zeigt.",
    intro:
      "Wenn eine Wallet eine Transaktion sendet, landet sie nicht sofort in einem Block. Sie wird an Full Nodes verbreitet, die sie jeweils validieren und in ihren <strong>Mempool</strong> legen: den Warteraum für Ausgaben, die gültig, aber noch nicht bestätigt sind. Der nächste Farmer, der einen Transaktionsblock gewinnt, füllt ihn aus diesem Warteraum. Diese Website ist ein Fenster in den Mempool des Nodes, von dem sie liest.",
    bundlesTitle: "Spend Bundles statt Transaktionen",
    bundles:
      "Was im Mempool wartet, ist ein <strong>Spend Bundle</strong>: eine Menge von Coin-Ausgaben plus eine aggregierte Signatur. Eine einfache Zahlung gibt ein oder zwei Coins aus und erzeugt zwei (die Zahlung und das Wechselgeld); ein angenommenes Offer oder ein Token-Swap kann Dutzende ausgeben. Seine ID ist der Hash des Bundles, und genau die fügen Sie in die Suche ein, um es zu verfolgen.",
    fillTitle: "Wie ein Block gefüllt wird",
    fill: "Ein Block bietet Platz für 11 Milliarden Einheiten <strong>Kosten</strong>, und jedes Bundle belegt einen Teil davon. Der Node sortiert wartende Bundles nach <strong>Gebühr pro Kosten</strong> (Mojos pro Kosteneinheit), nimmt die bestbezahlten zuerst und hört auf, wenn der Block voll ist. Die Ansicht <dashboard>Nächster Block</dashboard> auf der Übersicht wendet dieselbe Packlogik auf den Live-Mempool an, sodass Sie ungefähr sehen, in welchem Block Ihre Ausgabe landen wird, und zusehen können, wie sich der Block füllt, während Bundles eintreffen.",
    feesTitle: "Gebühren",
    fees: "Meistens ist der Mempool nicht voll, und Ausgaben ohne Gebühr werden innerhalb weniger Blöcke bestätigt. Gebühren spielen in zwei Situationen eine Rolle: wenn der Mempool mehr enthält als das Limit des Nodes (Kosten im Umfang von zehn Blöcken), sodass nur noch Ausgaben mit Gebühr angenommen werden, und wenn mehr Bundles warten, als der nächste Block aufnehmen kann. Die <fees>Gebührenseite</fees> zeigt die eigene Schätzung des Nodes, um innerhalb von einer, fünf oder zehn Minuten in einen Block zu kommen, und was eine typische Überweisung bei diesem Satz kostet.",
    leavingTitle: "Den Mempool verlassen",
    leaving:
      "Ein Bundle verlässt den Mempool, wenn ein Block es aufnimmt (<em>bestätigt</em>), wenn einer seiner Coins zuerst von einem anderen Bundle ausgegeben wird, oder wenn der Node es nach einem Reorg verwirft oder weil es nicht mehr gültig ist (<em>entfernt</em>). Eine Transaktionsseite zeigt die Coins eines entfernten Bundles weiterhin an, wenn Coinset es erfasst hat; die Nodes selbst vergessen verworfene Bundles.",
    graphsTitle: "Die Diagramme lesen",
    graphsCost:
      "<strong>Genutzte Kosten</strong> zeigt, wie viel der Mempool-Kapazität belegt ist, aufgeteilt nach Gebührenband.",
    graphsIncoming:
      "<strong>Eingehend</strong> sind Bundles pro Minute, wie dieser Browser sie sieht.",
    graphsProjected:
      "<strong>Voraussichtliche Blöcke</strong> gruppieren die Warteschlange in Blöcke, in der Reihenfolge, in der der Node sie auswählen würde.",
  },
  offersAndTrading: {
    title: "Offers und Handel",
    summary:
      "Peer-to-Peer-Tausch von XCH, CATs und NFTs ohne Börse – und wie das on-chain aussieht.",
    intro:
      "Ein <strong>Offer</strong> ist eine halb fertige Transaktion: Der Maker signiert Coin-Ausgaben, die etwas hergeben (etwa 10 XCH), unter der Bedingung, dass ihm im selben Bundle etwas anderes gezahlt wird (etwa 1.000 eines Tokens). Das Offer ist eine Datei, die meist über einen Marktplatz wie Dexie geteilt wird. On-chain passiert nichts, bis ein <em>Taker</em> die andere Hälfte ergänzt und das ganze Bundle einreicht; dann werden beide Seiten atomar abgewickelt oder gar nicht.",
    noExchangeTitle: "Warum keine Börse nötig ist",
    noExchange:
      "Weil die Coins des Makers nur zusammen mit der Zahlung des Takers ausgegeben werden können, muss niemand einem Mittelsmann vertrauen. Der Maker behält die Verwahrung bis zum Moment des Tauschs, kann stornieren, indem er die angebotenen Coins selbst ausgibt, und kann ein Ablaufdatum setzen. Das funktioniert für XCH, CATs und NFTs gleichermaßen – so gibt es auf Chia NFT-Verkäufe, Token-Märkte und sogar Bundles aus mehreren Assets ohne verwahrende Börse.",
    onChainTitle: "Wie ein Offer on-chain aussieht",
    onChain:
      "Einmal angenommen, ist ein Offer ein gewöhnliches Spend Bundle: Auf seiner <mempool>Mempool</mempool>- und Transaktionsseite sehen Sie es als Offer oder Swap markiert, mit den gesendeten und empfangenen Assets jedes Beteiligten. Vorher weiß nur der Marktplatz davon; Coinset indexiert die Offers, die es sieht, und diese Website zeigt ihren Status auf den <tokens>Token</tokens>-, NFT- und Adressseiten sowie auf der eigenen Seite eines Offers, sobald Sie dessen ID kennen.",
    lifecycleTitle: "Lebenszyklus eines Offers",
    lifecycleOpen: "<strong>Offen</strong>: veröffentlicht, Coins noch nicht ausgegeben.",
    lifecycleTaking: "<strong>Wird angenommen</strong>: das Bundle eines Takers liegt im Mempool.",
    lifecycleTaken: "<strong>Angenommen</strong>: in einem Block bestätigt.",
    lifecycleCancelled:
      "<strong>Storniert</strong> oder <strong>abgelaufen</strong>: Der Maker hat die Coins anderweitig ausgegeben, oder das Ablaufdatum ist verstrichen.",
    clawbackTitle: "Clawbacks",
    clawback:
      "Eine verwandte Idee ist der <strong>Clawback</strong>: eine Zahlung, die der Absender für eine festgelegte Zeit zurückholen kann, bevor der Empfänger sie beanspruchen darf – ein Sicherheitsnetz gegen Zahlungen an die falsche Adresse. Solche Coins erscheinen auf einer <address>Adressseite</address> mit ihrem Timelock, bis sie beansprucht oder widerrufen werden.",
  },
  questions: {
    title: "Häufige Fragen",
    summary:
      "Kurze Antworten auf das, was am häufigsten gefragt wird: Gebühren, Bestätigungen, Coins, Adressen und Reorgs.",
    pending: {
      q: "Meine Transaktion ist ausstehend. Wie lange dauert es?",
      a: "Schlagen Sie sie nach: Die Transaktionsseite zeigt den voraussichtlichen Block und die voraussichtliche Zeit, je nachdem, wo das Bundle steht, wenn der Mempool nach Gebühr pro Kosten sortiert ist. Bei leerem Mempool landet eine Ausgabe ohne Gebühr im nächsten Transaktionsblock, meist innerhalb einer Minute.",
    },
    fee: {
      q: "Wie viel Gebühr sollte ich zahlen?",
      a: "Meist gar keine. Wenn der Mempool ausgelastet ist, zeigt die <fees>Gebührenseite</fees> die Schätzung des Nodes pro Zielzeit; 5 Mojos pro Kosteneinheit ist der Satz, ab dem eine Ausgabe eine günstigere ersetzt, und eine typische Überweisung kostet einige Millionen Kosteneinheiten – selbst eine „hohe“ Gebühr ist also ein Bruchteil eines Cents.",
    },
    confirmations: {
      q: "Wie viele Bestätigungen brauche ich?",
      a: "Reorgs sind bei Chia fast immer nur einen Block tief, daher betrachten die meisten Wallets eine Ausgabe nach einer Handvoll Blöcken als endgültig; Börsen warten länger. Die Block-Seite zeigt, wie viele Blöcke auf einem bestimmten Block liegen.",
    },
    ids: {
      q: "Was ist der Unterschied zwischen einer Coin-ID, einer Transaktions-ID und einem Puzzle-Hash?",
      a: "Eine <strong>Coin-ID</strong> bezeichnet einen Coin (Hash aus Eltern-Coin, Puzzle-Hash und Betrag). Eine <strong>Transaktions-ID</strong> bezeichnet ein Spend Bundle. Ein <strong>Puzzle-Hash</strong> ist das, was eine Adresse kodiert: die Ausgaberegel, an die Coins gebunden sind. Die Suche akzeptiert alle drei und erkennt selbst, was was ist.",
    },
    coins: {
      q: "Warum zeigt meine Adresse mehr Coins als Transaktionen?",
      a: "Wallets teilen Wechselgeld auf mehrere Coins auf, und CATs, NFTs und DIDs sind umhüllte Coins, die nur per <em>Hint</em> auf Ihre Adresse verweisen. Die Adressseite zählt sowohl die einfachen XCH-Coins als auch die per Hint zugeordneten.",
    },
    reorg: {
      q: "Was ist ein Reorg, und ist meine Transaktion verloren?",
      a: "Ein Reorg ersetzt den oder die neuesten Blöcke durch einen konkurrierenden Zweig. Ihre Ausgabe kehrt in den Mempool zurück und wird normalerweise einen Block später erneut aufgenommen; die <blocks>Blöcke-Seite</blocks> listet jüngste Reorgs und ihre Tiefe auf.",
    },
    data: {
      q: "Woher bezieht diese Website ihre Daten?",
      a: "Von Coinsets öffentlicher Full-Node- und Index-API, von Dexie für Token-Namen und -Icons und von MintGarden für NFTs – alles direkt von Ihrem Browser abgerufen; in den <settings>Einstellungen</settings> können Sie auf Ihren eigenen Node umstellen. Die <status>Statusseite</status> zeigt, ob jeder dieser Dienste gerade erreichbar ist.",
    },
    prefarm: {
      q: "Was ist die Prefarm?",
      a: "Die 21 Millionen XCH, die Chia Network vor dem ersten Block erzeugt hat, verwahrt in vier Wallets mit öffentlichen Prüfregeln. Der <prefarm>Prefarm-Tracker</prefarm> liest ihre On-Chain-Guthaben.",
    },
  },
};

export default messages;
