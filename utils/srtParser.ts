import { SubtitleLine } from '../types';

/**
 * Converts SRT time string (00:00:01,500) to seconds (1.5)
 */
const parseSrtTime = (timeString: string): number => {
  if (!timeString) return 0;
  const parts = timeString.split(':');
  if (parts.length < 3) return 0;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const secondsParts = parts[2].split(',');
  const seconds = parseInt(secondsParts[0], 10);
  const milliseconds = parseInt(secondsParts[1] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
};

/**
 * Parses raw SRT content into an array of SubtitleLine objects
 */
export const parseSRT = (content: string): SubtitleLine[] => {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split('\n\n');
  
  const subtitles: SubtitleLine[] = [];

  blocks.forEach((block) => {
    const lines = block.split('\n').filter(line => line.trim() !== '');
    if (lines.length >= 3) {
      // Line 1: Index (ignored)
      // Line 2: Timecode
      const timecode = lines[1];
      // Line 3+: Text
      const text = lines.slice(2).join('\n');

      const timeParts = timecode.split(' --> ');
      if (timeParts.length === 2) {
        subtitles.push({
          id: subtitles.length + 1,
          startTime: parseSrtTime(timeParts[0]),
          endTime: parseSrtTime(timeParts[1]),
          text: text
        });
      }
    }
  });

  return subtitles;
};