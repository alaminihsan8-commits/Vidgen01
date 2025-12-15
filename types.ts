export enum AnimationStyle {
  FADE = 'fade',
  SLIDE_LEFT = 'slide_left',
  SLIDE_RIGHT = 'slide_right',
  ZOOM_IN = 'zoom_in',
  ZOOM_OUT = 'zoom_out',
  NONE = 'none'
}

export enum VideoResolution {
  HD_720P = '1280x720',
  FHD_1080P = '1920x1080'
}

export interface SubtitleLine {
  id: number;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
}

export interface MediaFile {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  type: 'image' | 'audio' | 'subtitle';
}

export interface ProcessingStatus {
  state: 'idle' | 'analyzing' | 'rendering' | 'completed' | 'error';
  progress: number; // 0 to 100
  message: string;
  resultUrl?: string;
  error?: string;
}

export interface ProjectConfig {
  resolution: VideoResolution;
  animation: AnimationStyle;
  randomizeOrder: boolean;
}