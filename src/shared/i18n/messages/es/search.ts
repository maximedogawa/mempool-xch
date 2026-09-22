import type { Translation } from "../../translate";
import type en from "../en/search";

const messages: Translation<typeof en> = {
  label: "Buscar transacciones, bloques, direcciones, monedas y activos",
  placeholderLarge: "Buscar tx, bloque, dirección, moneda, CAT o NFT…",
  placeholder: "Buscar ID de tx, bloque, dirección, moneda, CAT o NFT…",
  clear: "Borrar búsqueda",
  submit: "Buscar",
  go: "Ir",
  severalMatches: "Varios resultados, elige uno",
  bestGuess: "Mejor coincidencia",
  noMatches:
    "Sin resultados para «{query}». Prueba con una altura de bloque exacta, un ID de tx, una dirección, un ID de moneda, un ID nft1, un ID de activo CAT o un @handle.",
  invalid: {
    empty: "Escribe algo para buscar.",
    addressChecksum: "Parece una dirección, pero su checksum es incorrecto.",
    nftChecksum: "Parece un ID de NFT, pero su checksum es incorrecto.",
    offerFile:
      "Eso es un archivo de oferta, no un ID. Su ID solo existe cuando la oferta se publica: súbela a Dexie y luego busca el ID de oferta que aparece allí o la dirección que la creó.",
    didChecksum: "Parece un DID, pero su checksum es incorrecto.",
    hexLength: "Los ID hex deben tener 32 bytes (64 caracteres hex).",
  },
  match: {
    transaction: "Transacción",
    coin: "Moneda",
    block: "Bloque {height}",
    offer: "Oferta ({status})",
    nft: "NFT",
    did: "DID",
    collection: "Colección",
    cat: "Activo CAT",
    address: "Dirección (puzzle hash)",
    expiredHandle: "{handle} (handle caducado)",
  },
};

export default messages;
