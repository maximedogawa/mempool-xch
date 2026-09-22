import type { Translation } from "../../translate";
import type en from "../en/shell";

const messages: Translation<typeof en> = {
  home: "mempoolxch.space Startseite",
  primaryNav: "Hauptnavigation",
  mobileNav: "Mobile Navigation",
  morePages: "Weitere Seiten",
  more: "Mehr",
  openMenu: "Menü öffnen",
  closeMenu: "Menü schließen",
  language: "Sprache",
  nav: {
    dashboard: "Übersicht",
    blocks: "Blöcke",
    mempool: "Mempool",
    charts: "Diagramme",
    market: "Markt",
    map: "Karte",
    tokens: "Token",
    nfts: "NFTs",
    fees: "Gebühren",
    pools: "Pools",
    vaults: "Vaults",
    learn: "Lernen",
    help: "Hilfe",
    arcade: "Arcade",
    wallet: "Meine Wallet",
    settings: "Einstellungen",
  },
  groups: {
    assets: "Assets",
    network: "Netzwerk",
    learnPlay: "Lernen & Spielen",
    liveChain: "Live-Chain",
    you: "Persönlich",
  },
};

export default messages;
