import type { Translation } from "../../translate";
import type en from "../en/did";

const messages: Translation<(typeof en)["messages"]> = {
  title: "Perfil",
  mainnetOnly: "Los perfiles y las tenencias de NFT vienen de MintGarden, que solo indexa mainnet.",
  avatarAlt: "Avatar del DID",
  unnamed: "Perfil sin nombre",
  verified: "Verificado",
  noProfile:
    "Este DID no tiene perfil en MintGarden. Aun así puede tener NFT que MintGarden no ha indexado.",
  nftsHeld: { one: "{count} NFT en posesión", other: "{count} NFT en posesión" },
  website: "Sitio web",
  collectionsHeld: "Colecciones en posesión",
  more: "+{count} más",
};

export default messages;
