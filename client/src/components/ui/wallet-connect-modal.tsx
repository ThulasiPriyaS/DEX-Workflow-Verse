import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface WalletOption {
  id: string;
  name: string;
  icon: string;
}

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (address: string) => void;
}

const WALLET_OPTIONS: WalletOption[] = [
  {
    id: "bitcoin-wallet",
    name: "Bitcoin Wallet",
    icon: "currency_bitcoin",
  },
  {
    id: "metamask",
    name: "MetaMask",
    icon: "account_balance_wallet",
  },
  {
    id: "wallet-connect",
    name: "WalletConnect",
    icon: "link",
  },
];

export function WalletConnectModal({ isOpen, onClose, onConnect }: WalletConnectModalProps) {
  const handleConnect = (walletId: string) => {
    // Simulate wallet connection
    // In a real app, this would integrate with actual wallet APIs
    let mockAddress = "";
    
    switch (walletId) {
      case "bitcoin-wallet":
        mockAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
        break;
      case "metamask":
        mockAddress = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
        break;
      case "wallet-connect":
        mockAddress = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";
        break;
      default:
        mockAddress = "0x" + Math.random().toString(16).slice(2, 42);
    }
    
    onConnect(mockAddress);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-dark-200 border border-dark-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">Connect Wallet</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 my-2">
          {WALLET_OPTIONS.map((wallet) => (
            <Button
              key={wallet.id}
              variant="outline"
              onClick={() => handleConnect(wallet.id)}
              className="w-full bg-dark-100 hover:bg-dark-300 transition p-3 rounded flex items-center justify-between h-auto"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 rounded flex items-center justify-center mr-3 bg-dark-300">
                  <span className="material-icons text-primary">{wallet.icon}</span>
                </div>
                <span>{wallet.name}</span>
              </div>
              <span className="material-icons text-gray-400">chevron_right</span>
            </Button>
          ))}
        </div>
        
        <div className="border-t border-dark-100 pt-4 mt-2">
          <p className="text-xs text-gray-400 text-center">
            By connecting your wallet, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
