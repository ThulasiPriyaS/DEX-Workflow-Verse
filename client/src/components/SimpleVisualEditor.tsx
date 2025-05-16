import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Connection,
  Edge,
  Node,
  NodeTypes,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ACTION_TEMPLATES } from './action-templates';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Node components
const ActionNode = ({ data }: { data: any }) => {
  const actionType = data.type || 'httpRequest';
  const label = data.label || 'Action';
  
  const getIcon = () => {
    switch (actionType) {
      case 'httpRequest': return '🌐';
      case 'smartContractCall': return '📝';
      case 'defiSwap': return '🔄';
      case 'tokenTransfer': return '💸';
      case 'emailSend': return '📧';
      default: return '⚙️';
    }
  };
  
  return (
    <div className="px-4 py-2 border-2 border-gray-300 rounded-md shadow-sm bg-white min-w-[150px]">
      <div className="flex items-center gap-2">
        <div className="text-2xl">{getIcon()}</div>
        <div>
          <div className="font-medium">{label}</div>
          <div className="text-xs text-gray-500">{actionType}</div>
        </div>
      </div>
    </div>
  );
};

const ConditionNode = ({ data }: { data: any }) => {
  return (
    <div className="px-4 py-2 border-2 border-gray-300 rounded-md shadow-sm bg-yellow-50 min-w-[150px]">
      <div className="flex items-center gap-2">
        <div className="text-2xl">⚖️</div>
        <div>
          <div className="font-medium">{data.label || 'Condition'}</div>
          <div className="text-xs text-gray-500">Branch workflow</div>
        </div>
      </div>
    </div>
  );
};

const StartEndNode = ({ data }: { data: any }) => {
  const isStart = data.subType === 'start';
  return (
    <div className={`px-4 py-2 border-2 border-gray-300 rounded-full shadow-sm ${
      isStart ? 'bg-green-50' : 'bg-red-50'
    } min-w-[100px] flex items-center justify-center`}>
      <div className="text-lg font-medium">{data.label}</div>
    </div>
  );
};

// Node type definitions
const nodeTypes: NodeTypes = {
  actionNode: ActionNode,
  conditionNode: ConditionNode,
  startEndNode: StartEndNode,
};

// Available node templates
const NODE_TEMPLATES = [
  {
    type: 'actionNode',
    label: 'HTTP Request',
    actionType: 'httpRequest',
    description: 'Make an API call',
  },
  {
    type: 'actionNode',
    label: 'Smart Contract',
    actionType: 'smartContractCall',
    description: 'Execute a contract function',
  },
  {
    type: 'actionNode',
    label: 'Token Swap',
    actionType: 'defiSwap',
    description: 'Swap between tokens',
  },
  {
    type: 'conditionNode',
    label: 'Condition',
    description: 'If/else branch',
  },
  {
    type: 'startEndNode',
    label: 'Start',
    subType: 'start',
    description: 'Workflow start',
  },
  {
    type: 'startEndNode',
    label: 'End',
    subType: 'end',
    description: 'Workflow end',
  },
];

// Generate unique IDs
const generateId = () => `${Math.random().toString(36).substr(2, 9)}`;

// Main component
function SimpleVisualEditor() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflowName, setWorkflowName] = useState('');
  const { toast } = useToast();
  
  // Handle connections between nodes
  const onConnect = useCallback((params: Connection) => {
    const newEdge = {
      ...params,
      id: `e-${generateId()}`,
      animated: true,
      style: { strokeWidth: 2 },
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);
  
  // Handle dropping nodes onto canvas
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!reactFlowBounds) return;
    
    const templateId = event.dataTransfer.getData('application/reactflow');
    if (!templateId) return;
    
    const template = NODE_TEMPLATES.find(t => `${t.type}-${t.actionType || t.subType || ''}` === templateId);
    if (!template) return;
    
    // Calculate position where node is dropped
    const position = {
      x: event.clientX - reactFlowBounds.left - 75,
      y: event.clientY - reactFlowBounds.top - 25,
    };
    
    // Create a new node
    const newNode = {
      id: generateId(),
      type: template.type,
      position,
      data: {
        label: template.label,
        type: template.actionType,
        subType: template.subType,
        config: {},
      },
    };
    
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);
  
  // Handle node selection
  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };
  
  // Save workflow
  const saveWorkflow = async () => {
    if (!workflowName) {
      toast({
        title: 'Error',
        description: 'Please provide a workflow name',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Create workflow data structure
      const workflowData = {
        name: workflowName,
        description: 'Created with Visual Builder',
        nodes: nodes,
        edges: edges,
      };
      
      // Save to backend
      const response = await apiRequest('POST', '/api/workflows', workflowData);
      const workflow = await response.json();
      
      toast({
        title: 'Success',
        description: 'Workflow saved successfully!',
      });
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to save workflow. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="flex h-full">
      {/* Sidebar with node templates */}
      <div className="w-64 bg-gray-100 p-4 overflow-y-auto border-r flex flex-col">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Workflow Name</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-md"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="My Workflow"
          />
        </div>
        
        <h3 className="font-medium mb-3">Node Templates</h3>
        <div className="space-y-2 flex-grow overflow-y-auto">
          {NODE_TEMPLATES.map((template) => (
            <div
              key={`${template.type}-${template.actionType || template.subType || ''}`}
              className="p-2 bg-white rounded-md shadow-sm cursor-move border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData(
                  'application/reactflow',
                  `${template.type}-${template.actionType || template.subType || ''}`
                );
                event.dataTransfer.effectAllowed = 'move';
              }}
            >
              <div className="font-medium">{template.label}</div>
              <div className="text-xs text-gray-500">{template.description}</div>
            </div>
          ))}
        </div>
        
        <div className="mt-auto pt-4 border-t">
          <button
            onClick={saveWorkflow}
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Save Workflow
          </button>
        </div>
      </div>
      
      {/* Flow canvas */}
      <div className="flex-grow" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          
          <Panel position="top-right">
            <div className="bg-white p-2 rounded-md shadow-md text-sm">
              Drag elements from the sidebar onto the canvas
            </div>
          </Panel>
        </ReactFlow>
      </div>
      
      {/* Node editor panel (conditionally rendered when a node is selected) */}
      {selectedNode && (
        <div className="w-80 bg-white p-4 border-l overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Edit Node</h3>
            <button
              className="text-gray-500 hover:text-gray-800"
              onClick={() => setSelectedNode(null)}
            >
              ×
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Label</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                value={selectedNode.data.label}
                onChange={(e) => {
                  // Update node label
                  setNodes((nds) =>
                    nds.map((node) => {
                      if (node.id === selectedNode.id) {
                        return {
                          ...node,
                          data: {
                            ...node.data,
                            label: e.target.value,
                          },
                        };
                      }
                      return node;
                    })
                  );
                  setSelectedNode({
                    ...selectedNode,
                    data: { ...selectedNode.data, label: e.target.value },
                  });
                }}
              />
            </div>
            
            {selectedNode.type === 'actionNode' && selectedNode.data.type && (
              <div>
                <label className="block text-sm font-medium mb-1">Action Type</label>
                <div className="text-sm px-3 py-2 bg-gray-100 rounded-md">
                  {selectedNode.data.type}
                </div>
              </div>
            )}
            
            <button
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md"
              onClick={() => {
                setNodes(nodes.filter((n) => n.id !== selectedNode.id));
                setEdges(edges.filter(
                  (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
                ));
                setSelectedNode(null);
              }}
            >
              Delete Node
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Export with ReactFlowProvider
export default function SimpleVisualEditorWrapper() {
  return (
    <ReactFlowProvider>
      <div className="h-full border rounded-md overflow-hidden">
        <SimpleVisualEditor />
      </div>
    </ReactFlowProvider>
  );
}