import { useCopyToClipboard } from "usehooks-ts";
import { DocumentDuplicateIcon } from "@heroicons/react/24/solid";

export default function CopyButton({ data }) {
  const [value, copy] = useCopyToClipboard();
  return (
    <button
      onClick={() => {
        copy(data);
      }}
    >
      <DocumentDuplicateIcon
        width={16}
        height={16}
        className="invisible group-hover:visible"
      />
    </button>
  );
}
