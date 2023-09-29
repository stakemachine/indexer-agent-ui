export function CutAddress(address: string) {
  return address.slice(0, 6) + "-" + address.slice(-6);
}

export function NormalizeGRT(amount: bigint) {
  var normalizedAmount = (
    BigInt(amount) / BigInt(1000000000000000000)
  ).toString();
  return Number(normalizedAmount).toFixed(0);
}

export function EmptyBatchControl(rows) {
  return;
}

export const Caip2ByChainAlias: { [key: string]: string } = {
  mainnet: "eip155:1",
  goerli: "eip155:5",
  gnosis: "eip155:100",
  hardhat: "eip155:1337",
  "arbitrum-one": "eip155:42161",
  "arbitrum-goerli": "eip155:421613",
  avalanche: "eip155:43114",
  matic: "eip155:137",
  celo: "eip155:42220",
  optimism: "eip155:10",
  fantom: "eip155:250",
};

export function resolveChainAlias(id: string): string {
  const aliasMatches = Object.keys(Caip2ByChainAlias).filter(
    (name) => Caip2ByChainAlias[name] == id,
  );
  if (aliasMatches.length === 1) {
    return aliasMatches[0];
  }
  return id;
}
