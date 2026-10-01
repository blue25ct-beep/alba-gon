const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/BarcodeScanner.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldDeviceSelection = `        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (videoInputDevices.length === 0) {
          setCameraError('카메라를 찾을 수 없습니다.');
          return;
        }

        // 후면 카메라 우선
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

const newDeviceSelection = `        if (videoRef.current && active) {
          const controls = await codeReader.decodeFromConstraints(
            {
              video: {
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                advanced: [{ focusMode: "continuous" } as any]
              }
            },`;

content = content.replace(oldDeviceSelection, newDeviceSelection);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed iPhone front camera issue in BarcodeScanner');
