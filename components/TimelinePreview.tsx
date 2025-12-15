import React from 'react';
import { MediaFile, SubtitleLine } from '../types';

interface TimelinePreviewProps {
  images: MediaFile[];
  audioDuration: number;
  subtitles: SubtitleLine[];
}

export const TimelinePreview: React.FC<TimelinePreviewProps> = ({ 
  images, 
  audioDuration, 
  subtitles 
}) => {
  if (images.length === 0 || audioDuration === 0) return null;

  const durationPerImage = audioDuration / images.length;

  return (
    <div className="w-full bg-slate-900 rounded-lg p-4 border border-slate-800 overflow-hidden">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Timeline Analysis</h3>
        <span className="text-xs text-slate-400">Total: {audioDuration.toFixed(1)}s</span>
      </div>
      
      {/* Timeline Track */}
      <div className="relative h-24 w-full bg-slate-950 rounded border border-slate-800 flex overflow-x-auto overflow-y-hidden custom-scrollbar">
        {images.map((img, idx) => (
          <div 
            key={img.id}
            className="flex-shrink-0 relative h-full border-r border-slate-800 group"
            style={{ width: '100px' }} 
          >
            {/* Image Strip */}
            <div className="h-2/3 w-full overflow-hidden">
              <img 
                src={img.previewUrl} 
                alt="thumb" 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
              />
            </div>
            
            {/* Time Indicator */}
            <div className="absolute top-1 left-1 bg-black/70 px-1 rounded text-[9px] text-white">
              {(idx * durationPerImage).toFixed(1)}s
            </div>

            {/* Subtitle Dots */}
            <div className="h-1/3 w-full bg-slate-900/50 relative border-t border-slate-800">
              {subtitles.map(sub => {
                const imgStart = idx * durationPerImage;
                const imgEnd = (idx + 1) * durationPerImage;
                
                // Check if subtitle overlaps this image block
                if (sub.startTime < imgEnd && sub.endTime > imgStart) {
                   return (
                     <div 
                      key={sub.id} 
                      className="absolute top-1 bottom-1 bg-blue-500/30 rounded-sm border-l border-blue-500"
                      style={{
                        left: '0%', 
                        right: '0%',
                        fontSize: '8px',
                        padding: '2px',
                        color: '#60a5fa',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden'
                      }}
                     >
                       <span className="scale-75 origin-left block">{sub.text.substring(0, 10)}...</span>
                     </div>
                   )
                }
                return null;
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-slate-500 flex justify-between">
        <span>Display Time: {durationPerImage.toFixed(2)}s / image</span>
        <span>{images.length} Frames</span>
      </div>
    </div>
  );
};