const fs = require('fs');

let file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/PhotoCaptureModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldCapture = `  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const newPhoto = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedPhotos((prev) => [...prev, newPhoto]);
    }
  };`;

const newCapture = `  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    let width = videoRef.current.videoWidth || 640;
    let height = videoRef.current.videoHeight || 480;
    
    const MAX_SIZE = 600;
    if (width > height && width > MAX_SIZE) {
      height *= MAX_SIZE / width;
      width = MAX_SIZE;
    } else if (height > MAX_SIZE) {
      width *= MAX_SIZE / height;
      height = MAX_SIZE;
    }
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, width, height);
      const newPhoto = canvas.toDataURL('image/jpeg', 0.6);
      setCapturedPhotos((prev) => [...prev, newPhoto]);
    }
  };`;

content = content.replace(oldCapture, newCapture);

// Also reduce MAX_SIZE to 600 and quality to 0.6 in handleFileChange
content = content.replace(/const MAX_SIZE = 800;/g, 'const MAX_SIZE = 600;');
content = content.replace(/canvas.toDataURL\('image\/jpeg', 0.8\)/g, 'canvas.toDataURL(\'image/jpeg\', 0.6)');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed PhotoCaptureModal compression!');
