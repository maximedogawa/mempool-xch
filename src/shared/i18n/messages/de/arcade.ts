import type { Translation } from "../../translate";
import type en from "../en/arcade";

const messages: Translation<typeof en> = {
  title: "Arcade",
  titleHint:
    "Spiele auf Basis des Chia-Gaming-Protokolls: Zwei Spieler sperren einen Einsatz in einem State Channel on-chain, spielen off-chain mit kryptografischer Fairness (Mental Poker für Karten) und rechnen das Ergebnis wieder on-chain ab. Zum Spielen brauchen Sie eine Chia-Wallet mit Gaming-Protokoll; jedes Spiel öffnet sich auf der Website des Trackers.",
  games: "Spiele",
  filterByGenre: "Nach Genre filtern",
  allGenres: "alle",
  disclaimer:
    "Die Spiele sind so aufgeführt, wie ihre Entwickler sie beim <link>{tracker}-Tracker</link> registriert haben; mempoolxch.space prüft sie nicht, und die Einsätze sind echte XCH.",
  game: {
    verified: "verifiziert",
    developer: "Entwickler",
    stake: "Einsatz",
    licence: "Lizenz",
    plays: "Partien",
    howToPlay: "Spielanleitung",
    hideHowToPlay: "Spielanleitung ausblenden",
    play: "Spielen",
    homepage: "Website",
  },
  rooms: {
    title: "Spielräume",
    live: "live · {seconds} s",
    loading: "Wird geladen…",
    snapshot: "Snapshot {date}",
    searchPlaceholder: "Spiel oder Spieler suchen",
    searchLabel: "Räume durchsuchen",
    phases: {
      waiting: "Wartet auf Gegner",
      playing: "Im Spiel",
      closed: "Geschlossen",
    },
    countOf: "{shown} von {total}",
    noMatch: "Kein Treffer.",
    noneNow: "Derzeit keine.",
    table: "Tisch",
    join: "beitreten",
    watch: "zuschauen",
    noPlayers: "noch keine Spieler",
    versusSeparator: " vs. ",
    online: "{count} online",
    wager: "{amount} Einsatz",
    gamesPlayed: { one: "{count} Partie", other: "{count} Partien" },
    announced: {
      one: "<b>{count}</b> Raum beim Tracker angekündigt{breakdown}.",
      other: "<b>{count}</b> Räume beim Tracker angekündigt{breakdown}.",
    },
    breakdown: " ({list})",
    openArcade: "Arcade öffnen",
  },
  potato: {
    hint: "Ein Heiße-Kartoffel-Spiel komplett on-chain: Wer den Kartoffel-Coin {hours} Stunden lang hält, behält den Pot. Vorher kann ihn jeder schnappen, indem er {price} in den Pot und {royalty} an jeden vorherigen Halter zahlt. Der Zustand hier wird ausschließlich aus der Coin-Abstammung auf Coinset gelesen.",
    live: "folgt dem Coin live",
    unreachable: "Coinset nicht erreichbar, Snapshot wird angezeigt",
    snapshot: "Snapshot {date}",
    heldLongEnough: "Lange genug gehalten",
    untilKeeps: "Bis der Halter alles behält",
    roundOver: "Runde vorbei",
    ripe: "reif",
    ended: "Die Kartoffel wurde beansprucht oder durchgereicht; die Runde ist beendet.",
    ripeNote:
      "Die Frist ist abgelaufen: Der Pot gehört jetzt dem Halter, es gibt nichts zu beanspruchen.",
    deadline: "Frist {date} · plus/minus {buffer} s, der Zeitstempel des Schnappens entscheidet",
    meter: "Bereits abgelaufener Anteil der Haltezeit",
    held: "gehalten {time}",
    hold: "{hours} h Haltezeit",
    inPot: "Im Pot",
    snatches: "Geschnappt",
    nextCost: "Nächstes Schnappen kostet",
    nextCostNote: "{price} in den Pot + Royalties",
    taken: "Übernommen",
    inBlock: "in Block <link>#{height}</link>",
    coinNote:
      "Kartoffel-Coin <hash></hash> · der Halter steckt in einem Clawback, daher zeigt die Chain eine Merkle-Root statt einer Adresse.",
  },
};

export default messages;
