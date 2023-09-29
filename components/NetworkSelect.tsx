import { useLocalStorage } from "usehooks-ts";

// Usage
export default function NetworkSelect() {
  const [networkName, setNetwork] = useLocalStorage("network", "mainnet");
  const networkChange = (event) => {
    setNetwork(event.target.value);
  };

  const NetworksList = ["mainnet", "arbitrum-one", "goerli", "arbitrum-goerli"];

  return (
    <select
      value={networkName}
      className="select max-w-xs"
      onChange={networkChange}
    >
      <option disabled selected>
        Network
      </option>
      {NetworksList.map((network) => (
        <option key={network} value={network}>
          {network}
        </option>
      ))}
    </select>
  );
}
