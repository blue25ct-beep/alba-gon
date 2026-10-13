const fs = require('fs');
const file = 'C:/Users/김진곤/Downloads/alba-gon/client/src/components/PhotoCaptureModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="flex flex-col gap-2">[\s\S]*?<Check className="w-4 h-4" \/>/m;

const correctBlock = `<div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {streamActive ? (
                  capturedPhotos.length < 3 ? (
                    <button
                      type="button"
                      onClick={handleCaptureSnapshot}
                      className="h-12 px-5 rounded-full bg-sunken text-ink-soft hover:text-ink text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      추가 촬영
                    </button>
                  ) : null
                ) : (
                  capturedPhotos.length < 3 ? (
                    <label className="h-12 px-5 rounded-full bg-sunken text-ink-soft hover:text-ink text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer">
                      <Plus className="w-4 h-4" />
                      추가 촬영
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  ) : null
                )}
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 h-12 rounded-full bg-sage hover:bg-sage-deep text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <Check className="w-4 h-4" />`;

content = content.replace(regex, correctBlock);
fs.writeFileSync(file, content, 'utf8');
