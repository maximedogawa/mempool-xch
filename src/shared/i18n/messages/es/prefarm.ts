import type { Translation } from "../../translate";
import type en from "../en/prefarm";

const messages: Translation<typeof en> = {
  title: "Seguimiento del prefarm",
  tooltip:
    "Chia Network creó 21 millones de XCH antes del primer bloque. Se guardan en cuatro bóvedas de custodia (frías y templadas, en EE. UU. y Suiza) con reglas de auditoría publicadas. Esta página lee las monedas de las bóvedas desde la cadena; no estima nada.",
  mainnetOnly: "Las bóvedas del prefarm solo existen en mainnet; cambia de red para verlas.",
  tracked: "Seguido en cadena",
  trackedSub: "{percent} del prefarm de {total} XCH",
  trackedHint:
    "Suma de las monedas singleton de las cuatro bóvedas y de las monedas sin gastar en sus puzzle hashes conocidos.",
  cold: "Bóvedas frías",
  coldSub: "custodia con clawback de 90 días",
  warm: "Bóvedas templadas",
  warmSub: "custodia con clawback de 24 horas",
  elsewhere: "Fuera de estas direcciones",
  elsewhereSub: "gastado, vendido o movido a direcciones que esta página no conoce",
  elsewhereHint:
    "Desde 2021 el prefarm ha financiado compras, creación de mercado y subvenciones, y un rekey de bóveda cambia su puzzle hash. Lo que no está en las direcciones conocidas se muestra aquí, sin suposiciones.",
  tier: {
    cold: "fría",
    warm: "templada",
  },
  readError: "No se pudieron leer las monedas de esta bóveda en este momento.",
  coins: { one: "{count} moneda", other: "{count} monedas" },
  lastMovement: " · último movimiento {age}",
  custody: "Custodia",
  launcher: "Launcher",
  singletonAt: "· moneda singleton en #{height}",
  addresses: "Direcciones",
  footnote:
    "Los launcher ids de las bóvedas son los que Chia Network publica para sus propias herramientas de auditoría (<alert>prefarm-alert</alert>); las reglas de custodia se describen en la <guide>guía de auditoría del prefarm</guide>. Un rekey de bóveda mueve los fondos a un nuevo puzzle hash; cuando ocurre, el saldo aquí baja hasta que se añade la nueva dirección, por eso la cifra «fuera de estas direcciones» se muestra aparte en lugar de sumarse a un total.",
};

export default messages;
