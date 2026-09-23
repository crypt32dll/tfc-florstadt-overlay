import type { DestinationView, MatchState } from "./types";

/**
 * View currently shown under the logo sting (outgoing or incoming destination).
 * Pure helper for OverlayShell routing.
 */
export function displayView(state: MatchState): DestinationView | null {
  if (state.activeView === "transition") {
    return state.transitionTo;
  }
  return state.activeView;
}

export function isShowingView(
  state: MatchState,
  view: DestinationView,
): boolean {
  return displayView(state) === view;
}
