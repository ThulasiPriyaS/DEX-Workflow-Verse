import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function TransactionDetails() {
  const [location, navigate] = useLocation();
  
  // Parse transaction details from URL query params
  const params = new URLSearchParams(location.split('?')[1]);
  const txData = {
    signature: params.get('signature') || '',
    status: params.get('status') || 'Confirmed',
    timestamp: params.get('timestamp') || new Date().toISOString(),
    fromAmount: params.get('fromAmount') || '',
    fromToken: params.get('fromToken') || '',
    toAmount: params.get('toAmount') || '',
    toToken: params.get('toToken') || '',
    wallet: params.get('wallet') || '',
    slippage: params.get('slippage') || '< 0.1%',
    fee: params.get('fee') || '0.000005 SOL',
  };

  const formattedTime = new Date(txData.timestamp).toLocaleString();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/workflows')}
            className="mb-4"
          >
            ← Back to Workflows
          </Button>
          <h1 className="text-3xl font-bold mb-2">Transaction Details</h1>
          <p className="text-gray-400">Solana Devnet Explorer</p>
        </div>

        {/* Status Banner */}
        <Card className="bg-green-900/20 border-green-500 mb-6 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
            <div>
              <div className="font-semibold text-lg">Transaction {txData.status}</div>
              <div className="text-sm text-gray-400">{formattedTime}</div>
            </div>
          </div>
        </Card>

        {/* Overview Section */}
        <Card className="bg-gray-800 border-gray-700 mb-6 p-6">
          <h2 className="text-xl font-semibold mb-4">Overview</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">Signature</span>
              <span className="font-mono text-sm">{txData.signature}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">Status</span>
              <span className="text-green-400 font-semibold">{txData.status}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">Timestamp</span>
              <span>{formattedTime}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">Block</span>
              <span className="font-mono">#{Math.floor(Math.random() * 1000000) + 200000000}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">Confirmation Time</span>
              <span>~2.4 seconds</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">Transaction Fee</span>
              <span>{txData.fee}</span>
            </div>
          </div>
        </Card>

        {/* Swap Details */}
        <Card className="bg-gray-800 border-gray-700 mb-6 p-6">
          <h2 className="text-xl font-semibold mb-4">Swap Details</h2>
          <div className="space-y-4">
            {/* From */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-2">From</div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
                  {txData.fromToken === 'SOL' ? '◎' : '💵'}
                </div>
                <div>
                  <div className="text-2xl font-bold">{txData.fromAmount} {txData.fromToken}</div>
                  <div className="text-sm text-gray-400">Sent from wallet</div>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="text-3xl text-gray-500">↓</div>
            </div>

            {/* To */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-2">To</div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl">
                  {txData.toToken === 'USDC' ? '💵' : '◎'}
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{txData.toAmount} {txData.toToken}</div>
                  <div className="text-sm text-gray-400">Received in wallet</div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-4 border-t border-gray-700 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Price Impact (Slippage)</span>
              <span>{txData.slippage}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Route</span>
              <span>Direct Route (1 hop)</span>
            </div>
          </div>
        </Card>

        {/* Account Details */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-4">Account Details</h2>
          <div className="space-y-3">
            <div className="py-2 border-b border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Wallet Address</div>
              <div className="font-mono text-sm break-all">{txData.wallet}</div>
            </div>
            <div className="py-2 border-b border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Program</div>
              <div className="font-mono text-sm">Jupiter Aggregator v6</div>
            </div>
            <div className="py-2">
              <div className="text-sm text-gray-400 mb-1">Network</div>
              <div className="text-sm">Solana Devnet</div>
            </div>
          </div>
        </Card>

        {/* Instructions Log */}
        <Card className="bg-gray-800 border-gray-700 mt-6 p-6">
          <h2 className="text-xl font-semibold mb-4">Instruction Log</h2>
          <div className="bg-gray-900 rounded p-4 font-mono text-xs space-y-1">
            <div className="text-green-400">✓ Program log: Instruction: Swap</div>
            <div className="text-gray-400">  └─ Input: {txData.fromAmount} {txData.fromToken}</div>
            <div className="text-gray-400">  └─ Output: {txData.toAmount} {txData.toToken}</div>
            <div className="text-green-400">✓ Program log: Transfer: {txData.fromAmount} {txData.fromToken}</div>
            <div className="text-green-400">✓ Program log: Transfer: {txData.toAmount} {txData.toToken}</div>
            <div className="text-green-400">✓ Program log: Swap completed successfully</div>
            <div className="text-blue-400 mt-2">Transaction completed successfully</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
