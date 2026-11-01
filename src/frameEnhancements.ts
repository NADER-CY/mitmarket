import { labels, type Language } from './i18n';
import type { CategoryId } from './categories';

const navigation: Record<string, Partial<Record<Language, string>>> = {
  Explore: {fa:'کاوش',tr:'Keşfet',az:'Kəşf et',ar:'استكشف',es:'Explorar',fr:'Explorer',de:'Entdecken',ru:'Обзор',zh:'探索',ja:'探す'},
  Trending: {fa:'پرطرفدار',tr:'Trendler',az:'Trenddə',ar:'الرائج',es:'Tendencias',fr:'Tendances',de:'Trends',ru:'В тренде',zh:'热门',ja:'トレンド'},
  Portfolio: {fa:'پورتفولیو',tr:'Portföy',az:'Portfel',ar:'المحفظة',es:'Cartera',fr:'Portefeuille',de:'Portfolio',ru:'Портфель',zh:'投资组合',ja:'ポートフォリオ'},
  Leaderboard: {fa:'رتبه‌بندی',tr:'Sıralama',az:'Reytinq',ar:'المتصدرون',es:'Clasificación',fr:'Classement',de:'Rangliste',ru:'Рейтинг',zh:'排行榜',ja:'ランキング'},
  Breaking: {fa:'خبر فوری',tr:'Son Dakika',az:'Son xəbərlər',ar:'عاجل',es:'Últimas noticias',fr:'À la une',de:'Eilmeldungen',ru:'Срочно',zh:'突发',ja:'速報'},
  New: {fa:'جدید',tr:'Yeni',az:'Yeni',ar:'جديد',es:'Nuevo',fr:'Nouveau',de:'Neu',ru:'Новое',zh:'最新',ja:'新着'},
  Crypto: {fa:'رمزارز',tr:'Kripto',az:'Kripto',ar:'العملات الرقمية',es:'Cripto',fr:'Crypto',de:'Krypto',ru:'Крипто',zh:'加密货币',ja:'暗号資産'},
  Politics: {fa:'سیاست',tr:'Politika',az:'Siyasət',ar:'السياسة',es:'Política',fr:'Politique',de:'Politik',ru:'Политика',zh:'政治',ja:'政治'},
  Sports: {fa:'ورزش',tr:'Spor',az:'İdman',ar:'الرياضة',es:'Deportes',fr:'Sport',de:'Sport',ru:'Спорт',zh:'体育',ja:'スポーツ'},
  Finance: {fa:'مالی',tr:'Finans',az:'Maliyyə',ar:'المالية',es:'Finanzas',fr:'Finance',de:'Finanzen',ru:'Финансы',zh:'金融',ja:'金融'},
  Technology: {fa:'فناوری',tr:'Teknoloji',az:'Texnologiya',ar:'التكنولوجيا',es:'Tecnología',fr:'Technologie',de:'Technologie',ru:'Технологии',zh:'科技',ja:'テクノロジー'},
  Tech: {fa:'فناوری',tr:'Teknoloji',az:'Texnologiya',ar:'تقنية',es:'Tecnología',fr:'Tech',de:'Technik',ru:'Технологии',zh:'科技',ja:'技術'},
  Geopolitics: {fa:'ژئوپلیتیک',tr:'Jeopolitik',az:'Geosiyasət',ar:'الجغرافيا السياسية',es:'Geopolítica',fr:'Géopolitique',de:'Geopolitik',ru:'Геополитика',zh:'地缘政治',ja:'地政学'},
  Elections: {fa:'انتخابات',tr:'Seçimler',az:'Seçkilər',ar:'الانتخابات',es:'Elecciones',fr:'Élections',de:'Wahlen',ru:'Выборы',zh:'选举',ja:'選挙'},
  Economy: {fa:'اقتصاد',tr:'Ekonomi',az:'İqtisadiyyat',ar:'الاقتصاد',es:'Economía',fr:'Économie',de:'Wirtschaft',ru:'Экономика',zh:'经济',ja:'経済'},
  Culture: {fa:'فرهنگ',tr:'Kültür',az:'Mədəniyyət',ar:'الثقافة',es:'Cultura',fr:'Culture',de:'Kultur',ru:'Культура',zh:'文化',ja:'文化'},
  More: {fa:'بیشتر',tr:'Daha fazla',az:'Daha çox',ar:'المزيد',es:'Más',fr:'Plus',de:'Mehr',ru:'Ещё',zh:'更多',ja:'もっと'},
};

const footerWords: Partial<Record<Language, [string,string,string,string,string]>> = {
  fa:['بازارهای پیش‌بینی','پلتفرم','منابع','داده‌های عمومی زنده','اطلاعات صرفاً جهت آگاهی است؛ معاملات فعال نیست.'],
  tr:['Tahmin Piyasaları','Platform','Kaynaklar','Canlı kamu verileri','Bilgilendirme amaçlıdır; işlemler etkin değildir.'],
  az:['Proqnoz Bazarları','Platforma','Resurslar','Canlı açıq məlumat','Yalnız məlumat üçündür; ticarət aktiv deyil.'],
  ar:['أسواق التوقعات','المنصة','الموارد','بيانات عامة مباشرة','للمعلومات فقط؛ التداول غير مفعل.'],
  es:['Mercados de predicción','Plataforma','Recursos','Datos públicos en vivo','Solo información; operaciones no habilitadas.'],
  fr:['Marchés de prédiction','Plateforme','Ressources','Données publiques en direct','Information uniquement ; trading désactivé.'],
  de:['Prognosemärkte','Plattform','Ressourcen','Live-Marktdaten','Nur Information; kein Handel möglich.'],
  ru:['Рынки прогнозов','Платформа','Ресурсы','Публичные данные онлайн','Только информация; торговля отключена.'],
};

export function enhanceFrame(doc: Document, language: Language, onNavigate: (screen: string) => void, onCategory: (category: CategoryId) => void) {
  const header = doc.querySelector('body > header');
  if (header) {
    // Mobile Stitch category navigation is in main, desktop navigation is in header.
    const controls = [...header.querySelectorAll<HTMLElement>('a,button'), ...doc.querySelectorAll<HTMLElement>('main button')];
    for (const node of controls) {
      if (!node.dataset.atlasOriginalLabel) {
        const leaf = [...node.childNodes].find(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
        if (leaf) node.dataset.atlasOriginalLabel = leaf.textContent?.trim();
      }
      const original = node.dataset.atlasOriginalLabel;
      if (!original || !navigation[original]) continue;
      const leaf = [...node.childNodes].find(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
      if (leaf) leaf.textContent = (leaf.textContent ?? '').replace((leaf.textContent ?? '').trim(), navigation[original][language] ?? original);
    }
    const search = header.querySelector<HTMLInputElement>('input[placeholder]');
    if (search) search.placeholder = labels(language).search;
  }

  let footer = doc.getElementById('atlas-enhanced-footer');
  if (!footer) {
    footer = doc.createElement('footer');
    footer.id = 'atlas-enhanced-footer';
    footer.innerHTML = `<div class="atlas-footer-inner"><div class="atlas-footer-main"><div class="atlas-footer-about"><div class="atlas-footer-brand"><span class="atlas-footer-logo">A</span><span>MITMARKET</span><span class="atlas-footer-live">● LIVE DATA</span></div><p data-footer="intro">Independent prediction market intelligence powered by public data.</p><span class="atlas-footer-chip" data-footer="feed">● Public live data</span></div><div class="atlas-footer-group"><h3 data-footer="platform">Platform</h3><button data-footer-action="explore">Explore markets</button><button data-footer-action="trending">Trending</button><button data-footer-action="portfolio">Portfolio</button></div><div class="atlas-footer-group"><h3 data-footer="resources">Resources</h3><a href="https://docs.polymarket.com/" target="_blank" rel="noopener noreferrer">Market data documentation ↗</a><a href="https://polymarket.com/" target="_blank" rel="noopener noreferrer">Data provider ↗</a><button data-footer-action="home">MITMARKET home</button></div><div class="atlas-footer-group"><h3>MITMARKET</h3><p>Institutional-grade market intelligence interface.</p><p>English · فارسی · Türkçe · Azərbaycanca</p></div></div><div class="atlas-footer-bottom"><span>© ${new Date().getFullYear()} MITMARKET. Independent interface.</span><span data-footer="note">Informational only · Trading not enabled.</span></div></div>`;
    const css = doc.createElement('style');
    css.textContent = `#atlas-enhanced-footer{position:relative;z-index:1;background:#101216;color:#F4F6FA;border-top:1px solid #29313D;padding:44px 26px 22px;margin-top:16px;font-family:inherit}#atlas-enhanced-footer .atlas-footer-inner{max-width:1440px;margin:auto}#atlas-enhanced-footer .atlas-footer-main{display:grid;grid-template-columns:2fr repeat(3,1fr);gap:32px;padding-bottom:36px}#atlas-enhanced-footer .atlas-footer-brand{display:flex;align-items:center;gap:10px;font-size:22px;font-weight:750;letter-spacing:2px}#atlas-enhanced-footer .atlas-footer-logo{width:34px;height:34px;display:grid;place-items:center;background:#1463ff;color:#000;border-radius:8px;letter-spacing:0;font-size:17px}#atlas-enhanced-footer .atlas-footer-live{color:#0bba74;font-size:10px;letter-spacing:1px;margin-left:6px}#atlas-enhanced-footer p{color:#98A5B5;font-size:13px;line-height:1.8;margin:14px 0 10px}#atlas-enhanced-footer .atlas-footer-chip{display:inline-block;margin-top:8px;border:1px solid #29313D;padding:7px 10px;border-radius:20px;color:#0bba74;font-size:11px}#atlas-enhanced-footer .atlas-footer-group{display:flex;flex-direction:column;align-items:flex-start;gap:12px}#atlas-enhanced-footer h3{font-weight:600;font-size:13px;letter-spacing:.3px;margin:0 0 7px}#atlas-enhanced-footer a,#atlas-enhanced-footer button{background:none;border:0;padding:0;color:#98A5B5;text-decoration:none;font:inherit;font-size:12px;text-align:left;cursor:pointer}#atlas-enhanced-footer a:hover,#atlas-enhanced-footer button:hover{color:#EAA343}#atlas-enhanced-footer .atlas-footer-bottom{display:flex;justify-content:space-between;gap:15px;border-top:1px solid #29313D;padding-top:20px;color:#98A5B5;font-size:11px;flex-wrap:wrap}@media(max-width:700px){#atlas-enhanced-footer{padding:31px 18px 98px}#atlas-enhanced-footer .atlas-footer-main{grid-template-columns:repeat(2,minmax(0,1fr));gap:28px 16px}#atlas-enhanced-footer .atlas-footer-about{grid-column:1/-1}#atlas-enhanced-footer .atlas-footer-bottom{flex-direction:column;gap:8px}}`;
    css.textContent += '#atlas-enhanced-footer{border-top:0}';
    doc.head.appendChild(css);
    doc.body.appendChild(footer);
    footer.addEventListener('click', event => {
      const action = (event.target as HTMLElement).closest<HTMLElement>('[data-footer-action]')?.dataset.footerAction;
      if (!action) return;
      if (action === 'home' || action === 'portfolio') onNavigate(action === 'home' ? 'home' : 'portfolio_dashboard');
      else onCategory(action === 'trending' ? 'trending' : 'all');
    });
    // Replace the sparse source footer only when one exists; keep every other panel unchanged.
    for (const previous of doc.querySelectorAll<HTMLElement>('footer:not(#atlas-enhanced-footer)')) previous.style.setProperty('display','none','important');
  }
  const words = footerWords[language] ?? ['Prediction markets','Platform','Resources','Public live data','Informational only · Trading not enabled.'];
  const change = (key: string, value: string) => { const el = footer?.querySelector<HTMLElement>(`[data-footer="${key}"]`); if (el) el.textContent = value; };
  change('intro', words[0] + ' · MITMARKET'); change('platform', words[1]); change('resources', words[2]); change('feed', `● ${words[3]}`); change('note', words[4]);
  const actions: Record<string,string> = { explore: labels(language).markets, trending: navigation.Trending[language] ?? 'Trending', portfolio: navigation.Portfolio[language] ?? 'Portfolio', home: 'MITMARKET' };
  for (const [action,label] of Object.entries(actions)) { const button = footer.querySelector<HTMLElement>(`[data-footer-action="${action}"]`); if (button) button.textContent = label; }
}
