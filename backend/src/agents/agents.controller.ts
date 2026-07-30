import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { AgentOrchestratorService } from './agent-orchestrator.service';
import { AgentGapAnalyzerService } from './agent-gap-analyzer.service';
import { MCPServerService } from './mcp/mcp.server';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { AdminRole } from '../admin/entities/admin.entity';
import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';
import { CreateToolDto, CreateWorkflowDto, UpdateWorkflowDto } from './dto/tool-workflow.dto';

@ApiTags('Admin - Agents')
@Controller('admin/agents')
@UseGuards(JwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AgentsController {
  constructor(
    private readonly service: AgentsService,
    private readonly orchestrator: AgentOrchestratorService,
    private readonly gapAnalyzer: AgentGapAnalyzerService,
    private readonly mcpServer: MCPServerService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Agent dashboard stats' })
  async dashboard() { return { success: true, data: await this.service.getDashboardStats() }; }

  @Get('instances')
  @ApiOperation({ summary: 'List all agent instances' })
  async findAllAgents() { return { success: true, data: await this.service.findAllAgents() }; }

  @Get('instances/:id')
  @ApiOperation({ summary: 'Get agent instance' })
  async findAgentById(@Param('id') id: string) { return { success: true, data: await this.service.findAgentById(id) }; }

  @Post('instances')
  @ApiOperation({ summary: 'Create agent instance' })
  async createAgent(@Body() dto: CreateAgentDto) { return { success: true, message: 'Agent created', data: await this.service.createAgent(dto) }; }

  @Patch('instances/:id')
  @ApiOperation({ summary: 'Update agent instance' })
  async updateAgent(@Param('id') id: string, @Body() dto: UpdateAgentDto) { return { success: true, message: 'Agent updated', data: await this.service.updateAgent(id, dto) }; }

  @Delete('instances/:id')
  @ApiOperation({ summary: 'Remove agent instance' })
  async removeAgent(@Param('id') id: string) { await this.service.removeAgent(id); return { success: true, message: 'Agent removed' }; }

  @Post('instances/:id/toggle')
  @ApiOperation({ summary: 'Toggle agent enabled/disabled' })
  async toggleAgent(@Param('id') id: string) { return { success: true, data: await this.service.toggleAgent(id) }; }

  @Post('instances/:id/execute')
  @ApiOperation({ summary: 'Execute agent manually' })
  async executeAgent(@Param('id') id: string, @Body() body: { input: Record<string, unknown>; context?: Record<string, unknown> }) {
    return { success: true, data: await this.orchestrator.executeAgent(id, body.input, body.context) };
  }

  @Post('trigger')
  @ApiOperation({ summary: 'Trigger event for agent activation' })
  async triggerEvent(@Body() body: { eventType: string; payload: Record<string, unknown> }) {
    await this.orchestrator.triggerEvent(body.eventType, body.payload);
    return { success: true, message: `Event ${body.eventType} triggered` };
  }

  @Post('discover')
  @ApiOperation({ summary: 'Discover agent capabilities and gaps' })
  async discoverCapabilities() { return { success: true, data: await this.orchestrator.discoverCapabilities() }; }

  @Get('tools')
  @ApiOperation({ summary: 'List all tools' })
  async findAllTools() { return { success: true, data: await this.service.findAllTools() }; }

  @Get('tools/:id')
  @ApiOperation({ summary: 'Get tool' })
  async findToolById(@Param('id') id: string) { return { success: true, data: await this.service.findToolById(id) }; }

  @Post('tools')
  @ApiOperation({ summary: 'Create tool' })
  async createTool(@Body() dto: CreateToolDto) { return { success: true, message: 'Tool created', data: await this.service.createTool(dto) }; }

  @Patch('tools/:id')
  @ApiOperation({ summary: 'Update tool' })
  async updateTool(@Param('id') id: string, @Body() dto: Partial<CreateToolDto>) { return { success: true, data: await this.service.updateTool(id, dto) }; }

  @Delete('tools/:id')
  @ApiOperation({ summary: 'Remove tool' })
  async removeTool(@Param('id') id: string) { await this.service.removeTool(id); return { success: true, message: 'Tool removed' }; }

  @Get('workflows')
  @ApiOperation({ summary: 'List all workflows' })
  async findAllWorkflows() { return { success: true, data: await this.service.findAllWorkflows() }; }

  @Get('workflows/:id')
  @ApiOperation({ summary: 'Get workflow' })
  async findWorkflowById(@Param('id') id: string) { return { success: true, data: await this.service.findWorkflowById(id) }; }

  @Post('workflows')
  @ApiOperation({ summary: 'Create workflow' })
  async createWorkflow(@Body() dto: CreateWorkflowDto) { return { success: true, message: 'Workflow created', data: await this.service.createWorkflow(dto) }; }

  @Patch('workflows/:id')
  @ApiOperation({ summary: 'Update workflow' })
  async updateWorkflow(@Param('id') id: string, @Body() dto: UpdateWorkflowDto) { return { success: true, data: await this.service.updateWorkflow(id, dto) }; }

  @Delete('workflows/:id')
  @ApiOperation({ summary: 'Remove workflow' })
  async removeWorkflow(@Param('id') id: string) { await this.service.removeWorkflow(id); return { success: true, message: 'Workflow removed' }; }

  @Post('workflows/:id/execute')
  @ApiOperation({ summary: 'Execute workflow manually' })
  async executeWorkflow(@Param('id') id: string) { return { success: true, data: await this.service.executeWorkflow(id) }; }

  @Get('metrics')
  @ApiOperation({ summary: 'Get agent metrics' })
  async findMetrics(@Param('agentId') agentId?: string) { return { success: true, data: await this.service.findMetrics(agentId) }; }

  @Post('analyze')
  @ApiOperation({ summary: 'Run gap analysis and optimization scan' })
  async runAnalysis() { return { success: true, data: await this.gapAnalyzer.runFullAnalysis() }; }

  @Get('mcp/tools')
  @ApiOperation({ summary: 'MCP: List available tools' })
  async mcpListTools() { return await this.mcpServer.listTools(); }

  @Post('mcp/call')
  @ApiOperation({ summary: 'MCP: Call a tool' })
  async mcpCallTool(@Body() body: { name: string; arguments: Record<string, unknown> }) {
    return await this.mcpServer.callTool(body.name, body.arguments);
  }
}
