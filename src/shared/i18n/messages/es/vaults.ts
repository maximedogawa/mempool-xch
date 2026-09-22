import type { Translation } from "../../translate";
import type en from "../en/vaults";

const messages: Translation<typeof en> = {
  exampleLabel: "Billetera caliente Buy XCH de Chia Network",
  actions: {
    initiateRecovery: "Recuperación iniciada",
    finishRecovery: "Recuperación finalizada",
    clawbackRecovery: "Recuperación revertida",
  },
  invalid: {
    checksum: "Parece una dirección, pero su checksum es incorrecto.",
    format: "Pega un launcher ID de bóveda (64 caracteres hex) o la dirección xch de la bóveda.",
  },
  title: "Chia Vaults",
  tooltip:
    "Una Chia Vault separa el derecho a gastar de las monedas: una passkey, una llave de hardware o firmantes m de n controlan un singleton, y una vía de recuperación permite al propietario recuperar el acceso tras un plazo que la bóveda puede revertir. Coinset transmite los pasos de recuperación, pero no tiene un directorio de bóvedas; el escáner enlazado abajo las indexa todas.",
  intro:
    "Busca una bóveda por su launcher ID o su dirección, o explóralas todas en el <link>escáner comunitario de bóvedas</link>.",
  lookup: {
    title: "Buscar bóveda",
    placeholder: "Launcher ID de la bóveda o dirección xch",
    inputLabel: "Launcher ID de la bóveda o dirección",
    submit: "Buscar",
    example: "Probar un ejemplo",
    needsCoinset:
      "El singleton de la bóveda necesita Coinset para consultarse; sus fondos se leen de tu nodo en la dirección derivada del launcher ID.",
    vaultAddress: "Dirección de la bóveda <hash></hash>",
    noSingleton: "Coinset no conoce ningún singleton con este launcher ID.",
    singleton: "Singleton",
    singletonFallback: "singleton",
    coinSpent: "moneda actual gastada",
    coinUnspent: "moneda actual sin gastar",
    coinSince: "Moneda actual desde",
    coinAmount: "Importe de la moneda",
    coinAmountSub: "el propio singleton, no los fondos de la bóveda",
    funds: "Fondos",
    fundsError: "no se pudieron cargar las monedas de la bóveda",
    unspentCoins: { one: "{count} moneda sin gastar", other: "{count} monedas sin gastar" },
    fundsHint:
      "Los fondos de una bóveda están en un puzzle hash derivado de su launcher ID (el puzzle p2 singleton de la bóveda), calculado aquí en el navegador. Es el saldo de la dirección principal de la bóveda; no se incluyen las monedas que la bóveda movió a otras direcciones.",
    launcher:
      "Launcher <launcher></launcher> · fondos en <funds></funds> · moneda actual en <current></current> · <scanner>abrir en el escáner</scanner>",
    fullHistory: "<hash></hash> · historial completo en la página de la dirección.",
  },
  funds: {
    balance: "Saldo",
    balanceSub: "monedas sin gastar en esta dirección",
    coins: "Monedas",
    newestCoin: "Moneda más reciente",
  },
  activity: {
    title: "Actividad de recuperación",
    fromStream: "del flujo de bóvedas de Coinset",
    needsStream: "requiere el flujo de Coinset",
    empty:
      "Aún no se ha visto ninguna recuperación de bóveda en esta conexión. Las recuperaciones son poco frecuentes; cuando llegue una, seguirá listada aquí entre visitas.",
  },
};

export default messages;
