// The two video shapes the app makes, in output pixels.
export const FORMATS = [
  { id: 'portrait', label: '9:16', hint: 'TikTok, Reels, Shorts', width: 1080, height: 1920 },
  { id: 'landscape', label: '16:9', hint: 'YouTube', width: 1920, height: 1080 },
];

export const formatById = (id) => FORMATS.find((f) => f.id === id) ?? FORMATS[0];
