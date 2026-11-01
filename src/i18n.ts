export const languages = [
  ['en', 'English'], ['fa', 'فارسی'], ['ar', 'العربية'], ['he', 'עברית'],
  ['tr', 'Türkçe'], ['az', 'Azərbaycanca'], ['es', 'Español'], ['fr', 'Français'],
  ['de', 'Deutsch'], ['it', 'Italiano'], ['pt', 'Português'], ['ru', 'Русский'],
  ['zh', '中文'], ['ja', '日本語'], ['ko', '한국어'], ['hi', 'हिन्दी'],
  ['ur', 'اردو'], ['bn', 'বাংলা'], ['id', 'Bahasa Indonesia'], ['ms', 'Bahasa Melayu'],
  ['vi', 'Tiếng Việt'], ['th', 'ไทย'], ['nl', 'Nederlands'], ['pl', 'Polski'],
  ['sv', 'Svenska'], ['uk', 'Українська'], ['el', 'Ελληνικά'], ['ro', 'Română'], ['cs', 'Čeština'],
] as const;
export type Language = (typeof languages)[number][0];
export const rtlLanguages: string[] = ['fa', 'ar', 'he', 'ur'];

type Labels = { markets: string; live: string; screens: string; desktop: string; mobile: string; search: string; volume: string; status: string; noResults: string; data: string; reference: string };
const english: Labels = { markets: 'Markets', live: 'Live market data', screens: 'Screens', desktop: 'Desktop', mobile: 'Mobile', search: 'Search markets', volume: '24h volume', status: 'Feed status', noResults: 'No matching markets', data: 'MITMARKET Live', reference: 'MITMARKET market view' };
const translations: Partial<Record<Language, Partial<Labels>>> = {
  fa: { markets: 'بازارها', live: 'داده‌های زنده بازار', screens: 'صفحه‌ها', desktop: 'دسکتاپ', mobile: 'موبایل', search: 'جستجوی بازار', volume: 'حجم ۲۴ ساعته', status: 'وضعیت اتصال', noResults: 'بازاری پیدا نشد', data: 'داده‌ها: پلی‌مارکت', reference: 'طرح اصلی استیچ' },
  ar: { markets: 'الأسواق', live: 'بيانات السوق المباشرة', screens: 'الصفحات', desktop: 'سطح المكتب', mobile: 'الهاتف', search: 'البحث في الأسواق', volume: 'حجم ٢٤ ساعة', status: 'حالة الاتصال' },
  tr: { markets: 'Piyasalar', live: 'Canlı piyasa verileri', screens: 'Sayfalar', desktop: 'Masaüstü', mobile: 'Mobil', search: 'Piyasa ara', volume: '24 saatlik hacim', status: 'Bağlantı durumu' },
  az: { markets: 'Bazarlar', live: 'Canlı bazar məlumatları', screens: 'Səhifələr', desktop: 'Masaüstü', mobile: 'Mobil', search: 'Bazarları axtar', volume: '24 saatlıq həcm', status: 'Bağlantı vəziyyəti' },
  es: { markets: 'Mercados', live: 'Datos en vivo', screens: 'Pantallas', desktop: 'Escritorio', mobile: 'Móvil', search: 'Buscar mercados', volume: 'Volumen 24h' },
  fr: { markets: 'Marchés', live: 'Données en direct', screens: 'Écrans', desktop: 'Bureau', mobile: 'Mobile', search: 'Rechercher', volume: 'Volume 24h' },
  de: { markets: 'Märkte', live: 'Live-Marktdaten', screens: 'Seiten', desktop: 'Desktop', mobile: 'Mobil', search: 'Märkte suchen', volume: '24h-Volumen' },
  ru: { markets: 'Рынки', live: 'Данные в реальном времени', screens: 'Страницы', desktop: 'Компьютер', mobile: 'Телефон', search: 'Поиск рынков', volume: 'Объём за 24 ч' },
  zh: { markets: '市场', live: '实时市场数据', screens: '页面', desktop: '桌面', mobile: '移动端', search: '搜索市场', volume: '24小时交易量' },
  ja: { markets: '市場', live: 'ライブ市場データ', screens: '画面', desktop: 'デスクトップ', mobile: 'モバイル', search: '市場を検索', volume: '24時間出来高' },
  ko: { markets: '시장', live: '실시간 시장 데이터', screens: '화면', desktop: '데스크톱', mobile: '모바일', search: '시장 검색', volume: '24시간 거래량' },
  he: { markets: 'שווקים', live: 'נתוני שוק בזמן אמת', screens: 'מסכים', desktop: 'מחשב', mobile: 'נייד', search: 'חיפוש שווקים', volume: 'נפח 24 שעות' },
  it: { markets: 'Mercati', live: 'Dati di mercato in tempo reale', screens: 'Schermate', desktop: 'Desktop', mobile: 'Mobile', search: 'Cerca mercati', volume: 'Volume 24 ore' },
  pt: { markets: 'Mercados', live: 'Dados de mercado ao vivo', screens: 'Telas', desktop: 'Computador', mobile: 'Celular', search: 'Buscar mercados', volume: 'Volume 24h' },
  hi: { markets: 'बाज़ार', live: 'लाइव बाज़ार डेटा', screens: 'स्क्रीन', desktop: 'डेस्कटॉप', mobile: 'मोबाइल', search: 'बाज़ार खोजें', volume: '24 घंटे की मात्रा' },
  ur: { markets: 'مارکیٹس', live: 'براہ راست مارکیٹ ڈیٹا', screens: 'صفحات', desktop: 'ڈیسک ٹاپ', mobile: 'موبائل', search: 'مارکیٹ تلاش کریں', volume: '24 گھنٹے حجم' },
  bn: { markets: 'বাজার', live: 'লাইভ বাজার তথ্য', screens: 'পর্দা', desktop: 'ডেস্কটপ', mobile: 'মোবাইল', search: 'বাজার খুঁজুন', volume: '২৪ ঘণ্টার ভলিউম' },
  id: { markets: 'Pasar', live: 'Data pasar langsung', screens: 'Halaman', desktop: 'Desktop', mobile: 'Seluler', search: 'Cari pasar', volume: 'Volume 24 jam' },
  ms: { markets: 'Pasaran', live: 'Data pasaran langsung', screens: 'Skrin', desktop: 'Desktop', mobile: 'Mudah alih', search: 'Cari pasaran', volume: 'Volum 24 jam' },
  vi: { markets: 'Thị trường', live: 'Dữ liệu thị trường trực tiếp', screens: 'Màn hình', desktop: 'Máy tính', mobile: 'Di động', search: 'Tìm thị trường', volume: 'Khối lượng 24 giờ' },
  th: { markets: 'ตลาด', live: 'ข้อมูลตลาดสด', screens: 'หน้าจอ', desktop: 'เดสก์ท็อป', mobile: 'มือถือ', search: 'ค้นหาตลาด', volume: 'ปริมาณ 24 ชม.' },
  nl: { markets: 'Markten', live: 'Live marktgegevens', screens: 'Schermen', desktop: 'Desktop', mobile: 'Mobiel', search: 'Zoek markten', volume: '24-uursvolume' },
  pl: { markets: 'Rynki', live: 'Dane rynkowe na żywo', screens: 'Ekrany', desktop: 'Komputer', mobile: 'Telefon', search: 'Szukaj rynków', volume: 'Wolumen 24h' },
  sv: { markets: 'Marknader', live: 'Marknadsdata i realtid', screens: 'Skärmar', desktop: 'Dator', mobile: 'Mobil', search: 'Sök marknader', volume: '24h-volym' },
  uk: { markets: 'Ринки', live: 'Ринкові дані наживо', screens: 'Екрани', desktop: 'Комп’ютер', mobile: 'Мобільний', search: 'Пошук ринків', volume: 'Обсяг за 24 год' },
  el: { markets: 'Αγορές', live: 'Ζωντανά δεδομένα αγοράς', screens: 'Οθόνες', desktop: 'Υπολογιστής', mobile: 'Κινητό', search: 'Αναζήτηση αγορών', volume: 'Όγκος 24ώρου' },
  ro: { markets: 'Piețe', live: 'Date de piață în timp real', screens: 'Ecrane', desktop: 'Desktop', mobile: 'Mobil', search: 'Caută piețe', volume: 'Volum 24h' },
  cs: { markets: 'Trhy', live: 'Živá tržní data', screens: 'Obrazovky', desktop: 'Počítač', mobile: 'Mobil', search: 'Hledat trhy', volume: 'Objem za 24 h' },
};
export function labels(language: Language): Labels { return { ...english, ...translations[language] }; }
