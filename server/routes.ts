import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWorkflowSchema, insertWorkflowActionSchema, insertWorkflowExecutionSchema, ExecutionStatusEnum } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import * as ethers from "ethers";

export async function registerRoutes(app: Express): Promise<Server> {
  // === WORKFLOW ROUTES ===
  app.get("/api/workflows", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const workflows = await storage.getWorkflows(userId);
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflows" });
    }
  });

  app.get("/api/workflows/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const workflow = await storage.getWorkflow(id);
      
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflow" });
    }
  });

  app.post("/api/workflows", async (req: Request, res: Response) => {
    try {
      // Add created and updated timestamps
      const workflowData = {
        ...req.body,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };
      
      const parsedData = insertWorkflowSchema.parse(workflowData);
      const workflow = await storage.createWorkflow(parsedData);
      res.status(201).json(workflow);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to create workflow" });
      }
    }
  });

  app.put("/api/workflows/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Update the 'updated' timestamp
      const workflowData = {
        ...req.body,
        updated: new Date().toISOString()
      };
      
      const parsedData = insertWorkflowSchema.parse(workflowData);
      const workflow = await storage.updateWorkflow(id, parsedData);
      
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      res.json(workflow);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to update workflow" });
      }
    }
  });

  app.delete("/api/workflows/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteWorkflow(id);
      
      if (!success) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete workflow" });
    }
  });

  // === WORKFLOW ACTIONS ROUTES ===
  
  // Get all actions for a workflow
  app.get("/api/workflows/:workflowId/actions", async (req: Request, res: Response) => {
    try {
      const workflowId = parseInt(req.params.workflowId);
      const actions = await storage.getWorkflowActions(workflowId);
      res.json(actions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflow actions" });
    }
  });
  
  // Create a new action for a workflow
  app.post("/api/workflows/:workflowId/actions", async (req: Request, res: Response) => {
    try {
      const workflowId = parseInt(req.params.workflowId);
      
      // Make sure the workflow exists
      const workflow = await storage.getWorkflow(workflowId);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      // Add the workflowId to the action data
      const actionData = {
        ...req.body,
        workflowId
      };
      
      const parsedAction = insertWorkflowActionSchema.parse(actionData);
      const action = await storage.createWorkflowAction(parsedAction);
      res.status(201).json(action);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to create workflow action" });
      }
    }
  });
  
  // Update a workflow action
  app.put("/api/workflows/actions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const actionData = insertWorkflowActionSchema.partial().parse(req.body);
      const updatedAction = await storage.updateWorkflowAction(id, actionData);
      
      if (!updatedAction) {
        return res.status(404).json({ message: "Workflow action not found" });
      }
      
      res.json(updatedAction);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to update workflow action" });
      }
    }
  });
  
  // Delete a workflow action
  app.delete("/api/workflows/actions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteWorkflowAction(id);
      
      if (!success) {
        return res.status(404).json({ message: "Workflow action not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete workflow action" });
    }
  });
  
  // === WORKFLOW EXECUTION ROUTES ===
  
  // Get all executions for a workflow
  app.get("/api/workflows/:workflowId/executions", async (req: Request, res: Response) => {
    try {
      const workflowId = parseInt(req.params.workflowId);
      const executions = await storage.getWorkflowExecutions(workflowId);
      res.json(executions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflow executions" });
    }
  });
  
  // Get a specific execution
  app.get("/api/workflows/executions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const execution = await storage.getWorkflowExecution(id);
      
      if (!execution) {
        return res.status(404).json({ message: "Workflow execution not found" });
      }
      
      res.json(execution);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflow execution" });
    }
  });
  
  // Execute a workflow
  app.post("/api/workflows/:workflowId/execute", async (req: Request, res: Response) => {
    try {
      const workflowId = parseInt(req.params.workflowId);
      
      // Make sure the workflow exists
      const workflow = await storage.getWorkflow(workflowId);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      // Create a new execution record with "pending" status
      const executionData = {
        workflowId,
        status: 'pending'
      };
      
      const parsedData = insertWorkflowExecutionSchema.parse(executionData);
      const execution = await storage.createWorkflowExecution(parsedData);
      
      // Return the execution ID immediately so the client can poll for updates
      res.status(202).json(execution);
      
      // Process the workflow in the background
      setTimeout(() => {
        processWorkflow(workflowId, execution.id);
      }, 0);
      
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to execute workflow" });
      }
    }
  });

  // Mock endpoint for wallet validation
  app.post("/api/wallet/validate", (req: Request, res: Response) => {
    const { address } = req.body;
    
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ valid: false, message: "Invalid wallet address" });
    }
    
    // Simple validation for demonstration purposes
    const isValidAddress = address.startsWith("0x") && address.length === 42;
    
    res.json({
      valid: isValidAddress,
      message: isValidAddress ? "Wallet address is valid" : "Invalid wallet address format"
    });
  });

  // === DEFI ACTIONS (SIMULATION, REALISTIC) ===
  // Simulated Swap endpoint
  /**
   * POST /api/swap
   * Request: { from, to, amount, slippage, action ("swap"), [privateKey] }
   * Response: { success, simulated, tx: { hash, from, to, value, status, action, timestamp }, message }
   */
  app.post("/api/swap", async (req: Request, res: Response) => {
    const { from, to, amount, slippage, action = "swap", privateKey } = req.body;
    try {
      // Simulate pending status
      const txHash = "0x" + Math.random().toString(16).slice(2, 18).padEnd(64, "0");
      const now = new Date();
      // Mock reserves for simulation (e.g., ETH/USDC pool)
      const reserves: { [key: string]: number[] } = {
        "ETH/USDC": [1000, 2000000],
        "USDC/ETH": [2000000, 1000],
      };
      let key = "ETH/USDC";
      if (from && to && from.toUpperCase().includes("USDC")) key = "USDC/ETH";
      const [reserveIn, reserveOut] = reserves[key];
      const amountIn = parseFloat(amount);
      let amountOut = (amountIn * reserveOut) / (reserveIn + amountIn);
      const slippagePct = parseFloat(slippage || "0.5");
      const minAmountOut = amountOut * (1 - slippagePct / 100);
      setTimeout(() => {
        res.json({
          success: true,
          simulated: true,
          tx: {
            hash: txHash,
            from,
            to,
            value: amountIn,
            status: "confirmed",
            action,
            output: minAmountOut,
            timestamp: now.toISOString(),
            privateKey,
          },
          message: `Transaction confirmed! Swapped ${amountIn} ${key.split("/")[0]} for ~${minAmountOut.toFixed(2)} ${key.split("/")[1]}`
        });
      }, 2500); // 2.5s delay to mimic mining
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Simulated Stake endpoint
  /**
   * POST /api/stake
   * Request: { from, token, amount, action ("stake"), [privateKey] }
   * Response: { success, simulated, tx: { hash, from, to, value, status, action, timestamp }, message }
   */
  app.post("/api/stake", async (req: Request, res: Response) => {
    const { from, token, amount, action = "stake", privateKey } = req.body;
    try {
      const txHash = "0x" + Math.random().toString(16).slice(2, 18).padEnd(64, "0");
      const now = new Date();
      setTimeout(() => {
        res.json({
          success: true,
          simulated: true,
          tx: {
            hash: txHash,
            from,
            to: token + "_staking_contract",
            value: parseFloat(amount),
            status: "confirmed",
            action,
            timestamp: now.toISOString(),
            privateKey,
          },
          message: `Transaction confirmed! Staked ${amount} ${token}`
        });
      }, 2500);
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Simulated Claim Rewards endpoint
  /**
   * POST /api/claim-rewards
   * Request: { from, token, action ("claim-rewards"), [privateKey] }
   * Response: { success, simulated, tx: { hash, from, to, value, status, action, timestamp }, message }
   */
  app.post("/api/claim-rewards", async (req: Request, res: Response) => {
    const { from, token, action = "claim-rewards", privateKey } = req.body;
    try {
      const reward = (Math.random() * 10).toFixed(4);
      const txHash = "0x" + Math.random().toString(16).slice(2, 18).padEnd(64, "0");
      const now = new Date();
      setTimeout(() => {
        res.json({
          success: true,
          simulated: true,
          tx: {
            hash: txHash,
            from,
            to: token + "_staking_contract",
            value: parseFloat(reward),
            status: "confirmed",
            action,
            timestamp: now.toISOString(),
            privateKey,
          },
          message: `Transaction confirmed! Claimed ${reward} ${token}`
        });
      }, 2500);
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

// Function to process workflow execution in the background
async function processWorkflow(workflowId: number, executionId: number) {
  try {
    // Update status to running
    await storage.updateWorkflowExecutionStatus(executionId, 'running');
    
    // Get the workflow
    const workflow = await storage.getWorkflow(workflowId);
    if (!workflow) {
      await storage.updateWorkflowExecutionStatus(
        executionId, 
        'failed', 
        {}, 
        'Workflow not found'
      );
      return;
    }
    
    // Get all the actions for this workflow
    const actions = await storage.getWorkflowActions(workflowId);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // For now, just simulate a successful execution
    const result = {
      completedActions: actions.length,
      actions: actions.map(action => ({
        id: action.id,
        name: action.name,
        type: action.type,
        status: 'completed',
        result: `Simulated result for ${action.name}`
      }))
    };
    
    // Update status to completed
    await storage.updateWorkflowExecutionStatus(executionId, 'completed', result);
    
  } catch (error) {
    console.error("Error processing workflow:", error);
    
    // Update status to failed
    await storage.updateWorkflowExecutionStatus(
      executionId,
      'failed',
      {},
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
