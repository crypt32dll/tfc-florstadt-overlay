"use client";

import { useEffect, useState } from "react";
import { LabClient } from "@/components/lab/LabClient";
import type { MatchState } from "@/lib/match/types";

type Props = {
  roomId: string;
  initialState: MatchState;
};

export function LabPageClient(props: Props) {
  const [pinHint, setPinHint] = useState<string | null>(null);

  useEffect(() => {
    setPinHint(sessionStorage.getItem(`tfc-pin-${props.roomId}`));
  }, [props.roomId]);

  return <LabClient {...props} pinHint={pinHint} />;
}
