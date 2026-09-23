import type { Translation } from "../../translate";
import type en from "../en/arcade";

const messages: Translation<(typeof en)["messages"]> = {
  title: "Arcade",
  titleHint:
    "Juegos creados con el protocolo de juegos de Chia: dos jugadores bloquean una apuesta en un canal de estado en la cadena, juegan fuera de la cadena con equidad criptográfica (póker mental para las cartas) y liquidan el resultado de vuelta en la cadena. Para jugar necesitas una billetera de Chia con el protocolo de juegos; cada juego se abre en el sitio del propio tracker.",
  games: "Juegos",
  filterByGenre: "Filtrar por género",
  allGenres: "todos",
  disclaimer:
    "Los juegos aparecen tal como sus desarrolladores los registraron en el <link>tracker {tracker}</link>; mempoolxch.space no los revisa y las apuestas son XCH reales.",
  game: {
    verified: "verificado",
    developer: "Desarrollador",
    stake: "Apuesta",
    licence: "Licencia",
    plays: "Partidas",
    howToPlay: "Cómo jugar",
    hideHowToPlay: "Ocultar cómo jugar",
    play: "Jugar",
    homepage: "Sitio web",
  },
  rooms: {
    title: "Salas de juego",
    live: "en vivo · {seconds} s",
    loading: "Cargando…",
    snapshot: "instantánea {date}",
    searchPlaceholder: "Buscar juego o jugador",
    searchLabel: "Buscar salas",
    phases: {
      waiting: "Esperando rival",
      playing: "En juego",
      closed: "Cerrada",
    },
    countOf: "{shown} de {total}",
    noMatch: "Sin resultados.",
    noneNow: "Ninguna ahora mismo.",
    table: "Mesa",
    join: "unirse",
    watch: "ver",
    noPlayers: "aún sin jugadores",
    versusSeparator: " vs ",
    online: "{count} en línea",
    wager: "apuesta de {amount}",
    gamesPlayed: { one: "{count} partida", other: "{count} partidas" },
    announced: {
      one: "<b>{count}</b> sala anunciada en el tracker{breakdown}.",
      other: "<b>{count}</b> salas anunciadas en el tracker{breakdown}.",
    },
    breakdown: " ({list})",
    openArcade: "Abrir el arcade",
  },
  potato: {
    hint: "Un juego de la patata caliente totalmente en la cadena: quien tenga la moneda patata durante {hours} horas se queda con el bote. Antes de eso, cualquiera puede arrebatarla pagando {price} al bote más {royalty} a cada poseedor anterior. El estado que ves aquí se lee solo del linaje de la moneda en Coinset.",
    live: "siguiendo la moneda en vivo",
    unreachable: "Coinset no disponible, mostrando la instantánea",
    snapshot: "instantánea {date}",
    heldLongEnough: "Retenida el tiempo suficiente",
    untilKeeps: "Hasta que el poseedor se lo quede todo",
    roundOver: "ronda terminada",
    ripe: "madura",
    ended: "La patata se reclamó o se pasó; la ronda ha terminado.",
    ripeNote: "El plazo ha vencido: el bote ya es XCH del poseedor, no hay nada que reclamar.",
    deadline:
      "plazo {date} · con un margen de {buffer} s, decide la marca de tiempo del propio arrebato",
    meter: "Parte del tiempo de retención ya cumplida",
    held: "retenida {time}",
    hold: "retención de {hours} h",
    inPot: "En el bote",
    snatches: "Arrebatos",
    nextCost: "El próximo arrebato cuesta",
    nextCostNote: "{price} al bote + regalías",
    taken: "Tomada",
    inBlock: "en el bloque <link>#{height}</link>",
    coinNote:
      "Moneda patata <hash></hash> · el poseedor está envuelto en un clawback, así que la cadena muestra una raíz de Merkle en lugar de una dirección.",
  },
};

export default messages;
