import fs from 'fs/promises';
import path from 'path';

const LOG_DIR = path.resolve('logs', 'gemini');

export interface LlmMetricsSummary {
  totalTokens: number;
  promptTokens: number;
  candidateTokens: number;
  totalCostUsd: number;
  count: number;
  breakdown: Record<string, { count: number; cost: number; tokens: number }>;
  dailyCost: { date: string; cost: number }[];
}

export async function getLlmMetrics(days = 30): Promise<LlmMetricsSummary> {
  const summary: LlmMetricsSummary = {
    totalTokens: 0,
    promptTokens: 0,
    candidateTokens: 0,
    totalCostUsd: 0,
    count: 0,
    breakdown: {},
    dailyCost: [],
  };

  try {
    const files = await fs.readdir(LOG_DIR);
    const now = new Date();
    const limitDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const limitPrefix = limitDate.toISOString().split('T')[0];

    // Filter files matching timestamp from last 30 days
    const relevantFiles = files.filter(file => {
      if (!file.endsWith('.json')) return false;
      // Filename starts with ISO timestamp like '2026-07-11T...'
      const prefix = file.slice(0, 10);
      return prefix >= limitPrefix;
    });

    const dailyMap: Record<string, number> = {};

    for (const file of relevantFiles) {
      try {
        const filePath = path.join(LOG_DIR, file);
        const contentStr = await fs.readFile(filePath, 'utf-8');
        const entry = JSON.parse(contentStr);

        const type = entry.requestType || 'unknown';
        const tokens = entry.tokenUsage?.totalTokens || 0;
        const pTokens = entry.tokenUsage?.promptTokens || 0;
        const cTokens = entry.tokenUsage?.candidateTokens || 0;
        const cost = entry.costEstimate?.totalCostUsd || 0;

        summary.count++;
        summary.totalTokens += tokens;
        summary.promptTokens += pTokens;
        summary.candidateTokens += cTokens;
        summary.totalCostUsd += cost;

        summary.breakdown[type] ??= { count: 0, cost: 0, tokens: 0 };
        summary.breakdown[type].count++;
        summary.breakdown[type].cost += cost;
        summary.breakdown[type].tokens += tokens;

        if (entry.timestamp) {
          const dateStr = entry.timestamp.split('T')[0];
          dailyMap[dateStr] = (dailyMap[dateStr] || 0) + cost;
        }
      } catch (err) {
        // Skip malformed log files
      }
    }

    // Format breakdown costs
    for (const key of Object.keys(summary.breakdown)) {
      summary.breakdown[key].cost = parseFloat(summary.breakdown[key].cost.toFixed(6));
    }

    // Generate last 30 days daily costs array
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      summary.dailyCost.push({
        date: dateStr,
        cost: parseFloat((dailyMap[dateStr] || 0).toFixed(6)),
      });
    }

    summary.totalCostUsd = parseFloat(summary.totalCostUsd.toFixed(6));
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      console.error('[AdminMetrics] Error reading LLM logs:', err.message);
    }
  }

  return summary;
}
