import type { Translation } from "../../translate";
import type en from "../en/api";

const messages: Translation<typeof en> = {
  title: "Referencia de la API",
  titleHint:
    "mempoolxch.space no tiene API de servidor propia: cada página que ves lee un endpoint de la cadena directamente desde tu navegador, igual que esta app. Esta página documenta las llamadas que hace la propia app para que tú también puedas hacerlas, contra el endpoint público de Coinset o tu propio nodo.",
  coinsetOnly: "solo Coinset",
  anyFullNode: "cualquier nodo completo",
  showExample: "Mostrar ejemplo",
  hideExample: "Ocultar ejemplo",
  base: {
    title: "URL base",
    intro:
      "Cada método de abajo es un <code>POST</code> a <code>{base}/{method}</code> con un cuerpo JSON, sin autenticación y con CORS abierto. El RPC del nodo completo y la API indexada de Coinset comparten el mismo host.",
    mainnet: "Mainnet:",
    testnet: "Testnet11:",
    websocket: "WebSocket (eventos de pico y de transacciones):",
    specs:
      "Especificaciones OpenAPI completas: <code>coinset.org/openapi/full_node_bundled.json</code> y <code>coinset.org/openapi/coinset_bundled.json</code>. Los endpoints marcados como «cualquier nodo completo» también funcionan con tu propio nodo; consulta <link>Ajustes → nodo propio</link>.",
  },
  groups: {
    chain: "Cadena y mempool",
    blocks: "Bloques",
    transactions: "Transacciones (indexadas, solo Coinset)",
    coins: "Monedas",
    balances: "Saldos y activos (indexados, solo Coinset)",
    offers: "Ofertas, clawbacks y reorgs (indexados, solo Coinset)",
  },
  endpoints: {
    get_blockchain_state:
      "Altura y hash del pico, tamaño y coste de la mempool, coste máximo por bloque, dificultad, estado de sincronización.",
    get_fee_estimate:
      "Estimación de comisión por coste para uno o varios tiempos de confirmación objetivo.",
    get_all_mempool_tx_ids: "Todos los ID de spend bundle que hay ahora en la mempool.",
    get_all_mempool_items:
      "Todos los spend bundles pendientes completos. Es grande (decenas de MB); la app lo compara con los ID que ya tiene en lugar de volver a descargarlo entero.",
    get_mempool_item_by_tx_id: "Un spend bundle pendiente por ID.",
    get_mempool_items_by_coin_name: "Spend bundles pendientes que afectan a una moneda.",
    get_network_space: "Espacio de red estimado entre dos hashes de cabecera.",
    get_block_records:
      "Registros de bloque en un rango de alturas, sin incluir el final. Coinset limita cada llamada a 1000 registros.",
    get_block_record_by_height: "Un registro de bloque por altura.",
    get_block_record: "Un registro de bloque por hash de cabecera.",
    get_block:
      "El bloque completo (información del generador, cobros de recompensas) por hash de cabecera.",
    get_block_spends:
      "Gastos de monedas en un bloque (alternativa para nodos personalizados en el flujo de monedas).",
    get_additions_and_removals:
      "Monedas creadas y eliminadas en un bloque, para la vista de flujo de monedas.",
    get_block_transactions:
      "Resúmenes semánticos de las transacciones confirmadas en un bloque, paginados.",
    get_transaction: "Un resumen semántico de transacción por ID de spend bundle.",
    get_transactions_by_p2:
      "Historial de transacciones del puzzle hash de una dirección, paginado, las más recientes primero.",
    get_pending_transactions_by_p2: "Transacciones pendientes de una dirección.",
    get_transactions_by_cat_asset_id:
      "Historial de transacciones de un ID de activo CAT, paginado.",
    get_transactions_by_nft_id: "Historial de transacciones de un NFT.",
    get_transactions_by_coin_name:
      "La transacción que creó una moneda y, si se gastó, la que la eliminó.",
    get_coin_record_by_name: "Un registro de moneda por ID de moneda.",
    get_coin_records_by_names: "Registros de monedas a partir de una lista de ID de moneda.",
    get_coin_records_by_puzzle_hash: "Registros de monedas pagadas a un puzzle hash.",
    get_coin_records_by_hint:
      "Registros de monedas por hint de memo (así encuentran las billeteras sus propias monedas).",
    get_coin_records_by_parent_ids:
      "Registros de monedas creadas por una lista de ID de moneda padre.",
    get_puzzle_and_solution: "El reveal y la solución con los que se gastó una moneda.",
    get_memos_by_coin_name: "Cadenas de memo adjuntas al gasto de una moneda.",
    get_coin_details:
      "Semántica de la moneda (tipo, ID de activo) cuando Coinset puede clasificarla.",
    push_tx: "Envía un spend bundle a la mempool.",
    get_xch_balance_by_p2: "Saldo de XCH confirmado y pendiente de un puzzle hash.",
    get_cat_balances_by_p2: "Saldos de CAT de un puzzle hash.",
    get_nft_balance_by_p2: "Número de NFT de un puzzle hash.",
    get_singleton_info: "Linaje de un singleton (NFT/DID) por launcher ID.",
    get_latest_nft_coin_by_nft_id: "La moneda actual sin gastar de un NFT.",
    get_offer:
      "Estado del ciclo de vida de una oferta por ID: ambos lados, creadores y la transacción que la aceptó o la canceló.",
    get_offers_by_p2:
      "Ofertas creadas desde un puzzle hash, un estado del ciclo de vida por llamada.",
    get_offers_by_cat_asset_id: "Ofertas que ofrecen o piden un CAT.",
    get_offers_by_nft_id: "Ofertas que ofrecen o piden un NFT.",
    get_clawback_coins_by_receiver:
      "Monedas con clawback enviadas a un puzzle hash, con su bloqueo temporal y si el remitente aún puede revocarlas.",
    get_reorgs: "Reorganizaciones de la cadena detectadas por Coinset, las más recientes primero.",
    get_raw_transaction_by_id:
      "Elemento tipo mempool (gastos de monedas, adiciones, eliminaciones) de un bundle incluso después de salir de la mempool.",
  },
  otherData: {
    title: "Otros datos",
    dexie:
      "Los nombres, tickers e iconos de CAT vienen del registro público de Dexie: <code>GET https://api.dexie.space/v1/assets?type=cat</code> (paginado, 100 por página), iconos en <code>https://icons.dexie.space/{asset_id}.webp</code>.",
    mintgarden:
      "Los metadatos e imágenes de NFT vienen de MintGarden: <code>GET https://api.mintgarden.io/nfts/{nft1_id}</code>.",
  },
  embeds: {
    title: "Widgets e insignias",
    theme: "Tema del widget",
    dark: "oscuro",
    light: "claro",
    intro:
      "Widgets listos para usar en pools, billeteras y sitios de la comunidad. Cada uno es una pequeña página estática (menos de 15 KB de script, sin framework) que consulta Coinset directamente desde el navegador del visitante, así que nada de tus visitantes nos llega. <code>?theme=dark|light</code> elige los colores y <code>&network=testnet11</code> cambia de red. Se pueden incrustar desde cualquier origen.",
    preview: "vista previa",
    items: {
      blocks: {
        title: "Cola de bloques",
        what: "Los próximos bloques previstos y los tres últimos bloques de transacciones.",
      },
      fees: {
        title: "Tarjetas de comisiones",
        what: "La estimación de comisión del nodo para el próximo bloque, ~5 y ~10 minutos.",
      },
      mempool: {
        title: "Ocupación de la mempool",
        what: "Bundles en espera, coste usado de la capacidad del nodo, comisiones totales.",
      },
      tx: {
        title: "Estado de la transacción",
        what: "Pendiente, confirmada o eliminada para un ID de transacción.",
      },
    },
    badgeTitle: "Insignia SVG",
    badgeWhat:
      "Una imagen al estilo shields para READMEs y páginas que no pueden ejecutar scripts; servida por mempoolxch.space y en caché durante un minuto.",
  },
  fairUse: {
    title: "Límites de uso y uso justo",
    limits:
      "Estos son endpoints de Coinset, Dexie y MintGarden, no nuestros: no podemos fijar sus límites de uso y, por ahora, no han publicado ninguno. Sé considerado: guarda en caché lo que descargues, agrupa las peticiones cuando el endpoint lo permita (por ejemplo, el rango de alturas de <code>get_block_records</code>, limitado a 1000 por llamada) y evita consultar con más frecuencia que una vez por bloque, aproximadamente (~18–20 s en mainnet).",
    terms:
      "Los <link>Términos de uso</link> propios de mempoolxch.space siguen rigiendo este sitio (disponibilidad, uso aceptable de las páginas que cargas aquí); usar Coinset, Dexie o MintGarden directamente es un asunto entre tú y ellos.",
  },
};

export default messages;
