/** The DID profile card (src/widgets/did). */
import { defineNamespace } from "../../translate";

const messages = {
  title: "Profile",
  mainnetOnly: "Profiles and NFT holdings come from MintGarden, which indexes mainnet only.",
  avatarAlt: "DID avatar",
  unnamed: "Unnamed profile",
  verified: "Verified",
  noProfile:
    "No MintGarden profile for this DID. It may still hold NFTs that MintGarden has not indexed.",
  nftsHeld: { one: "{count} NFT held", other: "{count} NFTs held" },
  website: "Website",
  collectionsHeld: "Collections held",
  more: "+{count} more",
};

export default defineNamespace("did", messages);
