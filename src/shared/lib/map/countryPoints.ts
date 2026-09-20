/**
 * Representative points for every country the Chia crawler snapshot reports, with its ISO
 * 3166-1 alpha-2 code and the region it is grouped under. One stable point per country: the
 * dashboard publishes country totals, never node coordinates, so a marker is an aggregate at a
 * conventional spot, not a located node.
 */

export type MapRegion =
  "Europe" | "Asia" | "North America" | "South America" | "Africa" | "Oceania";

export const MAP_REGIONS: readonly MapRegion[] = [
  "Europe",
  "Asia",
  "North America",
  "South America",
  "Africa",
  "Oceania",
];

export interface CountryPoint {
  lat: number;
  lon: number;
  /** ISO 3166-1 alpha-2, uppercase. */
  code: string;
  region: MapRegion;
}

export const COUNTRY_POINTS: Record<string, CountryPoint> = {
  Afghanistan: { lat: 33.9, lon: 67.7, code: "AF", region: "Asia" },
  Albania: { lat: 41, lon: 20, code: "AL", region: "Europe" },
  Algeria: { lat: 28, lon: 2.6, code: "DZ", region: "Africa" },
  Andorra: { lat: 42.5, lon: 1.6, code: "AD", region: "Europe" },
  Angola: { lat: -11.2, lon: 17.9, code: "AO", region: "Africa" },
  Argentina: { lat: -34, lon: -64, code: "AR", region: "South America" },
  Armenia: { lat: 40.2, lon: 44.9, code: "AM", region: "Asia" },
  Australia: { lat: -25, lon: 134, code: "AU", region: "Oceania" },
  Austria: { lat: 47.5, lon: 14.5, code: "AT", region: "Europe" },
  Azerbaijan: { lat: 40.3, lon: 47.8, code: "AZ", region: "Asia" },
  Bahamas: { lat: 25, lon: -77.4, code: "BS", region: "North America" },
  Bahrain: { lat: 26, lon: 50.5, code: "BH", region: "Asia" },
  Bangladesh: { lat: 23.7, lon: 90.4, code: "BD", region: "Asia" },
  Barbados: { lat: 13.2, lon: -59.5, code: "BB", region: "North America" },
  Belarus: { lat: 53.7, lon: 27.9, code: "BY", region: "Europe" },
  Belgium: { lat: 50.6, lon: 4.6, code: "BE", region: "Europe" },
  Bolivia: { lat: -16.3, lon: -63.6, code: "BO", region: "South America" },
  "Bosnia and Herzegovina": { lat: 44, lon: 18, code: "BA", region: "Europe" },
  Brazil: { lat: -10, lon: -55, code: "BR", region: "South America" },
  Brunei: { lat: 4.5, lon: 114.7, code: "BN", region: "Asia" },
  Bulgaria: { lat: 42.7, lon: 25, code: "BG", region: "Europe" },
  Cambodia: { lat: 12.6, lon: 104.9, code: "KH", region: "Asia" },
  Canada: { lat: 56, lon: -106, code: "CA", region: "North America" },
  Chile: { lat: -33, lon: -71, code: "CL", region: "South America" },
  China: { lat: 35, lon: 103, code: "CN", region: "Asia" },
  Colombia: { lat: 4, lon: -73, code: "CO", region: "South America" },
  "Costa Rica": { lat: 9.9, lon: -84.1, code: "CR", region: "North America" },
  Croatia: { lat: 45.1, lon: 15.5, code: "HR", region: "Europe" },
  Cuba: { lat: 21.5, lon: -79.5, code: "CU", region: "North America" },
  Curaçao: { lat: 12.2, lon: -69, code: "CW", region: "South America" },
  Cyprus: { lat: 35.1, lon: 33.4, code: "CY", region: "Europe" },
  Czechia: { lat: 49.8, lon: 15.5, code: "CZ", region: "Europe" },
  Denmark: { lat: 56, lon: 10, code: "DK", region: "Europe" },
  "Dominican Republic": { lat: 19, lon: -70.6, code: "DO", region: "North America" },
  Ecuador: { lat: -1.5, lon: -78.5, code: "EC", region: "South America" },
  Egypt: { lat: 26.8, lon: 30.8, code: "EG", region: "Africa" },
  "El Salvador": { lat: 13.8, lon: -88.9, code: "SV", region: "North America" },
  Estonia: { lat: 58.7, lon: 25.5, code: "EE", region: "Europe" },
  Ethiopia: { lat: 9.1, lon: 40.5, code: "ET", region: "Africa" },
  Finland: { lat: 64, lon: 26, code: "FI", region: "Europe" },
  France: { lat: 46, lon: 2, code: "FR", region: "Europe" },
  "French Polynesia": { lat: -17.6, lon: -149.4, code: "PF", region: "Oceania" },
  Georgia: { lat: 42.3, lon: 43.4, code: "GE", region: "Asia" },
  Germany: { lat: 51, lon: 10, code: "DE", region: "Europe" },
  Ghana: { lat: 7.9, lon: -1, code: "GH", region: "Africa" },
  Gibraltar: { lat: 36.1, lon: -5.35, code: "GI", region: "Europe" },
  Greece: { lat: 39, lon: 22, code: "GR", region: "Europe" },
  Guatemala: { lat: 15.5, lon: -90.3, code: "GT", region: "North America" },
  Honduras: { lat: 15.2, lon: -86.2, code: "HN", region: "North America" },
  "Hong Kong": { lat: 22.3, lon: 114.2, code: "HK", region: "Asia" },
  Hungary: { lat: 47, lon: 19, code: "HU", region: "Europe" },
  Iceland: { lat: 64.9, lon: -19, code: "IS", region: "Europe" },
  India: { lat: 22, lon: 79, code: "IN", region: "Asia" },
  Indonesia: { lat: -2, lon: 118, code: "ID", region: "Asia" },
  Iran: { lat: 32, lon: 53, code: "IR", region: "Asia" },
  Iraq: { lat: 33.2, lon: 43.7, code: "IQ", region: "Asia" },
  Ireland: { lat: 53.2, lon: -8, code: "IE", region: "Europe" },
  Israel: { lat: 31.4, lon: 35, code: "IL", region: "Asia" },
  Italy: { lat: 42, lon: 12, code: "IT", region: "Europe" },
  Jamaica: { lat: 18.1, lon: -77.3, code: "JM", region: "North America" },
  Japan: { lat: 36, lon: 138, code: "JP", region: "Asia" },
  Jordan: { lat: 31.3, lon: 36.5, code: "JO", region: "Asia" },
  Kazakhstan: { lat: 48, lon: 68, code: "KZ", region: "Asia" },
  Kenya: { lat: -0.5, lon: 37.9, code: "KE", region: "Africa" },
  Kosovo: { lat: 42.6, lon: 20.9, code: "XK", region: "Europe" },
  Kuwait: { lat: 29.3, lon: 47.5, code: "KW", region: "Asia" },
  Laos: { lat: 19.9, lon: 102.5, code: "LA", region: "Asia" },
  Latvia: { lat: 56.9, lon: 24.9, code: "LV", region: "Europe" },
  Lebanon: { lat: 33.9, lon: 35.9, code: "LB", region: "Asia" },
  Lithuania: { lat: 55.2, lon: 23.9, code: "LT", region: "Europe" },
  Luxembourg: { lat: 49.8, lon: 6.1, code: "LU", region: "Europe" },
  Macao: { lat: 22.2, lon: 113.55, code: "MO", region: "Asia" },
  Malaysia: { lat: 4, lon: 102, code: "MY", region: "Asia" },
  Malta: { lat: 35.9, lon: 14.4, code: "MT", region: "Europe" },
  Mexico: { lat: 23, lon: -102, code: "MX", region: "North America" },
  Moldova: { lat: 47.2, lon: 28.5, code: "MD", region: "Europe" },
  Monaco: { lat: 43.7, lon: 7.4, code: "MC", region: "Europe" },
  Mongolia: { lat: 46.9, lon: 103.8, code: "MN", region: "Asia" },
  Montenegro: { lat: 42.7, lon: 19.4, code: "ME", region: "Europe" },
  Morocco: { lat: 31.8, lon: -7.1, code: "MA", region: "Africa" },
  Mozambique: { lat: -18.7, lon: 35.5, code: "MZ", region: "Africa" },
  Myanmar: { lat: 19.8, lon: 96.1, code: "MM", region: "Asia" },
  Namibia: { lat: -22.6, lon: 17.1, code: "NA", region: "Africa" },
  Nepal: { lat: 28.4, lon: 84.1, code: "NP", region: "Asia" },
  Netherlands: { lat: 52.2, lon: 5.3, code: "NL", region: "Europe" },
  "New Zealand": { lat: -41, lon: 174, code: "NZ", region: "Oceania" },
  Nicaragua: { lat: 12.9, lon: -85.2, code: "NI", region: "North America" },
  Nigeria: { lat: 9.1, lon: 8.7, code: "NG", region: "Africa" },
  "North Macedonia": { lat: 41.6, lon: 21.7, code: "MK", region: "Europe" },
  Norway: { lat: 61, lon: 9, code: "NO", region: "Europe" },
  Oman: { lat: 21, lon: 57, code: "OM", region: "Asia" },
  Pakistan: { lat: 30.4, lon: 69.3, code: "PK", region: "Asia" },
  Panama: { lat: 8.5, lon: -80.1, code: "PA", region: "North America" },
  Paraguay: { lat: -23.4, lon: -58.4, code: "PY", region: "South America" },
  Peru: { lat: -9.2, lon: -75, code: "PE", region: "South America" },
  Philippines: { lat: 12.9, lon: 122.8, code: "PH", region: "Asia" },
  Poland: { lat: 52, lon: 19, code: "PL", region: "Europe" },
  Portugal: { lat: 39.5, lon: -8, code: "PT", region: "Europe" },
  "Puerto Rico": { lat: 18.2, lon: -66.5, code: "PR", region: "North America" },
  Qatar: { lat: 25.3, lon: 51.2, code: "QA", region: "Asia" },
  Romania: { lat: 46, lon: 25, code: "RO", region: "Europe" },
  Russia: { lat: 60, lon: 90, code: "RU", region: "Europe" },
  "Saudi Arabia": { lat: 24, lon: 45, code: "SA", region: "Asia" },
  Senegal: { lat: 14.5, lon: -14.5, code: "SN", region: "Africa" },
  Serbia: { lat: 44, lon: 21, code: "RS", region: "Europe" },
  Seychelles: { lat: -4.6, lon: 55.5, code: "SC", region: "Africa" },
  Singapore: { lat: 1.35, lon: 103.8, code: "SG", region: "Asia" },
  Slovakia: { lat: 48.7, lon: 19.5, code: "SK", region: "Europe" },
  Slovenia: { lat: 46.1, lon: 14.8, code: "SI", region: "Europe" },
  "South Africa": { lat: -29, lon: 24, code: "ZA", region: "Africa" },
  "South Korea": { lat: 36.5, lon: 127.8, code: "KR", region: "Asia" },
  Spain: { lat: 40, lon: -4, code: "ES", region: "Europe" },
  "Sri Lanka": { lat: 7.9, lon: 80.8, code: "LK", region: "Asia" },
  Sweden: { lat: 62, lon: 15, code: "SE", region: "Europe" },
  Switzerland: { lat: 47, lon: 8, code: "CH", region: "Europe" },
  Syria: { lat: 35, lon: 38, code: "SY", region: "Asia" },
  Taiwan: { lat: 23.5, lon: 121, code: "TW", region: "Asia" },
  Tanzania: { lat: -6.4, lon: 34.9, code: "TZ", region: "Africa" },
  Thailand: { lat: 15, lon: 101, code: "TH", region: "Asia" },
  "Trinidad and Tobago": { lat: 10.7, lon: -61.2, code: "TT", region: "South America" },
  Tunisia: { lat: 34, lon: 9, code: "TN", region: "Africa" },
  Türkiye: { lat: 39, lon: 35, code: "TR", region: "Asia" },
  Turkmenistan: { lat: 39, lon: 59.6, code: "TM", region: "Asia" },
  Ukraine: { lat: 49, lon: 32, code: "UA", region: "Europe" },
  "United Arab Emirates": { lat: 24, lon: 54, code: "AE", region: "Asia" },
  "United Kingdom": { lat: 54, lon: -2, code: "GB", region: "Europe" },
  "United States": { lat: 38, lon: -97, code: "US", region: "North America" },
  Uruguay: { lat: -33, lon: -56, code: "UY", region: "South America" },
  Uzbekistan: { lat: 41.4, lon: 64.6, code: "UZ", region: "Asia" },
  Venezuela: { lat: 8, lon: -66, code: "VE", region: "South America" },
  Vietnam: { lat: 16, lon: 106, code: "VN", region: "Asia" },
  Yemen: { lat: 15.5, lon: 48, code: "YE", region: "Asia" },
  Zimbabwe: { lat: -19, lon: 29.2, code: "ZW", region: "Africa" },
};

/**
 * Names the crawler has used, or may use, for a country already in the table. Keeps a renamed
 * label on the map instead of silently dropping its marker.
 */
const ALIASES: Record<string, string> = {
  "Czech Republic": "Czechia",
  Turkey: "Türkiye",
  "Russian Federation": "Russia",
  "Korea, Republic of": "South Korea",
  "Republic of Korea": "South Korea",
  "Viet Nam": "Vietnam",
  "Hong Kong SAR China": "Hong Kong",
  "Macao SAR China": "Macao",
  Macau: "Macao",
  "Taiwan, Province of China": "Taiwan",
  "United States of America": "United States",
  USA: "United States",
  UK: "United Kingdom",
  "Great Britain": "United Kingdom",
  "Iran, Islamic Republic of": "Iran",
  "Bolivia, Plurinational State of": "Bolivia",
  "Venezuela, Bolivarian Republic of": "Venezuela",
  "Syrian Arab Republic": "Syria",
  "Lao People's Democratic Republic": "Laos",
  "Republic of Moldova": "Moldova",
  "North Macedonia (Republic of)": "North Macedonia",
  Macedonia: "North Macedonia",
  Curacao: "Curaçao",
};

/** Case-insensitive lookup that also resolves the alias names above; null when unplaceable. */
export function countryPoint(label: string): CountryPoint | null {
  const direct = COUNTRY_POINTS[label];
  if (direct) return direct;
  const aliased = ALIASES[label];
  if (aliased) return COUNTRY_POINTS[aliased] ?? null;
  const folded = label.trim().toLowerCase();
  for (const [name, point] of Object.entries(COUNTRY_POINTS)) {
    if (name.toLowerCase() === folded) return point;
  }
  return null;
}
