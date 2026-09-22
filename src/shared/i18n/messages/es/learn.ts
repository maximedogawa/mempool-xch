import type { Translation } from "../../translate";
import type en from "../en/learn";

const messages: Translation<typeof en> = {
  index: {
    title: "Aprender",
    intro:
      "Explicaciones breves de lo que muestra este explorador, escritas para quienes usan Chia, no para quienes lo desarrollan. Cada artículo enlaza a la página donde puedes ver el concepto en vivo.",
    alsoWorth:
      "También vale la pena echar un vistazo al <prefarm>seguimiento del prefarm</prefarm>, a la <docs>página de ayuda</docs> sobre este sitio y a la <status>página de estado</status> de los servicios de los que depende.",
  },
  article: {
    breadcrumb: "Ruta de navegación",
    learn: "Aprender",
    minRead: "{minutes} min de lectura",
    moreArticles: "Más artículos",
    allArticles: "Todos los artículos →",
  },
  whatIsChia: {
    title: "¿Qué es Chia?",
    summary:
      "Una blockchain protegida por espacio en disco en lugar de electricidad o stake, con monedas que son pequeños programas.",
    intro:
      "Chia es una blockchain pública que se lanzó en 2021. Su moneda nativa es XCH. Como en Bitcoin, no hay ninguna empresa que decida quién puede hacer transacciones, y cada nodo completo guarda una copia de todo el historial. A diferencia de Bitcoin, no se protege quemando electricidad: la red se protege con <strong>espacio en disco</strong> (consulta <pos>prueba de espacio y tiempo</pos>). Cualquiera con almacenamiento libre puede participar en la producción de bloques, lo que Chia llama <em>farming</em>.",
    coinsTitle: "Monedas, no cuentas",
    coins:
      "Chia no guarda saldos en cuentas. El valor vive en <strong>monedas</strong> (coins), cada una con un importe en mojos (un XCH son un billón de mojos) y un <strong>puzzle hash</strong>, el hash del pequeño programa que decide cómo se puede gastar la moneda. Gastar una moneda la destruye y crea monedas nuevas; una dirección es simplemente un puzzle hash escrito de forma más legible. Cuando este sitio muestra un «saldo de la dirección», está sumando las monedas no gastadas que comparten un mismo puzzle hash.",
    programsTitle: "Las monedas son programas",
    programs:
      "El programa detrás de una moneda está escrito en <strong>Chialisp</strong> y se ejecuta en la CLVM, una pequeña máquina virtual que ejecuta cada nodo. Eso es lo que hace posibles los tokens (<tokens>CAT</tokens>), los NFT, las identidades descentralizadas y las <offers>ofertas</offers> sin tratarlos como casos especiales en el protocolo: son solo monedas con puzzles concretos. También explica la palabra <em>coste</em> que verás por todas partes aquí: cada gasto tiene un coste CLVM, y un bloque puede llevar como máximo 11 mil millones.",
    blocksTitle: "Bloques cada nueve segundos, transacciones en un tercio de ellos",
    blocks:
      "Llega un bloque nuevo de media cada 18,75 segundos, pero solo alrededor de uno de cada tres es un <strong>bloque de transacciones</strong> que realmente incluye gastos; los demás solo llevan las pruebas que mantienen la cadena en marcha. El <dashboard>panel</dashboard> muestra ambos tipos y hace una cuenta atrás hasta el siguiente bloque de transacciones.",
    originTitle: "De dónde salieron las monedas",
    origin:
      "Cada bloque paga 0,5 XCH al farmer y 1,5 XCH al pool del plot ganador (con halvings a lo largo del tiempo), así que las monedas nuevas entran en circulación a un ritmo conocido. Antes del primer bloque, Chia Network creó un <prefarm>prefarm</prefarm> de 21 millones de XCH guardado en billeteras de custodia auditables públicamente.",
  },
  proofOfSpaceAndTime: {
    title: "Prueba de espacio y tiempo",
    summary:
      "Cómo los plots, los desafíos y las funciones de retardo verificables deciden quién hace farming del siguiente bloque.",
    intro:
      "El consenso de Chia responde a la misma pregunta que la minería de Bitcoin, <em>¿quién puede añadir el siguiente bloque?</em>, pero con una lotería en la que participas almacenando datos en lugar de calculando hashes lo más rápido posible.",
    spaceTitle: "Prueba de espacio",
    space:
      "Un farmer llena discos con <strong>plots</strong>: archivos grandes de tablas de hash precalculadas. Cada pocos segundos la red publica un <strong>desafío</strong> aleatorio. Cada plot se comprueba contra él; un plot «gana» cuando contiene una prueba cuya calidad supera un umbral fijado por la <strong>dificultad</strong> actual. Cuanto más espacio tengas, más boletos de lotería tienes: tu probabilidad de ganar es tu parte del espacio total, el <em>netspace</em> que se muestra en el <dashboard>panel</dashboard>. Comprobar un plot es barato, así que el farming consume más o menos lo que un ordenador en reposo.",
    timeTitle: "Prueba de tiempo",
    time: "El espacio por sí solo no basta: un farmer con una máquina rápida podría intentar reescribir la historia probando alternativas una tras otra. Por eso Chia intercala cada bloque con una <strong>función de retardo verificable</strong> (VDF) calculada por los <em>timelords</em>. Una VDF requiere una cantidad fija de tiempo secuencial para calcularse, sin importar cuántos procesadores tengas, y aun así se verifica rápidamente. La cadena avanza solo tan rápido como pasa el tiempo real, y eso es lo que hace fiable la posición de un bloque en el tiempo.",
    signageTitle: "Signage points e infusión",
    signage:
      "El tiempo se divide en <strong>sub-slots</strong> de 64 signage points, de unos 10 minutos cada uno. Los desafíos se emiten en los signage points; una prueba ganadora debe <em>infundirse</em> en la cadena unos signage points después, una vez que el timelord ha producido la VDF correspondiente. Por eso la página de un bloque muestra un índice de signage point y por eso varios farmers pueden ganar casi el mismo slot: el protocolo lo permite y la cadena elige la rama más pesada. Cuando dos ramas compiten un momento, ves un <strong>reorg</strong> en la <blocks>página de bloques</blocks>; en Chia suelen tener un solo bloque de profundidad.",
    youTitle: "Por qué te importa",
    you: "Nada de tu transacción cambia cómo se encuentran los bloques. Lo que tú controlas es la <strong>comisión</strong>, que decide con qué rapidez un farmer incluye tu gasto una vez que está en la <mempool>mempool</mempool>.",
  },
  farmingAndPlotting: {
    title: "Farming y plotting",
    summary: "Qué es un plot, qué hace un farmer cada nueve segundos y qué papel tienen los pools.",
    plottingTitle: "Plotting",
    plotting:
      "Un plot es un archivo, normalmente de unos 100 GB, que un plotter produce una sola vez y que luego se usa para farming durante años. Crearlo implica construir siete tablas de hash y ordenarlas, lo que lleva un rato y mucho espacio temporal; ese trabajo es la «prueba de trabajo» que Chia saca del camino para que el coste continuo del farming sea casi nulo. Los plots están vinculados a un <strong>plot NFT</strong> o a tus propias claves, y eso decide quién cobra cuando el plot gana.",
    farmingTitle: "Farming",
    farming:
      "Un farmer ejecuta un nodo completo más un <em>harvester</em> en cada máquina con plots. En cada signage point el harvester busca el desafío en cada plot y, si existe una prueba de calidad suficiente, el farmer construye un bloque y lo difunde. El nodo completo valida los bloques de todos los demás y guarda la copia de la cadena que este explorador lee a través de <settings>un nodo o Coinset</settings>.",
    rewardsTitle: "Recompensas",
    rewards:
      "Cada bloque crea dos monedas de recompensa: una recompensa para el farmer y otra para el pool (0,25 y 0,75 XCH tras el tercer halving en 2033; actualmente 0,5 y 1,5). La <blocks>página del bloque</blocks> lista los cobros de recompensa que incorpora un bloque de transacciones, y la <pools>página de pools</pools> atribuye la recompensa del pool al pool al que se pagó.",
    poolsTitle: "Pools",
    pools:
      "Con una granja pequeña puedes pasar meses sin ganar. Un <strong>pool</strong> lo suaviza: tu plot NFT apunta al pool, el pool recibe la recompensa de 1,5 XCH cada vez que gana cualquier miembro y paga a los miembros según su parte de las pruebas parciales enviadas. Como el pooling forma parte del protocolo, conservas tus claves y cambias de pool gastando tu plot NFT, que es una transacción normal que puedes encontrar en la mempool como cualquier otra.",
    hereTitle: "Qué puedes ver aquí",
    hereNetspace:
      "<dashboard>Netspace</dashboard>: el espacio total en plots que la red estima a partir de la dificultad reciente.",
    herePools: "<pools>Cuota de pools</pools>: quién hizo farming de los bloques del último día.",
    hereMap:
      "<map>Mapa de nodos</map>: dónde se encuentran los nodos completos que reparten los introductores DNS.",
  },
  whatIsTheMempool: {
    title: "¿Qué es la mempool?",
    summary:
      "Dónde esperan los spend bundles, cómo el nodo los elige para un bloque y qué te muestra este sitio sobre ello.",
    intro:
      "Cuando una billetera envía una transacción, no entra directamente en un bloque. Se difunde a los nodos completos, y cada uno la valida y la pone en su <strong>mempool</strong>: la sala de espera de los gastos que son válidos pero aún no están confirmados. El próximo farmer que gane un bloque de transacciones lo llena desde esa sala. Este sitio es una ventana a la mempool del nodo del que lee.",
    bundlesTitle: "Spend bundles, no transacciones",
    bundles:
      "Lo que espera en la mempool es un <strong>spend bundle</strong>: un conjunto de gastos de monedas más una firma agregada. Un pago sencillo gasta una o dos monedas y crea dos (el pago y el cambio); aceptar una oferta o un swap de tokens puede gastar docenas. Su ID es el hash del bundle, y eso es lo que pegas en la búsqueda para seguirlo.",
    fillTitle: "Cómo se llena un bloque",
    fill: "Un bloque tiene espacio para 11 mil millones de unidades de <strong>coste</strong>, y cada bundle usa parte de él. El nodo ordena los bundles en espera por <strong>comisión por coste</strong> (mojos por unidad de coste), toma primero los que mejor pagan y se detiene cuando el bloque está lleno. La vista <dashboard>próximo bloque</dashboard> del panel aplica el mismo empaquetado a la mempool en vivo, para que veas aproximadamente en qué bloque entrará tu gasto y cómo se llena el bloque a medida que llegan bundles.",
    feesTitle: "Comisiones",
    fees: "La mayor parte del tiempo la mempool no está llena y los gastos sin comisión se confirman en pocos bloques. Las comisiones empiezan a importar en dos situaciones: cuando la mempool contiene más que el límite del nodo (el coste de diez bloques), de modo que solo se aceptan gastos que pagan, y cuando esperan más bundles de los que puede llevar el siguiente bloque. La <fees>página de comisiones</fees> muestra la estimación del propio nodo para entrar en un bloque en uno, cinco o diez minutos y lo que cuesta una transferencia típica a esa tasa.",
    leavingTitle: "Salir de la mempool",
    leaving:
      "Un bundle sale de la mempool cuando un bloque lo incluye (<em>confirmado</em>), cuando otro bundle gasta antes una de sus monedas, o cuando el nodo lo descarta tras un reorg o porque ya no es válido (<em>eliminado</em>). La página de una transacción sigue mostrando las monedas de un bundle eliminado si Coinset lo registró; los propios nodos olvidan los bundles descartados.",
    graphsTitle: "Cómo leer los gráficos",
    graphsCost:
      "<strong>Coste usado</strong> es cuánta capacidad de la mempool está ocupada, dividida por franja de comisión.",
    graphsIncoming:
      "<strong>Entrantes</strong> son los bundles por minuto tal como los ve este navegador.",
    graphsProjected:
      "<strong>Bloques previstos</strong> agrupan la cola en bloques en el orden en que el nodo los elegiría.",
  },
  offersAndTrading: {
    title: "Ofertas y trading",
    summary:
      "Intercambios peer-to-peer de XCH, CAT y NFT sin un exchange, y cómo se ven en la cadena.",
    intro:
      "Una <strong>oferta</strong> es una transacción a medio hacer: el maker firma gastos de monedas que entregan algo (por ejemplo 10 XCH) con la condición de que se le pague otra cosa (por ejemplo 1000 unidades de un token) en el mismo bundle. La oferta es un archivo, que normalmente se comparte a través de un mercado como Dexie. No hace nada en la cadena hasta que un <em>taker</em> completa la otra mitad y envía el bundle entero; entonces ambos lados se liquidan de forma atómica o no se liquidan.",
    noExchangeTitle: "Por qué no necesita un exchange",
    noExchange:
      "Como las monedas del maker solo se pueden gastar junto con el pago del taker, nadie tiene que confiar en un intermediario. El maker conserva la custodia hasta el momento del intercambio, puede cancelar gastando él mismo las monedas ofrecidas y puede fijar una caducidad. Esto funciona igual para XCH, CAT y NFT, y así es como Chia tiene ventas de NFT, mercados de tokens e incluso bundles de varios activos sin un exchange custodio.",
    onChainTitle: "Cómo se ve una oferta en la cadena",
    onChain:
      "Una vez aceptada, una oferta es un spend bundle normal: en sus páginas de <mempool>mempool</mempool> y de transacción la verás marcada como oferta o swap, con los activos enviados y recibidos por cada participante. Antes de eso, solo el mercado sabe que existe; Coinset indexa las ofertas que ve y este sitio muestra su estado en las páginas de <tokens>token</tokens>, NFT y dirección, y en la página propia de la oferta una vez que conoces su ID.",
    lifecycleTitle: "Ciclo de vida de una oferta",
    lifecycleOpen: "<strong>Abierta</strong>: publicada, monedas aún sin gastar.",
    lifecycleTaking: "<strong>Aceptándose</strong>: el bundle de un taker está en la mempool.",
    lifecycleTaken: "<strong>Aceptada</strong>: confirmada en un bloque.",
    lifecycleCancelled:
      "<strong>Cancelada</strong> o <strong>caducada</strong>: el maker gastó las monedas de otra forma, o pasó la fecha de caducidad.",
    clawbackTitle: "Clawbacks",
    clawback:
      "Una idea relacionada es el <strong>clawback</strong>: un pago que el remitente puede recuperar durante un tiempo fijado antes de que el destinatario pueda reclamarlo, una red de seguridad contra envíos a la dirección equivocada. Estas monedas aparecen en la <address>página de la dirección</address> con su bloqueo temporal hasta que se reclaman o se revocan.",
  },
  questions: {
    title: "Preguntas frecuentes",
    summary:
      "Respuestas breves a lo que más se pregunta: comisiones, confirmaciones, monedas, direcciones y reorgs.",
    pending: {
      q: "Mi transacción está pendiente. ¿Cuánto tardará?",
      a: "Búscala: la página de la transacción muestra el bloque previsto y su tiempo estimado, según dónde queda el bundle cuando la mempool se ordena por comisión por coste. Con la mempool vacía, un gasto sin comisión entra en el siguiente bloque de transacciones, normalmente en menos de un minuto.",
    },
    fee: {
      q: "¿Cuánta comisión debo pagar?",
      a: "Normalmente ninguna. Cuando la mempool está congestionada, la <fees>página de comisiones</fees> muestra la estimación del nodo para cada tiempo objetivo; 5 mojos por unidad de coste es la tasa a la que un gasto sustituye a otro más barato, y una transferencia típica cuesta unos pocos millones de unidades de coste, así que incluso una comisión «alta» es una fracción de céntimo.",
    },
    confirmations: {
      q: "¿Cuántas confirmaciones necesito?",
      a: "Los reorgs de Chia casi siempre tienen un solo bloque de profundidad, así que la mayoría de las billeteras consideran definitivo un gasto tras unos pocos bloques; los exchanges esperan más. La página del bloque muestra cuántos bloques hay encima de uno dado.",
    },
    ids: {
      q: "¿Qué diferencia hay entre un ID de moneda, un ID de transacción y un puzzle hash?",
      a: "Un <strong>ID de moneda</strong> identifica una moneda (hash del padre, el puzzle hash y el importe). Un <strong>ID de transacción</strong> identifica un spend bundle. Un <strong>puzzle hash</strong> es lo que codifica una dirección: la regla de gasto a la que están bloqueadas las monedas. La búsqueda acepta los tres y averigua cuál es cuál.",
    },
    coins: {
      q: "¿Por qué mi dirección muestra más monedas que transacciones?",
      a: "Las billeteras dividen el cambio en varias monedas, y los CAT, NFT y DID son monedas envueltas que solo hacen <em>referencia</em> (hint) a tu dirección. La página de la dirección cuenta tanto las monedas XCH simples como las referenciadas.",
    },
    reorg: {
      q: "¿Qué es un reorg? ¿He perdido mi transacción?",
      a: "Un reorg sustituye el bloque o los bloques más recientes por una rama que compite con ellos. Tu gasto vuelve a la mempool y normalmente se incluye de nuevo un bloque después; la <blocks>página de bloques</blocks> lista los reorgs recientes y su profundidad.",
    },
    data: {
      q: "¿De dónde obtiene sus datos este sitio?",
      a: "De la API pública de nodo completo e indexada de Coinset, de Dexie para los nombres e iconos de tokens y de MintGarden para los NFT, todo leído directamente por tu navegador; puedes apuntarlo a tu propio nodo en los <settings>ajustes</settings>. La <status>página de estado</status> muestra si cada uno de ellos está accesible ahora mismo.",
    },
    prefarm: {
      q: "¿Qué es el prefarm?",
      a: "Los 21 millones de XCH que Chia Network creó antes del primer bloque, guardados en cuatro billeteras de custodia con reglas de auditoría públicas. El <prefarm>seguimiento del prefarm</prefarm> lee sus saldos en la cadena.",
    },
  },
};

export default messages;
