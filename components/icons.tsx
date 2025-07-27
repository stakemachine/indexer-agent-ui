export function EthereumIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <title>Ethereum logo</title>
      <path d="M12 2L2 12l10 10 10-10L12 2z" />
      <path d="M12 2l0 20" />
    </svg>
  );
}
