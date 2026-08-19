import { nneAssets } from "../config/assets";

interface CollabBrandProps {
  compact?: boolean;
  className?: string;
}

export function CollabBrand({ compact = false, className = "" }: CollabBrandProps) {
  return (
    <div
      className={`collab-brand ${compact ? "compact" : ""} ${className}`.trim()}
      aria-label="NNE por WESTDETRO"
    >
      <img src={nneAssets.brand.nneWhite} alt="NNE" />
      <span aria-hidden="true">×</span>
      <img src={nneAssets.brand.westdetroWhite} alt="WESTDETRO" />
    </div>
  );
}
