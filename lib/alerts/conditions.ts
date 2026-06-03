interface RuleContext {
  triggerType:      'threshold_high' | 'threshold_low' | 'unused';
  thresholdPercent: number | null;
  creditsUsed:      number | null;
  creditLimit:      number | null;
  unusedDays:       number | null;
  lastSnapshotAt:   Date | null;
}

export function evaluateRule(ctx: RuleContext): boolean {
  if (ctx.triggerType === 'threshold_high') {
    if (ctx.creditsUsed === null || !ctx.creditLimit || !ctx.thresholdPercent) return false;
    return (ctx.creditsUsed / ctx.creditLimit) * 100 >= ctx.thresholdPercent;
  }

  if (ctx.triggerType === 'threshold_low') {
    if (ctx.creditsUsed === null || !ctx.creditLimit || ctx.thresholdPercent === null) return false;
    return (ctx.creditsUsed / ctx.creditLimit) * 100 < ctx.thresholdPercent;
  }

  if (ctx.triggerType === 'unused') {
    if (!ctx.unusedDays || !ctx.lastSnapshotAt) return true; // never synced → treat as unused
    const daysSince = (Date.now() - ctx.lastSnapshotAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= ctx.unusedDays;
  }

  return false;
}
