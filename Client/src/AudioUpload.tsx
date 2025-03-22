"use client";

import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import {
  Music,
  Upload,
  X,
  Send,
  Check,
  AlertCircle,
  Loader2,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AudioPlayer from "@/components/audio-player";
import AudioRecorder from "@/components/audio-recorder";
import axios from "axios";
import { toast, Toaster } from "sonner";

export default function AudioUploader() {
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [sendingStatus, setSendingStatus] = useState<
    Record<number, "idle" | "loading" | "success" | "error">
  >({});
  const [predictions, setPredictions] = useState<
    Record<number, { dialect: string | null; loading: boolean; error: boolean }>
  >({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter((file) =>
        file.type.startsWith("audio/")
      );
      setAudioFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("audio/")
      );
      setAudioFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeAudio = (index: number) => {
    setAudioFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const addRecordedAudio = (audioFile: File) => {
    setAudioFiles((prev) => [...prev, audioFile]);
  };

  const sendAudioToAPI = async (file: File, index: number) => {
    // Set loading state for this file
    setSendingStatus((prev) => ({ ...prev, [index]: "loading" }));
    // Set prediction loading state
    setPredictions((prev) => ({
      ...prev,
      [index]: { dialect: null, loading: true, error: false },
    }));

    // Create FormData to send the file
    const formData = new FormData();

    // Log the file details for debugging
    console.log("Sending file:", {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    });

    // Add the file to FormData - try both "audio" and "file" keys
    // Your API might be expecting a specific key name
    formData.append("audio", file);

    // Log FormData entries for debugging
    for (const pair of formData.entries()) {
      console.log(`FormData contains: ${pair[0]}, ${pair[1]}`);
    }

    try {
      // Add timeout and better error handling
      const response = await axios.post(
        "http://127.0.0.1:8000/api/predict/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            // Add this to prevent axios from setting the boundary incorrectly
            Accept: "application/json",
          },
          // Increase timeout for large files
          timeout: 30000,
          // Add withCredentials if your API requires cookies/auth
          // withCredentials: true,
        }
      );

      console.log("API response:", response.data);

      // Set success state
      setSendingStatus((prev) => ({ ...prev, [index]: "success" }));
      // Set prediction result
      setPredictions((prev) => ({
        ...prev,
        [index]: {
          dialect: response.data.dialect,
          loading: false,
          error: false,
        },
      }));

      toast.success(`Dialect prediction complete for ${file.name}.`);
    } catch (error: any) {
      console.error("Error sending audio:", error);

      // More detailed error logging
      if (axios.isAxiosError(error)) {
        console.error("API error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        });
      }

      // Set error state
      setSendingStatus((prev) => ({ ...prev, [index]: "error" }));
      // Set prediction error state
      setPredictions((prev) => ({
        ...prev,
        [index]: { dialect: null, loading: false, error: true },
      }));

      toast.error(
        `There was a problem processing ${file.name}. ${error.message}`
      );
    }
  };

  return (
    <div className="space-y-6">
      <Toaster richColors position="top-center" />
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Audio</TabsTrigger>
          <TabsTrigger value="record">Record Audio</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          <div
            className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileInput}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="audio/*"
              className="hidden"
              multiple
            />
            <div className="flex flex-col items-center justify-center space-y-2 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium">
                Drag audio files here or click to upload
              </h3>
              <p className="text-sm text-muted-foreground">
                Support for MP3, WAV, OGG, and other audio formats
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="record" className="mt-4">
          <AudioRecorder onRecordingComplete={addRecordedAudio} />
        </TabsContent>
      </Tabs>

      {audioFiles.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Audio Files</h2>
          <div className="space-y-3">
            {audioFiles.map((file, index) => (
              <Card key={index} className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Music className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendAudioToAPI(file, index)}
                      disabled={
                        sendingStatus[index] === "loading" ||
                        sendingStatus[index] === "success"
                      }
                      className="flex items-center gap-1"
                    >
                      {sendingStatus[index] === "loading" && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {sendingStatus[index] === "success" && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                      {sendingStatus[index] === "error" && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      {!sendingStatus[index] && <Send className="h-4 w-4" />}
                      {sendingStatus[index] === "success"
                        ? "Sent"
                        : sendingStatus[index] === "loading"
                        ? "Sending..."
                        : sendingStatus[index] === "error"
                        ? "Retry"
                        : "Send"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAudio(index);
                      }}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                </div>
                <AudioPlayer file={file} />

                {/* Dialect Prediction Section */}
                <div className="mt-4 border-t pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Languages className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-medium">Dialect Prediction</h4>
                  </div>

                  {predictions[index]?.loading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Analyzing audio...</span>
                    </div>
                  )}

                  {predictions[index]?.error && (
                    <div className="flex items-center gap-2 text-sm text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      <span>Failed to predict dialect. Please try again.</span>
                    </div>
                  )}

                  {predictions[index]?.dialect && (
                    <div className="bg-primary/5 rounded-md p-3">
                      <p className="text-sm font-medium">Predicted Dialect:</p>
                      <p className="text-lg font-semibold text-primary">
                        {predictions[index].dialect}
                      </p>
                    </div>
                  )}

                  {!predictions[index] && (
                    <p className="text-sm text-muted-foreground">
                      Send the audio to predict the dialect.
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
