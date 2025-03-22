"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AudioPlayer from "./audio-player";
import { motion } from "framer-motion";

interface AudioRecorderProps {
  onRecordingComplete: (file: File) => void;
}

export default function AudioRecorder({
  onRecordingComplete,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<File | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    audioChunksRef.current = [];
    setRecordedAudio(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const fileName = `recording-${new Date()
          .toDateString()
          .replace(/[:.]/g, "-")}.mp3`;
        const audioFile = new File([audioBlob], fileName, {
          type: "audio/mp3",
        });

        setRecordedAudio(audioFile);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Microphone permission error:", error);
      setPermissionDenied(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const saveRecording = () => {
    if (recordedAudio) {
      onRecordingComplete(recordedAudio);
      setRecordedAudio(null);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  if (permissionDenied) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Microphone Access Denied</AlertTitle>
        <AlertDescription>
          Please enable microphone access in your browser settings to use the
          recorder.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="p-6 shadow-xl">
        <div className="flex flex-col items-center space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">Record Your Voice</h3>
            <p className="text-sm text-muted-foreground">
              Click the mic button below to start recording
            </p>
          </div>

          {isRecording ? (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="flex flex-col items-center space-y-4"
            >
              <div className="relative flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-25" />
                <div className="relative rounded-full bg-red-500 p-6">
                  <Mic className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="text-xl font-mono">
                {formatTime(recordingTime)}
              </div>
              <Button
                variant="destructive"
                size="lg"
                onClick={stopRecording}
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Stop Recording
              </Button>
            </motion.div>
          ) : (
            <Button
              variant="outline"
              size="lg"
              onClick={startRecording}
              className="flex items-center gap-2 h-16 w-16 rounded-full"
            >
              <Mic className="h-8 w-8" />
              <span className="sr-only">Start Recording</span>
            </Button>
          )}

          {recordedAudio && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full space-y-4"
            >
              <div className="text-center font-medium">
                Preview Your Recording
              </div>
              <AudioPlayer file={recordedAudio} />
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setRecordedAudio(null)}
                >
                  Discard
                </Button>
                <Button onClick={saveRecording}>Save Recording</Button>
              </div>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
