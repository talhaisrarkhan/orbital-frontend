import React, { memo, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Typography,
  Grid,
  Paper,
  useTheme,
  styled,
} from "@mui/material";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users,
  ScreenShare,
} from "lucide-react";

// Types
export interface Participant {
  name: string;
  stream?: MediaStream | null;
  screenStream?: MediaStream | null;
  videoOn?: boolean;
  micOn?: boolean;
  isCurrentlySharing?: boolean;
}

interface VideoCallScreenProps {
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  localUserName: string;
  socket: any;
  roomID: string;
  onToggleScreenShare: () => void;
  isSharingScreen: boolean;
  isAudioOnly: boolean;
}

// Styled Components
const VideoContainer = styled(Paper)(({ theme }) => ({
  position: "relative",
  width: "100%",
  height: "100%",
  overflow: "hidden",
  backgroundColor: theme.palette.grey[900],
  borderRadius: theme.shape.borderRadius,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledVideo = styled("video")({
  width: "100%",
  height: "100%",
  objectFit: "cover",
  "&.mirror": {
    transform: "scaleX(-1)",
  },
  "&.contain": {
    objectFit: "contain",
  },
});

const ParticipantName = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: theme.spacing(1),
  left: theme.spacing(1),
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  padding: theme.spacing(0.5, 1.5),
  borderRadius: theme.shape.borderRadius,
  color: theme.palette.common.white,
  fontSize: "0.875rem",
  zIndex: 10,
}));

const MicStatus = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: theme.spacing(1),
  right: theme.spacing(1),
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  padding: theme.spacing(0.5),
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10,
}));

const ControlBar = styled(Box)(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(2),
  backgroundColor: "rgba(18, 18, 18, 0.8)",
  backdropFilter: "blur(10px)",
  borderTop: `1px solid ${theme.palette.divider}`,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  position: "fixed",
  bottom: 0,
  left: 0,
  zIndex: 100,
}));

const ParticipantVideo = memo(
  ({
    participant,
    localUserName,
    isScreenShareView = false,
  }: {
    participant: Participant;
    localUserName: string;
    isScreenShareView?: boolean;
  }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamToDisplay = isScreenShareView
      ? participant.screenStream
      : participant.stream;

    useEffect(() => {
      if (videoRef.current && streamToDisplay) {
        videoRef.current.srcObject = streamToDisplay;
      }
    }, [streamToDisplay]);

    const isLocalUser = participant.name === localUserName;

    return (
      <VideoContainer elevation={3}>
        <StyledVideo
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocalUser || isScreenShareView}
          className={
            isScreenShareView
              ? "contain"
              : isLocalUser
              ? "mirror"
              : ""
          }
          style={{
            display:
              streamToDisplay && (isScreenShareView || participant.videoOn)
                ? "block"
                : "none",
          }}
        />
        {(!streamToDisplay || (!isScreenShareView && !participant.videoOn)) && (
          <Users size={64} className="text-gray-400" />
        )}

        <ParticipantName>
          {participant.name} {isLocalUser && !isScreenShareView && "(You)"}
        </ParticipantName>

        {!isScreenShareView && (
          <MicStatus>
            {participant.micOn ? (
              <Mic size={16} color="white" />
            ) : (
              <MicOff size={16} color="red" />
            )}
          </MicStatus>
        )}
      </VideoContainer>
    );
  }
);

ParticipantVideo.displayName = "ParticipantVideo";

const VideoCallScreen = memo(
  ({
    participants,
    setParticipants,
    localUserName,
    socket,
    roomID,
    onToggleScreenShare,
    isSharingScreen,
    isAudioOnly,
  }: VideoCallScreenProps) => {
    const theme = useTheme();
    const localUser = participants.find((p) => p.name === localUserName);
    const [isVideoEnabled, setIsVideoEnabled] = useState(
      () => localUser?.videoOn ?? true
    );
    const [isAudioEnabled, setIsAudioEnabled] = useState(
      () => localUser?.micOn ?? true
    );

    useEffect(() => {
      const localUser = participants.find((p) => p.name === localUserName);
      if (localUser) {
        setIsVideoEnabled(localUser.videoOn ?? true);
        setIsAudioEnabled(localUser.micOn ?? true);
      }
    }, [participants, localUserName]);

    useEffect(() => {
      const handleMediaStateChanged = ({
        userName,
        enabled,
        mediaType,
      }: {
        userName: string;
        enabled: boolean;
        mediaType: "video" | "audio";
      }) => {
        setParticipants((prev) =>
          prev.map((p) =>
            p.name === userName
              ? { ...p, [mediaType === "video" ? "videoOn" : "micOn"]: enabled }
              : p
          )
        );
      };

      const handleScreenShareStatus = ({
        name,
        isSharing,
      }: {
        name: string;
        isSharing: boolean;
      }) => {
        const sharerName = isSharing ? name : null;
        setParticipants((prev) =>
          prev.map((p) => ({
            ...p,
            isCurrentlySharing: p.name === sharerName,
          }))
        );
      };

      socket?.on("mediaStateChanged", handleMediaStateChanged);
      socket?.on("screenShareStatus", handleScreenShareStatus);

      return () => {
        socket?.off("mediaStateChanged", handleMediaStateChanged);
        socket?.off("screenShareStatus", handleScreenShareStatus);
      };
    }, [socket, setParticipants]);

    const toggleMedia = (mediaType: "video" | "audio") => {
      const localParticipant = participants.find((p) => p.name === localUserName);
      if (!localParticipant?.stream) return;

      const isVideo = mediaType === "video";
      const tracks = isVideo
        ? localParticipant.stream.getVideoTracks()
        : localParticipant.stream.getAudioTracks();

      if (tracks.length > 0) {
        const track = tracks[0];
        track.enabled = !track.enabled;
        const isEnabled = track.enabled;
        if (isVideo) {
          setIsVideoEnabled(isEnabled);
        } else {
          setIsAudioEnabled(isEnabled);
        }
        setParticipants((prev) =>
          prev.map((p) =>
            p.name === localUserName
              ? { ...p, [isVideo ? "videoOn" : "micOn"]: isEnabled }
              : p
          )
        );
        socket?.emit("mediaStateChange", {
          roomID,
          userName: localUserName,
          enabled: isEnabled,
          mediaType,
        });
      }
    };

    const handleLeaveCall = () => {
      socket?.disconnect();
      window.location.href = "/dashboard/chat";
    };

    const screenSharer = participants.find(
      (p) => p.isCurrentlySharing && p.screenStream
    );
    const participantCount = participants.length;

    return (
      <Box
        sx={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
          color: "text.primary",
          overflow: "hidden",
        }}
      >
        <Box
          component="main"
          sx={{
            flex: 1,
            display: "flex",
            p: 2,
            gap: 2,
            overflow: "hidden",
            pb: 10, // Space for control bar
          }}
        >
          {screenSharer ? (
            <>
              <Box sx={{ flex: 1, height: "100%", position: "relative" }}>
                <ParticipantVideo
                  participant={screenSharer}
                  localUserName={localUserName}
                  isScreenShareView={true}
                />
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 16,
                    left: 16,
                    bgcolor: "primary.main",
                    color: "white",
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                    fontWeight: "bold",
                    fontSize: "0.875rem",
                  }}
                >
                  {screenSharer.name} is sharing their screen
                </Box>
              </Box>
              <Box
                sx={{
                  width: { xs: "100%", lg: 256 },
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  overflowY: "auto",
                }}
              >
                {participants.map((participant) => (
                  <Box
                    key={participant.name}
                    sx={{ position: "relative", width: "100%", aspectRatio: "16/9" }}
                  >
                    <ParticipantVideo
                      participant={participant}
                      localUserName={localUserName}
                    />
                  </Box>
                ))}
              </Box>
            </>
          ) : (
            <Grid container spacing={2} sx={{ height: "100%", alignContent: "center" }}>
              {participants.map((participant) => {
                let xs = 12;
                let md = 6;
                let lg = 4;

                if (participantCount === 1) {
                  xs = 12; md = 12; lg = 12;
                } else if (participantCount === 2) {
                  xs = 12; md = 6; lg = 6;
                } else if (participantCount <= 4) {
                  xs = 12; md = 6; lg = 6;
                }

                return (
                  <Grid
                    item
                    key={participant.name}
                    xs={xs}
                    md={md}
                    lg={lg}
                    sx={{ height: participantCount === 1 ? "100%" : "auto", minHeight: 300 }}
                  >
                    <ParticipantVideo
                      participant={participant}
                      localUserName={localUserName}
                    />
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>

        <ControlBar>
          <Box sx={{ width: "33%", display: "flex", justifyContent: "flex-start" }}>
            <Tooltip title="Leave call">
              <Button
                variant="contained"
                color="error"
                onClick={handleLeaveCall}
                startIcon={<PhoneOff size={20} />}
                sx={{ borderRadius: 28, px: 3 }}
              >
                Leave
              </Button>
            </Tooltip>
          </Box>

          <Box
            sx={{
              width: "33%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <Tooltip title={isAudioEnabled ? "Mute" : "Unmute"}>
              <IconButton
                onClick={() => toggleMedia("audio")}
                sx={{
                  bgcolor: isAudioEnabled ? "action.hover" : "error.main",
                  color: isAudioEnabled ? "inherit" : "white",
                  "&:hover": {
                    bgcolor: isAudioEnabled ? "action.selected" : "error.dark",
                  },
                  width: 48,
                  height: 48,
                }}
              >
                {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
              </IconButton>
            </Tooltip>

            {!isAudioOnly && (
              <Tooltip title={isVideoEnabled ? "Stop video" : "Start video"}>
                <IconButton
                  onClick={() => toggleMedia("video")}
                  sx={{
                    bgcolor: isVideoEnabled ? "action.hover" : "error.main",
                    color: isVideoEnabled ? "inherit" : "white",
                    "&:hover": {
                      bgcolor: isVideoEnabled ? "action.selected" : "error.dark",
                    },
                    width: 48,
                    height: 48,
                  }}
                >
                  {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                </IconButton>
              </Tooltip>
            )}

            {!isAudioOnly && (
              <Tooltip
                title={
                  isSharingScreen
                    ? "Stop sharing"
                    : screenSharer
                    ? `${screenSharer.name} is sharing`
                    : "Share screen"
                }
              >
                <span>
                  <IconButton
                    onClick={onToggleScreenShare}
                    disabled={!!screenSharer && !isSharingScreen}
                    sx={{
                      bgcolor: isSharingScreen ? "primary.main" : "action.hover",
                      color: isSharingScreen ? "white" : "inherit",
                      "&:hover": {
                        bgcolor: isSharingScreen ? "primary.dark" : "action.selected",
                      },
                      width: 48,
                      height: 48,
                    }}
                  >
                    <ScreenShare size={24} />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>

          <Box sx={{ width: "33%" }} />
        </ControlBar>
      </Box>
    );
  }
);

VideoCallScreen.displayName = "VideoCallScreen";

export default VideoCallScreen;
