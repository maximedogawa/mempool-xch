import type { Translation } from "../../translate";
import type en from "../en/settings";

const messages: Translation<(typeof en)["messages"]> = {
  title: "Ajustes",
  channel:
    "<strong>Canal en vivo: {name}.</strong> {detail} Todo se lee directamente del endpoint.",
  network: {
    title: "Red",
    active: "Red activa",
    intro:
      "Toda la app sigue a la red activa: prefijos de dirección, enlaces del explorador, el stream en vivo y el resumen de la mempool. Endpoint activo: <endpoint>{url}</endpoint>",
  },
  endpoints: {
    title: "Endpoints RPC de nodo completo",
    sage: "<strong>Dentro de Sage:</strong> tu saldo, tus monedas y tus transacciones vienen de la propia billetera. El puente de apps de Sage no ofrece RPC de nodo (ni consultas de pico, mempool o bloques), así que los datos de toda la cadena vienen del endpoint de abajo; un endpoint propio se autoriza en Sage al guardarlo.",
    intro:
      "Por defecto, mempoolxch.space lee la cadena a través del RPC público de nodo completo de <coinset>Coinset</coinset>, directamente desde tu navegador y sin necesidad de nodo propio. Puedes apuntar cada red a cualquier endpoint HTTPS compatible con el RPC de nodo completo de Chia. Las funciones exclusivas de Coinset (resúmenes semánticos de transacciones, historial de direcciones y el stream WebSocket) se desactivan automáticamente con endpoints propios, y la app pasa a sondear y a descargar la mempool en bruto en el navegador.",
    ownNode:
      "<strong>¿Usas tu propio nodo?</strong> Un nodo completo de Chia estándar escucha en <code>https://localhost:8555</code> con TLS mutuo: exige el certificado de cliente del nodo, que un navegador no puede presentar, y no envía cabeceras CORS. Pon delante un pequeño proxy inverso que termine el TLS con el certificado de cliente y añada <code>Access-Control-Allow-Origin</code>, y luego introduce aquí la URL del proxy. <guide>Guía paso a paso</guide>.",
    nodexch:
      "<strong>¿nodexch?</strong> Un gateway nodexch habla el dialecto de Coinset delante de su propio nodo completo: RPC de nodo completo, la API indexada y el WebSocket en un solo host. Elige el preajuste o marca tu propio gateway como nodexch; con cada llamada se envía una clave publicable (<code>nxp_…</code>) ligada al origen de este sitio. Nunca introduzcas aquí una clave secreta.",
  },
  endpoint: {
    addresses: "(direcciones {prefix})",
    coinsetDefault: "Coinset por defecto",
    customNode: "Nodo propio",
    test: "Probar conexión",
    save: "Guardar",
    reset: "Restablecer a Coinset",
    ok: "Pico {height} en {ms} ms",
    okCustom:
      "Pico {height} en {ms} ms · nodo propio: API indexada, WebSocket y API de resumen desactivados",
    sageHttpsOnly: "Dentro de Sage solo se pueden autorizar endpoints https.",
    sageRefused: "Sage no permitió este host; el endpoint no se guardó.",
    sageAllowed: "Sage permitió este host.",
    nodexch: "nodexch",
    nodexchPreset: "Usar nodexch.space",
    nodexchToggle: "Este endpoint es un gateway nodexch",
    apiKey: "Clave publicable",
    apiKeyHint: "nxp_… (opcional con el preajuste nodexch.space)",
    apiKeyInvalid: "En un navegador solo va una clave publicable (nxp_…).",
    okNodexch: "Pico {height} en {ms} ms · nodexch: API indexada y WebSocket activos",
  },
  appearance: {
    title: "Apariencia",
    theme: "Tema",
    dark: "Oscuro",
    darkHint: "estilo mempool.space",
    light: "Claro",
    lightHint: "claro y nítido",
    system: "Sistema",
    systemHint: "sigue tu dispositivo",
    sageLocked:
      "Dentro de Sage la app sigue el tema de la billetera (ahora {theme}). Cámbialo en los ajustes de Sage.",
    language: "Idioma",
    languageAuto: "Automático (idioma del navegador)",
    chime: "Sonido de confirmación",
    chimeHint:
      "Un suave sonido de moneda cuando una transacción de tu billetera entra en un bloque (solo en Sage).",
    recentBlocks: "Bloques recientes en el panel",
  },
  resetAll: "Restablecer todos los ajustes",
};

export default messages;
