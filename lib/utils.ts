export function CutAddress(address: string) {
  return address.slice(0, 6) + "-" + address.slice(-6);
}

export function NormalizeGRT(amount: bigint) {
  var normalizedAmount = (
    BigInt(amount) / BigInt(1000000000000000000)
  ).toString();
  return Number(normalizedAmount).toFixed(0);
}
