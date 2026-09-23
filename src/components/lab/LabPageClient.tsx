"use client";

import { useSyncExternalStore } from "react";
import { LabClient } from "@/components/lab/LabClient";
import type { MatchState } from "@/lib/match/types";

type Props = {
  roomId: string;
  initialState: MatchState;
};

export function LabPageClient(props: Props) {
  const pinHint = useSyncExternalStore(
    () => () => {},
    () => sessionStorage.getItem(`tfc-pin-${props.roomId}`),
    () => null,
  );

  return <LabClient {...props} pinHint={pinHint} />;
}
