import type { Translation } from "../../translate";
import type en from "../en/consent";

const messages: Translation<(typeof en)["messages"]> = {
  consent: {
    title: "Cookies y almacenamiento local",
    intro:
      "Este sitio guarda en tu navegador solo lo que necesita para funcionar. No se carga nada de analítica ni publicidad a menos que lo permitas aquí.",
    cookiePolicy: "Política de cookies",
    privacyPolicy: "Política de privacidad",
    signal:
      "Tu navegador envía una señal Do Not Track o Global Privacy Control, por lo que la analítica y la publicidad permanecen desactivadas.",
    categoriesLegend: "Categorías",
    categories: {
      necessary: {
        label: "Estrictamente necesarias",
        detail: "Tus ajustes, cachés y esta elección, guardados en tu navegador. Siempre activas.",
      },
      analytics: {
        label: "Analítica",
        detail: "Estadísticas de uso anónimas. No se utilizan por el momento.",
      },
      advertising: {
        label: "Publicidad",
        detail: "Anuncios y medición publicitaria. No se utilizan por el momento.",
      },
    },
    rejectAll: "Rechazar todo",
    saveChoice: "Guardar mi elección",
    acceptAll: "Aceptar todo",
    close: "Cerrar",
    settingsButton: "Ajustes de cookies",
  },
  disclaimer: {
    label: "Aviso",
    text: "Software en fase alfa, todavía cambia mucho. No es asesoramiento financiero: verifícalo en tu propia billetera. <link>Términos de uso</link>",
    dismiss: "Cerrar aviso",
  },
};

export default messages;
