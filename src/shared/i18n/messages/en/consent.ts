/** Consent panel and disclaimer banner shown on every page (src/widgets/legal). */
import { defineNamespace } from "../../translate";

const messages = {
  consent: {
    title: "Cookies and local storage",
    intro:
      "This site keeps only what it needs to work in your browser. Nothing for analytics or advertising loads unless you allow it here.",
    cookiePolicy: "Cookie policy",
    privacyPolicy: "Privacy policy",
    signal:
      "Your browser sends a Do Not Track or Global Privacy Control signal, so analytics and advertising stay off.",
    categoriesLegend: "Categories",
    categories: {
      necessary: {
        label: "Strictly necessary",
        detail: "Your settings, caches and this choice, kept in your browser. Always on.",
      },
      analytics: {
        label: "Analytics",
        detail: "Anonymous usage statistics. Not used at the moment.",
      },
      advertising: {
        label: "Advertising",
        detail: "Ads and ad measurement. Not used at the moment.",
      },
    },
    rejectAll: "Reject all",
    saveChoice: "Save my choice",
    acceptAll: "Accept all",
    close: "Close",
    settingsButton: "Cookie settings",
  },
  disclaimer: {
    label: "Disclaimer",
    text: "Alpha software, still changing a lot. Not financial advice — verify in your own wallet. <link>Terms of use</link>",
    dismiss: "Dismiss disclaimer",
  },
};

export default defineNamespace("consent", messages);
