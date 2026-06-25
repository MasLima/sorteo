export function formatMoney(amount: number): string {
  return amount % 1 === 0 ? `S/${amount}` : `S/${amount.toFixed(2)}`;
}
