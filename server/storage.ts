import { users, workflows, workflowActions, workflowExecutions,
  type User, type InsertUser, type Workflow, type InsertWorkflow,
  type WorkflowAction, type InsertWorkflowAction,
  type WorkflowExecution, type InsertWorkflowExecution,
  type ExecutionStatus
} from "@shared/schema";
import { db, usingNeon } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Workflow methods
  getWorkflows(): Promise<Workflow[]>;
  getWorkflow(id: number): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: number, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: number): Promise<boolean>;

  // Workflow Actions methods
  getWorkflowActions(workflowId: number): Promise<WorkflowAction[]>;
  createWorkflowAction(action: InsertWorkflowAction): Promise<WorkflowAction>;
  updateWorkflowAction(id: number, action: Partial<InsertWorkflowAction>): Promise<WorkflowAction | undefined>;
  deleteWorkflowAction(id: number): Promise<boolean>;
  
  // Workflow Execution methods
  getWorkflowExecutions(workflowId: number): Promise<WorkflowExecution[]>;
  getWorkflowExecution(id: number): Promise<WorkflowExecution | undefined>;
  createWorkflowExecution(execution: InsertWorkflowExecution): Promise<WorkflowExecution>;
  updateWorkflowExecutionStatus(id: number, status: ExecutionStatus, result?: Record<string, any>, error?: string): Promise<WorkflowExecution | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Workflow methods
  async getWorkflows(): Promise<Workflow[]> {
    return await db.select().from(workflows);
  }
  
  async getWorkflow(id: number): Promise<Workflow | undefined> {
    const [workflow] = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, id));
    return workflow || undefined;
  }
  
  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    const [newWorkflow] = await db
      .insert(workflows)
      .values(workflow)
      .returning();
    return newWorkflow;
  }
  
  async updateWorkflow(id: number, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const [updatedWorkflow] = await db
      .update(workflows)
      .set(workflow)
      .where(eq(workflows.id, id))
      .returning();
    return updatedWorkflow || undefined;
  }
  
  async deleteWorkflow(id: number): Promise<boolean> {
    try {
      // Delete associated actions and executions first
      await db.delete(workflowActions).where(eq(workflowActions.workflowId, id));
      await db.delete(workflowExecutions).where(eq(workflowExecutions.workflowId, id));
      
      // Then delete the workflow
      const [deletedWorkflow] = await db
        .delete(workflows)
        .where(eq(workflows.id, id))
        .returning();
      return !!deletedWorkflow;
    } catch (error) {
      console.error("Error deleting workflow:", error);
      return false;
    }
  }
  
  // Workflow Actions methods
  async getWorkflowActions(workflowId: number): Promise<WorkflowAction[]> {
    return await db
      .select()
      .from(workflowActions)
      .where(eq(workflowActions.workflowId, workflowId))
      .orderBy(workflowActions.order);
  }
  
  async createWorkflowAction(action: InsertWorkflowAction): Promise<WorkflowAction> {
    const [newAction] = await db
      .insert(workflowActions)
      .values(action)
      .returning();
    return newAction;
  }
  
  async updateWorkflowAction(id: number, action: Partial<InsertWorkflowAction>): Promise<WorkflowAction | undefined> {
    const [updatedAction] = await db
      .update(workflowActions)
      .set(action)
      .where(eq(workflowActions.id, id))
      .returning();
    return updatedAction || undefined;
  }
  
  async deleteWorkflowAction(id: number): Promise<boolean> {
    const [deletedAction] = await db
      .delete(workflowActions)
      .where(eq(workflowActions.id, id))
      .returning();
    return !!deletedAction;
  }
  
  // Workflow Execution methods
  async getWorkflowExecutions(workflowId: number): Promise<WorkflowExecution[]> {
    return await db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.workflowId, workflowId))
      .orderBy(desc(workflowExecutions.startedAt));
  }
  
  async getWorkflowExecution(id: number): Promise<WorkflowExecution | undefined> {
    const [execution] = await db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.id, id));
    return execution || undefined;
  }
  
  async createWorkflowExecution(execution: InsertWorkflowExecution): Promise<WorkflowExecution> {
    const [newExecution] = await db
      .insert(workflowExecutions)
      .values(execution)
      .returning();
    return newExecution;
  }
  
  async updateWorkflowExecutionStatus(
    id: number, 
    status: ExecutionStatus, 
    result?: Record<string, any>, 
    error?: string
  ): Promise<WorkflowExecution | undefined> {
    const updates: any = { status };
    
    if (status === 'completed' || status === 'failed') {
      updates.completedAt = new Date();
    }
    
    if (result) {
      updates.result = result;
    }
    
    if (error) {
      updates.error = error;
    }
    
    const [updatedExecution] = await db
      .update(workflowExecutions)
      .set(updates)
      .where(eq(workflowExecutions.id, id))
      .returning();
    
    return updatedExecution || undefined;
  }
}

// Simple in-memory fallback storage used when a real DB isn't available (local dev)
class InMemoryStorage implements IStorage {
  private users: User[] = [];
  private workflows: Workflow[] = [];
  private actions: WorkflowAction[] = [];
  private executions: WorkflowExecution[] = [];
  private idCounter = 1;

  // User methods
  async getUser(id: number) { return this.users.find(u => u.id === id); }
  async getUserByUsername(username: string) { return this.users.find(u => u.username === username); }
  async createUser(user: InsertUser) {
    const newUser = { ...user, id: this.idCounter++ } as unknown as User;
    this.users.push(newUser);
    return newUser;
  }

  // Workflow methods
  async getWorkflows() { return this.workflows; }
  async getWorkflow(id: number) { return this.workflows.find(w => w.id === id); }
  async createWorkflow(workflow: InsertWorkflow) {
    const newWorkflow = { ...(workflow as any), id: this.idCounter++ } as unknown as Workflow;
    this.workflows.push(newWorkflow);
    return newWorkflow;
  }
  async updateWorkflow(id: number, workflow: Partial<InsertWorkflow>) {
    const idx = this.workflows.findIndex(w => w.id === id);
    if (idx === -1) return undefined;
    this.workflows[idx] = { ...this.workflows[idx], ...workflow } as Workflow;
    return this.workflows[idx];
  }
  async deleteWorkflow(id: number) {
    const idx = this.workflows.findIndex(w => w.id === id);
    if (idx === -1) return false;
    this.workflows.splice(idx, 1);
    return true;
  }

  // Actions
  async getWorkflowActions(workflowId: number) { return this.actions.filter(a => a.workflowId === workflowId); }
  async createWorkflowAction(action: InsertWorkflowAction) {
    const newAction = { ...(action as any), id: this.idCounter++ } as unknown as WorkflowAction;
    this.actions.push(newAction);
    return newAction;
  }
  async updateWorkflowAction(id: number, action: Partial<InsertWorkflowAction>) {
    const idx = this.actions.findIndex(a => a.id === id);
    if (idx === -1) return undefined;
    this.actions[idx] = { ...this.actions[idx], ...action } as WorkflowAction;
    return this.actions[idx];
  }
  async deleteWorkflowAction(id: number) {
    const idx = this.actions.findIndex(a => a.id === id);
    if (idx === -1) return false;
    this.actions.splice(idx, 1);
    return true;
  }

  // Executions
  async getWorkflowExecutions(workflowId: number) { return this.executions.filter(e => e.workflowId === workflowId); }
  async getWorkflowExecution(id: number) { return this.executions.find(e => e.id === id); }
  async createWorkflowExecution(execution: InsertWorkflowExecution) {
    const newExec = { ...(execution as any), id: this.idCounter++, startedAt: new Date(), status: execution.status } as unknown as WorkflowExecution;
    this.executions.push(newExec);
    return newExec;
  }
  async updateWorkflowExecutionStatus(id: number, status: ExecutionStatus, result?: Record<string, any>, error?: string) {
    const idx = this.executions.findIndex(e => e.id === id);
    if (idx === -1) return undefined;
    this.executions[idx] = { ...this.executions[idx], status, result: result || this.executions[idx].result, error: error || this.executions[idx].error, completedAt: (status === 'completed' || status === 'failed') ? new Date() : undefined } as WorkflowExecution;
    return this.executions[idx];
  }
}

export const storage = usingNeon && db ? new DatabaseStorage() : new InMemoryStorage();
