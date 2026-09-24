import type { Translation } from "../../translate";
import type en from "../en/consent";

const messages: Translation<(typeof en)["messages"]> = {
  consent: {
    title: "Cookies und lokaler Speicher",
    intro:
      "Diese Website speichert in Ihrem Browser nur, was sie zum Funktionieren braucht. Nichts für Analyse oder Werbung wird geladen, sofern Sie es hier nicht erlauben.",
    cookiePolicy: "Cookie-Richtlinie",
    privacyPolicy: "Datenschutzerklärung",
    signal:
      "Ihr Browser sendet ein Do-Not-Track- oder Global-Privacy-Control-Signal, daher bleiben Analyse und Werbung deaktiviert.",
    categoriesLegend: "Kategorien",
    categories: {
      necessary: {
        label: "Unbedingt erforderlich",
        detail:
          "Ihre Einstellungen, Caches und diese Auswahl, gespeichert in Ihrem Browser. Immer aktiv.",
      },
      analytics: {
        label: "Analyse",
        detail: "Anonyme Nutzungsstatistiken. Derzeit nicht verwendet.",
      },
      advertising: {
        label: "Werbung",
        detail: "Werbung und Werbemessung. Derzeit nicht verwendet.",
      },
    },
    rejectAll: "Alle ablehnen",
    saveChoice: "Auswahl speichern",
    acceptAll: "Alle akzeptieren",
    close: "Schließen",
    settingsButton: "Cookie-Einstellungen",
  },
  disclaimer: {
    label: "Haftungshinweis",
    text: "Alpha-Software, die sich noch stark verändert. Keine Finanzberatung – prüfen Sie alles in Ihrer eigenen Wallet. <link>Nutzungsbedingungen</link>",
    dismiss: "Haftungshinweis schließen",
  },
};

export default messages;
