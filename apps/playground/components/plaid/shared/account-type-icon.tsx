import {
  CreditCardIcon,
  HandCoinsIcon,
  LandmarkIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const typeMap: Record<string, typeof LandmarkIcon> = {
  depository: LandmarkIcon,
  credit: CreditCardIcon,
  loan: HandCoinsIcon,
  investment: TrendingUpIcon,
  other: WalletIcon,
};

type AccountTypeIconProps = {
  type: string;
  className?: string;
};

export function AccountTypeIcon({ type, className }: AccountTypeIconProps) {
  const Icon = typeMap[type?.toLowerCase()] ?? WalletIcon;
  return <Icon className={cn("size-4", className)} />;
}
