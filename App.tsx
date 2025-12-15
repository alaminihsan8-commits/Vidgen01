import React, { useState, useEffect, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { TimelinePreview } from './components/TimelinePreview';
import { parseSRT } from './utils/srtParser';
import { ffmpegService } from './services/ffmpegService';
import { 
  MediaFile, 
  SubtitleLine, 
  ProcessingStatus, 
  ProjectConfig, 
  AnimationStyle, 
  VideoResolution 
} from './types';

// Icons
const IconImage = () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const IconAudio = () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>;
const IconSub = () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>;
const IconVideo = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const IconRefresh = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const IconTrash = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

export default function App() {
  const [images, setImages] = useState<MediaFile[]>([]);
  const [audio, setAudio] = useState<MediaFile | null>(null);
  const [subtitles, setSubtitles] = useState<SubtitleLine[]>([]);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  
  const [config, setConfig] = useState<ProjectConfig>({
    resolution: VideoResolution.FHD_1080P,
    animation: AnimationStyle.FADE,
    randomizeOrder: false
  });

  const [status, setStatus] = useState<ProcessingStatus>({
    state: 'idle',
    progress: 0,
    message: ''
  });

  // Handle Images
  const handleImages = (files: File[]) => {
    const newImages = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      type: 'image' as const
    }));
    setImages(prev => config.randomizeOrder 
      ? [...prev, ...newImages].sort(() => Math.random() - 0.5) 
      : [...prev, ...newImages]
    );
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  // Handle Audio
  const handleAudio = (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    const url = URL.createObjectURL(file);
    
    // Get duration
    const audioObj = new Audio(url);
    audioObj.onloadedmetadata = () => {
      setAudioDuration(audioObj.duration);
    };

    setAudio({
      id: 'audio-main',
      file,
      previewUrl: url,
      name: file.name,
      type: 'audio'
    });
  };

  // Handle Subtitles
  const handleSubtitles = (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseSRT(content);
      setSubtitles(parsed);
    };
    reader.readAsText(file);
  };

  // Generate Video
  const handleGenerate = async () => {
    if (images.length === 0 || !audio) return;
    
    setStatus({ state: 'analyzing', progress: 0, message: 'Initializing engine...' });
    
    try {
      const blob = await ffmpegService.generateVideo(
        images, 
        audio, 
        subtitles, 
        config, 
        audioDuration,
        (progress, message) => {
          setStatus({ state: 'rendering', progress, message });
        }
      );

      const url = URL.createObjectURL(blob);
      setStatus({ 
        state: 'completed', 
        progress: 100, 
        message: 'Video generated successfully!',
        resultUrl: url
      });

    } catch (error: any) {
      console.error(error);
      setStatus({ 
        state: 'error', 
        progress: 0, 
        message: 'Failed to generate video',
        error: error.message 
      });
    }
  };

  const resetProject = () => {
    setImages([]);
    setAudio(null);
    setSubtitles([]);
    setAudioDuration(0);
    setStatus({ state: 'idle', progress: 0, message: '' });
  };

  // Randomize toggle effect
  useEffect(() => {
    if (config.randomizeOrder) {
      setImages(prev => [...prev].sort(() => Math.random() - 0.5));
    }
  }, [config.randomizeOrder]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      
      {/* Sidebar / Configuration */}
      <aside className="w-full md:w-96 bg-slate-950 border-r border-slate-800 flex flex-col h-screen sticky top-0 overflow-y-auto">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <IconVideo />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              AutoSlide AI
            </h1>
          </div>
          <p className="text-xs text-slate-500">Intelligent Video Generator</p>
        </div>

        <div className="p-6 space-y-8 flex-1">
          {/* Settings Group */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Configuration</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Resolution</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={config.resolution}
                  onChange={(e) => setConfig({...config, resolution: e.target.value as VideoResolution})}
                >
                  <option value={VideoResolution.FHD_1080P}>1080p Full HD (1920x1080)</option>
                  <option value={VideoResolution.HD_720P}>720p HD (1280x720)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Animation Style</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={config.animation}
                  onChange={(e) => setConfig({...config, animation: e.target.value as AnimationStyle})}
                >
                  <option value={AnimationStyle.FADE}>Simple Fade</option>
                  <option value={AnimationStyle.ZOOM_IN}>Ken Burns (Zoom In)</option>
                  <option value={AnimationStyle.ZOOM_OUT}>Ken Burns (Zoom Out)</option>
                  <option value={AnimationStyle.SLIDE_LEFT}>Slide Left</option>
                  <option value={AnimationStyle.NONE}>No Animation</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="randomize"
                  checked={config.randomizeOrder}
                  onChange={(e) => setConfig({...config, randomizeOrder: e.target.checked})}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="randomize" className="text-sm text-slate-300">Randomize Image Order</label>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Images</span>
              <span className="font-mono">{images.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Audio Duration</span>
              <span className="font-mono">{audioDuration.toFixed(1)}s</span>
            </div>
            <div className="flex justify-between text-sm border-t border-slate-800 pt-2">
              <span className="text-blue-400 font-medium">Time per Image</span>
              <span className="font-mono text-blue-400">
                {images.length > 0 && audioDuration > 0 
                  ? (audioDuration / images.length).toFixed(2) 
                  : '0.00'}s
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800">
          <button
            onClick={handleGenerate}
            disabled={status.state === 'rendering' || images.length === 0 || !audio}
            className={`
              w-full py-3 px-4 rounded-lg font-bold text-sm shadow-lg shadow-blue-900/20
              flex items-center justify-center gap-2 transition-all
              ${status.state === 'rendering' 
                ? 'bg-slate-700 cursor-not-allowed text-slate-400' 
                : images.length === 0 || !audio
                  ? 'bg-slate-800 cursor-not-allowed text-slate-500'
                  : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-[1.02]'
              }
            `}
          >
            {status.state === 'rendering' ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : 'Generate Video'}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-sm z-10">
          <h2 className="font-medium text-slate-300">Workspace</h2>
          <div className="flex gap-4">
             {status.state !== 'idle' && status.state !== 'completed' && (
                <div className="flex items-center gap-2 bg-blue-900/20 px-3 py-1 rounded-full border border-blue-900/50">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <span className="text-xs text-blue-400 font-medium">{status.message} ({Math.round(status.progress)}%)</span>
                </div>
             )}
             <button onClick={resetProject} className="text-slate-500 hover:text-red-400 transition-colors" title="Reset Project">
               <IconRefresh />
             </button>
          </div>
        </header>

        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {/* Top Row: Audio & Subtitles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Audio Upload */}
            <div className="space-y-3">
               <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                 <span className="w-2 h-2 bg-indigo-500 rounded-full"></span> Audio Track (Required)
               </h3>
               {!audio ? (
                 <FileUpload 
                   accept="audio/*" 
                   label="Drop Audio File" 
                   subLabel="MP3, WAV"
                   icon={<IconAudio />}
                   onFilesSelected={handleAudio}
                 />
               ) : (
                 <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between group">
                   <div className="flex items-center gap-3 overflow-hidden">
                     <div className="w-10 h-10 bg-indigo-900/50 rounded-lg flex items-center justify-center text-indigo-400">
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                     </div>
                     <div className="min-w-0">
                       <p className="font-medium text-slate-200 truncate">{audio.name}</p>
                       <p className="text-xs text-slate-500">{audioDuration.toFixed(1)}s • MP3/WAV</p>
                     </div>
                   </div>
                   <button onClick={() => { setAudio(null); setAudioDuration(0); }} className="text-slate-500 hover:text-red-400 p-2">
                     <IconTrash />
                   </button>
                 </div>
               )}
            </div>

            {/* Subtitle Upload */}
            <div className="space-y-3">
               <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                 <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Subtitles (Optional)
               </h3>
               {subtitles.length === 0 ? (
                 <FileUpload 
                   accept=".srt" 
                   label="Drop SRT File" 
                   subLabel="Standard Subtitle Format"
                   icon={<IconSub />}
                   onFilesSelected={handleSubtitles}
                 />
               ) : (
                 <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-emerald-900/50 rounded-lg flex items-center justify-center text-emerald-400">
                       <span className="font-bold text-xs">CC</span>
                     </div>
                     <div>
                       <p className="font-medium text-slate-200">{subtitles.length} Lines Parsed</p>
                       <p className="text-xs text-slate-500">Auto-sync active</p>
                     </div>
                   </div>
                   <button onClick={() => setSubtitles([])} className="text-slate-500 hover:text-red-400 p-2">
                     <IconTrash />
                   </button>
                 </div>
               )}
            </div>
          </div>

          {/* Timeline Analysis */}
          <TimelinePreview images={images} audioDuration={audioDuration} subtitles={subtitles} />

          {/* Image Grid */}
          <div className="space-y-3">
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Visuals ({images.length})
                </h3>
                {images.length > 0 && (
                  <button onClick={() => setImages([])} className="text-xs text-red-400 hover:text-red-300">Clear All</button>
                )}
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
               {/* Upload Button Card */}
               <FileUpload 
                 accept="image/*" 
                 label="Add Images"
                 icon={<IconImage />}
                 onFilesSelected={handleImages}
                 multiple={true}
                 compact={true}
               />

               {/* Image Cards */}
               {images.map((img, idx) => (
                 <div key={img.id} className="group relative aspect-video bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-blue-500 transition-colors">
                   <img src={img.previewUrl} alt={img.name} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <span className="text-xs font-mono text-white bg-black/50 px-2 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      <button 
                        onClick={() => removeImage(img.id)}
                        className="p-1.5 bg-red-500/80 text-white rounded-full hover:bg-red-600"
                      >
                        <IconTrash />
                      </button>
                   </div>
                   <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-[10px] text-slate-300 truncate">{img.name}</p>
                   </div>
                 </div>
               ))}
             </div>
          </div>

          {/* Render Output Area */}
          {status.resultUrl && (
            <div className="border-t border-slate-800 pt-8 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-green-500">✔</span> Ready for Download
              </h3>
              <div className="bg-black/40 rounded-xl overflow-hidden border border-slate-700 max-w-2xl mx-auto shadow-2xl">
                 {/* 
                    NOTE: This is a simulated output container. 
                    In a real FFmpeg scenario, the blob URL would play the actual generated video.
                    Here we show a placeholder for the demo since we can't ship heavy binaries.
                  */}
                 <div className="aspect-video bg-slate-900 flex items-center justify-center relative">
                    <p className="text-slate-500 text-sm p-8 text-center">
                      <span className="block mb-2 text-xl font-bold text-slate-300">Video Generated</span>
                      The browser successfully simulated the rendering pipeline.<br/>
                      (Real playback requires enabling shared array buffers on the host)
                    </p>
                    {/* Actual video element if blob was real MP4 */}
                    {/* <video src={status.resultUrl} controls className="w-full h-full" /> */}
                 </div>
                 <div className="p-4 bg-slate-800 flex justify-end gap-3">
                   <a 
                    href={status.resultUrl} 
                    download="autostlide_video.mp4"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                     Download MP4
                   </a>
                 </div>
              </div>
            </div>
          )}

          {status.state === 'error' && (
             <div className="bg-red-900/20 border border-red-900/50 p-4 rounded-lg text-red-200 text-sm">
               <strong>Error:</strong> {status.error}
             </div>
          )}

        </div>
      </main>
    </div>
  );
}