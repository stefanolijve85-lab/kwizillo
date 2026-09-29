(()=>{
  // The few lines that name the store. The strings files say "Apple" and "App
  // Store"; in the Android app the same lines say Google Play. Everything else
  // is identical on both, so this wraps K.t and only answers for these keys.
  const K=window.KWIZILLO_M1;
  if(!K||!K.t)return;
  const platform=window.Capacitor?.getPlatform?.();
  if(platform!=='android')return;

  const ANDROID={
    nl:{
      'premium.legal':'Het abonnement wordt via je Google Play-account afgerekend en verlengt automatisch tot je het opzegt. Je kunt het altijd beheren of opzeggen onder Abonnementen in Google Play. Een gratis proefperiode gaat over in een betaald abonnement als je niet vóór het einde opzegt.',
      'premium.manageSub':'Opzeggen of wijzigen via Google Play',
      'premium.purchasing':'Even geduld, Google Play regelt de aankoop…',
      'premium.manageUnavailable':'Abonnementen beheer je in de Google Play Store-app onder Betalingen en abonnementen.',
      'settings.termsBody':'Kwizillo is een leerspel voor kinderen. Premium is een abonnement dat via Google Play wordt afgerekend en automatisch verlengt tot het wordt opgezegd; opzeggen kan altijd onder Abonnementen in Google Play. Er zijn geen advertenties en geen aankopen in het spel zelf.',
      'privacy.itemPremium':'Of Premium actief is (komt van Google Play)',
      'privacy.eraseBody':'Naam, instellingen, voortgang, kaarten en statistieken verdwijnen van dit toestel. Een gekochte Premium blijft bij je Google-account en kun je terugzetten met “Aankopen herstellen”.'
    },
    en:{
      'premium.legal':'The subscription is billed to your Google Play account and renews automatically until cancelled. You can manage or cancel it at any time under Subscriptions in Google Play. A free trial turns into a paid subscription unless you cancel before it ends.',
      'premium.manageSub':'Cancel or change via Google Play',
      'premium.purchasing':'One moment, Google Play is handling the purchase…',
      'premium.manageUnavailable':'Manage subscriptions in the Google Play Store app under Payments & subscriptions.',
      'settings.termsBody':'Kwizillo is a learning game for children. Premium is a subscription billed through Google Play that renews automatically until cancelled; you can cancel at any time under Subscriptions in Google Play. There are no ads and no purchases inside the game itself.',
      'privacy.itemPremium':'Whether Premium is active (that comes from Google Play)',
      'privacy.eraseBody':'Name, settings, progress, cards and statistics disappear from this device. A Premium you bought stays with your Google account and comes back with “Restore Purchases”.'
    },
    pt:{
      'premium.legal':'A assinatura é cobrada na sua conta do Google Play e renova automaticamente até ser cancelada. Você pode gerenciar ou cancelar quando quiser em Assinaturas no Google Play. O período grátis vira assinatura paga se você não cancelar antes do fim.',
      'premium.manageSub':'Cancelar ou mudar pelo Google Play',
      'premium.purchasing':'Um momento, o Google Play está processando a compra…',
      'premium.manageUnavailable':'Gerencie as assinaturas no app Google Play Store, em Pagamentos e assinaturas.',
      'settings.termsBody':'Kwizillo é um jogo educativo para crianças. O Premium é uma assinatura cobrada pelo Google Play que renova automaticamente até ser cancelada; você pode cancelar quando quiser em Assinaturas no Google Play. Não há anúncios nem compras dentro do jogo.',
      'privacy.itemPremium':'Se o Premium está ativo (isso vem do Google Play)',
      'privacy.eraseBody':'Nome, configurações, progresso, cartas e estatísticas somem deste aparelho. Um Premium comprado continua na sua conta Google e volta com “Restaurar compras”.'
    },
    de:{
      'premium.legal':'Das Abo wird über dein Google-Play-Konto abgerechnet und verlängert sich automatisch, bis es gekündigt wird. Du kannst es jederzeit unter Abos in Google Play verwalten oder kündigen. Ein Gratiszeitraum wird zu einem bezahlten Abo, wenn du nicht vorher kündigst.',
      'premium.manageSub':'Über Google Play kündigen oder ändern',
      'premium.purchasing':'Einen Moment, Google Play bearbeitet den Kauf…',
      'premium.manageUnavailable':'Verwalte Abos in der Google Play Store-App unter Zahlungen und Abos.',
      'settings.termsBody':'Kwizillo ist ein Lernspiel für Kinder. Premium ist ein Abo, das über Google Play abgerechnet wird und sich automatisch verlängert, bis es gekündigt wird; du kannst es jederzeit unter Abos in Google Play kündigen. Es gibt keine Werbung und keine Käufe im Spiel selbst.',
      'privacy.itemPremium':'Ob Premium aktiv ist (das kommt von Google Play)',
      'privacy.eraseBody':'Name, Einstellungen, Fortschritt, Karten und Statistik verschwinden von diesem Gerät. Ein gekauftes Premium bleibt bei deinem Google-Konto und kommt mit „Käufe wiederherstellen“ zurück.'
    },
    fr:{
      'premium.legal':'L’abonnement est facturé sur ton compte Google Play et se renouvelle automatiquement jusqu’à sa résiliation. Tu peux le gérer ou le résilier à tout moment dans Abonnements sur Google Play. Une période gratuite devient un abonnement payant si tu ne résilies pas avant la fin.',
      'premium.manageSub':'Résilier ou modifier via Google Play',
      'premium.purchasing':'Un instant, Google Play traite l’achat…',
      'premium.manageUnavailable':'Gère les abonnements dans l’app Google Play Store, sous Paiements et abonnements.',
      'settings.termsBody':'Kwizillo est un jeu éducatif pour enfants. Premium est un abonnement facturé par Google Play qui se renouvelle automatiquement jusqu’à sa résiliation ; tu peux résilier à tout moment dans Abonnements sur Google Play. Il n’y a pas de publicité ni d’achats dans le jeu lui-même.',
      'privacy.itemPremium':'Si Premium est actif (cela vient de Google Play)',
      'privacy.eraseBody':'Prénom, réglages, progression, cartes et statistiques disparaissent de cet appareil. Un Premium acheté reste lié à ton compte Google et revient avec « Restaurer les achats ».'
    },
    es:{
      'premium.legal':'La suscripción se cobra en tu cuenta de Google Play y se renueva automáticamente hasta que la canceles. Puedes gestionarla o cancelarla cuando quieras en Suscripciones de Google Play. Un periodo gratuito se convierte en suscripción de pago si no cancelas antes de que termine.',
      'premium.manageSub':'Cancelar o cambiar desde Google Play',
      'premium.purchasing':'Un momento, Google Play está procesando la compra…',
      'premium.manageUnavailable':'Gestiona las suscripciones en la app Google Play Store, en Pagos y suscripciones.',
      'settings.termsBody':'Kwizillo es un juego educativo para niños. Premium es una suscripción que cobra Google Play y que se renueva automáticamente hasta que la canceles; puedes cancelarla cuando quieras en Suscripciones de Google Play. No hay publicidad ni compras dentro del juego.',
      'privacy.itemPremium':'Si Premium está activo (eso viene de Google Play)',
      'privacy.eraseBody':'El nombre, los ajustes, el progreso, las cartas y los datos desaparecen de este dispositivo. Un Premium comprado sigue en tu cuenta de Google y vuelve con «Restaurar compras».'
    },
    it:{
      'premium.legal':'L’abbonamento viene addebitato sul tuo account Google Play e si rinnova automaticamente finché non lo disdici. Puoi gestirlo o disdirlo quando vuoi in Abbonamenti su Google Play. Un periodo gratuito diventa un abbonamento a pagamento se non disdici prima della fine.',
      'premium.manageSub':'Disdici o cambia tramite Google Play',
      'premium.purchasing':'Un attimo, Google Play sta gestendo l’acquisto…',
      'premium.manageUnavailable':'Gestisci gli abbonamenti nell’app Google Play Store, in Pagamenti e abbonamenti.',
      'settings.termsBody':'Kwizillo è un gioco educativo per bambini. Premium è un abbonamento addebitato da Google Play che si rinnova automaticamente finché non lo disdici; puoi disdirlo quando vuoi in Abbonamenti su Google Play. Non ci sono pubblicità né acquisti dentro il gioco.',
      'privacy.itemPremium':'Se Premium è attivo (questo arriva da Google Play)',
      'privacy.eraseBody':'Nome, impostazioni, progressi, carte e statistiche spariscono da questo dispositivo. Un Premium acquistato resta sul tuo account Google e torna con «Ripristina acquisti».'
    },
    da:{
      'premium.legal':'Abonnementet trækkes på din Google Play-konto og fornyes automatisk, indtil du opsiger det. Du kan altid administrere eller opsige det under Abonnementer i Google Play. En gratis periode bliver til et betalt abonnement, hvis du ikke opsiger inden den slutter.',
      'premium.manageSub':'Opsig eller skift via Google Play',
      'premium.purchasing':'Et øjeblik, Google Play behandler købet…',
      'premium.manageUnavailable':'Administrer abonnementer i Google Play Butik-appen under Betalinger og abonnementer.',
      'settings.termsBody':'Kwizillo er et læringsspil for børn. Premium er et abonnement, der trækkes via Google Play og fornyes automatisk, indtil du opsiger det; du kan altid opsige det under Abonnementer i Google Play. Der er hverken reklamer eller køb inde i selve spillet.',
      'privacy.itemPremium':'Om Premium er aktiv (det kommer fra Google Play)',
      'privacy.eraseBody':'Navn, indstillinger, fremgang, kort og tal forsvinder fra denne enhed. Et købt Premium bliver på din Google-konto og kommer tilbage med “Gendan køb”.'
    },
    ru:{
      'premium.legal':'Подписка оплачивается через твой аккаунт Google Play и продлевается сама, пока её не отменят. Её можно изменить или отменить в любой момент в разделе «Подписки» в Google Play. Бесплатный период переходит в платную подписку, если не отменить её до конца периода.',
      'premium.manageSub':'Отменить или изменить через Google Play',
      'premium.purchasing':'Минутку, Google Play оформляет покупку…',
      'premium.manageUnavailable':'Управляй подписками в приложении Google Play Маркет, в разделе «Платежи и подписки».',
      'settings.termsBody':'Kwizillo — обучающая игра для детей. Premium — это подписка, которая оплачивается через Google Play и продлевается сама, пока её не отменят; отменить её можно в любой момент в разделе «Подписки» в Google Play. Внутри самой игры нет ни рекламы, ни покупок.',
      'privacy.itemPremium':'Активен ли Premium (это приходит из Google Play)',
      'privacy.eraseBody':'Имя, настройки, успехи, карточки и статистика исчезнут с этого устройства. Купленный Premium остаётся в вашем аккаунте Google и возвращается кнопкой «Восстановить покупки».'
    },
    ar:{
      'premium.legal':'يُحتسب الاشتراك على حساب Google Play الخاص بك ويتجدد تلقائيًا حتى تلغيه. يمكنك إدارته أو إلغاؤه في أي وقت من الاشتراكات في Google Play. تتحول التجربة المجانية إلى اشتراك مدفوع ما لم تلغِها قبل انتهائها.',
      'premium.manageSub':'الإلغاء أو التغيير عبر Google Play',
      'premium.purchasing':'لحظة من فضلك، Google Play ينهي عملية الشراء…',
      'premium.manageUnavailable':'أدِر الاشتراكات من تطبيق متجر Google Play، ضمن الدفعات والاشتراكات.',
      'settings.termsBody':'كويزيلو لعبة تعليمية للأطفال. بريميوم اشتراك يُحتسب عبر Google Play ويتجدد تلقائيًا حتى تلغيه؛ يمكنك الإلغاء في أي وقت من الاشتراكات في Google Play. لا توجد إعلانات ولا مشتريات داخل اللعبة نفسها.',
      'privacy.itemPremium':'هل بريميوم مفعّل (يأتي ذلك من Google Play)',
      'privacy.eraseBody':'الاسم والإعدادات والتقدم والبطاقات والأرقام تختفي من هذا الجهاز. بريميوم الذي اشتريته يبقى مع حساب Google ويعود بـ«استعادة المشتريات».'
    }
  };
  K.STORE_TEXTS=ANDROID;
  const base=K.t;
  K.t=(key,params)=>{
    const s=(ANDROID[K.state.language]||ANDROID.en)[key];
    if(s===undefined)return base(key,params);
    let out=s;
    if(params)for(const [k,v] of Object.entries(params))out=out.split(`{${k}}`).join(String(v));
    return out;
  };
})();
