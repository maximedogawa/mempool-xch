import type { Translation } from "../../translate";
import type en from "../en/map";

const messages: Translation<typeof en> = {
  title: "Mapa de la red",
  titleHint:
    "Las cifras proceden de una instantánea del panel público Peer Info de Chia. Los marcadores de país muestran poblaciones agregadas de nodos en puntos representativos. Si falta la instantánea o tiene más de 30 días, la página pasa a consultar desde tu navegador los introductores DNS de Chia.",
  intro:
    "Dónde están los nodos completos de Chia, qué versión ejecutan y qué está haciendo la red ahora mismo. Busca o elige una región para acotar el mapa y luego haz clic en un país para ver su detalle.",
  stats: {
    fullNodes: "Nodos completos",
    fullNodesSub: "vistos en los últimos 5 días",
    fullNodesHint:
      "Población de nodos completos que informa el panel Peer Info de Chia en una ventana de cinco días.",
    reliable: "Fiables",
    reliableSub: "{share} de la red",
    reliableHint:
      "Nodos lo bastante estables como para que el rastreador los reparta a través de los introductores DNS.",
    ipv6: "IPv6",
    ipv6Sub: { one: "{count} nodo", other: "{count} nodos" },
    ipv6Hint:
      "Parte de la población que el rastreador alcanzó por IPv6. Un nodo puede responder por ambos.",
    countries: "Países",
    countriesSub: { one: "{count} nodo ubicado", other: "{count} nodos ubicados" },
    countriesHint:
      "Países que informó el rastreador, todos con un punto representativo en el mapa.",
    concentration: "Concentración",
    concentrationValue: { one: "{count} país", other: "{count} países" },
    concentrationSub: "{country} tiene el {share}",
    concentrationHint:
      "Cuántos de los países más grandes hacen falta para reunir la mitad de todos los nodos completos.",
    snapshot: "Instantánea",
    snapshotSub: "última observación",
    unavailable: "no disponible",
    snapshotHint: "Antigüedad de la captura del panel en la que se basa esta página.",
  },
  mapCard: {
    title: "Nodos completos de Chia — en vivo",
    modelledReach: "Alcance modelado",
    zoomIn: "Acercar",
    zoomOut: "Alejar",
    resetView: "Restablecer la vista del mapa",
    reset: "restablecer",
    searchLabel: "Filtrar el mapa por país o región",
    searchPlaceholder: "filtrar el mapa — país, código o región",
    suggestionNodes: { one: "{count} nodo", other: "{count} nodos" },
    filteredSummary: "{shown} de {total} países · {nodes} nodos ({share})",
    summary: "{nodes} nodos completos · {countries} países",
    controls: "arrastra para mover · doble clic o ⌘/ctrl + rueda para hacer zoom · {scale}×",
    noMatch: "Ningún país coincide con «{query}».",
    modelLegend:
      "Los países nuevos o que han cambiado desde la última instantánea o respuesta del escaneo aparecen creciendo o emiten un anillo. Los pulsos (ámbar: nuevo pico, verde: lote del mempool) y los arcos de alcance son un modelo: caen en países ponderados por número de nodos, no donde se originó un bloque o un spend bundle.",
  },
  fallback: {
    missing: "Falta la instantánea del panel o no se puede leer.",
    stale:
      "La instantánea del panel es del {date}, de hace más de {days} días, así que ya no muestra la red tal como es.",
    network: "La instantánea del panel solo cubre mainnet, no {network}.",
    scan: "Este mapa muestra en su lugar el escaneo de seeders en vivo: los nodos que tu navegador encuentra al consultar los introductores DNS de Chia, ubicados por GeoJS. Ve unos cientos de nodos, no toda la red.",
  },
  scan: {
    found: "Nodos encontrados",
    foundSub: {
      one: "de {count} respuesta de seeder",
      other: "de {count} respuestas de seeders",
    },
    foundHint:
      "Direcciones de nodos completos que los introductores DNS entregaron a este navegador, guardadas una semana en el almacenamiento local.",
    located: "Ubicados",
    locatedSub: {
      one: "{count} a la espera de ubicación",
      other: "{count} a la espera de ubicación",
    },
    locatedHint:
      "Nodos encontrados que GeoJS pudo ubicar. Los porcentajes de esta página son sobre estos nodos.",
    countriesHint: "Países donde están los nodos ubicados, cada uno en un punto representativo.",
    lastAnswer: "Última respuesta",
    lastAnswerHint: "Mientras la página está visible, se consulta un introductor cada 6 segundos.",
    scanning: "escaneando",
    pausedHidden: "en pausa mientras la pestaña está oculta",
    snapshotSub: "escaneo de seeders en su lugar",
    logTitle: "Escaneo de seeders",
    logAction: "un introductor cada {seconds} s",
    logWaiting: "Consultando el primer introductor…",
    logEntry: "{answered} respondidos · {added} nuevos",
    logError: "sin respuesta",
    source:
      "Fuente: el escaneo de seeders de este navegador (introductores DNS de Chia a través de Cloudflare DNS, con dns.google como alternativa; ubicaciones de GeoJS). Solo se envían direcciones de nodos a un servicio de geolocalización, nunca la del visitante.",
  },
  worldMap: {
    label: "Mapa mundial de {nodes} nodos de Chia observados en {countries} países",
    marker: {
      one: "{country}: {count} nodo, puesto {rank}",
      other: "{country}: {count} nodos, puesto {rank}",
    },
    peer: "Par conectado {host} cerca de {place}",
  },
  activity: {
    title: "Actividad en vivo vista por este nodo",
    counts: "{blocks} bloques · {bundles} bundles",
    waiting: "Esperando el primer evento…",
    newPeak: "Nuevo pico <link>#{height}</link>",
  },
  versions: {
    title: "Versiones de los nodos",
    reporting: {
      one: "{count} nodo informa su versión",
      other: "{count} nodos informan su versión",
    },
    empty: "La instantánea no incluye el panel de versiones.",
    note: "Los porcentajes son sobre los {reporting} nodos cuya versión conoce el rastreador ({coverage} de la población).",
    noteNewest:
      "Los porcentajes son sobre los {reporting} nodos cuya versión conoce el rastreador ({coverage} de la población); {newest} es la compilación más reciente informada.",
  },
  regions: {
    title: "Regiones",
    action: "haz clic para filtrar el mapa",
    names: {
      europe: "Europa",
      asia: "Asia",
      northAmerica: "Norteamérica",
      southAmerica: "Sudamérica",
      africa: "África",
      oceania: "Oceanía",
      unmapped: "Sin ubicar",
    },
  },
  reach: {
    title: "Conectividad",
    action: "ventana de rastreo de cinco días",
    ipv4: "IPv4",
    ipv6: "IPv6",
    reliable: "Fiables",
    ipv4Hint: "Nodos que el rastreador alcanzó por IPv4 en los últimos cinco días.",
    ipv6Hint: "Nodos que el rastreador alcanzó por IPv6 en los últimos cinco días.",
    reliableHint:
      "Nodos lo bastante estables como para que el rastreador los reparta a través de los introductores DNS.",
    overlap:
      "Los porcentajes de IPv4 e IPv6 se solapan: un nodo de doble pila cuenta en ambos, así que suman más que la población.",
  },
  countries: {
    title: "Países",
    titleFiltered: "Países — filtrados",
    action: "{nodes} nodos en {countries} países",
    scanWaiting: "Todavía no hay ningún nodo ubicado; el escaneo de seeders sigue en marcha.",
    noMatch: "Ningún país coincide con el filtro actual.",
    tableLabel: "Países",
    country: "País",
    region: "Región",
    nodes: "Nodos",
    share: "Porcentaje",
    showTop: "Mostrar solo los {count} primeros",
    showAll: "Mostrar los {count} países",
  },
  about: {
    title: "Qué es este mapa",
    shows:
      "<b>Qué muestra.</b> Poblaciones de nodos completos por país del panel Peer Info de Chia, capturadas {age}, además de los pares conectados de un nodo configurado. El tamaño del marcador es el número de nodos; el color, la región.",
    showsScan:
      "<b>Qué muestra.</b> Los nodos completos que tu navegador ha encontrado a través de los introductores DNS de Chia, agrupados por el país en que GeoJS los ubica, además de los pares conectados de un nodo configurado. El tamaño del marcador es el número de nodos; el color, la región.",
    notShows:
      "<b>Qué no es.</b> Chia no publica las coordenadas de los nodos, ni dónde se farmeó un bloque ni de dónde vino un spend bundle. Los marcadores están en un punto representativo por país, y los arcos de alcance y los pulsos son un modelo de propagación, no una ruta de paquetes.",
  },
  source:
    "Fuente: <link>panel Peer Info de Chia</link>, observado el {observed} UTC. El panel de países abarca {placed} de los {total} nodos que informa el panel de población. Solo se envían direcciones de nodos a un servicio de geolocalización, nunca la del visitante.",
  sourceGap:
    "Fuente: <link>panel Peer Info de Chia</link>, observado el {observed} UTC. El panel de países abarca {placed} de los {total} nodos que informa el panel de población; la diferencia de {gap} nodos se debe a dos consultas separadas del panel, no a un error de redondeo. Solo se envían direcciones de nodos a un servicio de geolocalización, nunca la del visitante.",
  attribution:
    "Estadísticas de nodos de Chia Network Inc., de su <link>panel público Peer Info</link>, importadas a mano como instantánea estática.",
  history: {
    title: "La red a lo largo del tiempo",
    action: "cada 3 días · últimos dos años",
    seriesLabel: "Serie",
    total: "Nodos completos",
    capacity: "Fiables",
    ipv4: "IPv4",
    ipv6: "IPv6",
    chartLabel: "{series} a lo largo del tiempo",
    note: "Las series del rastreador del panel Peer Info, una muestra cada tres días, hasta la instantánea.",
    versionsTitle: "Versiones a lo largo del tiempo",
    versionsAction: "cada 3 días · último año",
    versionsLabel: "Nodos por versión a lo largo del tiempo",
    versionsLegend: "Versiones",
    otherVersions: "otras",
  },
  asns: {
    title: "Operadores de red",
    action: {
      one: "{count} sistema autónomo",
      other: "{count} sistemas autónomos",
    },
    tableLabel: "Operadores de red",
    organization: "Operador",
    asn: "ASN",
    nodes: "Nodos",
    share: "Porcentaje",
    note: "Los {shown} mayores de los {count} operadores (sistemas autónomos) que encontró el rastreador; juntos alojan el {share} de los nodos que pudo asignar a uno.",
  },
  ownNodeHint: "Apunta los ajustes a tu propio nodo para ver también aquí sus pares conectados.",
  detail: {
    nodes: "Nodos",
    share: "Porcentaje",
    rank: "Puesto",
    region: "Región",
    yourPeers: "Tus pares",
    lastSeen: "Visto por última vez",
    note: "Estimación del panel en un punto representativo, no un nodo localizado.",
    noteScan:
      "Porcentaje de los nodos que este navegador ha ubicado, dibujado en un punto representativo.",
  },
  peers: {
    errorTitle: "No se pudieron leer las conexiones",
    errorDescription: "Tu nodo no respondió a get_connections.",
    none: "No se han informado conexiones con pares.",
    title: "Conexiones de tu nodo",
    action: {
      one: "{count} par · se actualiza cada 15 s",
      other: "{count} pares · se actualiza cada 15 s",
    },
    tableLabel: "Conexiones",
    peer: "Par",
    type: "Tipo",
    location: "Ubicación",
    network: "Red",
    peakHeight: "Altura del pico",
    sentReceived: "Enviado / recibido",
    connected: "Conectado",
    unknownType: "Tipo {type}",
    types: {
      fullNode: "Nodo completo",
      harvester: "Harvester",
      farmer: "Farmer",
      timelord: "Timelord",
      introducer: "Introductor",
      wallet: "Billetera",
    },
  },
};

export default messages;
