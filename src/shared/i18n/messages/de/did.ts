import type { Translation } from "../../translate";
import type en from "../en/did";

const messages: Translation<(typeof en)["messages"]> = {
  title: "Profil",
  mainnetOnly: "Profile und NFT-Bestände stammen von MintGarden, das nur das Mainnet indexiert.",
  avatarAlt: "DID-Avatar",
  unnamed: "Unbenanntes Profil",
  verified: "Verifiziert",
  noProfile:
    "Kein MintGarden-Profil für diese DID. Sie kann trotzdem NFTs halten, die MintGarden nicht indexiert hat.",
  nftsHeld: { one: "{count} NFT im Besitz", other: "{count} NFTs im Besitz" },
  website: "Website",
  collectionsHeld: "Gehaltene Kollektionen",
  more: "+{count} weitere",
};

export default messages;
