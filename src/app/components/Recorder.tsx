"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { Button } from "@/components/ui/button";
import {
  bytesToSize,
  estimateVideoBitrateForWebM,
  formatElapsedTime,
} from "@/utils/utils";
import DiskSpaceInfo from "./DiskSpaceInfo";
import { VideoSettings } from "@/types";
import {
  StopCircle,
  PlayCircle,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Download,
  PauseCircle,
  RefreshCw,
} from "react-feather";

enum RecordingStatus {
  "IDLE",
  "RECORDING",
  "PAUSED",
  "COMPLETED",
}

const Recorder = () => {
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>(
    RecordingStatus.IDLE
  );
  const [chunks, setChunks] = useState<Blob[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);
  //   const [isScreenEnabled, setIsScreenEnabled] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<string | number | NodeJS.Timeout | undefined>();
  const [videoSetting, setVideoSetting] = useState<VideoSettings>();

  const estimatedBitRate = useMemo(
    () => estimateVideoBitrateForWebM(videoSetting),
    [videoSetting]
  );

  const startStream = useCallback(async () => {
    let audioEnabled = isAudioEnabled;
    let videoEnabled = isVideoEnabled;

    // Create constraints object based on enabled/disabled audio and video
    let constraints: MediaStreamConstraints | DisplayMediaStreamOptions = {
      audio: audioEnabled,
      video: videoEnabled,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const videoTrack = stream.getVideoTracks()[0];

      // get user video settings
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        const { width, height, frameRate } = settings;
        if (width && height && frameRate)
          setVideoSetting({ width, height, frameRate });
      }

      //   const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      if (videoRef.current) {
        // Assign the stream to the video element
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      handleError(error as Error);
      // Handle error, e.g., prompt user to allow access to media devices
    }
  }, []);

  useEffect(() => {
    startStream();
  }, [startStream]);

  useEffect(() => {
    if (recordingStatus === RecordingStatus.RECORDING) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prevElapsedTime) => prevElapsedTime + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [recordingStatus, chunks]);

  const handleError = (error: Error) => {
    console.error("Error accessing media devices:", error);
  };

  const handleDataAvailable = useCallback((event: BlobEvent) => {
    if (event.data.size > 0) {
      setChunks([event.data]);
    }
  }, []);

  const startRecording = useCallback(async () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      const mediaRecorder = new MediaRecorder(stream as MediaStream, {
        bitsPerSecond: estimatedBitRate,
      });
      setRecorder(mediaRecorder);
      mediaRecorder.ondataavailable = handleDataAvailable;
      mediaRecorder.start();
      setRecordingStatus(RecordingStatus.RECORDING);
    }
  }, [handleDataAvailable]);

  const pauseRecording = () => {
    if (recorder && recorder.state === "recording") {
      recorder.pause();
      setRecordingStatus(RecordingStatus.PAUSED);
    }
  };

  const resumeRecording = () => {
    if (recorder && recorder.state === "paused") {
      recorder.resume();
      setRecordingStatus(RecordingStatus.RECORDING);
    }
  };

  const stopRecording = () => {
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      setRecordingStatus(RecordingStatus.COMPLETED);
    }
  };

  const reset = () => {
    setElapsedTime(0);
    setChunks([]);
    setRecordingStatus(RecordingStatus.IDLE);
  };

  const downloadRecording = () => {
    if (chunks.length === 0) return;

    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "recording.webm";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-stone-900 flex flex-col justify-center items-center w-screen h-screen">
      {/* Video Container */}

      <div className="border rounded-md flex flex-col justify-center items-center">
        {/* Info Panel */}
        <div className="flex flex-row w-full justify-between px-4">
          <p className="text-white">{formatElapsedTime(elapsedTime)}</p>
          <DiskSpaceInfo usage={elapsedTime * estimatedBitRate} />
        </div>

        <video ref={videoRef} autoPlay muted className="top-0" />
        {recordingStatus === RecordingStatus.IDLE ? (
          <div className="flex flex-row justify-center items-center">
            <Button
              variant={"ghost"}
              className="bg-transparent text-white !border-white hover:none"
              onClick={() => setIsAudioEnabled((prev) => !prev)}
            >
              {isAudioEnabled ? <MicOff /> : <Mic />}
            </Button>
            <Button
              variant={"ghost"}
              className="bg-transparent text-white !border-white hover:none"
              onClick={() => setIsVideoEnabled((prev) => !prev)}
            >
              {isVideoEnabled ? <VideoOff /> : <Video />}
            </Button>
          </div>
        ) : null}
      </div>

      {/* Controls Panel */}
      <div className="my-8 flex flex-row">
        {recordingStatus === RecordingStatus.IDLE ? (
          <Button
            onClick={startRecording}
            className="bg-blue-500 hover:bg-blue-400"
          >
            <PlayCircle className="mr-2" />
            Start
          </Button>
        ) : null}

        {recordingStatus === RecordingStatus.RECORDING ? (
          <>
            <Button onClick={pauseRecording} className="bg-yellow-600">
              <PauseCircle className="mr-2" /> Pause
            </Button>
            <Button variant={"destructive"} onClick={stopRecording}>
              <StopCircle className="mr-2" />
              Stop
            </Button>
          </>
        ) : null}

        {recordingStatus === RecordingStatus.PAUSED ? (
          <>
            <Button onClick={resumeRecording}>
              <PlayCircle className="mr-2" /> Resume
            </Button>
            <Button variant={"destructive"} onClick={stopRecording}>
              <StopCircle className="mr-2" /> Stop
            </Button>
          </>
        ) : null}

        {recordingStatus === RecordingStatus.COMPLETED ? (
          <>
            <Button onClick={reset}>
              <RefreshCw className="mr-2" /> Start Again
            </Button>
            <Button
              variant={"secondary"}
              className="bg-green-600 hover:bg-green-500"
              onClick={downloadRecording}
            >
              <Download className="mr-2" /> Download Recording
            </Button>
          </>
        ) : null}

        {/* <Button onClick={() => setIsScreenEnabled((prev) => !prev)}>
          {isScreenEnabled ? "Disable Screen" : "Enable Screen"}
        </Button> */}
      </div>
    </div>
  );
};

export default Recorder;
