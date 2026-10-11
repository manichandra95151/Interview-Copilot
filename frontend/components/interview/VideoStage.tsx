"use client";

import { useEffect, useRef } from "react";
import "@livekit/components-styles";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  GridLayout,
  ParticipantTile,
  useTracks,
  useLocalParticipant,
} from "@livekit/components-react";
import { Track } from "livekit-client";

/**
 * In-app video call (LiveKit). Renders participant tiles + call controls and
 * hands the local microphone track up to the parent so the same capture also
 * feeds transcription.
 */
export function VideoStage({
  url,
  token,
  onLocalMicTrack,
  onLeave,
  compact,
}: {
  url: string;
  token: string;
  onLocalMicTrack?: (track: MediaStreamTrack) => void;
  onLeave?: () => void;
  compact?: boolean;
}) {
  return (
    <LiveKitRoom
      serverUrl={url}
      token={token}
      connect
      audio
      video
      onDisconnected={onLeave}
      data-lk-theme="default"
      style={{ height: "100%", width: "100%", borderRadius: 16, overflow: "hidden" }}
    >
      <Stage onLocalMicTrack={onLocalMicTrack} />
      <RoomAudioRenderer />
      <ControlBar
        variation={compact ? "minimal" : "verbose"}
        controls={{ microphone: true, camera: true, screenShare: !compact, chat: false, leave: true }}
      />
    </LiveKitRoom>
  );
}

function Stage({ onLocalMicTrack }: { onLocalMicTrack?: (track: MediaStreamTrack) => void }) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const { localParticipant } = useLocalParticipant();
  const sentRef = useRef(false);

  // Hand the local mic track to the parent once it's published.
  useEffect(() => {
    if (sentRef.current) return;
    const pub = localParticipant?.getTrackPublication(Track.Source.Microphone);
    const mst = pub?.audioTrack?.mediaStreamTrack;
    if (mst) {
      sentRef.current = true;
      onLocalMicTrack?.(mst);
    }
  });

  return (
    <GridLayout tracks={tracks} style={{ height: "calc(100% - 56px)" }}>
      <ParticipantTile />
    </GridLayout>
  );
}
