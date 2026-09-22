import type { Translation } from "../../translate";
import type en from "../en/shell";

const messages: Translation<typeof en> = {
  home: "Inicio de mempoolxch.space",
  primaryNav: "Principal",
  mobileNav: "Navegación móvil",
  morePages: "Más páginas",
  more: "Más",
  openMenu: "Abrir menú",
  closeMenu: "Cerrar menú",
  language: "Idioma",
  nav: {
    dashboard: "Panel",
    blocks: "Bloques",
    mempool: "Mempool",
    charts: "Gráficos",
    market: "Mercado",
    map: "Mapa",
    tokens: "Tokens",
    nfts: "NFT",
    fees: "Comisiones",
    pools: "Pools",
    vaults: "Bóvedas",
    learn: "Aprender",
    help: "Ayuda",
    arcade: "Arcade",
    wallet: "Mi billetera",
    settings: "Ajustes",
  },
  groups: {
    assets: "Activos",
    network: "Red",
    learnPlay: "Aprender y jugar",
    liveChain: "Cadena en vivo",
    you: "Personal",
  },
};

export default messages;
