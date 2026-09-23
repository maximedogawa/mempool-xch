import type { Translation } from "../../translate";
import type en from "../en/legal";

const messages: Translation<typeof en> = {
  page: {
    navLabel: "法律页面",
    nav: {
      terms: "使用条款",
      notice: "法律声明",
      privacy: "隐私政策",
      cookies: "Cookie 政策",
    },
    lastUpdated: "最后更新：{date}",
    translationNote: "本译文仅供参考。如与英文版本有任何不一致，以英文版本为准。",
  },
  consent: {
    title: "Cookie 与本地存储",
    intro:
      "本网站仅在您的浏览器中保存其运行所需的内容。除非您在此处允许，否则不会加载任何分析或广告内容。",
    cookiePolicy: "Cookie 政策",
    privacyPolicy: "隐私政策",
    signal:
      "您的浏览器发送了「请勿跟踪」（Do Not Track）或「全球隐私控制」（Global Privacy Control）信号，因此分析和广告保持关闭。",
    categoriesLegend: "类别",
    categories: {
      necessary: {
        label: "严格必要",
        detail: "您的设置、缓存和本次选择，保存在您的浏览器中。始终开启。",
      },
      analytics: {
        label: "分析",
        detail: "匿名使用统计。目前未使用。",
      },
      advertising: {
        label: "广告",
        detail: "广告及广告效果衡量。目前未使用。",
      },
    },
    rejectAll: "全部拒绝",
    saveChoice: "保存我的选择",
    acceptAll: "全部接受",
    close: "关闭",
    settingsButton: "Cookie 设置",
  },
  disclaimer: {
    label: "免责声明",
    text: "Alpha 版软件，仍在大幅变化中。不构成财务建议——请在您自己的钱包中核实。<link>使用条款</link>",
    dismiss: "关闭免责声明",
  },
  terms: {
    title: "使用条款",
    intro:
      "本条款适用于网站 {site}、其公开数据接口以及 Sage 钱包内的 {site} 应用（统称「本服务」）。运营者信息载于<link>法律声明</link>。使用本服务即表示您接受本条款。如您不接受本条款，请勿使用本服务。",
    service: {
      title: "1. 本服务是什么",
      body: "本服务是一个独立、免费、只读的公共 Chia 区块链浏览器。在公开来源可获得相关信息的范围内，它显示区块、交易、内存池、手续费估算、地址、币（coin）和资产。",
      items: {
        funds: "它不持有、接收或管理资金、私钥或助记词，也无法转移您的币。",
        transactions: "它不执行、路由或撮合交易、成交或订单，也不收取任何费用或佣金。",
        accounts: "本服务没有用户账户。",
        mica: "它不提供欧盟第 2023/1114 号条例（MiCA）所指的加密资产服务，也不是交易所、经纪商、托管机构、投资顾问或其他受监管的金融服务。",
        sage: "在 Sage 钱包内，钱包是 Sage 的软件。本应用仅在您允许后读取 Sage 提供的内容；您签名或发送的任何内容，均在 Sage 中签名或发送。",
      },
    },
    noAdvice: {
      title: "2. 不构成建议",
      body: "本服务上的所有内容均为一般性信息。其中任何内容均不构成财务、投资、税务或法律建议，也不构成购买或出售任何资产的推荐或要约。加密资产波动性极高，您可能损失投入的全部资金。区块链交易无法撤销。请自行研究，并在采取行动前在您自己的钱包中核对金额、地址、资产 ID 和手续费。",
    },
    data: {
      title: "3. 数据：按现状、按可用性提供",
      intro:
        "本服务显示来自第三方的数据（默认来自 Coinset、Dexie 和 MintGarden，或您自行配置的节点），以及由这些数据推算出的数值，例如预测区块、手续费估算、预计确认时间、资产名称、图标和价格。这些信息：",
      items: {
        delayed: "可能存在延迟、不完整、来自缓存、已过时或错误；",
        estimates:
          "包含可能与实际结果不同的估算和预测，例如交易会被打包进哪个区块，或多少手续费才足够；",
        names:
          "包含由第三方选定的名称、代码（ticker）、图标和图片，这些内容可能具有误导性或仿冒其他资产。请始终通过资产 ID 识别资产。",
      },
      asIs: "本服务按「现状」和「可用性」提供。不保证其在任何特定时间可用、没有错误或适合任何特定用途。本服务可随时更改、限制、中断或停止，恕不另行通知。",
    },
    use: {
      title: "4. 可接受的使用",
      intro: "您可以在本规则范围内，将本服务（包括其公开数据接口）用于个人和商业目的。您不得：",
      items: {
        rate: "以给本服务造成负担的频率发送请求、规避速率限制或封锁，或干扰他人使用本服务；",
        access: "试图未经授权访问本服务或其背后的系统；",
        unlawful: "将本服务用于任何违法目的（包括欺诈），或就某项资产或交易误导他人；",
        endorse: "将您自己的产品或服务表述为由 {site} 运营、认可或验证。",
      },
      automated:
        "自动化使用时，请缓存响应并将请求频率保持在合理范围内。本服务可对影响其可用性的流量进行限速或封锁。",
    },
    thirdParty: {
      title: "5. 第三方内容和链接",
      body: "资产名称、图标、NFT 图片和元数据来自区块链和第三方。它们并非由运营者创建、审核或认可。本服务链接到的外部网站同样如此。如您认为本服务上显示的内容违法或侵犯您的权利，请写信至 x.com 上的 x.com/MaximEdogawa，并注明页面地址和理由；运营者一旦知悉侵权行为，将停止显示相关内容。",
    },
    liability: {
      title: "6. 责任",
      intro: "本服务免费提供。因此，无论基于何种法律依据，运营者对损害的责任限制如下：",
      items: {
        unlimited:
          "对于故意和重大过失、对生命、身体或健康造成的伤害、依据《产品责任法》（Produkthaftungsgesetz）的责任、已作出担保的情形以及恶意隐瞒缺陷的情形，运营者承担无限责任。",
        slight:
          "对于轻微过失，运营者仅对违反基本义务承担责任，即履行该义务是正常使用本服务的前提，且您通常可以信赖该义务得到履行。在此情况下，责任限于您使用本服务时典型且可预见的损害。",
        excluded: "除此之外，对轻微过失的责任予以排除。",
        decisions:
          "在不影响第 1 点的前提下，这尤其意味着：对于因您基于本服务显示的信息所作的决定（例如发送、购买、出售或持有资产，或选择手续费）而产生的损失，或因本服务不可用而产生的损失，运营者不承担责任。",
        representatives: "上述限制同样保护运营者的代表以及协助运营本服务的任何人。",
      },
    },
    openSource: {
      title: "7. 开源",
      body: "本服务背后的软件依据 MIT 许可证开源，该许可证附有其自身针对软件的免责声明。本条款适用于托管的本服务。",
    },
    changes: {
      title: "8. 变更",
      body: "本条款可能会更新，例如在本服务发生变化时。本页所载版本及上方所示日期自该日期起适用。如您在变更后继续使用本服务，则更新后的条款适用于该使用。",
    },
    law: {
      title: "9. 适用法律和管辖法院",
      choice:
        "本条款受奥地利法律管辖，但排除《联合国国际货物销售合同公约》的适用。如您是消费者，此法律选择不剥夺您惯常居住国强制性消费者保护法律对您的保护。",
      venue:
        "如您是商人、公法法人，或在欧盟境内没有一般管辖地，则由奥地利维也纳的法院管辖。法定强制管辖地不受影响。",
      disputes: "运营者既无义务也不愿意参加消费者仲裁机构的争议解决程序。",
    },
    severability: {
      title: "10. 可分割性",
      body: "如本条款的任何规定无效，其余规定仍然有效，并由法定规则取代无效规定。",
    },
  },
  notice: {
    title: "法律声明",
    intro: "关于运营者的信息（即依据 § 5 DDG 和 § 18 MStV 提供的 Impressum）。",
    independence: {
      title: "独立性和商标",
      body: "{site} 是一个独立项目。它与 Chia Network Inc. 没有关联，也未获得其认可或赞助。「Chia」和「XCH」仅用于描述本服务所显示的网络；它们及任何相关标志均归其各自所有者所有。这同样适用于 Sage、Coinset、Dexie、MintGarden 以及本服务上显示的所有其他产品或资产名称。",
    },
    liability: {
      title: "内容和链接",
      content:
        "本网站的内容经过审慎编制，但其显示的大部分内容是来自公共区块链和第三方的数据，系自动显示且未经审核。不保证其准确性、完整性或及时性；请参阅<link>使用条款</link>。",
      links:
        "本网站链接到外部网站，其内容不受运营者控制，并由其提供者负责。设置链接时未发现被链接页面存在违法内容；一旦知悉侵权行为，将立即删除相关链接。",
    },
    report: {
      title: "举报内容",
      body: "如需举报本网站上显示的、您认为违法或侵犯您权利的内容，请写信至 x.com 上的 x.com/MaximEdogawa。由于没有账户，服务器日志只能通过您的 IP 地址和访问时间与您对应。",
    },
    attribution: {
      title: "开源和数据来源",
      items: {
        source: "源代码：<link>github.com/maximedogawa/mempool-xch</link>，采用 MIT 许可证。",
        chain: "链上数据：<link>Coinset</link>，或您配置的全节点。",
        cats: "CAT 名称和图标：<link>Dexie</link>。",
        nfts: "NFT 元数据和图片：<link>MintGarden</link> 以及 NFT 自身的链接。",
        ownership: "NFT 图片、CAT 图标和链上内容归其创作者所有。",
      },
    },
    disputes: {
      title: "消费者争议解决",
      body: "运营者既无义务也不愿意参加消费者仲裁机构的争议解决程序。",
    },
  },
  privacy: {
    title: "隐私政策",
    intro:
      "{site} 如何依据欧盟《通用数据保护条例》（GDPR）处理个人数据。简而言之：没有账户、没有跟踪、没有分析、没有广告。您的设置保留在您的浏览器中。",
    controller: {
      title: "1. 数据控制者",
      body: "Maxim Edogawa。另请参阅<link>法律声明</link>。",
    },
    logs: {
      title: "2. 访问网站：服务器日志",
      intro:
        "当您打开本网站时，您的浏览器会发送技术数据，服务器将其记录在访问日志中：IP 地址、日期和时间、请求的地址（其中可能包含您查询的交易 ID、区块、地址或币）、状态码、来源页面和浏览器标识。",
      items: {
        purpose: "目的：提供网站、保障其安全和稳定，以及调查滥用和错误。",
        basis: "法律依据：GDPR 第 6 条第 1 款 (f) 项；正当利益在于运营一个安全的网站。",
        retention: "保存期限：14 天；仅在调查具体安全事件所需期间才会延长。",
        hosting: "托管：Hetzner，依据 GDPR 第 28 条作为数据处理者。",
      },
      noProxy:
        "服务器不会代表您获取链上或资产数据：它仅提供应用本身（HTML、脚本、样式）。您进行的每一次查询，都是由您自己的浏览器向 Coinset、Dexie、MintGarden、XCHandles、公共市场数据来源或您自己的节点发出的请求，详见以下各节。",
      market:
        "「市场」页面从 Gate.io（api.gateio.ws）、OKX（www.okx.com）和 HTX（api.huobi.pro）读取公开订单簿，并从 Dexie 读取 ByteCash（BYC，Circuit 的美元稳定币）和 wUSDC.b 的公开 XCH 报价（offer）。这些请求不包含任何账户凭据。某个来源可能不可用或受到速率限制；此时页面会将其标记为过时，并将其排除在汇总数据之外。",
    },
    storage: {
      title: "3. 在您浏览器中的存储",
      body: "本网站在您浏览器的本地存储中保存少量条目：您的设置（网络、节点地址、主题、语言、声音、是否开启浏览器通知）、资产列表缓存、页面打开期间记录的简短内存池历史、您添加的地址和交易 ID 关注列表（如有）、您拒绝的 Sage 权限，以及您的 Cookie 选择。它们保留在您的设备上，不会发送给运营者。它们对于提供您所请求的内容是严格必要的（TDDDG 第 25 条第 2 款第 2 项）。您可以随时在浏览器设置中删除它们。详情请参阅 <link>Cookie 政策</link>。",
      notifications:
        "如果您为关注列表开启浏览器通知，该权限由您的浏览器授予本网站，您可以随时在浏览器中撤回；运营者永远不会知道您是否开启了通知。",
    },
    thirdParties: {
      title: "4. 您的浏览器直接联系的服务",
      intro:
        "每个页面都由您自己的浏览器直接从其他服务读取链上和资产数据，而不经过本网站的服务器。与任何网络服务器一样，这些服务会收到您的 IP 地址、浏览器标识以及所请求项目的地址：",
      items: {
        dexie: "Dexie（api.dexie.space、icons.dexie.space）：CAT 代币列表、名称、代码和图标。",
        mintgarden:
          "MintGarden（api.mintgarden.io、assets.mainnet.mintgarden.io、ipfs.mintgarden.io）：NFT 元数据和图片。",
        nftHosts:
          "NFT 自身链上元数据中指定的主机（当 MintGarden 没有副本时）。具体是哪些主机由 NFT 的创作者决定。",
        xchandles:
          "XCHandles（api.xchandles.com）：仅在您查询、关注或搜索域名（handle）时——该名称解析到何处以及何时到期。",
        coinset:
          "Coinset（api.coinset.org）：所有链上数据——内存池、您查看的区块、交易、地址、币和资产，以及实时更新——除非您在下方输入其他节点。",
        node: "您在「设置」中输入的全节点：此时所有链上数据均来自该节点，而不是 Coinset。",
        map: "「网络地图」页面：其节点统计数据是随本网站一同发布的 Chia Network 公开 Peer Info 仪表板（dashboard.chia.net）的快照，因此显示这些数据不会联系任何第三方。只有当该快照缺失、超过 30 天或不属于所选网络时，页面才会在打开期间改用实时扫描：Cloudflare DNS（cloudflare-dns.com，以 dns.google 作为备用）响应针对 Chia 引导节点（introducer）的 DNS 查询，GeoJS（get.geojs.io）估算这些响应中包含的节点地址的位置；获取到的地址会在您浏览器的本地存储中保留一周。如果您在设置中指向自己的节点，其已连接对等节点的地址也会发送给 GeoJS。发送查询的只有节点地址，绝不包括您的地址。页面还会在本地存储中记住您上次看到的各国节点数，以便突出显示变化。",
      },
      basis:
        "法律依据：GDPR 第 6 条第 1 款 (f) 项；正当利益在于显示您请求的区块链内容。其中部分提供者可能在欧洲经济区以外（例如美国）处理数据，当地的数据保护水平可能较低。适用其各自的隐私政策。",
      publicData:
        "地址、交易 ID 和币 ID 在区块链上是公开的。如果您查询自己的地址，响应该查询的服务可能会将其与您的 IP 地址关联起来。",
    },
    sage: {
      title: "5. 在 Sage 钱包内",
      body: "在 Sage 应用中，钱包信息（您的收款地址、余额、待确认和过往交易、币）仅在您允许后才从 Sage 读取，并在您的设备上处理。这些信息不会发送给运营者。为了显示您的地址页面，应用会在链上数据来源（Coinset 或您的节点）查询您的公开地址，与任何地址搜索相同。",
    },
    noTracking: {
      title: "6. 无 Cookie、无分析、无广告",
      body: "本网站不设置 Cookie，也不使用任何分析、跟踪或广告。如这一情况发生变化，只会在事先通过「Cookie 设置」征得您同意后进行，并且本政策会先行更新。",
    },
    rights: {
      title: "7. 您的权利",
      intro: "您有权：",
      items: {
        access: "访问所保存的与您有关的个人数据（GDPR 第 15 条）；",
        rectification: "要求更正（第 16 条）或删除（第 17 条）这些数据；",
        restriction: "限制其处理（第 18 条），并以可携带的格式接收这些数据（第 20 条）；",
        objection:
          "基于与您特定情况相关的理由，随时<b>反对</b>依据 GDPR 第 6 条第 1 款 (f) 项进行的处理（第 21 条）；",
        complaint:
          "向数据保护监管机构投诉（第 77 条），特别是向您居住或工作所在的欧盟国家的监管机构投诉。",
      },
      contact:
        "请写信至 x.com 上的 x.com/MaximEdogawa。由于没有账户，服务器日志只能通过您的 IP 地址和访问时间与您对应。",
    },
    other: {
      title: "8. 其他",
      body: "您没有义务提供个人数据。没有第 2 节所述的技术数据，本网站将无法提供。本网站不进行自动化决策或用户画像。本政策会在网站发生变化时更新；上方日期显示当前版本。",
    },
  },
  cookies: {
    title: "Cookie 政策",
    intro:
      "{site} 不设置 Cookie。它会在您浏览器的本地存储中保存少量条目，关于 Cookie 的规定（《电子隐私指令》第 5 条第 3 款，TDDDG 第 25 条）同样适用于这些条目。本页列出了这些条目。",
    categories: {
      title: "类别",
      necessary:
        "<b>严格必要</b>：始终开启。为您使用的功能所必需，并且无需征得同意（TDDDG 第 25 条第 2 款第 2 项）。",
      analytics: "<b>分析</b>：使用统计。目前未使用；只有在您同意后才会运行。",
      advertising: "<b>广告</b>：广告及广告效果衡量。目前未使用；只有在您同意后才会运行。",
    },
    necessary: {
      title: "严格必要的存储",
      columns: {
        key: "键",
        purpose: "用途",
        kept: "保存期限",
      },
      rows: {
        settings: {
          purpose: "网络、节点地址、主题、语言、最近区块数量、声音、是否开启浏览器通知",
          lifetime: "直到您重置或清除",
        },
        tokens: {
          purpose: "缓存的 CAT 名称和图标列表，以免每次访问都重新下载",
          lifetime: "24 小时后刷新",
        },
        history: {
          purpose: "过去两小时的内存池图表，在页面打开期间记录",
          lifetime: "超过两小时的条目会被删除",
        },
        snapshot: {
          purpose: "上次显示的待确认交易（公开网络数据），以便下次访问时立即显示，而无需重新下载",
          lifetime: "一小时后忽略；页面打开期间会被替换",
        },
        watchlist: {
          purpose: "您选择关注的地址和交易 ID",
          lifetime: "直到您移除或清除",
        },
        sageRefused: {
          purpose: "您拒绝的 Sage 权限，以免再次询问您（仅限 Sage 应用）",
          lifetime: "直到您清除",
        },
        consent: {
          purpose: "您在「Cookie 设置」中的选择",
          lifetime: "12 个月",
        },
      },
      notShared: "这些条目均不会发送给运营者，也不会用于识别或跟踪您。",
    },
    choice: {
      title: "您的选择",
      body: "您首次访问时，会有一个面板请您作出选择：全部拒绝、保存我的选择或全部接受。您的选择将保存 12 个月，之后会再次询问。您可以随时通过页脚中的「Cookie 设置」或在此处更改或撤回您的选择：",
      signal:
        "如果您的浏览器发送「请勿跟踪」（Do Not Track）或「全球隐私控制」（Global Privacy Control）信号，分析和广告将保持关闭，并且不会询问您。",
    },
    thirdParties: {
      title: "来自其他服务的内容",
      body: "图标、NFT 图片和部分链上数据直接从其他服务加载，这些服务会像任何网络服务器一样收到您的 IP 地址。请参阅<link>隐私政策</link>第 4 节。",
    },
  },
};

export default messages;
