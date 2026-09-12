/** Compact, persisted domain state. Never replay arbitrary tool outputs or UI text as instructions. */
export function interactionContext(
  turns: { input: unknown; uiSnapshot: unknown; status: string }[],
) {
  return turns.flatMap((turn) => {
    if (turn.status !== "completed") return [];
    const input = turn.input as Record<string, unknown> | null;
    const messages = Array.isArray(turn.uiSnapshot) ? turn.uiSnapshot : [];
    const data = messages.find((m) => m && typeof m === "object" && "updateDataModel" in m)
      ?.updateDataModel?.value;
    const state: Record<string, unknown> = {};
    if (input?.kind === "action")
      state.event = { name: input.event, values: input.values, actionId: input.actionId };
    if (data?.savings?.result) {
      const { assumptions, finalCents, totalContributedCents, estimatedInterestCents } =
        data.savings.result;
      state.savings = { assumptions, finalCents, totalContributedCents, estimatedInterestCents };
    }
    if (data?.period) state.period = data.period;
    if (data?.comparison) state.comparison = data.comparison;
    if (data?.form?.draft) state.movementDraft = data.form.draft;
    if (data?.goalResult) state.savedGoal = data.goalResult;
    if (data?.goals?.draft) state.goalDraft = data.goals.draft;
    if (data?.result) state.savedMovement = data.result;
    return Object.keys(state).length ? [state] : [];
  });
}

export function toolCacheKey(name: string, args: Record<string, unknown>) {
  return (
    name +
    ":" +
    JSON.stringify(Object.fromEntries(Object.entries(args).sort(([a], [b]) => a.localeCompare(b))))
  );
}
