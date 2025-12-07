import React, { Suspense } from "react";
import IndividualMeetingRoom from "src/components/ui/call/ClientMeetingRoom"

export default function CallPage() {
  return (
    <Suspense fallback={<div>Loading meeting...</div>}>
      <IndividualMeetingRoom />
    </Suspense>
  );
}
