class FeedbackManager {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  private playTone(freq: number, durationSec: number, type: OscillatorType = 'sine', gainVal: number = 0.15) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationSec);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationSec);
    } catch {
      // Audio autoplay blocked or unsupported
    }
  }

  private vibrate(pattern: number | number[]) {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {
      // 진동을 지원하지 않는 기기는 무시
    }
  }

  // 바코드 인식 성공 – 맑은 단음 비프 + 가벼운 진동
  playScanSuccess() {
    this.vibrate(40);
    this.playTone(1320, 0.08, 'sine', 0.12);
  }

  // 수량 저장 완료 – 기분 좋은 2단 상승 차임음 (딩동!) + 진동 피드백
  playSaveSuccess() {
    this.vibrate([30, 40, 30]);
    this.playTone(880, 0.08, 'triangle', 0.15);
    setTimeout(() => {
      this.playTone(1320, 0.12, 'triangle', 0.15);
    }, 70);
  }

  // 미등록/주의 알림 – 두 번 끊어서 확인 신호
  playAlert() {
    this.vibrate([60, 60, 60]);
    this.playTone(440, 0.15, 'sawtooth', 0.1);
  }
}

export const soundManager = new FeedbackManager();
