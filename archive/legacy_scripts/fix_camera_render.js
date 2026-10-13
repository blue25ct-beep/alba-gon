const fs = require('fs');

const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/PhotoCaptureModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldRender = `          <div className="relative aspect-square bg-sunken rounded-2xl overflow-hidden flex items-center justify-center">
            {streamActive ? (
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            ) : (
              <div className="text-center px-6">
                <Camera className="w-7 h-7 text-ink-faint mx-auto mb-2" />
                <p className="text-sm text-ink-soft">카메라를 열 수 없습니다</p>`;

const newRender = `          <div className="relative aspect-square bg-sunken rounded-2xl overflow-hidden flex items-center justify-center">
            <video ref={videoRef} className={\`w-full h-full object-cover \${streamActive ? '' : 'hidden'}\`} playsInline muted autoPlay />
            {!streamActive && (
              <div className="text-center px-6">
                <Camera className="w-7 h-7 text-ink-faint mx-auto mb-2" />
                <p className="text-sm text-ink-soft">카메라를 열 수 없습니다</p>`;

content = content.replace(oldRender, newRender);

const oldVideoPlay = `        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setStreamActive(true);
        }`;

const newVideoPlay = `        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error('Video play error:', e));
          setStreamActive(true);
        }`;

content = content.replace(oldVideoPlay, newVideoPlay);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed PhotoCaptureModal video element rendering and playback');
