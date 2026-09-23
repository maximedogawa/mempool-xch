import type { Translation } from "../../translate";
import type en from "../en/docs";

const messages: Translation<typeof en> = {
  title: "Ayuda",
  why: {
    title: "Por qué mempoolxch.space",
    intro:
      "Algunas cosas que hace esta versión y que otros exploradores de Chia con los que la comparamos no hacían en la última revisión:",
    sage: "Una página de billetera dentro de Sage: tus transacciones pendientes en el panel, con su posición en la cola y un aviso sonoro al confirmarse.",
    projected:
      "Próximos bloques previstos empaquetados como el nodo los llena realmente (ordenados por coste), no solo la longitud de una cola.",
    cats: "Cada CAT recibe nombre e icono del registro de Dexie, en todas las páginas que lo muestran, no solo en una página de consulta.",
    a11y: "Accesibilidad comprobada en cada ruta: pruebas automáticas axe AA y un recorrido completo con teclado en la batería de tests, no solo prometida.",
    openSource:
      "Código abierto bajo MIT, una sola imagen Docker, desplegada tal como se documenta en el repositorio.",
    comparison:
      "La comparación completa función por función, incluido lo que todavía favorece a la competencia, se mantiene actualizada en la <link>matriz de competidores</link> (wiki).",
  },
  reading: {
    title: "Cómo leer el panel",
    projected: {
      q: "¿Qué son los bloques a la izquierda de la línea discontinua?",
      a: "Todavía no existen. Son los próximos bloques de transacciones tal como probablemente los llenará la red: cada spend bundle pendiente, ordenado por la comisión que paga por unidad de coste, empaquetado en bloques de 11 mil millones de coste. El bloque justo al lado de la línea es el siguiente; los que están más a la izquierda vienen después. Cada uno muestra la tasa de comisión típica en su interior, el rango de comisiones, las comisiones totales, cuántos spend bundles contiene y cuándo se farmeará, aproximadamente. Haz clic en uno para ver lo que contiene.",
    },
    confirmed: {
      q: "¿Y los bloques de la derecha?",
      a: "Los bloques de transacciones recién confirmados, del más nuevo al más antiguo, con sus comisiones, cobros de recompensa, antigüedad y el farmer que los ganó. Chia genera un bloque cada 18,75 segundos de media, pero solo uno de cada tres lleva transacciones; los pequeños marcadores +N cuentan los vacíos que hay entre medias.",
    },
    zeroFee: {
      q: "¿Por qué la comisión estimada suele ser 0?",
      a: "Chia no es Bitcoin. Las comisiones se pagan por unidad de coste CLVM, y la mempool acepta gastos sin ninguna comisión mientras tenga espacio. La barra de capacidad muestra lo llena que está (el coste de diez bloques). Cuando se llena, pagar una comisión te adelanta a la cola de gastos sin comisión, y las tarjetas muestran la tasa que te mete en el siguiente bloque, en cinco minutos o en diez.",
    },
    nextBlock: {
      q: "¿Qué muestra «Próximo bloque»?",
      a: "La composición del bloque que está a punto de generarse: una celda por spend bundle, con tamaño según su coste, coloreada según su franja de comisión y con borde según el tipo de activo. Usa los chips para resaltar gastos de XCH, CAT, NFT, ofertas o DID. Pasa el cursor sobre una celda para ver los detalles y haz clic para abrir la transacción.",
    },
    graph: {
      q: "¿Qué es el gráfico de la mempool?",
      a: "Cuánto coste está esperando, dividido por franja de comisión, durante las últimas dos horas. Lo muestrea tu navegador mientras la página está abierta, así que empieza cuando abriste la app por primera vez.",
    },
  },
  search: {
    title: "Encontrar tu transacción",
    paste: {
      q: "¿Qué puedo pegar en el cuadro de búsqueda?",
      a: "Un ID de transacción (spend bundle), una altura de bloque o hash de cabecera, una dirección xch o txch, un ID de moneda, un ID de activo CAT, un ID nft1 o un ID did:chia:. Una palabra suelta se busca como handle de XCHandles y, al mismo tiempo, como nombre de NFT o de colección. Pulsa <kbd>/</kbd> en cualquier sitio para saltar al cuadro. Si un ID hexadecimal de 64 caracteres puede ser varias cosas, la app comprueba la mempool, las transacciones, las monedas y los bloques y te muestra los candidatos.",
    },
    handle: {
      q: "¿Qué es un handle?",
      a: "XCHandles (xchandles.com) es un registro de nombres en Chia: un handle como <mono>@maximedogawa</mono> es una entrada del registro que resuelve a un NFT de nombre, y la dirección de ese NFT es adonde va un pago al nombre. Su página muestra a qué resuelve hoy, quién lo tiene y cuándo vence el registro, y se puede seguir como una dirección. Los datos de handles vienen de la propia API de solo lectura del registro, solo en mainnet.",
    },
    sent: {
      q: "He enviado una transacción. ¿Dónde está?",
      a: "Pega su ID o tu dirección. Una transacción pendiente muestra en qué bloque previsto se encuentra y un tiempo estimado; una vez confirmada muestra el bloque, las confirmaciones y qué se movió entre qué direcciones. La página de la dirección lista tus transacciones pendientes arriba y se actualiza sola.",
    },
    notClassified: {
      q: "¿Por qué la página de una moneda dice «sin clasificar»?",
      a: "La clasificación viene de los detalles de moneda de Coinset, que no siempre están disponibles. Las monedas XCH simples rara vez la necesitan; las monedas CAT y NFT siguen enlazando a las páginas de su activo desde la vista de la transacción.",
    },
  },
  sage: {
    title: "Usarlo dentro de la billetera Sage",
    install: {
      q: "¿Cómo lo instalo?",
      a: "En Sage 0.13 o posterior abre <em>Apps → Install from URL</em> y pega <mono>{site}</mono>. Sage descarga y verifica la app; a partir de ahí sigue la red y el tema de tu billetera, y una entrada <em>Mi billetera</em> abre la página de tu propia dirección en cuanto le permites leer tu dirección de recepción.",
    },
    network: {
      q: "¿Por qué el selector de red parece desactivado?",
      a: "Dentro de Sage, la app siempre muestra la red en la que está tu billetera.",
    },
    data: {
      q: "¿De dónde vienen los datos dentro de Sage?",
      a: "Todo lo que es tuyo viene de la propia billetera: saldo, estado de sincronización, transacciones pendientes y pasadas, tus monedas, si una dirección es tuya y el precio de XCH. Sage es una billetera ligera y su puente para apps no ofrece consultas al nodo (ni pico, ni mempool, ni búsqueda de bloques), así que la mempool, los bloques y las direcciones de otras personas siguen viniendo del endpoint de la cadena configurado en los ajustes: Coinset por defecto o un nodo que tú autorices.",
    },
  },
  customNode: {
    title: "Usar tu propio nodo",
    need: {
      q: "¿Necesito un nodo?",
      a: "No. Por defecto todo viene del nodo completo público de Chia de Coinset y de su índice, que también alimenta las actualizaciones en vivo, el historial de direcciones y las páginas de CAT y NFT.",
    },
    mine: {
      q: "Aun así quiero usar el mío.",
      a: "Ajustes → Endpoints RPC de nodo completo acepta cualquier RPC de nodo completo de Chia por HTTPS. Un nodo estándar escucha en <mono>https://localhost:8555</mono> con TLS de certificado de cliente y sin cabeceras CORS, con lo que un navegador no puede comunicarse directamente, así que pon un pequeño proxy delante:",
    },
    changes: {
      q: "¿Qué cambia con mi propio nodo?",
      a: "La app consulta periódicamente en lugar de recibir un stream y obtiene ella misma la mempool en bruto. Las funciones exclusivas de Coinset (resúmenes semánticos de transacciones, historial de direcciones, historial de CAT y NFT) se ocultan con una nota. Todo lo relacionado con bloques, monedas y la mempool sigue funcionando.",
    },
    channels: {
      q: "¿De dónde vienen las actualizaciones en vivo?",
      a: "El indicador de conexión (pasa el cursor por encima), el pie de página y los ajustes indican el canal que usa tu pestaña. No hay ningún servidor intermedio: este sitio solo aloja la app, y cada pestaña habla directamente con el endpoint de la cadena.",
      socket:
        "<strong>Socket de Coinset</strong>: tu pestaña recibe en streaming la altura del pico y los eventos de transacciones directamente del WebSocket de Coinset. Es el modo normal en mempoolxch.space y dentro de la instantánea integrada en Sage.",
      polling:
        "<strong>Sondeo</strong>: no hay stream disponible, así que la pestaña consulta el endpoint cada pocos segundos. Siempre es así con un nodo propio, y es la alternativa si el socket no puede conectarse.",
    },
  },
  more: {
    title: "Más",
    api: "Referencia de la API: cada llamada a Coinset que hace esta app, con ejemplos",
    install: "Instalación y uso",
    customNode: "Nodo propio o local, también con nginx",
    overview: "Cómo funciona por dentro",
    load: "Carga sobre las fuentes de datos y opciones a largo plazo",
    source: "Código fuente en GitHub (MIT)",
  },
};

export default messages;
