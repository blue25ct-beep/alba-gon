import React, { useRef, useState, useEffect } from 'react';
import { Camera, Check, X, Plus } from 'lucide-react';
import { soundManager } from '../services/sound';

interface PhotoCaptureModalProps {
  barcode: string;
  onCaptured: (photos: string[]) => void;
  onSkip: () => void;
  onClose: () => void;
}

export const PhotoCaptureModal: React.FC<PhotoCaptureModalProps> = ({
  barcode,
  onCaptured,
  onSkip,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [streamActive, setStreamActive] = useState(false);

  useEffect(() => {
    soundManager.playAlert();
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 800 }, height: { ideal: 800 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setStreamActive(true);
        }
      } catch {
        setStreamActive(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCaptureSnapshot = () => {
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
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setCapturedPhotos((prev) => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleConfirm = () => {
    if (capturedPhotos.length > 0) {
      onCaptured(capturedPhotos);
    } else {
      onSkip();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/30 backdrop-blur-[2px] p-0 sm:p-5">
      <div className="bg-surface rounded-t-3xl sm:rounded-3xl w-full max-w-sm shadow-xl animate-rise flex flex-col max-h-[90vh]">
        <div className="p-6 pb-4 flex justify-between items-start gap-4 shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-ink">처음 보는 상품입니다</h2>
            <p className="mt-1 text-[13px] text-ink-faint tabular">{barcode}</p>
            <p className="mt-2 text-sm text-ink-soft leading-relaxed break-keep">
              상품을 여러 각도에서 찍어두면 관리가 편해집니다.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="w-9 h-9 -mr-2 -mt-1 rounded-full text-ink-faint hover:text-ink hover:bg-sunken flex items-center justify-center shrink-0 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 shrink-0">
          <div className="relative aspect-square bg-sunken rounded-2xl overflow-hidden flex items-center justify-center">
            {streamActive ? (
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            ) : (
              <div className="text-center px-6">
                <Camera className="w-7 h-7 text-ink-faint mx-auto mb-2" />
                <p className="text-sm text-ink-soft">카메라를 열 수 없습니다</p>
                <label className="mt-3 inline-flex h-10 px-4 items-center justify-center rounded-full bg-surface text-sm font-medium text-ink-soft hover:text-ink transition-colors cursor-pointer">
                  앨범에서 선택
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {capturedPhotos.length > 0 && (
          <div className="px-6 py-4 flex gap-2 overflow-x-auto shrink-0">
            {capturedPhotos.map((p, idx) => (
              <div key={idx} className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-line">
                <img src={p} alt={'촬영본 ' + (idx + 1)} className="w-full h-full object-cover" />
                <button
                  onClick={() => setCapturedPhotos((prev) => prev.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 w-5 h-5 bg-ink/50 text-white rounded-full flex items-center justify-center text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="p-6 shrink-0">
          {capturedPhotos.length === 0 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSkip}
                className="h-12 px-5 rounded-full text-sm font-medium text-ink-soft hover:bg-sunken shrink-0 transition-colors"
              >
                건너뛰기
              </button>
              {streamActive ? (
                <button
                  type="button"
                  onClick={handleCaptureSnapshot}
                  className="flex-1 h-12 rounded-full bg-sage hover:bg-sage-deep text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  촬영
                </button>
              ) : (
                <label className="flex-1 h-12 rounded-full bg-sage hover:bg-sage-deep text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer">
                  <Camera className="w-4 h-4" />
                  파일 선택
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {streamActive ? (
                  <button
                    type="button"
                    onClick={handleCaptureSnapshot}
                    className="h-12 px-5 rounded-full bg-sunken text-ink-soft hover:text-ink text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    추가 촬영
                  </button>
                ) : (
                  <label className="h-12 px-5 rounded-full bg-sunken text-ink-soft hover:text-ink text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer">
                    <Plus className="w-4 h-4" />
                    추가 선택
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 h-12 rounded-full bg-sage hover:bg-sage-deep text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  저장하고 수량 입력
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
