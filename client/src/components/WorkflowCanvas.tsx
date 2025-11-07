import { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  NodeTypes,
  Node,
  ReactFlowProvider,
  ReactFlowInstance,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from "@/components/ui/button";
import { WorkflowNode } from './modules/WorkflowNode';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { executeJupiterSwap, validateSwapParams, DEVNET_MINTS } from '@/lib/solana/jupiterSwapWithMock';
import { getTokenByAddress } from '@/lib/solana/tokenList';
import { showNetworkWarning } from '@/lib/solana/networkUtils';
import { validateDevnetSetup, getDevnetInstructions } from '@/lib/solana/devnetValidator';
import { ACTION_TEMPLATES } from './action-templates';
import { useLocation } from 'wouter';

type ModuleType = "swap" | "jupiterSwap" | "stake" | "claim" | "bridge" | "lightning";

// Helper function to get default configuration for a module type
const getDefaultConfig = (moduleType: ModuleType) => {
  const template = ACTION_TEMPLATES.find(t => t.id === moduleType);
  return template?.defaultConfig || {};
};

const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNode,
};

const INITIAL_VIEWPORT = { x: 0, y: 0, zoom: 1 };

export function WorkflowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  const onNodesChange = useCallback((changes: any) => {
    setNodes((nds) => {
      const updatedNodes = [...nds];
      changes.forEach((change: any) => {
        if (change.type === 'select') {
          const nodeIndex = updatedNodes.findIndex(n => n.id === change.id);
          if (nodeIndex !== -1) {
            const node = updatedNodes[nodeIndex];
            setSelectedNode(change.selected ? node : null);
            // Update global workflow context if needed
            window.selectedWorkflowNode = change.selected ? node : null;
          }
        }
      });
      return updatedNodes;
    });
  }, [setNodes]);

  const onEdgesChange = useCallback((changes: any) => {
    setEdges((eds) => eds);
  }, [setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({
      ...connection,
      type: 'smoothstep',
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      style: { 
        stroke: 'rgba(255, 255, 255, 0.5)',
        strokeWidth: 2
      }
    }, eds)),
    [setEdges]
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const moduleType = event.dataTransfer.getData('application/reactflow') as ModuleType;
      if (!moduleType) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `${moduleType}-${Date.now()}`,
        type: 'workflowNode',
        position,
        data: { 
          type: moduleType, 
          label: getModuleLabel(moduleType),
          config: getDefaultConfig(moduleType)
        },
        draggable: true,
      };

      setNodes((nds) => nds.concat(newNode));
      setSelectedNode(newNode);
    },
    [reactFlowInstance, setNodes, setSelectedNode]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleNew = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    toast({
      title: 'New Workflow',
      description: 'Started a new workflow',
    });
  };

  const handleClear = () => {
    if (nodes.length > 0 && confirm('Are you sure you want to clear the current workflow?')) {
      setNodes([]);
      setEdges([]);
      setSelectedNode(null);
      toast({
        title: 'Workflow Cleared',
        description: 'All nodes and connections have been removed',
      });
    }
  };

  const handleValidate = () => {
    // Basic validation
    if (nodes.length === 0) {
      toast({
        title: 'Validation Failed',
        description: 'Workflow is empty. Add some modules to continue.',
        variant: 'destructive',
      });
      return;
    }

    // Check for disconnected nodes
    const connectedNodeIds = new Set<string>();
    
    edges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });
    
    // If there's only one node, it doesn't need connections
    if (nodes.length > 1) {
      const disconnectedNodes = nodes.filter(node => !connectedNodeIds.has(node.id));
      
      if (disconnectedNodes.length > 0) {
        toast({
          title: 'Validation Failed',
          description: `There are ${disconnectedNodes.length} disconnected modules. Connect all modules to create a valid workflow.`,
          variant: 'destructive',
        });
        return;
      }
    }

    toast({
      title: 'Validation Successful',
      description: 'Workflow is valid and ready to execute',
      variant: 'default',
    });
  };

  const handleExecute = async () => {
    // Validate first
    if (nodes.length === 0) {
      toast({
        title: 'Cannot Execute',
        description: 'Workflow is empty. Add some modules to continue.',
        variant: 'destructive',
      });
      return;
    }

    // Check for disconnected nodes
    const connectedNodeIds = new Set<string>();
    
    edges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });
    
    // If there's only one node, it doesn't need connections
    if (nodes.length > 1) {
      const disconnectedNodes = nodes.filter(node => !connectedNodeIds.has(node.id));
      
      if (disconnectedNodes.length > 0) {
        toast({
          title: 'Cannot Execute',
          description: `There are ${disconnectedNodes.length} disconnected modules. Connect all modules to create a valid workflow.`,
          variant: 'destructive',
        });
        return;
      }
    }

    // Execute: if there is a Jupiter Swap node, run a real devnet swap via Jupiter + Phantom
    try {
      const swapNode = nodes.find(n => n.data?.type === 'jupiterSwap');
      if (!swapNode) {
        toast({ title: 'No Jupiter Swap Found', description: 'Add a Jupiter Swap module to execute a swap.' });
        return;
      }

  // Read config from node
  const cfg = (swapNode.data?.config || {}) as any;
  const uiAmount = parseFloat(cfg.amount || '0.05');
  const slippageBps = parseInt(cfg.slippageBps || '50');
      
  // Get token addresses from config - if missing, default to WSOL (common devnet token)
  const inputMint = cfg.inputToken || DEVNET_MINTS.WSOL;
  // If output is not configured, default to devnet USDC (a different token for a real swap)
  const outputMint = cfg.outputToken || DEVNET_MINTS.USDC;
      
      console.log('Jupiter Swap Config:', cfg);
      console.log('Input Token (mint):', inputMint);
      console.log('Output Token (mint):', outputMint);
      
      // Validate that input and output are different tokens
      if (inputMint === outputMint) {
        toast({
          title: 'Invalid Swap Configuration',
          description: 'Input and output tokens must be different. Please select a different output token in the node configuration.',
          variant: 'destructive'
        });
        return;
      }
      
      // Get token info for decimals
      const inputTokenInfo = getTokenByAddress(inputMint);
      const inputDecimals = inputTokenInfo?.decimals || 9;

      // Phantom must be connected - using devnet for Jupiter development
      const provider: any = (window as any).solana;
      if (!provider?.isPhantom) {
        toast({ title: 'Phantom Required', description: 'Install/Connect Phantom wallet.', variant: 'destructive' });
        return;
      }
      if (!provider.publicKey) {
        await provider.connect();
      }
      
      // Verify we're on devnet - this is critical!
      let userPublicKey: string;
      try {
        // Run devnet validation first
        validateDevnetSetup();
        
        // Check network configuration 
        console.log('🔍 Checking Phantom network configuration...');
        const networkSafe = await showNetworkWarning();
        
        if (!networkSafe) {
          console.error(getDevnetInstructions());
          toast({ 
            title: 'MAINNET DETECTED - BLOCKED', 
            description: 'Switch Phantom to Devnet! Check console for instructions.',
            variant: 'destructive'
          });
          return;
        }
        
        // Connect to devnet explicitly in our code
        userPublicKey = provider.publicKey.toString();
        console.log('👤 Connected wallet:', userPublicKey);
        console.log('🌐 CONFIRMED: Using devnet for Jupiter swap');
      } catch (error) {
        console.error('Network validation failed:', error);
        throw new Error('Failed to validate devnet setup');
      }

  const inputSymbol = inputTokenInfo?.symbol || 'Token';
  const outputTokenInfo = getTokenByAddress(outputMint);
  const outputSymbol = outputTokenInfo?.symbol || 'Token';

  // Destination wallet: allow sending to an external address if configured in the node
  const destinationWallet = cfg.destinationAddress || userPublicKey;
      
      // Convert UI amount to base units (smallest unit for the token)
      const baseAmount = Math.floor(uiAmount * Math.pow(10, inputDecimals));
      
      // Validate swap parameters
      const validation = validateSwapParams({
        inputMint,
        outputMint,
        amount: baseAmount,
        slippageBps,
        userPublicKey,
        destinationWallet,
        cluster: 'devnet', // This will trigger mock mode
      });
      
      if (!validation.valid) {
        toast({
          title: 'Invalid Swap Configuration',
          description: validation.error,
          variant: 'destructive'
        });
        return;
      }

      toast({ 
        title: 'Executing Swap...', 
        description: `Swapping ${uiAmount} ${inputSymbol} → ${outputSymbol}` 
      });
      
      console.log('🎯 Starting swap execution with params:', {
        inputMint,
        outputMint,
        baseAmount,
        userPublicKey,
        destinationWallet,
      });
      
      const swapResult = await executeJupiterSwap(
        {
          inputMint,
          outputMint,
          amount: baseAmount,
          slippageBps,
          userPublicKey,
          destinationWallet,
          cluster: 'devnet', // Triggers mock mode automatically
        },
        provider // Phantom wallet for signing
      );

      console.log('🎯 Swap result received:', swapResult);

      if (swapResult.success && swapResult.signature) {
        const outputInUi = swapResult.outputAmount ? (swapResult.outputAmount / Math.pow(10, outputTokenInfo?.decimals || 6)).toFixed(4) : '?';
        const inputInUi = uiAmount;
        
        // Log transaction details
        console.log('✅ Swap completed successfully!');
        console.log(`
╔════════════════════════════════════════════════════╗
║           SWAP TRANSACTION CONFIRMED               ║
╠════════════════════════════════════════════════════╣
║ Signature: ${swapResult.signature}
║ 
║ Input:  ${inputInUi} ${inputSymbol}
║ Output: ${outputInUi} ${outputSymbol}
║ 
║ Wallet: ${userPublicKey}
║ Status: ✅ Confirmed
║ Time:   ${new Date().toLocaleString()}
╚════════════════════════════════════════════════════╝
        `);
        
        // Show quick success toast
        toast({
          title: '✅ Swap Confirmed!',
          description: 'Redirecting to transaction details...',
          duration: 2000,
        });
        
        // Dispatch balance update event for WalletBalance component
        const balanceUpdateEvent = new CustomEvent('walletBalanceUpdate', {
          detail: {
            fromToken: inputSymbol,
            toToken: outputSymbol,
            fromAmount: inputInUi,
            toAmount: outputInUi,
          }
        });
        window.dispatchEvent(balanceUpdateEvent);
        
        // Navigate to transaction details page with all data
        const params = new URLSearchParams({
          signature: swapResult.signature,
          fromAmount: String(inputInUi),
          fromToken: String(inputSymbol),
          fromMint: String(inputMint),
          toAmount: String(outputInUi),
          toToken: String(outputSymbol),
          toMint: String(outputMint),
          wallet: String(userPublicKey),
          timestamp: new Date().toISOString(),
          slippage: swapResult.slippage ? swapResult.slippage.toFixed(3) : '0.1',
        });
        
        navigate(`/transaction?${params.toString()}`);
      } else {
        console.error('❌ Swap failed:', swapResult.error);
        toast({ 
          title: 'Swap Failed', 
          description: swapResult.error || 'Unknown error occurred',
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Swap Failed', description: String(err?.message || err), variant: 'destructive' });
    }
  };

  return (
    <div className="flex-1 bg-dark-300 overflow-hidden flex flex-col">
      <div className="border-b border-dark-100 p-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-sm font-medium">My Workflow</h2>
          <div className="flex items-center space-x-1 text-xs text-gray-400">
            <span className="material-icons text-xs">info</span>
            <span>Drag modules to canvas and connect them</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
            <span className="material-icons text-xs">zoom_in</span>
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
            <span className="material-icons text-xs">zoom_out</span>
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
            <span className="material-icons text-xs">fit_screen</span>
          </Button>
        </div>
      </div>
      
      <div ref={reactFlowWrapper} className="flex-1 overflow-hidden relative" style={{ width: '100%', height: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          defaultViewport={INITIAL_VIEWPORT}
          minZoom={0.2}
          maxZoom={4}
          fitView
          deleteKeyCode={["Backspace", "Delete"]}
          className="canvas-grid"
        >
          <Background color="rgba(255, 255, 255, 0.05)" gap={20} />
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              switch (node.data?.type) {
                case 'swap': return '#3165F5';
                case 'stake': return '#10B981';
                case 'claim': return '#7C3AED';
                case 'bridge': return '#F59E0B';
                case 'lightning': return '#F59E0B';
                default: return '#888';
              }
            }}
            maskColor="rgba(0, 0, 0, 0.2)"
            className="bg-dark-200 border border-dark-100"
          />
        </ReactFlow>

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Card className="bg-dark-200/60 border border-dark-100 p-6 max-w-md text-center">
              <h3 className="text-lg font-medium mb-2">Empty Workflow</h3>
              <p className="text-gray-400 text-sm mb-4">
                Drag modules from the library panel to create your workflow
              </p>
              <span className="material-icons text-4xl text-gray-500">drag_indicator</span>
            </Card>
          </div>
        )}
      </div>
      
      <div className="border-t border-dark-100 p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleNew} className="flex items-center gap-1 text-sm">
            <span className="material-icons text-sm">add</span>
            <span>New</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleClear} className="flex items-center gap-1 text-sm">
            <span className="material-icons text-sm">delete</span>
            <span>Clear</span>
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleValidate} className="flex items-center gap-1 text-sm">
            <span className="material-icons text-sm">play_arrow</span>
            <span>Validate</span>
          </Button>
          <Button onClick={handleExecute} className="flex items-center gap-1 text-sm bg-secondary hover:bg-green-600">
            <span className="material-icons text-sm">rocket_launch</span>
            <span>Execute</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function getModuleLabel(type: ModuleType): string {
  switch (type) {
    case 'swap': return 'Swap';
    case 'jupiterSwap': return 'Jupiter Swap';
    case 'stake': return 'Stake';
    case 'claim': return 'Claim Rewards';
    case 'bridge': return 'BTC Bridge';
    case 'lightning': return 'Lightning';
    default: return type;
  }
}

export function WorkflowCanvasWrapper() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas />
    </ReactFlowProvider>
  );
}
