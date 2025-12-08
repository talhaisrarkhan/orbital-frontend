"use client";

import React, { useState, useRef, memo, useEffect, useCallback } from "react";
import {
  Button,
  TextField,
  Alert,
  AlertTitle,
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Stack,
  useTheme,
  styled,
} from "@mui/material";
import { Camera, RefreshCw, Mic, Lock, Settings } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import VideoCallScreen, { Participant } from "./CallingUi";

const backendDomain = "https://orbital-backend-t61x.onrender.com/signaling";

const peerConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

// Styled Components
const VideoPreview = styled("video")(({ theme }) => ({
  width: "100%",
  height: "100%",
  objectFit: "cover",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.grey[900],
  transform: "scaleX(-1)", // Mirror effect
}));

const PreviewContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 350,
  position: "relative",
  overflow: "hidden",
}));

export default function IndividualMeetingRoom() {
  const searchParams = useSearchParams();
  // Main camera/mic stream
  const [stream, setStream] = useState<MediaStream | null>(null);
  // Separate stream for screen sharing
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const [permissionDenied, setPermissionDenied] = useState(false);
  const [userName, setUserName] = useState("");
  const [roomID, setRoomID] = useState("");
  const [isInCall, setIsInCall] = useState(false);
  const [loadingForJoiningCall, setLoadingForJoiningCall] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isAudioOnly, setIsAudioOnly] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Refs for camera/mic peer connections
  const peerConnectionsRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const pendingIceCandidates = useRef<{ [key: string]: RTCIceCandidateInit[] }>({});

  // NEW: Refs for screen share peer connections
  const screenPeerConnectionsRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const pendingScreenIceCandidates = useRef<{ [key: string]: RTCIceCandidateInit[] }>({});

  // Get roomID from URL and restore user name from localStorage
  useEffect(() => {
    const room = searchParams.get("roomId");
    if (room) setRoomID(room);
    // ADDED: Check for isAudioCall parameter
    const audioCallParam = searchParams.get("isAudioCall") === "true";
    setIsAudioOnly(audioCallParam);

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUserName(JSON.parse(storedUser)?.name || "");
      } catch (e) {
        console.error(e);
      }
    }
  }, [searchParams]);

  // Effect 1: Handles the socket connection lifecycle
  useEffect(() => {
    if (!roomID) return;
    const socket = io(backendDomain, { transports: ["websocket"] });
    socketRef.current = socket;
    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected."));
    return () => {
      socket.disconnect();
    };
  }, [roomID]);

  const createPeerConnection = useCallback(
    (remoteUserName: string, pcStream: MediaStream | null) => {
      if (peerConnectionsRef.current[remoteUserName]) {
        return peerConnectionsRef.current[remoteUserName];
      }
      const pc = new RTCPeerConnection(peerConfiguration);

      if (pcStream) {
        pcStream.getTracks().forEach((track) => pc.addTrack(track, pcStream));
      }

      pc.ontrack = (event) => {
        setParticipants((prev) => {
          const existingParticipant = prev.find((p) => p.name === remoteUserName);
          if (existingParticipant) {
            // If participant exists, update their stream
            return prev.map((p) =>
              p.name === remoteUserName ? { ...p, stream: event.streams[0] } : p
            );
          }
          // If new, add them to the list
          return [
            ...prev,
            {
              name: remoteUserName,
              stream: event.streams[0],
              micOn: true,
              videoOn: !isAudioOnly,
              screenStream: null,
            },
          ];
        });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit("sendIceCandidate", {
            roomID,
            senderName: userName,
            targetName: remoteUserName,
            candidate: event.candidate,
          });
        }
      };
      peerConnectionsRef.current[remoteUserName] = pc;
      return pc;
    },
    [roomID, userName, isAudioOnly]
  );

  const createAndSendOffer = useCallback(
    async (targetName: string) => {
      try {
        console.log(`Sending offer to: ${targetName}`);
        // `createPeerConnection` gets the main `stream` to add audio/video tracks
        const pc = createPeerConnection(targetName, stream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socketRef.current?.emit("sendOffer", {
          roomID,
          senderName: userName.trim(),
          targetName,
          offer: pc.localDescription,
        });
      } catch (error) {
        console.error(`Error creating offer for ${targetName}:`, error);
      }
    },
    [roomID, userName, stream, createPeerConnection]
  );

  const createScreenPeerConnection = useCallback(
    (remoteUserName: string, pcScreenStream: MediaStream | null) => {
      if (screenPeerConnectionsRef.current[remoteUserName]) {
        return screenPeerConnectionsRef.current[remoteUserName];
      }
      const pc = new RTCPeerConnection(peerConfiguration);

      // If we are initiating the connection, add the local screen tracks
      if (pcScreenStream) {
        pcScreenStream.getTracks().forEach((track) => pc.addTrack(track, pcScreenStream));
      }

      // This handles receiving the remote screen share stream
      pc.ontrack = (event) => {
        setParticipants((prev) =>
          prev.map((p) =>
            p.name === remoteUserName ? { ...p, screenStream: event.streams[0] } : p
          )
        );
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit("sendScreenIceCandidate", {
            roomID,
            senderName: userName,
            targetName: remoteUserName,
            candidate: event.candidate,
          });
        }
      };
      screenPeerConnectionsRef.current[remoteUserName] = pc;
      return pc;
    },
    [roomID, userName]
  );

  // Manages all socket event listeners
  useEffect(() => {
    if (!socketRef.current || !userName) return;
    const socket = socketRef.current;

    // Helper to process pending ICE candidates
    const processPendingCandidates = async (
      pcRef: React.MutableRefObject<{ [key: string]: RTCPeerConnection }>,
      pendingCandidatesRef: React.MutableRefObject<{ [key: string]: RTCIceCandidateInit[] }>,
      senderName: string
    ) => {
      const pc = pcRef.current[senderName];
      const candidates = pendingCandidatesRef.current[senderName];
      if (pc?.remoteDescription && candidates?.length) {
        for (const candidate of candidates) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("Error adding ICE candidate:", err);
          }
        }
        pendingCandidatesRef.current[senderName] = [];
      }
    };

    // Camera/Mic Handlers
    const handleReceiveOffer = async ({
      offer,
      senderName,
    }: {
      offer: RTCSessionDescriptionInit;
      senderName: string;
    }) => {
      if (!stream) return; // Don't process if local media isn't ready
      const pc = createPeerConnection(senderName, stream);

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await processPendingCandidates(peerConnectionsRef, pendingIceCandidates, senderName);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("sendAnswer", {
        roomID,
        senderName: userName,
        receiverName: senderName,
        answer,
      });
    };

    const handleReceiveAnswer = async ({
      answer,
      senderName,
    }: {
      answer: RTCSessionDescriptionInit;
      senderName: string;
    }) => {
      const pc = peerConnectionsRef.current[senderName];
      // Check if a PeerConnection exists and if it's actually expecting an answer.
      if (pc && pc.signalingState === "have-local-offer") {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          // The connection is now stable, process any queued ICE candidates.
          await processPendingCandidates(peerConnectionsRef, pendingIceCandidates, senderName);
        } catch (err) {
          console.error("Error setting remote answer:", err);
        }
      } else {
        console.warn(
          `Received an answer from ${senderName}, but was not in the correct state. Current state: ${pc?.signalingState}`
        );
      }
    };

    // This handler is for EXISTING clients. When a newcomer arrives, they initiate the connection.
    const handleNewUserJoined = ({ name: newUserName }: { name: string }) => {
      // Don't try to connect to yourself if the server somehow sends your own name
      if (newUserName !== userName.trim()) {
        createAndSendOffer(newUserName);
      }
    };

    const handleReceiveIceCandidate = async ({
      candidate,
      senderName,
    }: {
      candidate: RTCIceCandidateInit;
      senderName: string;
    }) => {
      const pc = peerConnectionsRef.current[senderName];
      if (pc?.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        if (!pendingIceCandidates.current[senderName])
          pendingIceCandidates.current[senderName] = [];
        pendingIceCandidates.current[senderName].push(candidate);
      }
    };

    // Screen Share Handlers
    const handleReceiveScreenOffer = async ({
      offer,
      senderName,
    }: {
      offer: RTCSessionDescriptionInit;
      senderName: string;
    }) => {
      const pc = createScreenPeerConnection(senderName, null); // We are receiving, so no local stream to add initially
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await processPendingCandidates(
        screenPeerConnectionsRef,
        pendingScreenIceCandidates,
        senderName
      );
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("sendScreenAnswer", {
        roomID,
        senderName: userName,
        receiverName: senderName,
        answer,
      });
    };

    const handleReceiveScreenAnswer = async ({
      answer,
      senderName,
    }: {
      answer: RTCSessionDescriptionInit;
      senderName: string;
    }) => {
      const pc = screenPeerConnectionsRef.current[senderName];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
      await processPendingCandidates(
        screenPeerConnectionsRef,
        pendingScreenIceCandidates,
        senderName
      );
    };

    const handleReceiveScreenIceCandidate = async ({
      candidate,
      senderName,
    }: {
      candidate: RTCIceCandidateInit;
      senderName: string;
    }) => {
      const pc = screenPeerConnectionsRef.current[senderName];
      if (pc?.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        if (!pendingScreenIceCandidates.current[senderName])
          pendingScreenIceCandidates.current[senderName] = [];
        pendingScreenIceCandidates.current[senderName].push(candidate);
      }
    };

    const handleUserDisconnected = ({ name }: { name: string }) => {
      // Close both regular and screen share connections
      peerConnectionsRef.current[name]?.close();
      delete peerConnectionsRef.current[name];
      screenPeerConnectionsRef.current[name]?.close();
      delete screenPeerConnectionsRef.current[name];
      setParticipants((prev) => prev.filter((p) => p.name !== name));
    };

    const handleScreenShareStatus = ({
      name,
      isSharing,
    }: {
      name: string;
      isSharing: boolean;
    }) => {
      setParticipants((prev) =>
        prev.map((p) => {
          // If the sharer stops, also nullify their screenStream
          if (p.name === name && !isSharing) {
            return { ...p, screenStream: null };
          }
          return p;
        })
      );
    };

    socket.on("receiveOffer", handleReceiveOffer);
    socket.on("receiveAnswer", handleReceiveAnswer);
    socket.on("receiveIceCandidate", handleReceiveIceCandidate);
    socket.on("receiveScreenOffer", handleReceiveScreenOffer);
    socket.on("receiveScreenAnswer", handleReceiveScreenAnswer);
    socket.on("receiveScreenIceCandidate", handleReceiveScreenIceCandidate);
    socket.on("userDisconnected", handleUserDisconnected);
    socket.on("screenShareStatus", handleScreenShareStatus);
    socket.on("newUserJoined", handleNewUserJoined);

    return () => {
      socket.off("receiveOffer");
      socket.off("receiveAnswer");
      socket.off("receiveIceCandidate");
      socket.off("receiveScreenOffer");
      socket.off("receiveScreenAnswer");
      socket.off("receiveScreenIceCandidate");
      socket.off("userDisconnected");
      socket.off("screenShareStatus");
      socket.off("newUserJoined");
    };
  }, [
    userName,
    stream,
    roomID,
    createPeerConnection,
    createAndSendOffer,
    createScreenPeerConnection,
  ]);

  const handleToggleScreenShare = async () => {
    // If already sharing, stop it
    if (screenStream) {
      // Notify others that you've stopped
      socketRef.current?.emit("stopScreenShare", { roomID, name: userName.trim() });

      // Stop the local screen share tracks
      screenStream.getTracks().forEach((track) => track.stop());

      // Close all screen share peer connections
      for (const peerName in screenPeerConnectionsRef.current) {
        screenPeerConnectionsRef.current[peerName].close();
      }

      // Clear the state and refs
      screenPeerConnectionsRef.current = {};
      pendingScreenIceCandidates.current = {};
      setScreenStream(null);
      return;
    }

    // If not sharing, start it
    try {
      const newScreenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as any,
        audio: false, // Typically, you don't share system audio
      });
      setParticipants((prev) =>
        prev.map((p) =>
          p.name === userName.trim()
            ? { ...p, screenStream: newScreenStream }
            : p
        )
      );
      setScreenStream(newScreenStream);

      // Notify others you are starting to share
      socketRef.current?.emit("startScreenShare", { roomID, name: userName.trim() });

      // Create new peer connections for screen sharing with every other participant
      const otherParticipants = participants.filter((p) => p.name !== userName.trim());
      for (const participant of otherParticipants) {
        const pc = createScreenPeerConnection(participant.name, newScreenStream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current?.emit("sendScreenOffer", {
          roomID,
          senderName: userName.trim(),
          targetName: participant.name,
          offer,
        });
      }

      // Add a listener to handle the user clicking the browser's "Stop sharing" button
      newScreenStream.getVideoTracks()[0].onended = () => {
        handleToggleScreenShare();
      };
    } catch (error) {
      console.error("Error starting screen share:", error);
    }
  };

  const requestMediaPermissions = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some((d) => d.kind === "videoinput");
      const hasMic = devices.some((d) => d.kind === "audioinput");

      if (!hasCamera && !hasMic) throw new Error("No camera or microphone found");

      // CHANGED: Conditionally request video based on isAudioOnly state
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: isAudioOnly ? false : hasCamera,
        audio: hasMic,
      });

      setStream(mediaStream);
      if (localVideoRef.current) localVideoRef.current.srcObject = mediaStream;
      console.log("Media permissions granted.");
      setPermissionDenied(false);
    } catch (error) {
      console.error("Media permissions denied:", error);
      setPermissionDenied(true);
    }
  };

  const handleJoin = () => {
    if (!userName.trim() || !stream) return;

    setLoadingForJoiningCall(true);
    const payload = { roomID, name: userName.trim() };

    socketRef.current?.emit("joinRoom", payload, (ack: any) => {
      setLoadingForJoiningCall(false);
      if (ack.error) {
        return;
      }

      // CHANGED: Set videoOn to false if it's an audio-only call
      setParticipants([
        {
          name: userName.trim(),
          stream: stream,
          micOn: true,
          videoOn: !isAudioOnly,
          screenStream: null,
        },
      ]);
      setIsInCall(true);
    });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      {isInCall ? (
        <VideoCallScreen
          participants={participants}
          setParticipants={setParticipants}
          localUserName={userName.trim()}
          socket={socketRef.current}
          roomID={roomID}
          onToggleScreenShare={handleToggleScreenShare}
          isSharingScreen={!!screenStream} // True if screenStream is not null
          isAudioOnly={isAudioOnly} // ADDED: Pass the prop to the UI component
        />
      ) : (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Grid container spacing={4} justifyContent="center" alignItems="center">
            <Grid item xs={12} lg={stream ? 6 : 8}>
              <PreviewContainer elevation={3}>
                {!stream && !permissionDenied && (
                  <Box textAlign="center">
                    <Typography variant="h5" gutterBottom>
                      Ready to join?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Grant {isAudioOnly ? "microphone" : "camera and mic"} access to
                      continue.
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={requestMediaPermissions}
                      sx={{ borderRadius: 28, px: 4 }}
                    >
                      Grant Access
                    </Button>
                  </Box>
                )}
                {permissionDenied && <PermissionDenied isAudioOnly={isAudioOnly} />}
                {/* If it's an audio call, we don't need the video element, show an icon instead */}
                {isAudioOnly && stream && (
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <Mic size={96} className="text-green-500 mb-4" />
                    <Typography variant="h6">Microphone is active.</Typography>
                  </Box>
                )}
                <VideoPreview
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    display: stream && !isAudioOnly ? "block" : "none",
                  }}
                />
              </PreviewContainer>
            </Grid>

            {stream && (
              <Grid item xs={12} lg={6}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 4,
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h4" align="center" fontWeight="bold">
                    You're all set
                  </Typography>
                  <TextField
                    label="Enter your name"
                    variant="outlined"
                    fullWidth
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                  <Button
                    variant="contained"
                    size="large"
                    disabled={loadingForJoiningCall || !socketRef.current?.connected}
                    onClick={handleJoin}
                    sx={{ borderRadius: 28, py: 1.5 }}
                    startIcon={
                      loadingForJoiningCall ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : null
                    }
                  >
                    {loadingForJoiningCall
                      ? "Joining..."
                      : `Join ${isAudioOnly ? "Audio Call" : "Video Call"}`}
                  </Button>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Container>
      )}
    </Box>
  );
}

// MODIFIED: Accept isAudioOnly prop to show relevant message
const PermissionDenied = memo(({ isAudioOnly }: { isAudioOnly: boolean }) => (
  <Paper
    elevation={0}
    sx={{
      maxWidth: 400,
      mx: "auto",
      p: 3,
      bgcolor: "background.paper",
      borderRadius: 2,
    }}
  >
    <Alert severity="error" variant="filled" sx={{ mb: 2 }}>
      <AlertTitle>Permission Required</AlertTitle>
      <Box display="flex" alignItems="center" gap={1}>
        <Camera size={20} />
        <Typography variant="body2">
          Camera and Mic Access Required
        </Typography>
      </Box>
    </Alert>
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Please enable {isAudioOnly ? "microphone" : "camera and microphone"} access in
        your browser settings to continue.
      </Typography>
      <Stack spacing={2} sx={{ mt: 2 }}>
        <Box display="flex" gap={2} alignItems="center">
            <Lock size={20} />
            <Box>
                <Typography variant="subtitle2">Click the lock icon</Typography>
                <Typography variant="caption" color="text.secondary">Located in your browser's address bar</Typography>
            </Box>
        </Box>
        <Box display="flex" gap={2} alignItems="center">
            <Settings size={20} />
            <Box>
                <Typography variant="subtitle2">Open Site Settings</Typography>
                <Typography variant="caption" color="text.secondary">Find Camera and Microphone permissions</Typography>
            </Box>
        </Box>
      </Stack>
      <Button
        variant="outlined"
        fullWidth
        onClick={() => window.location.reload()}
        sx={{ mt: 3, borderRadius: 28 }}
        startIcon={<RefreshCw size={16} />}
      >
        Refresh and Try Again
      </Button>
    </Box>
  </Paper>
));
PermissionDenied.displayName = "PermissionDenied";
