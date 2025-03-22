"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AudioPlayer from "./audio-player";

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
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
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
        const fileName = `recording-${new Date().toISOString()}.wav`;
        const audioFile = new File([audioBlob], fileName, {
          type: "audio/wav",
        });

        setRecordedAudio(audioFile);
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setPermissionDenied(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop all tracks on the stream
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());

      // Clear timer
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
          Please allow microphone access in your browser settings to use the
          recording feature.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Record Your Voice</h3>
          <p className="text-sm text-muted-foreground">
            Click the microphone button to start recording
          </p>
        </div>

        {isRecording ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-25"></div>
              <div className="relative rounded-full bg-red-500 p-6">
                <Mic className="h-12 w-12 text-white" />
              </div>
            </div>
            <div className="text-xl font-mono">{formatTime(recordingTime)}</div>
            <Button
              variant="destructive"
              size="lg"
              onClick={stopRecording}
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Stop Recording
            </Button>
          </div>
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
          <div className="w-full space-y-4">
            <div className="text-center font-medium">Preview Recording</div>
            <AudioPlayer file={recordedAudio} />
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setRecordedAudio(null)}>
                Discard
              </Button>
              <Button onClick={saveRecording}>Save Recording</Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
