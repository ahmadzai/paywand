export const LOCALES = ['en', 'de', 'ps', 'fa'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

export const LOCALE_META: Record<Locale, { label: string; short: string; dir: 'ltr' | 'rtl'; htmlLang: string; dateLocale: string }> = {
  en: { label: 'English', short: 'EN', dir: 'ltr', htmlLang: 'en', dateLocale: 'en-GB' },
  de: { label: 'Deutsch', short: 'DE', dir: 'ltr', htmlLang: 'de', dateLocale: 'de-DE' },
  ps: { label: 'پښتو', short: 'پښتو', dir: 'rtl', htmlLang: 'ps', dateLocale: 'ps-AF' },
  fa: { label: 'دری', short: 'دری', dir: 'rtl', htmlLang: 'fa-AF', dateLocale: 'fa-AF' },
}

export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v)

/**
 * UI texts (menus, buttons, form labels). Content texts are edited in the admin panel.
 * Pashto and Dari strings: please have them reviewed by a native speaker before launch.
 */
const de = {
  nav: { home: 'Start', about: 'Über uns', offers: 'Angebote', events: 'Termine', news: 'Aktuelles', join: 'Mitmachen', contact: 'Kontakt', transparency: 'Transparenz', downloads: 'Downloads' },
  cta: { join: 'Mitglied werden', donate: 'Spenden', events: 'Alle Termine', news: 'Alle Beiträge', offers: 'Alle Angebote', more: 'Mehr erfahren', register: 'Jetzt anmelden', send: 'Nachricht senden', apply: 'Antrag absenden' },
  home: { offersTitle: 'Was wir machen', eventsTitle: 'Nächste Termine', newsTitle: 'Aus dem Vereinsleben', joinTitle: 'Werde Teil von Paywand', joinText: 'Ob als Mitglied, Ehrenamtliche/r oder mit einer Spende – jede Unterstützung stärkt das Miteinander in Berlin.', partnersTitle: 'Partner & Förderer' },
  about: { title: 'Über uns', board: 'Vorstand', purposes: 'Unsere Satzungszwecke', facts: 'Der Verein in Zahlen', founded: 'Gegründet', register: 'Vereinsregister', satzung: 'Satzung herunterladen', satzungFrom: 'Fassung vom', members: 'Mitglieder', volunteers: 'Ehrenamtliche' },
  offers: { title: 'Angebote', what: 'Was wir anbieten', howToJoin: 'So machst du mit', upcoming: 'Termine zu diesem Angebot' },
  events: { title: 'Termine', upcoming: 'Kommende Veranstaltungen', past: 'Vergangene Veranstaltungen', none: 'Gerade sind keine Termine geplant. Folge uns auf Social Media, um nichts zu verpassen.', where: 'Ort', when: 'Wann', languages: 'Sprachen', cost: 'Kosten', registerTitle: 'Anmeldung', full: 'Diese Veranstaltung ist ausgebucht.', spotsLeft: 'freie Plätze' },
  news: { title: 'Aktuelles', none: 'Noch keine Beiträge.', back: 'Zurück zu Aktuelles' },
  join: { title: 'Mitmachen', memberTitle: 'Mitglied werden', memberText: 'Mitglieder gestalten den Verein mit, stimmen in der Mitgliederversammlung ab und sind bei allen Angeboten dabei.', volunteerTitle: 'Ehrenamtlich helfen', volunteerText: 'Hausaufgabenhilfe, Übersetzen, Veranstaltungen organisieren, Social Media – schreib uns, was du gerne machen möchtest.', donateTitle: 'Spenden', donateText: 'Paywand ist gemeinnützig. Spenden sind steuerlich absetzbar; auf Wunsch stellen wir eine Zuwendungsbestätigung aus.', types: { regular: 'Ordentliches Mitglied', supporting: 'Fördermitglied', reduced: 'Ermäßigt' }, bank: { holder: 'Kontoinhaber', iban: 'IBAN', bic: 'BIC', bank: 'Bank' } },
  form: { name: 'Name', email: 'E-Mail', phone: 'Telefon / WhatsApp', phoneInvalid: 'Bitte eine gültige Telefonnummer eingeben, z. B. +49 170 1234567.', street: 'Straße und Hausnummer', postalCode: 'PLZ', postalCodeInvalid: 'Bitte eine gültige Postleitzahl eingeben (5 Ziffern, z. B. 12049).', city: 'Ort', message: 'Nachricht', subject: 'Betreff', participants: 'Anzahl Personen', type: 'Art der Mitgliedschaft', consent: 'Ich bin einverstanden, dass meine Angaben zur Bearbeitung meiner Anfrage gespeichert werden.', required: 'Pflichtfeld', success: 'Danke! Wir haben deine Nachricht erhalten und melden uns bald.', error: 'Bitte fülle alle Pflichtfelder aus und bestätige die Datenschutzerklärung.', sending: 'Wird gesendet …' },
  contact: { title: 'Kontakt', write: 'Schreib uns', address: 'Adresse', hours: 'Sprechzeiten' },
  transparency: {
    title: 'Transparenz', intro: 'Wer für das Gemeinwohl arbeitet, sollte offenlegen, was er tut, woher das Geld kommt und wer entscheidet. Wir orientieren uns an den zehn Punkten der Initiative Transparente Zivilgesellschaft.', income: 'Einnahmen', expenses: 'Ausgaben', year: 'Geschäftsjahr', notPublished: 'Der Finanzbericht wird nach Abschluss des Geschäftsjahres und der Kassenprüfung veröffentlicht.',
    basics: 'Name, Sitz und Gründung', statutes: 'Satzung und Ziele', taxStatus: 'Gemeinnützigkeit', decisionMakers: 'Entscheidungsträger/innen', activityReport: 'Tätigkeitsbericht', staff: 'Personalstruktur', fundsSource: 'Mittelherkunft', fundsUse: 'Mittelverwendung', affiliations: 'Gesellschaftsrechtliche Verbundenheit', majorDonors: 'Zuwendungen über 10 % der Jahreseinnahmen', result: 'Ergebnis', total: 'Gesamt', seat: 'Sitz', download: 'Herunterladen', auditNote: 'Geprüft durch die Kassenprüfung' },
  legal: { provider: 'Angaben gemäß § 5 DDG', represented: 'Vertretungsberechtigter Vorstand', register: 'Registereintrag', nonprofit: 'Gemeinnützigkeit', nonprofitNote: 'Der Verein ist als gemeinnützig anerkannt.', contact: 'Kontakt', privacyEmpty: 'Die Datenschutzerklärung wird derzeit erstellt. Bei Fragen zum Umgang mit deinen Daten schreib uns gerne.' },
  footer: { legal: 'Impressum', privacy: 'Datenschutz', admin: 'Login für Mitglieder', rights: 'Alle Rechte vorbehalten.' },
  common: { language: 'Sprache', menu: 'Menü', close: 'Schließen', skip: 'Zum Inhalt springen', readMore: 'Weiterlesen' },
}

type Dict = typeof de

const en: Dict = {
  nav: { home: 'Home', about: 'About us', offers: 'What we do', events: 'Events', news: 'News', join: 'Get involved', contact: 'Contact', transparency: 'Transparency', downloads: 'Downloads' },
  cta: { join: 'Become a member', donate: 'Donate', events: 'All events', news: 'All posts', offers: 'All programmes', more: 'Learn more', register: 'Register now', send: 'Send message', apply: 'Send application' },
  home: { offersTitle: 'What we do', eventsTitle: 'Upcoming events', newsTitle: 'Life in the Verein', joinTitle: 'Become part of Paywand', joinText: 'As a member, a volunteer or with a donation – every bit of support strengthens community in Berlin.', partnersTitle: 'Partners & funders' },
  about: { title: 'About us', board: 'Board', purposes: 'Our statutory purposes', facts: 'The Verein in numbers', founded: 'Founded', register: 'Register of associations', satzung: 'Download statutes', satzungFrom: 'Version of', members: 'Members', volunteers: 'Volunteers' },
  offers: { title: 'What we do', what: 'What we offer', howToJoin: 'How to take part', upcoming: 'Upcoming dates' },
  events: { title: 'Events', upcoming: 'Upcoming events', past: 'Past events', none: 'No events are planned right now. Follow us on social media to stay up to date.', where: 'Where', when: 'When', languages: 'Languages', cost: 'Cost', registerTitle: 'Registration', full: 'This event is fully booked.', spotsLeft: 'places left' },
  news: { title: 'News', none: 'No posts yet.', back: 'Back to news' },
  join: { title: 'Get involved', memberTitle: 'Become a member', memberText: 'Members help shape the Verein, vote at the general assembly and take part in all activities.', volunteerTitle: 'Volunteer', volunteerText: 'Homework help, translating, organising events, social media – tell us what you would like to do.', donateTitle: 'Donate', donateText: 'Paywand is a registered non-profit. Donations are tax-deductible; we issue a donation receipt on request.', types: { regular: 'Full member', supporting: 'Supporting member', reduced: 'Reduced fee' }, bank: { holder: 'Account holder', iban: 'IBAN', bic: 'BIC', bank: 'Bank' } },
  form: { name: 'Name', email: 'Email', phone: 'Phone / WhatsApp', phoneInvalid: 'Please enter a valid phone number, e.g. +49 170 1234567.', street: 'Street and house number', postalCode: 'Postal code', postalCodeInvalid: 'Please enter a valid postal code (5 digits, e.g. 12049).', city: 'City', message: 'Message', subject: 'Subject', participants: 'Number of people', type: 'Membership type', consent: 'I agree that my details are stored to process my request.', required: 'Required', success: 'Thank you! We received your message and will get back to you soon.', error: 'Please fill in all required fields and accept the privacy policy.', sending: 'Sending …' },
  contact: { title: 'Contact', write: 'Write to us', address: 'Address', hours: 'Office hours' },
  transparency: {
    title: 'Transparency', intro: 'Anyone working for the common good should disclose what they do, where the money comes from and who decides. We follow the ten points of the Transparent Civil Society Initiative.', income: 'Income', expenses: 'Expenses', year: 'Financial year', notPublished: 'The financial report is published once the financial year is closed and audited.',
    basics: 'Name, seat and founding', statutes: 'Statutes and goals', taxStatus: 'Non-profit status', decisionMakers: 'Decision makers', activityReport: 'Activity report', staff: 'Personnel structure', fundsSource: 'Source of funds', fundsUse: 'Use of funds', affiliations: 'Corporate affiliations', majorDonors: 'Contributions above 10% of annual income', result: 'Result', total: 'Total', seat: 'Seat', download: 'Download', auditNote: 'Audited by the cash auditors' },
  legal: { provider: 'Information according to § 5 DDG', represented: 'Authorised board members', register: 'Register entry', nonprofit: 'Non-profit status', nonprofitNote: 'The Verein is recognised as a non-profit organisation.', contact: 'Contact', privacyEmpty: 'The privacy policy is currently being prepared. If you have questions about how we handle your data, please write to us.' },
  footer: { legal: 'Legal notice', privacy: 'Privacy', admin: 'Member login', rights: 'All rights reserved.' },
  common: { language: 'Language', menu: 'Menu', close: 'Close', skip: 'Skip to content', readMore: 'Read more' },
}

const ps: Dict = {
  nav: { home: 'کور', about: 'زموږ په اړه', offers: 'خدمتونه', events: 'پروګرامونه', news: 'خبرونه', join: 'ګډون وکړئ', contact: 'اړیکه', transparency: 'روڼتیا', downloads: 'ډاونلوډونه' },
  cta: { join: 'غړی شئ', donate: 'مرسته وکړئ', events: 'ټول پروګرامونه', news: 'ټول خبرونه', offers: 'ټول خدمتونه', more: 'نور معلومات', register: 'اوس نوم ولیکئ', send: 'پیغام واستوئ', apply: 'غوښتنلیک واستوئ' },
  home: { offersTitle: 'موږ څه کوو', eventsTitle: 'راتلونکي پروګرامونه', newsTitle: 'د ټولنې ژوند', joinTitle: 'د پیوند برخه شئ', joinText: 'د غړي، رضاکار یا د مرستې له لارې – هره ملاتړ په برلین کې ګډ ژوند پیاوړی کوي.', partnersTitle: 'همکاران او ملاتړي' },
  about: { title: 'زموږ په اړه', board: 'اداري هیئت', purposes: 'زموږ موخې', facts: 'ټولنه په شمېرو کې', founded: 'د تأسیس نېټه', register: 'د ټولنو راجستر', satzung: 'اساسنامه ډاونلوډ کړئ', satzungFrom: 'نسخه', members: 'غړي', volunteers: 'رضاکاران' },
  offers: { title: 'خدمتونه', what: 'موږ څه وړاندې کوو', howToJoin: 'څنګه ګډون وکړئ', upcoming: 'راتلونکې نېټې' },
  events: { title: 'پروګرامونه', upcoming: 'راتلونکي پروګرامونه', past: 'تېر پروګرامونه', none: 'اوس مهال هېڅ پروګرام نشته. په ټولنیزو رسنیو کې موږ تعقیب کړئ.', where: 'ځای', when: 'کله', languages: 'ژبې', cost: 'لګښت', registerTitle: 'نوم لیکنه', full: 'دا پروګرام ډک دی.', spotsLeft: 'خالي ځایونه' },
  news: { title: 'خبرونه', none: 'تر اوسه هېڅ خبر نشته.', back: 'خبرونو ته بیرته' },
  join: { title: 'ګډون وکړئ', memberTitle: 'غړی شئ', memberText: 'غړي د ټولنې په جوړولو کې برخه اخلي، په عمومي غونډه کې رایه ورکوي او په ټولو پروګرامونو کې ګډون کوي.', volunteerTitle: 'رضاکارانه کار', volunteerText: 'د کورنۍ دندې مرسته، ژباړه، د پروګرامونو تنظیم، ټولنیزې رسنۍ – موږ ته ولیکئ چې څه کول غواړئ.', donateTitle: 'مرسته', donateText: 'پیوند یوه عامه ګټه ټولنه ده. مرستې د مالیې له مخې کمېدونکې دي؛ د غوښتنې پر اساس د مرستې تصدیق ورکوو.', types: { regular: 'عادي غړی', supporting: 'ملاتړی غړی', reduced: 'کم فیس' }, bank: { holder: 'د حساب څښتن', iban: 'IBAN', bic: 'BIC', bank: 'بانک' } },
  form: { name: 'نوم', email: 'برېښنالیک', phone: 'تلیفون / واټساپ', phoneInvalid: 'مهرباني وکړئ سمه د تلیفون شمېره ولیکئ، بېلګه: +49 170 1234567', street: 'سړک او د کور شمېره', postalCode: 'پوستي کوډ', postalCodeInvalid: 'مهرباني وکړئ سم پوستي کوډ ولیکئ (۵ عددونه، بېلګه: 12049).', city: 'ښار', message: 'پیغام', subject: 'موضوع', participants: 'د کسانو شمېر', type: 'د غړیتوب ډول', consent: 'زه موافق یم چې زما معلومات زما د غوښتنې د پروسس لپاره خوندي شي.', required: 'اړین', success: 'مننه! ستاسو پیغام مو ترلاسه کړ او ژر به درسره اړیکه ونیسو.', error: 'مهرباني وکړئ ټول اړین ځایونه ډک کړئ او د معلوماتو د ساتنې پالیسي ومنئ.', sending: 'لېږل کېږي …' },
  contact: { title: 'اړیکه', write: 'موږ ته ولیکئ', address: 'پته', hours: 'د کار وختونه' },
  transparency: {
    title: 'روڼتیا', intro: 'څوک چې د عامې ګټې لپاره کار کوي، باید ووايي چې څه کوي، پیسې له کومه راځي او پرېکړې څوک کوي.', income: 'عواید', expenses: 'لګښتونه', year: 'مالي کال', notPublished: 'مالي راپور د مالي کال له پای او پلټنې وروسته خپرېږي.',
    basics: 'نوم، مرکز او تأسیس', statutes: 'اساسنامه او موخې', taxStatus: 'عامه ګټه', decisionMakers: 'پرېکړه کوونکي', activityReport: 'د فعالیت راپور', staff: 'د کارکوونکو جوړښت', fundsSource: 'د پیسو سرچینه', fundsUse: 'د پیسو کارونه', affiliations: 'شرکتي اړیکې', majorDonors: 'له ۱۰ سلنې زیاتې مرستې', result: 'پایله', total: 'ټول', seat: 'مرکز', download: 'ډاونلوډ', auditNote: 'د خزانې پلټونکو له خوا کتل شوی' },
  legal: { provider: 'د § 5 DDG له مخې معلومات', represented: 'د استازیتوب وړ اداري هیئت', register: 'د راجستر ثبت', nonprofit: 'عامه ګټه', nonprofitNote: 'ټولنه د عامې ګټې په توګه پېژندل شوې ده.', contact: 'اړیکه', privacyEmpty: 'د معلوماتو د ساتنې بیان اوس مهال چمتو کېږي. که پوښتنې لرئ، موږ ته ولیکئ.' },
  footer: { legal: 'امپرېسوم', privacy: 'د معلوماتو ساتنه', admin: 'د غړو ننوتل', rights: 'ټول حقونه خوندي دي.' },
  common: { language: 'ژبه', menu: 'مېنو', close: 'بندول', skip: 'منځپانګې ته لاړ شئ', readMore: 'نور ولولئ' },
}

const fa: Dict = {
  nav: { home: 'خانه', about: 'درباره ما', offers: 'خدمات', events: 'برنامه‌ها', news: 'اخبار', join: 'همکاری کنید', contact: 'تماس', transparency: 'شفافیت', downloads: 'دانلودها' },
  cta: { join: 'عضو شوید', donate: 'کمک کنید', events: 'همه برنامه‌ها', news: 'همه اخبار', offers: 'همه خدمات', more: 'معلومات بیشتر', register: 'همین حالا ثبت‌نام کنید', send: 'ارسال پیام', apply: 'ارسال درخواست' },
  home: { offersTitle: 'ما چه می‌کنیم', eventsTitle: 'برنامه‌های آینده', newsTitle: 'از زندگی انجمن', joinTitle: 'بخشی از پیوند شوید', joinText: 'به عنوان عضو، رضاکار یا با کمک مالی – هر حمایتی همبستگی را در برلین تقویت می‌کند.', partnersTitle: 'همکاران و حامیان' },
  about: { title: 'درباره ما', board: 'هیئت مدیره', purposes: 'اهداف اساسنامه', facts: 'انجمن در اعداد', founded: 'تاریخ تأسیس', register: 'ثبت انجمن‌ها', satzung: 'دانلود اساسنامه', satzungFrom: 'نسخه', members: 'اعضا', volunteers: 'رضاکاران' },
  offers: { title: 'خدمات', what: 'آنچه ارائه می‌دهیم', howToJoin: 'چگونه شرکت کنید', upcoming: 'تاریخ‌های آینده' },
  events: { title: 'برنامه‌ها', upcoming: 'برنامه‌های آینده', past: 'برنامه‌های گذشته', none: 'فعلاً برنامه‌ای در نظر نیست. ما را در شبکه‌های اجتماعی دنبال کنید.', where: 'مکان', when: 'زمان', languages: 'زبان‌ها', cost: 'هزینه', registerTitle: 'ثبت‌نام', full: 'ظرفیت این برنامه تکمیل است.', spotsLeft: 'جای خالی' },
  news: { title: 'اخبار', none: 'هنوز خبری نیست.', back: 'بازگشت به اخبار' },
  join: { title: 'همکاری کنید', memberTitle: 'عضو شوید', memberText: 'اعضا در شکل‌دادن انجمن سهم دارند، در مجمع عمومی رأی می‌دهند و در همه برنامه‌ها شرکت می‌کنند.', volunteerTitle: 'کار رضاکارانه', volunteerText: 'کمک درسی، ترجمه، سازمان‌دهی برنامه‌ها، شبکه‌های اجتماعی – برای ما بنویسید چه کاری دوست دارید.', donateTitle: 'کمک مالی', donateText: 'پیوند یک انجمن عام‌المنفعه است. کمک‌ها از مالیات قابل کسر است؛ در صورت درخواست تصدیق کمک صادر می‌کنیم.', types: { regular: 'عضو عادی', supporting: 'عضو حامی', reduced: 'حق عضویت کاهش‌یافته' }, bank: { holder: 'صاحب حساب', iban: 'IBAN', bic: 'BIC', bank: 'بانک' } },
  form: { name: 'نام', email: 'ایمیل', phone: 'تلفون / واتساپ', phoneInvalid: 'لطفاً یک شماره تلفون معتبر وارد کنید، مثال: +49 170 1234567', street: 'سرک و شماره خانه', postalCode: 'کد پستی', postalCodeInvalid: 'لطفاً یک کد پستی معتبر وارد کنید (۵ رقم، مثال: 12049).', city: 'شهر', message: 'پیام', subject: 'موضوع', participants: 'تعداد افراد', type: 'نوع عضویت', consent: 'موافقم که معلوماتم برای رسیدگی به درخواستم ذخیره شود.', required: 'ضروری', success: 'تشکر! پیام شما را دریافت کردیم و به زودی با شما تماس می‌گیریم.', error: 'لطفاً همه بخش‌های ضروری را پر کنید و پالیسی حفظ معلومات را بپذیرید.', sending: 'در حال ارسال …' },
  contact: { title: 'تماس', write: 'برای ما بنویسید', address: 'آدرس', hours: 'ساعات کاری' },
  transparency: {
    title: 'شفافیت', intro: 'کسی که برای منافع عامه کار می‌کند، باید بگوید چه می‌کند، پول از کجا می‌آید و چه کسی تصمیم می‌گیرد.', income: 'درآمدها', expenses: 'مصارف', year: 'سال مالی', notPublished: 'گزارش مالی پس از پایان سال مالی و بررسی حسابات منتشر می‌شود.',
    basics: 'نام، مقر و تأسیس', statutes: 'اساسنامه و اهداف', taxStatus: 'عام‌المنفعه بودن', decisionMakers: 'تصمیم‌گیرندگان', activityReport: 'گزارش فعالیت', staff: 'ساختار کارکنان', fundsSource: 'منبع پول', fundsUse: 'مصرف پول', affiliations: 'پیوندهای شرکتی', majorDonors: 'کمک‌های بیش از ۱۰ درصد درآمد سالانه', result: 'نتیجه', total: 'مجموع', seat: 'مقر', download: 'دانلود', auditNote: 'بررسی‌شده توسط بازرسان حسابات' },
  legal: { provider: 'معلومات طبق § 5 DDG', represented: 'هیئت مدیره با حق نمایندگی', register: 'ثبت در راجستر', nonprofit: 'عام‌المنفعه بودن', nonprofitNote: 'انجمن به عنوان عام‌المنفعه شناخته شده است.', contact: 'تماس', privacyEmpty: 'اعلامیه حفظ معلومات در حال تهیه است. اگر سؤالی دارید، برای ما بنویسید.' },
  footer: { legal: 'امپرسوم', privacy: 'حفظ معلومات', admin: 'ورود اعضا', rights: 'تمام حقوق محفوظ است.' },
  common: { language: 'زبان', menu: 'منو', close: 'بستن', skip: 'رفتن به محتوا', readMore: 'ادامه مطلب' },
}

export const dictionaries: Record<Locale, Dict> = { de, ps, fa, en }
export const getDict = (locale: Locale) => dictionaries[locale] ?? en
export type { Dict }
