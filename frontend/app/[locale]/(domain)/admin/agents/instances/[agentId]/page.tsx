import AgentSettingsEditor from '../../_islands/agent_settings_editor';

/**
 * Agent settings: provider/model wiring plus a test run. Previously a stub that
 * pointed at Agent Studio, so an agent's model could not be configured at all.
 */
export default async function AgentEditPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  return <AgentSettingsEditor agentId={agentId} />;
}
