import { DEFAULT_VIDEO_SETTINGS } from "@/constants";
import { VideoSettings } from "@/types";

export const bytesToSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";

  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const convertedSize = (bytes / Math.pow(1024, i)).toFixed(2);

  return `${convertedSize} ${sizes[i]}`;
};

export const isPositiveNumber = (value: any): boolean => {
  return typeof value === "number" && value > 0 && !isNaN(value);
};

export const estimateVideoBitrateForWebM = (
  videoSetting = DEFAULT_VIDEO_SETTINGS
): number => {
  const { width, height, frameRate } = videoSetting;
  // Assume VP9 codec (you can adjust based on your codec)
  const bitsPerPixel = 0.06; // Example value for VP9 codec
  const pixelsPerFrame = width * height;
  const bitsPerSecond = pixelsPerFrame * frameRate * bitsPerPixel;
  return bitsPerSecond;
};

export const formatElapsedTime = (elapsedTime: number): string => {
  const hours = Math.floor(elapsedTime / 3600);
  const minutes = Math.floor((elapsedTime % 3600) / 60);
  const seconds = Math.floor(elapsedTime % 60);

  let formattedTime = "";

  if (hours > 0) {
    formattedTime += hours.toString().padStart(2, "0") + ":";
  }

  formattedTime +=
    minutes.toString().padStart(2, "0") +
    ":" +
    seconds.toString().padStart(2, "0");

  return formattedTime;
};
