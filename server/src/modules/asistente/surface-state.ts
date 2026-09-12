import { a2uiMessageSchema } from "../../ui-protocol/a2ui";
export const inlineEvents = ["simulate_savings", "change_period", "select_category", "list_goals"];
export function readSurface(snapshot: unknown) {
  const messages = (Array.isArray(snapshot) ? snapshot : []).map((m) => a2uiMessageSchema.parse(m));
  return {
    components: messages
      .flatMap((m) => ("updateComponents" in m ? m.updateComponents.components : []))
      .filter((c) => c.component !== "Column" && c.component !== "Text"),
    data: messages.find((m) => "updateDataModel" in m)?.updateDataModel?.value ?? {},
  };
}
