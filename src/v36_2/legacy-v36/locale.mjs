import shell from './pl-shell.json' with {type:'json'};
import views from './pl-views.json' with {type:'json'};
import clients from './pl-clients.json' with {type:'json'};

export const LOCALES = Object.freeze(['uk', 'en', 'pl']);
export const LOCALE_LABELS = Object.freeze({uk:'UA', en:'EN', pl:'PL'});
export const LOCALE_NAMES = Object.freeze({uk:'Українська', en:'English', pl:'Polski'});
export const OG_LOCALES = Object.freeze({uk:'uk_UA', en:'en_GB', pl:'pl_PL'});

export const polishUI = Object.freeze({...shell, ...views, ...clients});
for (const [name, dictionary] of [['views', views], ['clients', clients]]) {
  for (const [source, value] of Object.entries(dictionary)) {
    for (const [earlierName, earlier] of [['shell', shell], ['views', views]]) {
      if (earlierName === name) break;
      if (Object.hasOwn(earlier, source) && earlier[source] !== value) {
        throw Error('Conflicting Polish UI translation (' + earlierName + '/' + name + '): ' + source);
      }
    }
  }
}

export function assertLocale(locale) {
  if (!LOCALES.includes(locale)) throw Error('Unsupported locale: ' + locale);
  return locale;
}

export function translate(locale, uk, en) {
  assertLocale(locale);
  if (locale === 'uk') return uk;
  if (locale === 'en') return en;
  if (typeof uk !== 'string' || !Object.hasOwn(polishUI, uk) || typeof polishUI[uk] !== 'string') {
    throw Error('Missing Polish UI translation: ' + String(uk));
  }
  return polishUI[uk];
}

export function localizedValue(value, locale, context = '') {
  assertLocale(locale);
  if (!value || typeof value !== 'object' || Array.isArray(value) || !Object.hasOwn(value, locale)) {
    throw Error('Missing ' + locale + ' content: ' + context);
  }
  return value[locale];
}

export function stripLocale(pathname) {
  const path = pathname.startsWith('/') ? pathname : '/' + pathname;
  for (const locale of ['en', 'pl']) {
    if (path === '/' + locale || path.startsWith('/' + locale + '/')) {
      return {locale, route: path.slice(locale.length + 1) || '/'};
    }
  }
  return {locale:'uk', route:path};
}

export function localizedRoute(route, locale) {
  assertLocale(locale);
  const normalized = stripLocale(route).route;
  if (locale === 'uk') return normalized;
  if (normalized === '/') return locale === 'pl' ? '/pl/' : '/en';
  return '/' + locale + normalized;
}

export function localeNumber(locale, amount) {
  assertLocale(locale);
  return new Intl.NumberFormat(locale === 'uk' ? 'uk-UA' : locale === 'pl' ? 'pl-PL' : 'en-GB', {maximumFractionDigits:0, useGrouping:'always'}).format(amount);
}

export function uah(locale, amount) {
  return locale === 'uk' ? localeNumber(locale, amount) + ' грн' : localeNumber(locale, amount) + ' UAH';
}

export function moneyForLocale(locale, amount) {
  return locale === 'pl' ? localeNumber(locale, amount) + ' PLN' : uah(locale, amount);
}

export function polishPlural(number, one, few, many) {
  const value = Math.abs(Number(number));
  if (!Number.isSafeInteger(value)) throw Error('Invalid Polish plural number');
  const last = value % 10, lastTwo = value % 100;
  return value === 1 ? one : last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14) ? few : many;
}
