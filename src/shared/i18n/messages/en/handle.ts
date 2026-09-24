/** The XCHandles handle page (src/widgets/handle). */
import { defineNamespace } from "../../translate";

const messages = {
  status: {
    active: "Registered",
    expired: "Expired",
    unknown: "Not registered",
    syncing: "Registry syncing",
    unavailable: "Registry unreachable",
  },
  invalidTitle: "Not a valid handle",
  invalidDescription:
    "An XCHandles handle is 3 to 63 lowercase letters and digits, written @name, with no dots or dashes. Got: {raw}",
  empty: "(empty)",
  mainnetTitle: "Handles are a mainnet registry",
  mainnetDescription:
    "XCHandles runs on mainnet only. Switch the network back to mainnet to resolve a handle.",
  title: "Handle",
  artAlt: "Name NFT of {handle}",
  handle: "Handle",
  resolvesTo: "Resolves to",
  nobodyRegistered: "Nobody has registered this handle.",
  noAddress: "No address to resolve to.",
  expired: "Expired",
  expires: "Expires",
  nameNft: "Name NFT",
  ownerLauncherId: "Owner launcher id",
  syncing:
    "The registry index is behind the chain and would rather say so than answer from stale state. Try again in a moment.",
  unreachable: "The XCHandles registry could not be reached.",
  retry: "Retry",
  registry: "Registry",
  lastAction: "Last action",
  confirmedIn: "Confirmed in",
  block: "Block {height}",
  protocolFee: "Protocol fee",
  protocolFeeValue: "{fee} <faint>mojos of the payment CAT</faint>",
  notRegisteredTitle: "{handle} is not registered",
  notRegisteredDescription:
    "No live slot in the registry resolves this handle. It can be registered on xchandles.com.",
  openOnXchandles: "Open it on XCHandles",
};

export default defineNamespace("handle", messages);
