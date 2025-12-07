"use client";

import { useState, useRef, memo, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogTitle,
  DialogContentText,
  IconButton,
  styled,
} from "@mui/material";
import { Camera, Loader2, Lock, RefreshCw, Settings } from "lucide-react";
import CryptoJS from "crypto-js";
import { useParams, useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import VideoCallScreen, { Participant } from "src/components/ui/call/CallingUi";
import axios from "axios";

const SIGNING_KEY = "8ieFzC7WvOzu1MW";
const backendDomain = "http://127.0.0.1:5001";

const decryptToken = (encryptedToken: string): string | null => {
  try {
    const bytes = CryptoJS.AES.decrypt(decodeURIComponent(encryptedToken), SIGNING_KEY);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    return decryptedData;
  } catch (error) {
    console.error("Invalid token or decryption failed:", error);
    return null;
  }
};

const dekryptTurnUserAndPass = async (encrypted: string, key: string): Promise<string | null> => {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};

const peerConfiguration: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

// Styled Components
const VideoPreview = styled("video")(({ theme }) => ({
  width: "100%",
  height: "100%",
  borderRadius: theme.shape.borderRadius,
  objectFit: "cover",
}));

const OTPInput = styled(TextField)(({ theme }) => ({
  "& input": {
    textAlign: "center",
    fontSize: "1.5rem",
    letterSpacing: "0.5rem",
  },
}));

export default function IndividualMeetingRoom() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [userName, setUserName] = useState("");
  const [protectionStatus, setProtectionStatus] = useState<{
    hasPassword: string | false;
  }>({
    hasPassword: false,
  });
  const [inputOTP, setInputOTP] = useState("");
  const [roomID, setRoomID] = useState<string>("");
  const [isInCall_OR_ON_PreCallUI, setIsInCall_OR_ON_PreCallUI] = useState(false);
  const [dekryptionFailed, setDekrypttionFailed] = useState(false);
  const [loadingForJoiningCall, setLoadingForJoiningCall] = useState(false);
  const [participantsInCall, setParticipantsInCall] = useState<Participant[]>([]);
  
  const socketRef = useRef<Socket | null>(null);
  const dekryptionKeyForCreds = useRef("");
  const [secretMessage, setSecretMessage] = useState("");
  const local_videoRef = useRef<HTMLVideoElement>(null);
  const localUserNameRef = useRef<string | null>(null);

  const peerConnectionsRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const pendingIceCandidates = useRef<{ [key: string]: RTCIceCandidateInit[] }>({});

  const requestMediaPermissions = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      setStream(mediaStream);

      if (local_videoRef.current) {
        local_videoRef.current.srcObject = mediaStream;
      }
      setPermissionDenied(false);
    } catch (error) {
      console.error("Error accessing media devices:", error);
      setPermissionDenied(true);
    }
  };

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(
        "getDekryptionKeyAndMessage",
        ({ message, credsKey }: { message: string; credsKey: string }) => {
          dekryptionKeyForCreds.current = credsKey;
        }
      );
      socketRef.current.on(
        "receiveOffer",
        async ({
          offer,
          senderName,
          remoteUsersName,
        }: {
          offer: RTCSessionDescriptionInit;
          senderName: string;
          remoteUsersName: string;
        }) => {
          await handleIncomingOffer({ offer, senderName, remoteUsersName });
        }
      );

      socketRef.current.on(
        "receiveAnswer",
        async ({ answer, senderName }: { answer: RTCSessionDescriptionInit; senderName: string }) => {
          const pc = peerConnectionsRef.current[senderName];
          if (!pc) return;

          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await processPendingCandidates(senderName);
          setIsInCall_OR_ON_PreCallUI(true);
        }
      );

      socketRef.current.on(
        "receiveIceCandidate",
        async ({ candidate, senderName }: { candidate: RTCIceCandidateInit; senderName: string }) => {
          const pc = peerConnectionsRef.current[senderName];

          if (!pc) {
            if (!pendingIceCandidates.current[senderName]) {
              pendingIceCandidates.current[senderName] = [];
            }
            pendingIceCandidates.current[senderName].push(candidate);
            return;
          }

          if (!pc.remoteDescription) {
            if (!pendingIceCandidates.current[senderName]) {
              pendingIceCandidates.current[senderName] = [];
            }
            pendingIceCandidates.current[senderName].push(candidate);
            return;
          }

          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error(`Error adding ICE candidate for ${senderName}:`, err);
          }
        }
      );
    }
  }, [socketRef.current]);

  useEffect(() => {
    if (params?.room) {
      setRoomID(params.room as string);
    }
  }, [params]);

  useEffect(() => {
    if (roomID) {
      socketRef.current = io(backendDomain);

      return () => {
        socketRef.current?.disconnect();
        if (stream) {
          stream.getTracks().forEach((track) => {
            track.stop();
          });
        }
      };
    }
  }, [roomID]);

  const requestTurnCreds = async () => {
    try {
      const turnCreds = await axios.post(`${backendDomain}/get-creds`, {
        domain: window.location.hostname,
        message: secretMessage,
      });
      return turnCreds.data;
    } catch (e) {
      setLoadingForJoiningCall(false);
      console.error("Error requesting TURN server credentials:", e);
      return null;
    }
  };

  const pingBackendToStartCallProcessAndTransferCreds = (): Promise<{ success: boolean }> => {
    return new Promise((resolve) => {
      socketRef.current?.emit("request_call_credentials");
      resolve({ success: true });
    });
  };

  const handleJoin = async () => {
    if (!userName.trim()) {
      alert("Please enter your name to join");
      return;
    }

    if (protectionStatus.hasPassword) {
      if (protectionStatus.hasPassword !== inputOTP) {
        alert("Wrong password, please try again");
        return;
      }
    }

    if (!stream) {
      alert("Please grant mic and camera access to join the call");
      try {
        await requestMediaPermissions();
      } catch (e) {
        alert("Permission for mic and video not given");
        return;
      }
    }
    setLoadingForJoiningCall(true);

    const gotCredsKeyAndMessage = await pingBackendToStartCallProcessAndTransferCreds();

    if (!gotCredsKeyAndMessage?.success) {
      setLoadingForJoiningCall(false);
      alert("Failed to communicate with turn server");
      return;
    }

    const turnServerCreds = await requestTurnCreds();

    if (!turnServerCreds || !(turnServerCreds.userName && turnServerCreds.password)) {
      alert("Failed to communicate with turn server");
      return;
    }

    try {
      const dekryptedUserName = await dekryptTurnUserAndPass(
        turnServerCreds.userName,
        dekryptionKeyForCreds.current
      );
      const dekryptedPassword = await dekryptTurnUserAndPass(
        turnServerCreds.password,
        dekryptionKeyForCreds.current
      );
      if (!(dekryptedUserName && dekryptedPassword)) {
        alert("Failed to communicate with turn server");
        return;
      }

      peerConfiguration.iceServers?.forEach((server: any) => {
        if (!server.username) server.username = dekryptedUserName;
        if (!server.credential) server.credential = dekryptedPassword;
      });
    } catch (e) {
      alert("Failed to decrypt credentials");
      setLoadingForJoiningCall(false);
      return;
    }
    const trimmedUserName = userName.trim().toLowerCase().replace(/ /g, "_");

    localUserNameRef.current = trimmedUserName;
    socketRef.current?.emit(
      "basicInfoOFClientOnConnect",
      {
        roomID,
        name: trimmedUserName,
      },
      async (serverACK: any) => {
        if (serverACK.sameName) {
          alert(
            `A person named '${serverACK.existingName}' is already in the room. Please join with a different name.`
          );
          setLoadingForJoiningCall(false);
          return;
        }
        if (serverACK.isFirstInTheCall && !serverACK.roomFull) {
          setParticipantsInCall((prev) => [
            ...prev,
            { name: trimmedUserName, videoOn: true, micOn: true, stream },
          ]);
          setIsInCall_OR_ON_PreCallUI(true);
        } else if (!serverACK.isFirstInTheCall && !serverACK.roomFull) {
          setParticipantsInCall((prev) => [
            ...prev,
            { name: trimmedUserName, videoOn: true, micOn: true, stream },
          ]);
          if (serverACK.existingUsers && serverACK.existingUsers.length > 0) {
            for (const remoteUser of serverACK.existingUsers) {
              await createAndSendOffer(remoteUser);
            }
          }
        } else if (serverACK.roomFull) {
          alert("This room is already full");
          setLoadingForJoiningCall(false);
          return;
        }
      }
    );
  };

  const createAndSendOffer = async (targetName: string) => {
    if (!peerConnectionsRef.current[targetName]) {
      peerConnectionsRef.current[targetName] = createPeerConnection(targetName);
    }
    const pc = peerConnectionsRef.current[targetName];

    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);

      socketRef.current?.emit("sendOffer", {
        offer,
        roomID,
        senderName: userName.trim().toLowerCase().replace(/ /g, "_"),
        targetName,
      });
    } catch (err) {
      console.error("Error in createAndSendOffer:", err);
    }
  };

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      const enkryptedToken = token;
      if (enkryptedToken) {
        const dekryptedToken = decryptToken(enkryptedToken);
        if (dekryptedToken) {
          if (dekryptedToken.startsWith("has_password")) {
            const OTP = dekryptedToken.split("--")[1];
            setProtectionStatus({
              hasPassword: OTP || false,
            });
          }
        } else {
          setDekrypttionFailed(true);
        }
      }
    } else {
      setDekrypttionFailed(true);
    }
  }, [searchParams]);

  const createPeerConnection = (remoteUserName: string) => {
    const pc = new RTCPeerConnection(peerConfiguration);

    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    pc.ontrack = (event) => {
      const [incomingStream] = event.streams;

      setParticipantsInCall((prevList) => {
        const existing = prevList.find((p) => p.name === remoteUserName);
        if (!existing) {
          return [
            ...prevList,
            {
              name: remoteUserName,
              videoOn: true,
              micOn: true,
              stream: incomingStream,
            },
          ];
        }
        return prevList.map((p) =>
          p.name === remoteUserName ? { ...p, stream: incomingStream } : p
        );
      });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("sendIceCandidateToSignalingServer", {
          iceCandidate: event.candidate,
          roomID,
          senderName: localUserNameRef.current,
          targetName: remoteUserName,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
    };

    return pc;
  };

  const handleIncomingOffer = async ({
    offer,
    senderName,
    remoteUsersName,
  }: {
    offer: RTCSessionDescriptionInit;
    senderName: string;
    remoteUsersName: string;
  }) => {
    if (!stream) {
      await requestMediaPermissions();
    }

    if (!peerConnectionsRef.current[senderName]) {
      peerConnectionsRef.current[senderName] = createPeerConnection(senderName);
    }
    const pc = peerConnectionsRef.current[senderName];

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await processPendingCandidates(senderName);

      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(answer);

      socketRef.current?.emit("sendAnswer", {
        answer,
        roomID,
        senderName: remoteUsersName,
        receiverName: senderName,
      });

      setIsInCall_OR_ON_PreCallUI(true);
    } catch (err) {
      console.error("Error in handleIncomingOffer:", err);
      return;
    }
  };

  const processPendingCandidates = async (senderName: string) => {
    const pc = peerConnectionsRef.current[senderName];
    const candidates = pendingIceCandidates.current[senderName] || [];

    for (const candidate of candidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error(`Error processing buffered ICE candidate for ${senderName}:`, err);
      }
    }
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
      {isInCall_OR_ON_PreCallUI ? (
        <VideoCallScreen
          participants={participantsInCall}
          setParticipants={setParticipantsInCall}
          localUserName={userName}
          socket={socketRef.current}
          roomID={roomID}
          onToggleScreenShare={() => {}}
          isSharingScreen={false}
          isAudioOnly={false}
        />
      ) : (
        <Container maxWidth={stream ? "lg" : "md"} sx={{ py: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} lg={stream ? 6 : 12}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 350,
                }}
              >
                {!stream && !permissionDenied && (
                  <Box textAlign="center">
                    <Typography variant="h5" gutterBottom>
                      Grant mic and camera access
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      We do not access your audio or video streams. All data stays on your device.
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

                {permissionDenied && <PermissionDenied />}

                <VideoPreview
                  ref={local_videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    display: local_videoRef.current?.srcObject ? "block" : "none",
                  }}
                />
              </Paper>
            </Grid>

            {stream && (
              <Grid item xs={12} lg={6}>
                <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                  <Typography variant="h4" align="center" fontWeight="bold" gutterBottom>
                    Ready to join
                  </Typography>
                  <TextField
                    label="Enter your name"
                    variant="outlined"
                    fullWidth
                    value={userName}
                    onChange={(e) => {
                      setUserName(e.target.value);
                    }}
                    sx={{ mb: 3 }}
                  />
                  {protectionStatus.hasPassword && (
                    <Box sx={{ mb: 3 }}>
                      <OTPInput
                        label="Enter OTP"
                        variant="outlined"
                        fullWidth
                        value={inputOTP}
                        onChange={(e) => setInputOTP(e.target.value)}
                        inputProps={{ maxLength: 4 }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                        This meeting is protected. Please enter the OTP to join.
                      </Typography>
                    </Box>
                  )}
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={loadingForJoiningCall}
                    onClick={handleJoin}
                    sx={{ borderRadius: 28, py: 1.5 }}
                    startIcon={
                      loadingForJoiningCall ? <CircularProgress size={20} color="inherit" /> : null
                    }
                  >
                    {loadingForJoiningCall ? "Joining..." : "Join"}
                  </Button>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Container>
      )}

      <DecryptionFailedModal open={dekryptionFailed} setOpen={setDekrypttionFailed} />
    </Box>
  );
}

const PermissionDenied = memo(() => {
  return (
    <Paper elevation={0} sx={{ maxWidth: 500, p: 3, bgcolor: "background.paper" }}>
      <Alert severity="error" variant="filled" sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Camera size={20} />
          <AlertTitle sx={{ mb: 0 }}>Camera and Mic Access Required</AlertTitle>
        </Box>
      </Alert>

      <Typography variant="subtitle1" gutterBottom>
        Follow these steps to grant access:
      </Typography>

      <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        <Box display="flex" gap={2} alignItems="flex-start">
          <Lock size={20} />
          <Box>
            <Typography variant="subtitle2">Click the lock icon</Typography>
            <Typography variant="caption" color="text.secondary">
              Located in your browser&apos;s address bar
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={2} alignItems="flex-start">
          <Settings size={20} />
          <Box>
            <Typography variant="subtitle2">Open Site Settings</Typography>
            <Typography variant="caption" color="text.secondary">
              Find Camera and Microphone permissions
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={2} alignItems="flex-start">
          <Camera size={20} />
          <Box>
            <Typography variant="subtitle2">Allow access</Typography>
            <Typography variant="caption" color="text.secondary">
              Enable both camera and microphone
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={2} alignItems="flex-start">
          <RefreshCw size={20} />
          <Box>
            <Typography variant="subtitle2">Refresh the page</Typography>
            <Typography variant="caption" color="text.secondary">
              Try your action again
            </Typography>
          </Box>
        </Box>
      </Box>

      <Button
        variant="outlined"
        fullWidth
        onClick={() => window.location.reload()}
        sx={{ mt: 3, borderRadius: 28 }}
        startIcon={<RefreshCw size={16} />}
      >
        Refresh Now
      </Button>
    </Paper>
  );
});
PermissionDenied.displayName = "PermissionDenied";

const DecryptionFailedModal = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogTitle>Decryption Failed</DialogTitle>
      <DialogContent>
        <DialogContentText>
          You cannot join this meeting with a failed token. Please ask the host to share a new
          link.
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
};
