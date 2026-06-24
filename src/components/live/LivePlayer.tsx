"use client";
export function LivePlayer({ roomId }: { roomId: string }) {
  const jitsiUrl = `https://meet.jit.si/${roomId}#config.prejoinPageEnabled=false&config.startWithVideoMuted=false&userInfo.displayName=invité`;

  return (
    <iframe
      src={jitsiUrl}
      className="w-full h-full"
      allow="camera; microphone; fullscreen; display-capture"
      style={{ border: "none" }}
    />
  );
}
