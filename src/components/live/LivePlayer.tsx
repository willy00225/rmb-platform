"use client";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { useSession } from "next-auth/react";

export function LivePlayer({ roomId }: { roomId: string }) {
  const { data: session } = useSession();
  const displayName = session?.user?.name || "Invité";
  const email = session?.user?.email || "";

  return (
    <JitsiMeeting
      roomName={roomId}
      domain="meet.jit.si"
      configOverwrite={{
        startWithAudioMuted: true,
        startWithVideoMuted: false,
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        hideConferenceSubject: false,
        hideConferenceTimer: false,
        brandingRoomAlias: null,
        toolbarButtons: [
          "microphone",
          "camera",
          "chat",
          "raisehand",
          "fullscreen",
          "desktop",
          "tileview",
          "settings",
        ],
      }}
      interfaceConfigOverwrite={{
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        TOOLBAR_ALWAYS_VISIBLE: true,
        INITIAL_TOOLBAR_TIMEOUT: 5000,
        DEFAULT_BACKGROUND: "#1F2A22",
        DEFAULT_REMOTE_DISPLAY_NAME: "Participant",
        FILM_STRIP_MAX_HEIGHT: 100,
        HIDE_INVITE_MORE_HEADER: true,
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
        APP_NAME: "RMB Connect",
        NATIVE_APP_NAME: "RMB Connect",
        PROVIDER_NAME: "RMB Connect",
        LANG_DETECTION: true,
      }}
      userInfo={{
        displayName: displayName,
        email: email,
      }}
      getIFrameRef={(iframeRef) => {
        iframeRef.style.height = "100%";
        iframeRef.style.width = "100%";
      }}
      onReadyToClose={() => {
        // Optionnel : rediriger ou nettoyer
      }}
    />
  );
}