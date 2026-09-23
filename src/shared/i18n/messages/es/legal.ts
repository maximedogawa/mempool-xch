import type { Translation } from "../../translate";
import type en from "../en/legal";

const messages: Translation<(typeof en)["messages"]> = {
  page: {
    navLabel: "Páginas legales",
    nav: {
      terms: "Términos de uso",
      notice: "Aviso legal",
      privacy: "Política de privacidad",
      cookies: "Política de cookies",
    },
    lastUpdated: "Última actualización: {date}",
    translationNote:
      "Esta traducción se ofrece solo a título informativo. Si difiere de la versión en inglés, prevalece la versión en inglés.",
  },
  terms: {
    title: "Términos de uso",
    intro:
      "Estos términos se aplican al sitio web {site}, a sus endpoints públicos de datos y a la app {site} dentro de la billetera Sage (en conjunto, el «Servicio»). El operador figura en el <link>aviso legal</link>. Al usar el Servicio aceptas estos términos. Si no los aceptas, no uses el Servicio.",
    service: {
      title: "1. Qué es el Servicio",
      body: "El Servicio es un explorador independiente, gratuito y de solo lectura de la blockchain pública de Chia. Muestra bloques, transacciones, la mempool, estimaciones de comisiones, direcciones, monedas (coins) y activos, en la medida en que esa información esté disponible en fuentes públicas.",
      items: {
        funds:
          "No custodia, recibe ni gestiona fondos, claves privadas ni frases semilla, y no puede mover tus monedas.",
        transactions:
          "No ejecuta, enruta ni intermedia transacciones, operaciones ni órdenes, y no cobra ninguna comisión ni corretaje.",
        accounts: "No hay cuentas de usuario.",
        mica: "No presta servicios de criptoactivos en el sentido del Reglamento (UE) 2023/1114 (MiCA), y no es un exchange, bróker, custodio, asesor de inversiones ni ningún otro servicio financiero regulado.",
        sage: "Dentro de la billetera Sage, la billetera es el software de Sage. Esta app solo lee lo que Sage pone a su disposición después de que lo permitas; todo lo que firmes o envíes lo firmas o envías en Sage.",
      },
    },
    noAdvice: {
      title: "2. Sin asesoramiento",
      body: "Todo lo que aparece en el Servicio es información general. Nada de ello constituye asesoramiento financiero, de inversión, fiscal o jurídico, una recomendación ni una oferta de compra o venta de ningún activo. Los criptoactivos son muy volátiles y puedes perder todo el dinero que inviertas. Las transacciones en blockchain no se pueden revertir. Investiga por tu cuenta y comprueba importes, direcciones, ID de activos y comisiones en tu propia billetera antes de actuar.",
    },
    data: {
      title: "3. Datos: tal cual y según disponibilidad",
      intro:
        "El Servicio muestra datos de terceros (por defecto Coinset, Dexie y MintGarden, o un nodo que configures tú mismo) y cifras que deriva de esos datos, como bloques previstos, estimaciones de comisiones, tiempos de confirmación esperados, nombres de activos, iconos y precios. Esa información:",
      items: {
        delayed: "puede estar retrasada, incompleta, en caché, desactualizada o ser errónea;",
        estimates:
          "incluye estimaciones y proyecciones que pueden resultar distintas, por ejemplo en qué bloque entra una transacción o qué comisión es suficiente;",
        names:
          "incluye nombres, tickers, iconos e imágenes elegidos por terceros, que pueden ser engañosos o copiar otro activo. Identifica siempre un activo por su ID de activo.",
      },
      asIs: "El Servicio se ofrece «tal cual» y «según disponibilidad». No se garantiza que esté disponible en ningún momento concreto, que esté libre de errores ni que sea adecuado para un fin determinado. Puede modificarse, limitarse, interrumpirse o suspenderse en cualquier momento sin previo aviso.",
    },
    use: {
      title: "4. Uso aceptable",
      intro:
        "Puedes usar el Servicio, incluidos sus endpoints públicos de datos, con fines personales y comerciales dentro de estas reglas. No debes:",
      items: {
        rate: "enviar solicitudes a un ritmo que sobrecargue el Servicio, eludir límites de frecuencia o bloqueos, ni perturbarlo para otros;",
        access:
          "intentar obtener acceso no autorizado al Servicio o a los sistemas que hay detrás;",
        unlawful:
          "usar el Servicio para cualquier fin ilícito, incluido el fraude, ni para engañar a otros sobre un activo o una transacción;",
        endorse: "presentar tu propia oferta como operada, respaldada o verificada por {site}.",
      },
      automated:
        "Para el uso automatizado, almacena las respuestas en caché y mantén un ritmo de solicitudes razonable. El Servicio puede limitar o bloquear el tráfico que afecte a su disponibilidad.",
    },
    thirdParty: {
      title: "5. Contenido y enlaces de terceros",
      body: "Los nombres de activos, iconos, imágenes de NFT y metadatos proceden de la blockchain y de terceros. El operador no los crea, revisa ni respalda. Lo mismo se aplica a los sitios web externos a los que enlaza el Servicio. Si crees que un contenido mostrado en el Servicio es ilícito o vulnera tus derechos, escribe a x.com/MaximEdogawa en x.com indicando la dirección de la página y el motivo; se dejará de mostrar en cuanto el operador tenga conocimiento de una infracción.",
    },
    liability: {
      title: "6. Responsabilidad",
      intro:
        "El Servicio se presta de forma gratuita. Por ello, la responsabilidad del operador por daños, cualquiera que sea su fundamento jurídico, queda limitada del siguiente modo:",
      items: {
        unlimited:
          "El operador responde sin limitación en caso de dolo y negligencia grave, por daños a la vida, la integridad física o la salud, conforme a la Ley de responsabilidad por productos (Produkthaftungsgesetz), cuando se haya otorgado una garantía y cuando se haya ocultado dolosamente un defecto.",
        slight:
          "En caso de negligencia leve, el operador solo responde por el incumplimiento de una obligación esencial, es decir, aquella cuyo cumplimiento hace posible en primer lugar el uso adecuado del Servicio y en cuyo cumplimiento puedes confiar habitualmente. En ese caso, la responsabilidad se limita al daño típico y previsible en el momento en que usaste el Servicio.",
        excluded: "Fuera de ello, queda excluida la responsabilidad por negligencia leve.",
        decisions:
          "Sin perjuicio del punto 1, esto significa en particular que el operador no responde de las pérdidas derivadas de decisiones que bases en información mostrada en el Servicio, como enviar, comprar, vender o mantener un activo o elegir una comisión, ni de la falta de disponibilidad del Servicio.",
        representatives:
          "Estas limitaciones también protegen a los representantes del operador y a cualquier persona que ayude a operar el Servicio.",
      },
    },
    openSource: {
      title: "7. Código abierto",
      body: "El software en el que se basa el Servicio es de código abierto bajo la Licencia MIT, que incluye su propia exención de responsabilidad para el software. Estos términos se refieren al Servicio alojado.",
    },
    changes: {
      title: "8. Cambios",
      body: "Estos términos pueden actualizarse, por ejemplo cuando cambie el Servicio. La versión de esta página, con la fecha indicada arriba, se aplica a partir de esa fecha. Si sigues usando el Servicio después de un cambio, los términos actualizados se aplican a ese uso.",
    },
    law: {
      title: "9. Legislación aplicable y jurisdicción",
      choice:
        "Estos términos se rigen por la legislación de Austria, con exclusión de la Convención de las Naciones Unidas sobre los Contratos de Compraventa Internacional de Mercaderías. Si eres consumidor, esta elección de ley no te priva de la protección que te otorgan las normas imperativas de protección de los consumidores del país en el que tengas tu residencia habitual.",
      venue:
        "Si eres comerciante, una persona jurídica de derecho público o no tienes un fuero general en la Unión Europea, serán competentes los tribunales de Viena (Austria). Los fueros legales imperativos no se ven afectados.",
      disputes:
        "El operador no está obligado ni dispuesto a participar en procedimientos de resolución de litigios ante una entidad de arbitraje de consumo.",
    },
    severability: {
      title: "10. Divisibilidad",
      body: "Si alguna disposición de estos términos no fuera válida, las disposiciones restantes seguirán en vigor y en lugar de la disposición inválida se aplicarán las normas legales.",
    },
  },
  notice: {
    title: "Aviso legal",
    intro: "Información sobre el operador (Impressum conforme al § 5 DDG y al § 18 MStV).",
    independence: {
      title: "Independencia y marcas",
      body: "{site} es un proyecto independiente. No está afiliado a Chia Network Inc. ni cuenta con su respaldo o patrocinio. «Chia» y «XCH» se usan solo para describir la red que muestra el Servicio; estas y cualquier marca relacionada pertenecen a sus respectivos titulares. Lo mismo se aplica a Sage, Coinset, Dexie, MintGarden y a cualquier otro nombre de producto o activo mostrado en el Servicio.",
    },
    liability: {
      title: "Contenido y enlaces",
      content:
        "El contenido de este sitio se elabora con cuidado, pero la mayor parte de lo que muestra son datos de la blockchain pública y de terceros, presentados de forma automática y sin revisión. No se garantiza su exactitud, integridad ni actualidad; consulta los <link>términos de uso</link>.",
      links:
        "El sitio enlaza a sitios web externos cuyo contenido está fuera del control del operador y de los que son responsables sus proveedores. Al establecer el enlace no se detectó que las páginas enlazadas fueran ilícitas; un enlace se elimina en cuanto se tiene conocimiento de una infracción.",
    },
    report: {
      title: "Denunciar contenido",
      body: "Para denunciar contenido mostrado en este sitio que consideres ilícito o que vulnere tus derechos, escribe a x.com/MaximEdogawa en x.com. Como no hay cuentas, los registros del servidor solo pueden asociarse contigo mediante tu dirección IP y la hora de tu visita.",
    },
    attribution: {
      title: "Código abierto y fuentes de datos",
      items: {
        source:
          "Código fuente: <link>github.com/maximedogawa/mempool-xch</link> bajo la Licencia MIT.",
        chain: "Datos de la cadena: <link>Coinset</link>, o un nodo completo que configures.",
        cats: "Nombres e iconos de CAT: <link>Dexie</link>.",
        nfts: "Metadatos e imágenes de NFT: <link>MintGarden</link> y los propios enlaces de los NFT.",
        ownership:
          "Las imágenes de NFT, los iconos de CAT y el contenido on-chain pertenecen a sus creadores.",
      },
    },
    disputes: {
      title: "Resolución de litigios de consumo",
      body: "El operador no está obligado ni dispuesto a participar en procedimientos de resolución de litigios ante una entidad de arbitraje de consumo.",
    },
  },
  privacy: {
    title: "Política de privacidad",
    intro:
      "Cómo trata {site} los datos personales, conforme al Reglamento General de Protección de Datos de la UE (RGPD). En resumen: sin cuentas, sin seguimiento, sin analítica y sin publicidad. Tus ajustes se quedan en tu navegador.",
    controller: {
      title: "1. Responsable del tratamiento",
      body: "Maxim Edogawa. Consulta también el <link>aviso legal</link>.",
    },
    logs: {
      title: "2. Visita al sitio web: registros del servidor",
      intro:
        "Cuando abres el sitio, tu navegador envía datos técnicos que el servidor registra en los registros de acceso: dirección IP, fecha y hora, la dirección solicitada (que puede contener un ID de transacción, un bloque, una dirección o una moneda que hayas consultado), código de estado, página de referencia e identificación del navegador.",
      items: {
        purpose:
          "Finalidad: servir el sitio, mantenerlo seguro y estable, e investigar abusos y errores.",
        basis:
          "Base jurídica: art. 6.1.f) RGPD; el interés legítimo es el funcionamiento de un sitio web seguro.",
        retention:
          "Conservación: 14 días; más tiempo solo mientras sea necesario para investigar un incidente de seguridad concreto.",
        hosting: "Alojamiento: Hetzner, como encargado del tratamiento conforme al art. 28 RGPD.",
      },
      noProxy:
        "El servidor no obtiene datos de la cadena ni de activos en tu nombre: solo sirve la propia aplicación (HTML, scripts, estilos). Cada consulta que haces es una solicitud de tu propio navegador a Coinset, Dexie, MintGarden, XCHandles, fuentes públicas de datos de mercado o tu propio nodo, descritas en los apartados siguientes.",
      market:
        "La página Mercado lee libros de órdenes públicos de Gate.io (api.gateio.ws), OKX (www.okx.com) y HTX (api.huobi.pro), además de ofertas públicas de XCH para ByteCash (BYC, la stablecoin en USD de Circuit) y wUSDC.b de Dexie. Estas solicitudes no contienen credenciales de ninguna cuenta. Una fuente puede no estar disponible o tener limitada la frecuencia de solicitudes; la página la marca como desactualizada y la excluye de su agregado.",
    },
    storage: {
      title: "3. Almacenamiento en tu navegador",
      body: "El sitio guarda algunas entradas en el almacenamiento local de tu navegador: tus ajustes (red, dirección del nodo, tema, idioma, sonidos, si activaste las notificaciones del navegador), una caché de la lista de activos, un breve historial de la mempool registrado mientras la página está abierta, tu lista de seguimiento de direcciones e ID de transacción si añades alguno, qué permisos de Sage rechazaste y tu elección sobre cookies. Permanecen en tu dispositivo y no se envían al operador. Son estrictamente necesarias para prestar lo que has solicitado (§ 25(2) n.º 2 TDDDG). Puedes eliminarlas en cualquier momento en los ajustes de tu navegador. Encontrarás los detalles en la <link>política de cookies</link>.",
      notifications:
        "Si activas las notificaciones del navegador para tu lista de seguimiento, es tu navegador quien concede ese permiso a este sitio y puedes retirarlo allí en cualquier momento; el operador nunca ve si lo activaste.",
    },
    thirdParties: {
      title: "4. Servicios con los que tu navegador contacta directamente",
      intro:
        "Cada página lee los datos de la cadena y de activos directamente de otros servicios, desde tu propio navegador, no a través del servidor de este sitio. Como cualquier servidor web, reciben tu dirección IP, la identificación de tu navegador y la dirección del elemento solicitado:",
      items: {
        dexie:
          "Dexie (api.dexie.space, icons.dexie.space): la lista de tokens CAT, nombres, tickers e iconos.",
        mintgarden:
          "MintGarden (api.mintgarden.io, assets.mainnet.mintgarden.io, ipfs.mintgarden.io): metadatos e imágenes de NFT.",
        nftHosts:
          "Servidores indicados en los propios metadatos on-chain de un NFT, cuando MintGarden no tiene una copia. Qué servidores son lo decide el creador del NFT.",
        xchandles:
          "XCHandles (api.xchandles.com): solo cuando consultas, sigues o buscas un handle: a qué se resuelve ese nombre y cuándo caduca.",
        coinset:
          "Coinset (api.coinset.org): todos los datos de la cadena (la mempool, los bloques, las transacciones, las direcciones, las monedas y los activos que consultas, y las actualizaciones en vivo), a menos que introduzcas otro nodo a continuación.",
        node: "Un nodo completo que introduzcas en Ajustes: todos los datos de la cadena provienen entonces de él en lugar de Coinset.",
        map: "Solo mientras la página del mapa de la red está abierta: Cloudflare DNS (cloudflare-dns.com, con dns.google como alternativa) responde a las consultas DNS de los introductores de Chia, y GeoJS (get.geojs.io) estima la ubicación de las direcciones de nodos que contienen esas respuestas. Solo se envían direcciones de nodos para la consulta, nunca la tuya; las direcciones obtenidas se guardan en el almacenamiento local de tu navegador durante una semana.",
      },
      basis:
        "Base jurídica: art. 6.1.f) RGPD; el interés legítimo es mostrar el contenido de la blockchain que solicitas. Algunos de estos proveedores pueden tratar datos fuera del Espacio Económico Europeo, por ejemplo en los Estados Unidos, donde el nivel de protección de datos puede ser inferior. Se aplican sus propias políticas de privacidad.",
      publicData:
        "Las direcciones, los ID de transacción y los ID de moneda son públicos en la blockchain. Si consultas tu propia dirección, el servicio que responde a la consulta podría vincularla a tu dirección IP.",
    },
    sage: {
      title: "5. Dentro de la billetera Sage",
      body: "En la app de Sage, la información de la billetera (tu dirección de recepción, saldos, transacciones pendientes y anteriores, monedas) se lee de Sage solo después de que lo permitas, y se trata en tu dispositivo. No se envía al operador. Para mostrar la página de tu dirección, la app consulta tu dirección pública en la fuente de datos de la cadena (Coinset o tu nodo), igual que lo haría cualquier búsqueda de direcciones.",
    },
    noTracking: {
      title: "6. Sin cookies, analítica ni publicidad",
      body: "El sitio no instala cookies ni utiliza analítica, seguimiento o publicidad. Si eso cambiara, solo ocurriría con tu consentimiento previo a través de los ajustes de cookies, y esta política se actualizaría antes.",
    },
    rights: {
      title: "7. Tus derechos",
      intro: "Tienes derecho a:",
      items: {
        access: "acceder a los datos personales que se conservan sobre ti (art. 15 RGPD);",
        rectification: "obtener su rectificación (art. 16) o supresión (art. 17);",
        restriction:
          "limitar su tratamiento (art. 18) y recibirlos en un formato portable (art. 20);",
        objection:
          "<b>oponerte</b> en cualquier momento, por motivos relacionados con tu situación particular, al tratamiento basado en el art. 6.1.f) RGPD (art. 21);",
        complaint:
          "presentar una reclamación ante una autoridad de control de protección de datos (art. 77), en particular en el país de la UE en el que vivas o trabajes.",
      },
      contact:
        "Escribe a x.com/MaximEdogawa en x.com. Como no hay cuentas, los registros del servidor solo pueden asociarse contigo mediante tu dirección IP y la hora de tu visita.",
    },
    other: {
      title: "8. Otros",
      body: "No estás obligado a facilitar datos personales. Sin los datos técnicos del apartado 2 no se puede servir el sitio. No hay decisiones automatizadas ni elaboración de perfiles. Esta política se actualiza cuando cambia el sitio; la fecha indicada arriba muestra la versión vigente.",
    },
  },
  cookies: {
    title: "Política de cookies",
    intro:
      "{site} no instala cookies. Guarda algunas entradas en el almacenamiento local de tu navegador, a las que las normas sobre cookies (art. 5.3 de la Directiva ePrivacy, § 25 TDDDG) se aplican de la misma manera. Esta página las enumera.",
    categories: {
      title: "Categorías",
      necessary:
        "<b>Estrictamente necesarias</b>: siempre activas. Necesarias para las funciones que usas y exentas de consentimiento (§ 25(2) n.º 2 TDDDG).",
      analytics:
        "<b>Analítica</b>: estadísticas de uso. No se utilizan por el momento; solo se ejecutarían con tu consentimiento.",
      advertising:
        "<b>Publicidad</b>: anuncios y medición publicitaria. No se utilizan por el momento; solo se ejecutarían con tu consentimiento.",
    },
    necessary: {
      title: "Almacenamiento estrictamente necesario",
      columns: {
        key: "Clave",
        purpose: "Finalidad",
        kept: "Conservación",
      },
      rows: {
        settings: {
          purpose:
            "Red, dirección del nodo, tema, idioma, número de bloques recientes, sonidos, si las notificaciones del navegador están activadas",
          lifetime: "Hasta que lo restablezcas o lo borres",
        },
        tokens: {
          purpose: "Lista en caché de nombres e iconos de CAT, para no descargarla en cada visita",
          lifetime: "Se actualiza pasadas 24 horas",
        },
        history: {
          purpose:
            "Gráfico de la mempool de las últimas dos horas, registrado mientras la página está abierta",
          lifetime: "Se descartan las entradas de más de dos horas",
        },
        snapshot: {
          purpose:
            "Las transacciones pendientes mostradas por última vez (datos públicos de la red), para que la próxima visita las muestre de inmediato y no las vuelva a descargar",
          lifetime: "Se ignora después de una hora; se reemplaza mientras la página está abierta",
        },
        watchlist: {
          purpose: "Direcciones e ID de transacción que has decidido seguir",
          lifetime: "Hasta que los elimines o lo borres",
        },
        sageRefused: {
          purpose:
            "Permisos de Sage que rechazaste, para que no se te vuelvan a pedir (solo en la app de Sage)",
          lifetime: "Hasta que lo borres",
        },
        consent: {
          purpose: "Tu elección en los ajustes de cookies",
          lifetime: "12 meses",
        },
      },
      notShared:
        "Ninguna de estas entradas se envía al operador ni se usa para identificarte o seguirte.",
    },
    choice: {
      title: "Tu elección",
      body: "En tu primera visita, un panel te pide que elijas: Rechazar todo, Guardar mi elección o Aceptar todo. Tu elección se conserva durante 12 meses y después se te vuelve a preguntar. Puedes cambiarla o retirarla en cualquier momento con Ajustes de cookies en el pie de página o aquí:",
      signal:
        "Si tu navegador envía una señal Do Not Track o Global Privacy Control, la analítica y la publicidad permanecen desactivadas y no se te pregunta.",
    },
    thirdParties: {
      title: "Contenido de otros servicios",
      body: "Los iconos, las imágenes de NFT y algunos datos de la cadena se cargan directamente desde otros servicios, que reciben tu dirección IP como cualquier servidor web. Consulta el apartado 4 de la <link>política de privacidad</link>.",
    },
  },
};

export default messages;
