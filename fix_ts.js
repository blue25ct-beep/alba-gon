const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/PhotoCaptureModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const bad1 = `{streamActive ? (
                  {capturedPhotos.length < 3 && (
                  <button`;
const fix1 = `{streamActive ? (
                  capturedPhotos.length < 3 && (
                  <button`;

const bad2 = `)}
                ) : (
                  {capturedPhotos.length < 3 && (
                  <label`;
const fix2 = `)}
                ) : (
                  capturedPhotos.length < 3 && (
                  <label`;

content = content.replace(bad1, fix1).replace(bad2, fix2);
fs.writeFileSync(file, content, 'utf8');
