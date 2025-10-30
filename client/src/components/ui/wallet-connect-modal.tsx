import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export interface WalletOption {
  id: string;
  name: string;
  icon: string;
  available?: boolean;
}

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (address: string, privateKey?: string) => void;
}

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      publicKey?: { toString: () => string };
    };
  }
}

export function WalletConnectModal({ isOpen, onClose, onConnect }: WalletConnectModalProps) {
  const [manualMode, setManualMode] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [error, setError] = useState("");
  const [phantomAvailable, setPhantomAvailable] = useState(false);

  useEffect(() => {
    // Check if Phantom is installed
    setPhantomAvailable(!!window.solana?.isPhantom);
  }, [isOpen]);

  const WALLET_OPTIONS: WalletOption[] = [
    {
      id: "phantom",
      name: "Phantom (Solana)",
      icon: "account_balance_wallet",
      available: phantomAvailable,
    },
    {
      id: "metamask",
      name: "MetaMask (Ethereum)",
      icon: "account_balance_wallet",
    },
    {
      id: "wallet-connect",
      name: "WalletConnect",
      icon: "link",
    },
  ];

  const handleConnect = async (walletId: string) => {
    setError("");
    
    if (walletId === "phantom") {
      // Connect to Phantom wallet
      if (!window.solana?.isPhantom) {
        setError("Phantom wallet not found. Please install it from phantom.app");
        window.open("https://phantom.app", "_blank");
        return;
      }

      try {
        const response = await window.solana.connect();
        const address = response.publicKey.toString();
        onConnect(address);
      } catch (err: any) {
        setError(err.message || "Failed to connect to Phantom");
      }
      return;
    }

    // Mock addresses for other wallets (for demo purposes)
    let mockAddress = "";
    switch (walletId) {
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

  const handleManualConnect = () => {
    setError("");
    if (!manualAddress || !manualKey) {
      setError("Please enter both address and private key.");
      return;
    }
    // Optionally: Add address format validation here
    onConnect(manualAddress.trim(), manualKey.trim());
    setManualAddress("");
    setManualKey("");
    setManualMode(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-dark-200 border border-dark-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">Connect Wallet</DialogTitle>
        </DialogHeader>
        {!manualMode ? (
          <>
        <div className="space-y-3 my-2">
          {error && <div className="text-sm text-red-500 p-2 bg-red-500/10 rounded">{error}</div>}
          {WALLET_OPTIONS.map((wallet) => (
            <Button
              key={wallet.id}
              variant="outline"
              onClick={() => handleConnect(wallet.id)}
              className="w-full bg-dark-100 hover:bg-dark-300 transition p-3 rounded flex items-center justify-between h-auto"
              disabled={wallet.id === "phantom" && !wallet.available}
            >
              <div className="flex items-center">
                <div className="w-8 h-8 rounded flex items-center justify-center mr-3 bg-dark-300">
                  <span className="material-icons text-primary">{wallet.icon}</span>
                </div>
                <div className="flex flex-col items-start">
                  <span>{wallet.name}</span>
                  {wallet.id === "phantom" && !wallet.available && (
                    <span className="text-xs text-gray-400">Not installed</span>
                  )}
                  {wallet.id === "phantom" && wallet.available && (
                    <span className="text-xs text-green-400">✓ Detected</span>
                  )}
                </div>
              </div>
              <span className="material-icons text-gray-400">chevron_right</span>
            </Button>
          ))}
              <Button
                variant="outline"
                className="w-full bg-dark-100 hover:bg-dark-300 transition p-3 rounded flex items-center justify-between h-auto"
                onClick={() => setManualMode(true)}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded flex items-center justify-center mr-3 bg-dark-300">
                    <span className="material-icons text-primary">edit</span>
                  </div>
                  <span>Manual Entry</span>
                </div>
                <span className="material-icons text-gray-400">chevron_right</span>
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4 my-2">
            <div>
              <label className="block text-xs mb-1">Address</label>
              <input
                className="w-full p-2 rounded border border-dark-100 bg-dark-100 text-sm"
                value={manualAddress}
                onChange={e => setManualAddress(e.target.value)}
                placeholder="0x..."
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Private Key</label>
              <input
                className="w-full p-2 rounded border border-dark-100 bg-dark-100 text-sm"
                value={manualKey}
                onChange={e => setManualKey(e.target.value)}
                placeholder="0x..."
                type="password"
              />
            </div>
            {error && <div className="text-xs text-red-500">{error}</div>}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleManualConnect}>Connect</Button>
              <Button className="flex-1" variant="ghost" onClick={() => setManualMode(false)}>Cancel</Button>
            </div>
        </div>
        )}
        <div className="border-t border-dark-100 pt-4 mt-2">
          <p className="text-xs text-gray-400 text-center">
            By connecting your wallet, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
