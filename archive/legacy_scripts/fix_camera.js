const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/BarcodeScanner.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `        // 후면 카메라 우선
        const selectedDevice =
          videoInputDevices.find(
            (device) =>
              device.label.toLowerCase().includes('back') ||
              device.label.toLowerCase().includes('후면') ||
              device.label.toLowerCase().includes('rear')
          ) || videoInputDevices[0];

        if (videoRef.current && active) {
          const controls = await codeReader.decodeFromConstraints(
            {
              video: {
                deviceId: selectedDevice.deviceId,
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                advanced: [{ focusMode: "continuous" } as any]
              }
            },`;

const newStr = `        // iOS 사파리 등에서 권한 최초 허용 시 라벨이 비어있는 현상 대응
        const hasEmptyLabels = videoInputDevices.every(d => !d.label || d.label.trim() === '');
        
        // 후면 카메라 우선 찾기
        const backCamera = videoInputDevices.find(
          (device) =>
            device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('후면') ||
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment')
        );

        let videoConstraints: any = {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          advanced: [{ focusMode: "continuous" } as any]
        };

        if (hasEmptyLabels) {
          // 라벨이 없으면 브라우저 네이티브 후면 카메라(environment) 선택 우선
          videoConstraints.facingMode = { ideal: "environment" };
        } else if (backCamera) {
          videoConstraints.deviceId = { exact: backCamera.deviceId };
        } else {
          // 백카메라를 명시적으로 못 찾았을 경우에도 후면 우선
          videoConstraints.facingMode = { ideal: "environment" };
        }

        if (videoRef.current && active) {
          const controls = await codeReader.decodeFromConstraints(
            { video: videoConstraints },`;

if (content.includes('const selectedDevice =')) {
  content = content.replace(targetStr, newStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed iOS camera issue in BarcodeScanner.tsx');
} else {
  console.log('Target string not found');
}
