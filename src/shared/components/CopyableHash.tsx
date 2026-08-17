import { Check, Copy } from "lucide-react";
import React, { useState } from "react";

interface CopyableHashProps {
  value: string;
  /** Number of leading/trailing characters to keep when shortening. */
  chars?: number;
  className?: string;
}

const shorten = (value: string, chars: number) => {
  if (value.length <= chars * 2 + 1) return value;
  return `${value.slice(0, chars)}…${value.slice(-chars)}`;
};

export const CopyableHash: React.FC<CopyableHashProps> = ({
  value,
  chars = 6,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied!" : value}
      className={`inline-flex items-center gap-1.5 text-xs text-ink-subtle font-mono hover:text-ink transition-colors ${className}`}
    >
      <span>{shorten(value, chars)}</span>
      {copied ? (
        <Check className="w-3 h-3 text-verified" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
    </button>
  );
};

export default CopyableHash;
