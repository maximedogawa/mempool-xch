/** MintGarden/Dexie already answer in decimal XCH, not mojos, so this is a plain number formatter. */
export function formatXchDecimal(value: number): string {
  const digits = value === 0 ? 0 : value < 1 ? 4 : value < 100 ? 2 : 0;
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: digits })} XCH`;
}
