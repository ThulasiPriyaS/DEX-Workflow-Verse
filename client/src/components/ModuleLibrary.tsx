import { ModuleCard } from "./modules/ModuleCard";
import { ScrollArea } from "@/components/ui/scroll-area";

type ModuleType = "swap" | "jupiterSwap" | "stake" | "claim" | "bridge" | "lightning";

type ModuleInfo = {
  type: ModuleType;
  title: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
};

const MODULES: ModuleInfo[] = [
  {
    type: "swap",
    title: "Swap",
    description: "Exchange tokens",
    icon: "swap_horiz",
    color: "#3165F5",
    bgColor: "rgba(49, 101, 245, 0.2)",
  },
  {
    type: "jupiterSwap",
    title: "Jupiter Swap",
    description: "Swap Solana tokens via Jupiter on Devnet",
    icon: "currency_exchange",
    color: "#9945FF",
    bgColor: "rgba(153, 69, 255, 0.2)",
  },
  {
    type: "stake",
    title: "Stake",
    description: "Stake your tokens",
    icon: "lock",
    color: "#10B981",
    bgColor: "rgba(16, 185, 129, 0.2)",
  },
  {
    type: "claim",
    title: "Claim Rewards",
    description: "Harvest your rewards",
    icon: "redeem",
    color: "#7C3AED",
    bgColor: "rgba(124, 58, 237, 0.2)",
  },
  {
    type: "bridge",
    title: "BTC Bridge",
    description: "Bridge BTC to sBTC",
    icon: "bridge",
    color: "#F59E0B",
    bgColor: "rgba(245, 158, 11, 0.2)",
  },
  {
    type: "lightning",
    title: "Lightning",
    description: "Lightning payment",
    icon: "bolt",
    color: "#F59E0B",
    bgColor: "rgba(245, 158, 11, 0.2)",
  },
];

const CATEGORIES = [
  {
    name: "Core Operations",
    modules: ["swap", "stake", "claim"],
  },
  {
    name: "Solana Operations", 
    modules: ["jupiterSwap"],
  },
  {
    name: "Bitcoin Operations",
    modules: ["bridge", "lightning"],
  },
];

export function ModuleLibrary() {
  return (
    <div className="w-64 bg-dark-200 overflow-y-auto flex-shrink-0 border-r border-dark-100 hidden md:block">
      <ScrollArea className="h-full">
        <div className="p-4">
          <h2 className="text-lg font-medium mb-4">Module Library</h2>
          
          <div className="space-y-4">
            {CATEGORIES.map((category) => (
              <div key={category.name}>
                <div className="mb-2 text-xs uppercase text-gray-400 font-medium">
                  {category.name}
                </div>
                
                <div className="space-y-3">
                  {MODULES
                    .filter((module) => category.modules.includes(module.type))
                    .map((module) => (
                      <ModuleCard
                        key={module.type}
                        type={module.type}
                        title={module.title}
                        description={module.description}
                        icon={module.icon}
                        color={module.color}
                        bgColor={module.bgColor}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
