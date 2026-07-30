import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentInstance, AgentCategory, AgentStatus } from './entities/agent-instance.entity';
import { AgentTool } from './entities/agent-tool.entity';
import { AgentWorkflow, WorkflowStatus } from './entities/agent-workflow.entity';

export interface GapReport {
  timestamp: Date;
  gaps: Gap[];
  recommendations: Recommendation[];
  coverage: CoverageReport;
  totalGaps: number;
  estimatedEffort: string;
}

export interface Gap {
  severity: 'critical' | 'high' | 'medium' | 'low';
  area: string;
  description: string;
  suggestedAction: string;
}

export interface Recommendation {
  agentId?: string;
  agentName?: string;
  type: 'new_agent' | 'add_tool' | 'create_workflow' | 'optimize';
  description: string;
  implementation: string;
}

export interface CoverageReport {
  categories: Record<string, { agents: number; tools: number; workflows: number; coverage: string }>;
  orphanTools: number;
  inactiveAgents: number;
  brokenWorkflows: number;
}

@Injectable()
export class AgentGapAnalyzerService {
  private readonly logger = new Logger(AgentGapAnalyzerService.name);

  private readonly CATEGORY_TEMPLATES: Record<string, { suggestedAgents: string[]; suggestedTools: string[] }> = {
    marketing: {
      suggestedAgents: ['Marketing Campaign Agent', 'Social Media Agent', 'Content Generator Agent', 'SEO Optimizer Agent'],
      suggestedTools: ['send_email', 'generate_social_post', 'analyze_campaign_metrics', 'schedule_content'],
    },
    security: {
      suggestedAgents: ['Fraud Detector Agent', 'Content Moderator Agent', 'Access Auditor Agent'],
      suggestedTools: ['flag_user', 'suspend_account', 'scan_listing_content', 'audit_access_logs'],
    },
    sales: {
      suggestedAgents: ['Sales Assistant Agent', 'Listing Optimizer Agent', 'Pricing Advisor Agent'],
      suggestedTools: ['create_promotion', 'update_pricing', 'generate_listing_description', 'send_offer'],
    },
    support: {
      suggestedAgents: ['Customer Support Agent', 'FAQ Bot Agent', 'Ticket Resolution Agent'],
      suggestedTools: ['search_faq', 'create_ticket', 'send_support_response', 'escalate_issue'],
    },
    crm: {
      suggestedAgents: ['Lead Manager Agent', 'Buyer Engagement Agent', 'Seller Retention Agent'],
      suggestedTools: ['create_contact', 'send_follow_up', 'update_contact_status', 'log_interaction'],
    },
    operations: {
      suggestedAgents: ['Inventory Manager Agent', 'Payment Reconciliation Agent', 'Report Generator Agent'],
      suggestedTools: ['sync_inventory', 'reconcile_payments', 'generate_report', 'schedule_task'],
    },
  };

  constructor(
    @InjectRepository(AgentInstance) private readonly agentRepo: Repository<AgentInstance>,
    @InjectRepository(AgentTool) private readonly toolRepo: Repository<AgentTool>,
    @InjectRepository(AgentWorkflow) private readonly workflowRepo: Repository<AgentWorkflow>,
  ) {}

  async runFullAnalysis(): Promise<GapReport> {
    const [agents, tools, workflows] = await Promise.all([
      this.agentRepo.find(),
      this.toolRepo.find(),
      this.workflowRepo.find(),
    ]);

    const gaps: Gap[] = [];
    const recommendations: Recommendation[] = [];

    const categoryValues = Object.values(AgentCategory) as string[];
    const coverage: Record<string, { agents: number; tools: number; workflows: number; coverage: string }> = {};

    for (const cat of categoryValues) {
      const catAgents = agents.filter((a) => a.category === cat);
      const catTools = tools.filter((t) => t.category === cat);
      const catWorkflows = workflows.filter((w) => w.steps?.some((s) => catAgents.some((a) => a.id === s.agentId)));

      coverage[cat] = {
        agents: catAgents.length,
        tools: catTools.length,
        workflows: catWorkflows.length,
        coverage: catAgents.length > 0 ? 'partial' : 'none',
      };

      if (catAgents.length === 0) {
        gaps.push({
          severity: 'high',
          area: cat,
          description: `No agents configured for ${cat} category`,
          suggestedAction: `Create at least one agent for ${cat} operations`,
        });
        const template = this.CATEGORY_TEMPLATES[cat];
        if (template) {
          recommendations.push({
            type: 'new_agent',
            description: `Add ${cat} agents: ${template.suggestedAgents.join(', ')}`,
            implementation: 'Use the agent creation wizard to add recommended agents',
          });
        }
      }

      if (catAgents.length > 0 && catTools.length === 0 && cat !== 'custom') {
        gaps.push({
          severity: 'medium',
          area: cat,
          description: `Agents exist in ${cat} but no tools are available`,
          suggestedAction: 'Create tools for agent actions',
        });
      }
    }

    for (const agent of agents) {
      if (!agent.isEnabled && agent.status !== AgentStatus.INACTIVE) {
        gaps.push({
          severity: 'low',
          area: agent.name,
          description: `Agent ${agent.name} is disabled but not marked inactive`,
          suggestedAction: 'Toggle agent status to inactive or enable it',
        });
      }

      if (agent.isEnabled && (!agent.toolIds || agent.toolIds.length === 0) && agent.category !== 'custom') {
        gaps.push({
          severity: 'medium',
          area: agent.name,
          description: `Active agent ${agent.name} has no tools assigned`,
          suggestedAction: 'Assign relevant tools to this agent',
        });
      }

      if (agent.status === AgentStatus.ERROR) {
        gaps.push({
          severity: 'critical',
          area: agent.name,
          description: `Agent ${agent.name} is in ERROR state`,
          suggestedAction: 'Check agent logs and configuration, then restart',
        });
      }
    }

    for (const tool of tools) {
      const usedBy = agents.filter((a) => a.toolIds?.includes(tool.id));
      if (usedBy.length === 0 && tool.isEnabled) {
        gaps.push({
          severity: 'low',
          area: 'tools',
          description: `Tool ${tool.name} is enabled but not assigned to any agent`,
          suggestedAction: 'Assign to a relevant agent or disable it',
        });
      }
    }

    for (const wf of workflows) {
      if (wf.isEnabled && wf.steps?.length === 0) {
        gaps.push({
          severity: 'high',
          area: wf.name,
          description: `Workflow ${wf.name} is enabled but has no steps`,
          suggestedAction: 'Add workflow steps or disable it',
        });
      }
    }

    const brokenWorkflows = workflows.filter((w) => w.status === WorkflowStatus.FAILED).length;
    if (brokenWorkflows > 0) {
      gaps.push({
        severity: 'high',
        area: 'workflows',
        description: `${brokenWorkflows} workflow(s) in FAILED state`,
        suggestedAction: 'Review workflow logs and fix failures',
      });
    }

    const totalGaps = gaps.length;
    const estimatedEffort = totalGaps <= 5 ? '~1-2 hours' : totalGaps <= 15 ? '~4-8 hours' : '~1-2 days';

    return {
      timestamp: new Date(),
      gaps,
      recommendations,
      coverage: {
        categories: coverage,
        orphanTools: tools.filter((t) => !agents.some((a) => a.toolIds?.includes(t.id))).length,
        inactiveAgents: agents.filter((a) => !a.isEnabled).length,
        brokenWorkflows,
      } as CoverageReport,
      totalGaps,
      estimatedEffort,
    };
  }
}
