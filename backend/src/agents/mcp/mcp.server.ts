import { Injectable, Logger } from '@nestjs/common';
import { AgentsService } from '../agents.service';
import { AgentTool } from '../entities/agent-tool.entity';

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPToolCallResult {
  content: { type: string; text: string }[];
  isError?: boolean;
}

@Injectable()
export class MCPServerService {
  private readonly logger = new Logger(MCPServerService.name);

  constructor(private readonly agentsService: AgentsService) {}

  async listTools(): Promise<{ tools: MCPToolDefinition[] }> {
    const tools = await this.agentsService.findAllTools();
    const enabled = tools.filter((t) => t.isEnabled);

    return {
      tools: enabled.map((t) => ({
        name: t.name,
        description: t.description || `Call ${t.displayName}`,
        inputSchema: {
          type: 'object',
          properties: (t.inputSchema as any)?.properties || {},
          required: (t.inputSchema as any)?.required || [],
        },
      })),
    };
  }

  async callTool(toolName: string, args: Record<string, unknown>): Promise<MCPToolCallResult> {
    try {
      const tools = await this.agentsService.findAllTools();
      const tool = tools.find((t) => t.name === toolName && t.isEnabled);

      if (!tool) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `Tool ${toolName} not found or disabled` }) }],
          isError: true,
        };
      }

      const result = await this.executeTool(tool, args);
      this.logger.log(`MCP tool ${toolName} executed successfully`);

      return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
      };
    } catch (err: any) {
      this.logger.error(`MCP tool ${toolName} failed: ${err.message}`);
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }],
        isError: true,
      };
    }
  }

  private async executeTool(tool: AgentTool, args: Record<string, unknown>) {
    const baseUrl = process.env.API_URL || 'http://localhost:3001/api';
    const url = tool.endpoint.startsWith('http') ? tool.endpoint : `${baseUrl}${tool.endpoint}`;
    const method = tool.httpMethod.toLowerCase();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(tool.headers || {}),
    };

    const fetchInit: RequestInit = {
      method: method.toUpperCase(),
      headers,
      signal: AbortSignal.timeout(tool.timeoutMs || 15000),
    };

    if (method !== 'get' && method !== 'head') {
      fetchInit.body = JSON.stringify(args);
    }

    const queryUrl = method === 'get' && Object.keys(args).length > 0
      ? `${url}?${new URLSearchParams(args as Record<string, string>).toString()}`
      : url;

    const resp = await fetch(queryUrl, fetchInit);
    const data = await resp.json().catch(() => ({ status: resp.status }));

    return { status: resp.status, ...data };
  }
}
