/** Legal pages, consent panel and disclaimer banner (src/widgets/legal, src/app/legal). */
const messages = {
  page: {
    navLabel: "Legal pages",
    nav: {
      terms: "Terms of use",
      notice: "Legal notice",
      privacy: "Privacy policy",
      cookies: "Cookie policy",
    },
    lastUpdated: "Last updated {date}",
    translationNote:
      "This translation is provided for convenience. If it differs from the English version, the English version applies.",
  },
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
  terms: {
    title: "Terms of use",
    intro:
      'These terms apply to the website {site}, its public data endpoints and the {site} app inside the Sage wallet (together, the "Service"). The operator is named in the <link>legal notice</link>. By using the Service you accept these terms. If you do not accept them, please do not use the Service.',
    service: {
      title: "1. What the Service is",
      body: "The Service is an independent, free, read-only explorer for the public Chia blockchain. It shows blocks, transactions, the mempool, fee estimates, addresses, coins and assets, as far as that information is available from public sources.",
      items: {
        funds:
          "It does not hold, receive or manage funds, private keys or seed phrases, and it cannot move your coins.",
        transactions:
          "It does not execute, route or broker transactions, trades or orders, and it takes no fee or commission.",
        accounts: "There are no user accounts.",
        mica: "It does not provide crypto-asset services within the meaning of Regulation (EU) 2023/1114 (MiCA), and it is not an exchange, broker, custodian, investment adviser or other regulated financial service.",
        sage: "Inside the Sage wallet, the wallet is Sage's software. This app only reads what Sage makes available after you allow it; anything you sign or send, you sign or send in Sage.",
      },
    },
    noAdvice: {
      title: "2. No advice",
      body: "Everything on the Service is general information. Nothing on it is financial, investment, tax or legal advice, a recommendation or an offer to buy or sell any asset. Crypto-assets are highly volatile and you can lose all of the money you put in. Blockchain transactions cannot be reversed. Do your own research, and check amounts, addresses, asset IDs and fees in your own wallet before you act.",
    },
    data: {
      title: "3. Data: as is, as available",
      intro:
        "The Service displays data from third parties (by default Coinset, Dexie and MintGarden, or a node you configure yourself) and figures it derives from that data, such as projected blocks, fee estimates, expected confirmation times, asset names, icons and prices. That information:",
      items: {
        delayed: "may be delayed, incomplete, cached, out of date or wrong;",
        estimates:
          "includes estimates and projections that can turn out differently, for example which block a transaction lands in or what fee is enough;",
        names:
          "includes names, tickers, icons and images chosen by third parties, which can be misleading or copy another asset. Always identify an asset by its asset ID.",
      },
      asIs: 'The Service is provided "as is" and "as available". There is no promise that it is available at any particular time, free of errors or suitable for a particular purpose. It may be changed, limited, interrupted or discontinued at any time without notice.',
    },
    use: {
      title: "4. Acceptable use",
      intro:
        "You may use the Service, including its public data endpoints, for personal and commercial purposes within these rules. You must not:",
      items: {
        rate: "send requests at a rate that burdens the Service, get around rate limits or blocks, or disrupt it for others;",
        access: "attempt to gain unauthorised access to the Service or the systems behind it;",
        unlawful:
          "use the Service for anything unlawful, including fraud, or to mislead others about an asset or a transaction;",
        endorse: "present your own offering as operated, endorsed or verified by {site}.",
      },
      automated:
        "For automated use, cache responses and keep request rates reasonable. The Service may rate-limit or block traffic that affects its availability.",
    },
    thirdParty: {
      title: "5. Third-party content and links",
      body: "Asset names, icons, NFT images and metadata come from the blockchain and from third parties. They are not created, reviewed or endorsed by the operator. The same applies to external websites the Service links to. If you believe content shown on the Service is unlawful or infringes your rights, write to x.com/MaximEdogawa on x.com with the page address and the reason; it will be removed from display once the operator becomes aware of an infringement.",
    },
    liability: {
      title: "6. Liability",
      intro:
        "The Service is provided free of charge. The operator's liability for damages, whatever the legal ground, is therefore limited as follows:",
      items: {
        unlimited:
          "The operator is liable without limitation for intent and gross negligence, for injury to life, body or health, under the Product Liability Act (Produkthaftungsgesetz), where a guarantee was given and where a defect was fraudulently concealed.",
        slight:
          "For slight negligence the operator is liable only for breach of an essential obligation, that is one whose fulfilment is what makes proper use of the Service possible at all and on which you may ordinarily rely. In that case liability is limited to the damage that was typical and foreseeable when you used the Service.",
        excluded: "Apart from that, liability for slight negligence is excluded.",
        decisions:
          "Subject to point 1, this means in particular that the operator is not liable for losses resulting from decisions you base on information shown on the Service, such as sending, buying, selling or holding an asset or choosing a fee, or from the Service being unavailable.",
        representatives:
          "These limits also protect the operator's representatives and anyone who helps run the Service.",
      },
    },
    openSource: {
      title: "7. Open source",
      body: "The software behind the Service is open source under the MIT License, which comes with its own disclaimer for the software. These terms cover the hosted Service.",
    },
    changes: {
      title: "8. Changes",
      body: "These terms may be updated, for example when the Service changes. The version on this page, with the date shown above, applies from that date. If you keep using the Service after a change, the updated terms apply to that use.",
    },
    law: {
      title: "9. Governing law and venue",
      choice:
        "These terms are governed by the law of Austria, excluding the UN Convention on Contracts for the International Sale of Goods. If you are a consumer, this choice of law does not take away the protection of mandatory consumer law of the country where you habitually live.",
      venue:
        "If you are a merchant, a legal entity under public law or have no general place of jurisdiction in the European Union, the courts of Vienna, Austria, have jurisdiction. Mandatory statutory venues remain unaffected.",
      disputes:
        "The operator is neither obliged nor willing to take part in dispute resolution proceedings before a consumer arbitration board.",
    },
    severability: {
      title: "10. Severability",
      body: "If any provision of these terms is invalid, the remaining provisions stay in effect and the statutory rules apply in place of the invalid one.",
    },
  },
  notice: {
    title: "Legal notice",
    intro: "Information about the operator (Impressum under § 5 DDG and § 18 MStV).",
    independence: {
      title: "Independence and trademarks",
      body: '{site} is an independent project. It is not affiliated with, endorsed by or sponsored by Chia Network Inc. "Chia" and "XCH" are used only to describe the network the Service shows; they and any related marks belong to their respective owners. The same applies to Sage, Coinset, Dexie, MintGarden and every other product or asset name shown on the Service.',
    },
    liability: {
      title: "Content and links",
      content:
        "The content of this site is prepared with care, but most of what it shows is data from the public blockchain and from third parties, displayed automatically and without review. No guarantee is given for its accuracy, completeness or timeliness; see the <link>terms of use</link>.",
      links:
        "The site links to external websites whose content is outside the operator's control and for which their providers are responsible. Linked pages were not found to be unlawful when the link was set; a link is removed as soon as an infringement becomes known.",
    },
    report: {
      title: "Reporting content",
      body: "To report content shown on this site that you believe is unlawful or infringes your rights, write to x.com/MaximEdogawa on x.com. Since there are no accounts, server logs can only be matched to you with your IP address and the time of your visit.",
    },
    attribution: {
      title: "Open source and data sources",
      items: {
        source:
          "Source code: <link>github.com/maximedogawa/mempool-xch</link> under the MIT License.",
        chain: "Chain data: <link>Coinset</link>, or a full node you configure.",
        cats: "CAT names and icons: <link>Dexie</link>.",
        nfts: "NFT metadata and images: <link>MintGarden</link> and the NFTs' own links.",
        ownership: "NFT images, CAT icons and on-chain content belong to their creators.",
      },
    },
    disputes: {
      title: "Consumer dispute resolution",
      body: "The operator is neither obliged nor willing to take part in dispute resolution proceedings before a consumer arbitration board.",
    },
  },
  privacy: {
    title: "Privacy policy",
    intro:
      "How {site} handles personal data, under the EU General Data Protection Regulation (GDPR). In short: no accounts, no tracking, no analytics and no advertising. Your settings stay in your browser.",
    controller: {
      title: "1. Controller",
      body: "Maxim Edogawa. See also the <link>legal notice</link>.",
    },
    logs: {
      title: "2. Visiting the website: server logs",
      intro:
        "When you open the site, your browser sends technical data that the server records in access logs: IP address, date and time, the address requested (which can contain a transaction ID, block, address or coin you looked up), status code, referring page and browser identification.",
      items: {
        purpose:
          "Purpose: delivering the site, keeping it secure and stable, and investigating abuse and errors.",
        basis:
          "Legal basis: Art. 6(1)(f) GDPR; the legitimate interest is operating a secure website.",
        retention:
          "Retention: 14 days, longer only while needed to investigate a specific security incident.",
        hosting: "Hosting: Hetzner, acting as processor under Art. 28 GDPR.",
      },
      noProxy:
        "The server does not fetch chain or asset data on your behalf: it only serves the application itself (HTML, scripts, styles). Every lookup you make is a request from your own browser to Coinset, Dexie, MintGarden, XCHandles, public market data sources or your own node, described in the next sections.",
    },
    storage: {
      title: "3. Storage in your browser",
      body: "The site keeps a few entries in your browser's local storage: your settings (network, node address, theme, language, sounds, whether you turned on browser notifications), a cache of the asset list, a short mempool history drawn while the page is open, your watchlist of addresses and transaction ids if you add any, which Sage permissions you declined, and your cookie choice. They stay on your device and are not sent to the operator. They are strictly necessary to provide what you asked for (§ 25(2) no. 2 TDDDG). You can delete them at any time in your browser settings. Details are in the <link>cookie policy</link>.",
      notifications:
        "If you turn on browser notifications for your watchlist, that permission is granted to this site by your browser and can be withdrawn there at any time; the operator never sees whether you turned it on.",
    },
    thirdParties: {
      title: "4. Services your browser contacts directly",
      intro:
        "Every page reads chain and asset data straight from other services, from your own browser, not through this site's server. Like any web server, they receive your IP address, browser identification and the address of the item requested:",
      items: {
        dexie:
          "Dexie (api.dexie.space, icons.dexie.space): the CAT token list, names, tickers and icons.",
        mintgarden:
          "MintGarden (api.mintgarden.io, assets.mainnet.mintgarden.io, ipfs.mintgarden.io): NFT metadata and images.",
        nftHosts:
          "Hosts named in an NFT's own on-chain metadata, when MintGarden has no copy. Which hosts these are is decided by the NFT's creator.",
        xchandles:
          "XCHandles (api.xchandles.com): only when you look up, watch or search a handle — what that name resolves to and when it expires.",
        coinset:
          "Coinset (api.coinset.org): all chain data — the mempool, blocks, transactions, addresses, coins and assets you view, and the live updates — unless you enter a different node below.",
        node: "A full node you enter in Settings: all chain data then comes from there instead of Coinset.",
        map: "Only while the Network map page is open: Cloudflare DNS (cloudflare-dns.com, with dns.google as a fallback) answers DNS queries for the Chia introducers, and GeoJS (get.geojs.io) estimates the location of the node addresses those answers contain. Only node addresses are sent for lookup, never yours; the addresses learnt are kept in your browser's local storage for a week.",
        market:
          "Only while the Market page is open: the public market data APIs of Gate.io (api.gateio.ws), OKX (www.okx.com) and HTX (api.huobi.pro) for XCH order books and recent trades, every 5 seconds, and Dexie (api.dexie.space) for open XCH offers against the stablecoins BYC, wUSDC.b, wUSDC and wUSDT. The requests carry no account, key or wallet data; the exchanges see them like any visit to their API.",
      },
      basis:
        "Legal basis: Art. 6(1)(f) GDPR; the legitimate interest is showing the blockchain content you request. Some of these providers may process data outside the European Economic Area, for example in the United States, where the level of data protection can be lower. Their own privacy policies apply.",
      publicData:
        "Addresses, transaction IDs and coin IDs are public on the blockchain. If you look up your own address, the service answering the lookup may be able to link it to your IP address.",
    },
    sage: {
      title: "5. Inside the Sage wallet",
      body: "In the Sage app, wallet information (your receive address, balances, pending and past transactions, coins) is read from Sage only after you allow it, and is processed on your device. It is not sent to the operator. To show your address page, the app looks up your public address at the chain data source (Coinset or your node), just as any address search would.",
    },
    noTracking: {
      title: "6. No cookies, analytics or advertising",
      body: "The site sets no cookies and uses no analytics, tracking or advertising. Should that change, it will only happen with your prior consent through Cookie settings, and this policy will be updated first.",
    },
    rights: {
      title: "7. Your rights",
      intro: "You have the right to:",
      items: {
        access: "access the personal data held about you (Art. 15 GDPR);",
        rectification: "have it corrected (Art. 16) or erased (Art. 17);",
        restriction:
          "restrict its processing (Art. 18) and receive it in a portable format (Art. 20);",
        objection:
          "<b>object</b> at any time, on grounds relating to your particular situation, to processing based on Art. 6(1)(f) GDPR (Art. 21);",
        complaint:
          "complain to a data protection supervisory authority (Art. 77), in particular in the EU country where you live or work.",
      },
      contact:
        "Write to x.com/MaximEdogawa on x.com. Since there are no accounts, server logs can only be matched to you with your IP address and the time of your visit.",
    },
    other: {
      title: "8. Other",
      body: "You are not required to provide personal data. Without the technical data in section 2 the site cannot be delivered. There is no automated decision-making or profiling. This policy is updated when the site changes; the date above shows the current version.",
    },
  },
  cookies: {
    title: "Cookie policy",
    intro:
      "{site} sets no cookies. It keeps a few entries in your browser's local storage, which the rules for cookies (Art. 5(3) ePrivacy Directive, § 25 TDDDG) cover in the same way. This page lists them.",
    categories: {
      title: "Categories",
      necessary:
        "<b>Strictly necessary</b>: always on. Needed for features you use, and exempt from consent (§ 25(2) no. 2 TDDDG).",
      analytics:
        "<b>Analytics</b>: usage statistics. Not used at the moment; would only run with your consent.",
      advertising:
        "<b>Advertising</b>: ads and ad measurement. Not used at the moment; would only run with your consent.",
    },
    necessary: {
      title: "Strictly necessary storage",
      columns: {
        key: "Key",
        purpose: "Purpose",
        kept: "Kept",
      },
      rows: {
        settings: {
          purpose:
            "Network, node address, theme, language, number of recent blocks, sounds, whether browser notifications are on",
          lifetime: "Until you reset or clear it",
        },
        tokens: {
          purpose: "Cached list of CAT names and icons, so it is not downloaded on every visit",
          lifetime: "Refreshed after 24 hours",
        },
        history: {
          purpose: "Mempool graph of the last two hours, drawn while the page is open",
          lifetime: "Entries older than two hours are dropped",
        },
        snapshot: {
          purpose:
            "The pending transactions last shown (public network data), so the next visit shows them at once and does not download them again",
          lifetime: "Ignored after one hour, replaced while the page is open",
        },
        watchlist: {
          purpose: "Addresses and transaction ids you chose to watch",
          lifetime: "Until you remove them or clear it",
        },
        sageRefused: {
          purpose: "Sage permissions you declined, so you are not asked again (Sage app only)",
          lifetime: "Until you clear it",
        },
        consent: {
          purpose: "Your choice in Cookie settings",
          lifetime: "12 months",
        },
      },
      notShared: "None of these entries is sent to the operator or used to identify or follow you.",
    },
    choice: {
      title: "Your choice",
      body: "On your first visit a panel asks for your choice: Reject all, Save my choice or Accept all. Your choice is kept for 12 months and then asked again. You can change or withdraw it at any time with Cookie settings in the footer or here:",
      signal:
        "If your browser sends a Do Not Track or Global Privacy Control signal, analytics and advertising stay off and you are not asked.",
    },
    thirdParties: {
      title: "Content from other services",
      body: "Icons, NFT images and some chain data load directly from other services, which receive your IP address as any web server does. See section 4 of the <link>privacy policy</link>.",
    },
  },
};

export default messages;
