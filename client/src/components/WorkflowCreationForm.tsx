import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ActionType } from "@shared/schema";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";

// Define the form schema
const workflowFormSchema = z.object({
  name: z.string().min(1, "Workflow name is required"),
  description: z.string().optional(),
  actions: z.array(
    z.object({
      name: z.string().min(1, "Action name is required"),
      type: z.enum(["httpRequest", "smartContractCall", "emailSend", "defiSwap", "tokenTransfer"], {
        required_error: "Please select an action type",
      }),
      config: z.record(z.any()).optional(),
      order: z.number(),
    })
  ).min(1, "At least one action is required"),
});

type WorkflowFormValues = z.infer<typeof workflowFormSchema>;

const defaultValues: WorkflowFormValues = {
  name: "",
  description: "",
  actions: [
    {
      name: "",
      type: "httpRequest",
      config: {},
      order: 0,
    },
  ],
};

export default function WorkflowCreationForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  const form = useForm<WorkflowFormValues>({
    resolver: zodResolver(workflowFormSchema),
    defaultValues,
  });

  const onSubmit = async (data: WorkflowFormValues) => {
    setIsSubmitting(true);
    try {
      // Prepare the workflow data for API
      const workflowData = {
        name: data.name,
        description: data.description || "",
        // Add empty placeholders for nodes and edges (required by the schema)
        nodes: [],
        edges: [],
      };

      // Create the workflow
      const response = await apiRequest("POST", "/api/workflows", workflowData);
      const workflow = await response.json();

      // Add each action to the workflow
      for (const action of data.actions) {
        await apiRequest("POST", `/api/workflows/${workflow.id}/actions`, action);
      }

      toast({
        title: "Success",
        description: "Workflow created successfully!",
      });

      // Reset the form
      form.reset(defaultValues);
    } catch (error) {
      console.error("Error creating workflow:", error);
      toast({
        title: "Error",
        description: "Failed to create workflow. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addAction = () => {
    const actions = form.getValues("actions") || [];
    form.setValue("actions", [
      ...actions,
      {
        name: "",
        type: "httpRequest",
        config: {},
        order: actions.length,
      },
    ]);
  };

  const removeAction = (index: number) => {
    const actions = form.getValues("actions") || [];
    if (actions.length <= 1) {
      toast({
        title: "Error",
        description: "At least one action is required",
        variant: "destructive",
      });
      return;
    }
    
    const updatedActions = actions.filter((_, i) => i !== index).map((action, i) => ({
      ...action,
      order: i,
    }));
    
    form.setValue("actions", updatedActions);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create New Workflow</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workflow Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Workflow" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Describe the purpose of this workflow" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Actions</h3>
                <Button type="button" variant="outline" size="sm" onClick={addAction}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Action
                </Button>
              </div>
              
              {form.watch("actions").map((action, index) => (
                <div key={index} className="p-4 border rounded-md space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Action {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAction(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name={`actions.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Fetch Data" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name={`actions.${index}.type`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select action type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="httpRequest">HTTP Request</SelectItem>
                            <SelectItem value="smartContractCall">Smart Contract Call</SelectItem>
                            <SelectItem value="emailSend">Send Email</SelectItem>
                            <SelectItem value="defiSwap">DeFi Token Swap</SelectItem>
                            <SelectItem value="tokenTransfer">Token Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Add action-specific configuration fields based on the selected action type */}
                  {form.watch(`actions.${index}.type`) === "httpRequest" && (
                    <>
                      <FormField
                        control={form.control}
                        name={`actions.${index}.config.url`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://api.example.com/data" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`actions.${index}.config.method`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Method</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value || "GET"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="GET">GET</SelectItem>
                                <SelectItem value="POST">POST</SelectItem>
                                <SelectItem value="PUT">PUT</SelectItem>
                                <SelectItem value="DELETE">DELETE</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  
                  {form.watch(`actions.${index}.type`) === "smartContractCall" && (
                    <>
                      <FormField
                        control={form.control}
                        name={`actions.${index}.config.contractAddress`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contract Address</FormLabel>
                            <FormControl>
                              <Input placeholder="0x..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`actions.${index}.config.functionName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Function Name</FormLabel>
                            <FormControl>
                              <Input placeholder="transfer" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  
                  {form.watch(`actions.${index}.type`) === "emailSend" && (
                    <>
                      <FormField
                        control={form.control}
                        name={`actions.${index}.config.recipient`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recipient</FormLabel>
                            <FormControl>
                              <Input placeholder="user@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`actions.${index}.config.subject`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <FormControl>
                              <Input placeholder="Notification" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  
                  {form.watch(`actions.${index}.type`) === "defiSwap" && (
                    <>
                      <FormField
                        control={form.control}
                        name={`actions.${index}.config.sourceToken`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Source Token</FormLabel>
                            <FormControl>
                              <Input placeholder="BTC" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`actions.${index}.config.targetToken`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Token</FormLabel>
                            <FormControl>
                              <Input placeholder="ETH" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`actions.${index}.config.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input placeholder="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  
                  {form.watch(`actions.${index}.type`) === "tokenTransfer" && (
                    <>
                      <FormField
                        control={form.control}
                        name={`actions.${index}.config.token`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Token</FormLabel>
                            <FormControl>
                              <Input placeholder="BTC" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`actions.${index}.config.recipient`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recipient Address</FormLabel>
                            <FormControl>
                              <Input placeholder="0x..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`actions.${index}.config.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input placeholder="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating Workflow..." : "Create Workflow"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}