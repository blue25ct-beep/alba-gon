const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('ffmpeg path:', ffmpeg.path);

const videoPath = 'C:/Users/김진곤/.gemini/antigravity/brain/2b51445d-37e1-40fd-bacd-4387852181f3/.user_uploaded/media_1793618660890_d22b2e23.mp4';
console.log('Video exists:', fs.existsSync(videoPath));

// Extract frames
const outDir = 'C:/Users/김진곤/.gemini/antigravity/brain/2b51445d-37e1-40fd-bacd-4387852181f3/frames';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Extract 1 frame per second
const cmd = `"${ffmpeg.path}" -i "${videoPath}" -r 1 -q:v 2 "${outDir}/frame_%03d.jpg" -y`;
console.log('Running cmd...');
execSync(cmd);
console.log('Extracted frames count:', fs.readdirSync(outDir).length);
