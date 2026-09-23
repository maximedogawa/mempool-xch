/**
 * Every English namespace as one tree: the shape the other locales must translate (types.ts) and
 * what the message tests walk. The app never imports this at runtime (see NamespaceDef).
 */
import common from "./common";
import format from "./format";
import ui from "./ui";
import app from "./app";
import docs from "./docs";
import search from "./search";
import settings from "./settings";
import address from "./address";
import api from "./api";
import arcade from "./arcade";
import assets from "./assets";
import block from "./block";
import blocks from "./blocks";
import blocksList from "./blocksList";
import blocktime from "./blocktime";
import changelog from "./changelog";
import charts from "./charts";
import coin from "./coin";
import dashboard from "./dashboard";
import did from "./did";
import feed from "./feed";
import fees from "./fees";
import goggles from "./goggles";
import handle from "./handle";
import learn from "./learn";
import legal from "./legal";
import consent from "./consent";
import map from "./map";
import market from "./market";
import mempool from "./mempool";
import mempoolList from "./mempoolList";
import nft from "./nft";
import offers from "./offers";
import pools from "./pools";
import portfolio from "./portfolio";
import prefarm from "./prefarm";
import shell from "./shell";
import status from "./status";
import tokens from "./tokens";
import tx from "./tx";
import vaults from "./vaults";
import wallet from "./wallet";
import watchlist from "./watchlist";

const messages = {
  common: common.messages,
  format: format.messages,
  ui: ui.messages,
  app: app.messages,
  docs: docs.messages,
  search: search.messages,
  settings: settings.messages,
  address: address.messages,
  api: api.messages,
  arcade: arcade.messages,
  assets: assets.messages,
  block: block.messages,
  blocks: blocks.messages,
  blocksList: blocksList.messages,
  blocktime: blocktime.messages,
  changelog: changelog.messages,
  charts: charts.messages,
  coin: coin.messages,
  dashboard: dashboard.messages,
  did: did.messages,
  feed: feed.messages,
  fees: fees.messages,
  goggles: goggles.messages,
  handle: handle.messages,
  learn: learn.messages,
  legal: legal.messages,
  consent: consent.messages,
  map: map.messages,
  market: market.messages,
  mempool: mempool.messages,
  mempoolList: mempoolList.messages,
  nft: nft.messages,
  offers: offers.messages,
  pools: pools.messages,
  portfolio: portfolio.messages,
  prefarm: prefarm.messages,
  shell: shell.messages,
  status: status.messages,
  tokens: tokens.messages,
  tx: tx.messages,
  vaults: vaults.messages,
  wallet: wallet.messages,
  watchlist: watchlist.messages,
};

export default messages;
