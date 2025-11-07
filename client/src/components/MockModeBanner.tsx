/**
 * Mock Mode Configuration Banner Component
 * 
 * Displays a prominent banner when running in mock mode
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { shouldUseMockJupiter } from '@/lib/solana/mockJupiterService';

interface MockModeBannerProps {
  cluster?: string;
}

export function MockModeBanner({ cluster = 'devnet' }: MockModeBannerProps) {
  const isMockMode = shouldUseMockJupiter(cluster);
  
  if (!isMockMode) {
    return null;
  }
  
  return (
    <Alert className="mb-4 bg-yellow-50 border-yellow-200">
      <div className="flex items-start">
        <span className="text-2xl mr-3">🎭</span>
        <div>
          <AlertTitle className="text-yellow-900 font-semibold">
            Mock Mode Active
          </AlertTitle>
          <AlertDescription className="text-yellow-800 text-sm mt-1">
            You're using <strong>simulated Jupiter swaps</strong> for devnet testing.
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Quotes are generated with realistic price movements</li>
              <li>Transactions require real signatures but aren't submitted to blockchain</li>
              <li>Mock confirmations simulate 2-4 second blockchain delays</li>
              <li>No real funds are at risk</li>
            </ul>
            <p className="mt-2 text-xs">
              <strong>Note:</strong> To use real Jupiter API, switch Phantom to <strong>mainnet</strong> 
              and ensure you have mainnet SOL for testing.
            </p>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}