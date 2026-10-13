import React, { useState } from 'react';
import { X, Lock, Bell, Users, ShoppingBag, Zap, Plus, Trash2, Send, Check } from 'lucide-react';
import { storageService } from '../services/storage';
import { cloudSyncService } from '../services/cloudSyncService';
import { WorkerAuth } from '../types';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const current = storageService.getSettings();

  // 1. 관리자 보안
  const [managerPin, setManagerPin] = useState(current.managerPin || '1180');

  // 2. 디스코드 알림
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState(current.discordWebhookUrl || '');
  const [testingDiscord, setTestingDiscord] = useState(false);
  const [discordTestStatus, setDiscordTestStatus] = useState<string | null>(null);

  // 3. 근무자 관리
  const [workers, setWorkers] = useState<WorkerAuth[]>(
    current.workers && current.workers.length > 0
      ? current.workers
      : [
          { id: '6850', name: '하진현' },
          { id: '0280', name: '정금희' },
          { id: '4041', name: '손명원' },
          { id: '1311', name: '김승곤' },
        ]
  );
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerId, setNewWorkerId] = useState('');
  const [workerName, setWorkerName] = useState(current.workerName || '주간알바');

  // 4. 발주처 계정
  const [younmeId, setYounmeId] = useState(current.younmeId || '1060');
  const [younmePw, setYounmePw] = useState(current.younmePw || '');
  const [spchainId, setSpchainId] = useState(current.spchainId || '047458');
  const [spchainPw, setSpchainPw] = useState(current.spchainPw || '0474581227');

  // 5. 자동발주 토글
  const [autoOrderEnabled, setAutoOrderEnabled] = useState(
    current.autoOrderEnabled !== undefined ? current.autoOrderEnabled : true
  );

  const [saved, setSaved] = useState(false);
  const productCount = storageService.getProducts().length;

  // 디스코드 웹훅 테스트 발송
  const handleTestDiscord = async () => {
    const trimmedUrl = discordWebhookUrl.trim();
    if (!trimmedUrl) {
      setDiscordTestStatus('URL을 입력해주세요.');
      setTimeout(() => setDiscordTestStatus(null), 3000);
      return;
    }

    setTestingDiscord(true);
    setDiscordTestStatus(null);
    try {
      const res = await fetch(trimmedUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '🔔 **[테스트 알림]** 편의점 알바곤 디스코드 알림이 성공적으로 연동되었습니다! (점장님 설정 확인)',
        }),
      });
      if (res.ok || res.status === 204) {
        setDiscordTestStatus('✅ 테스트 알림 전송 성공!');
      } else {
        setDiscordTestStatus(`❌ 전송 실패 (오류 코드: ${res.status})`);
      }
    } catch {
      setDiscordTestStatus('❌ 전송 실패 (웹훅 URL을 다시 확인해주세요)');
    } finally {
      setTestingDiscord(false);
      setTimeout(() => setDiscordTestStatus(null), 3500);
    }
  };

  // 근무자 추가
  const handleAddWorker = () => {
    const name = newWorkerName.trim();
    const id = newWorkerId.trim().replace(/[^0-9]/g, '');

    if (!name) {
      alert('근무자 이름을 입력해주세요.');
      return;
    }
    if (id.length !== 4) {
      alert('전화번호 뒷자리 4자리를 정확히 입력해주세요.');
      return;
    }
    if (workers.some((w) => w.id === id)) {
      alert('이미 동일한 4자리 번호의 근무자가 등록되어 있습니다.');
      return;
    }

    setWorkers([...workers, { id, name }]);
    setNewWorkerName('');
    setNewWorkerId('');
  };

  // 근무자 삭제
  const handleRemoveWorker = (id: string, name: string) => {
    if (confirm(`'${name}' 근무자를 목록에서 삭제하시겠습니까?`)) {
      setWorkers(workers.filter((w) => w.id !== id));
    }
  };

  // 설정 저장
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const pin = managerPin.trim() || '1180';
    if (pin.length !== 4) {
      alert('관리자 비밀번호는 숫자 4자리여야 합니다.');
      return;
    }

    const updatedSettings = {
      managerPin: pin,
      discordWebhookUrl: discordWebhookUrl.trim(),
      workerName: workerName.trim() || '주간알바',
      workers,
      younmeId: younmeId.trim(),
      younmePw: younmePw.trim(),
      spchainId: spchainId.trim(),
      spchainPw: spchainPw.trim(),
      autoOrderEnabled,
    };

    storageService.saveSettings(updatedSettings);
    cloudSyncService.publishSettings(updatedSettings);
    cloudSyncService.publishAuthList(workers);

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 700);
  };

  const inputClass =
    'w-full h-10 px-3 rounded-xl bg-canvas border border-line text-[14px] text-ink placeholder:text-ink-faint focus:outline-none focus:border-sage transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-[2px] p-3 sm:p-5">
      <div className="bg-surface rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-rise">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-line flex justify-between items-center bg-surface sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-ink">관리자 설정</h2>
            <p className="text-[12px] text-ink-faint mt-0.5">매장 운영 보안, 알림 및 발주처 계정을 관리합니다.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="w-9 h-9 -mr-2 rounded-full text-ink-faint hover:text-ink hover:bg-sunken flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 (스크롤) */}
        <form onSubmit={handleSave} className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
          {/* 1. 관리자 보안 */}
          <div className="bg-sunken/40 rounded-2xl p-4 border border-line/70 space-y-3">
            <div className="flex items-center gap-2 text-ink">
              <Lock className="w-4 h-4 text-sage" />
              <h3 className="text-[14px] font-bold">관리자 보안 (비밀번호)</h3>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] text-ink-soft">관리자 접속 PIN (4자리)</p>
                <p className="text-[11px] text-ink-faint">관리자 화면 및 설정에 진입할 때 입력합니다.</p>
              </div>
              <div className="w-32">
                <input
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  value={managerPin}
                  onChange={(e) => setManagerPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className={`${inputClass} text-center font-bold text-lg tracking-[0.3em]`}
                  placeholder="1180"
                />
              </div>
            </div>
          </div>

          {/* 2. 디스코드 알림 연동 */}
          <div className="bg-sunken/40 rounded-2xl p-4 border border-line/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-ink">
                <Bell className="w-4 h-4 text-sage" />
                <h3 className="text-[14px] font-bold">디스코드 알림 연동</h3>
              </div>
              <button
                type="button"
                onClick={handleTestDiscord}
                disabled={testingDiscord}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-line text-xs font-medium text-ink-soft hover:bg-sunken hover:text-ink transition-colors disabled:opacity-50"
              >
                <Send className="w-3 h-3 text-sage" />
                <span>{testingDiscord ? '전송 중...' : '알림 테스트'}</span>
              </button>
            </div>
            <p className="text-[12px] text-ink-faint">
              발주 완료 및 실시간 스캔 알림을 전송할 디스코드 채널의 웹훅 URL입니다.
            </p>
            <input
              type="url"
              value={discordWebhookUrl}
              onChange={(e) => setDiscordWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className={inputClass}
            />
            {discordTestStatus && (
              <p className="text-[12px] font-medium transition-all text-sage-deep">{discordTestStatus}</p>
            )}
          </div>

          {/* 3. 근무자 관리 */}
          <div className="bg-sunken/40 rounded-2xl p-4 border border-line/70 space-y-3">
            <div className="flex items-center gap-2 text-ink">
              <Users className="w-4 h-4 text-sage" />
              <h3 className="text-[14px] font-bold">근무자(알바생) 관리</h3>
            </div>
            <p className="text-[12px] text-ink-faint">
              알바생이 앱에 접속했을 때 본인 번호(뒷자리 4자리)로 로그인하여 실사를 시작합니다.
            </p>

            {/* 등록된 근무자 목록 뱃지 */}
            <div className="flex flex-wrap gap-2 pt-1">
              {workers.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center gap-1.5 bg-surface border border-line px-3 py-1.5 rounded-xl shadow-2xs text-[13px]"
                >
                  <span className="font-semibold text-ink">{w.name}</span>
                  <span className="text-[11px] text-ink-faint font-mono">({w.id})</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveWorker(w.id, w.name)}
                    className="text-ink-faint hover:text-brick ml-1 transition-colors"
                    title="근무자 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {workers.length === 0 && (
                <p className="text-[12px] text-ink-faint italic">등록된 근무자가 없습니다.</p>
              )}
            </div>

            {/* 신규 근무자 추가 입력 */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="이름 (예: 홍길동)"
                value={newWorkerName}
                onChange={(e) => setNewWorkerName(e.target.value)}
                className={`${inputClass} flex-1`}
              />
              <input
                type="text"
                maxLength={4}
                placeholder="번호 4자리"
                value={newWorkerId}
                onChange={(e) => setNewWorkerId(e.target.value.replace(/[^0-9]/g, ''))}
                className={`${inputClass} w-28 text-center font-mono`}
              />
              <button
                type="button"
                onClick={handleAddWorker}
                className="h-10 px-3.5 rounded-xl bg-sage text-white text-xs font-semibold hover:bg-sage-deep flex items-center gap-1 shrink-0 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>추가</span>
              </button>
            </div>

            {/* 기본 근무자 이름 */}
            <div className="pt-2 border-t border-line/60 flex items-center justify-between gap-4">
              <span className="text-[12px] text-ink-soft shrink-0">로그인 미사용 시 기본 표기명</span>
              <input
                type="text"
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                placeholder="주간알바"
                className={`${inputClass} max-w-40 h-8 text-[12px] text-right`}
              />
            </div>
          </div>

          {/* 4. 발주처 로그인 연동 */}
          <div className="bg-sunken/40 rounded-2xl p-4 border border-line/70 space-y-3">
            <div className="flex items-center gap-2 text-ink">
              <ShoppingBag className="w-4 h-4 text-sage" />
              <h3 className="text-[14px] font-bold">발주 사이트 전산 계정</h3>
            </div>
            <p className="text-[12px] text-ink-faint">
              자동 발주 봇이 본사 발주망에 로그인하여 품목을 장바구니에 담을 때 사용합니다.
            </p>

            {/* 유앤미24 */}
            <div className="bg-surface rounded-xl p-3 border border-line space-y-2">
              <span className="text-[13px] font-bold text-sage-deep">🌿 유앤미24 (상온 / 냉장)</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[11px] text-ink-faint mb-1">아이디</span>
                  <input
                    type="text"
                    value={younmeId}
                    onChange={(e) => setYounmeId(e.target.value)}
                    placeholder="1060"
                    className={inputClass}
                  />
                </div>
                <div>
                  <span className="block text-[11px] text-ink-faint mb-1">비밀번호</span>
                  <input
                    type="password"
                    value={younmePw}
                    onChange={(e) => setYounmePw(e.target.value)}
                    placeholder="유앤미 비밀번호"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* 생필체인 */}
            <div className="bg-surface rounded-xl p-3 border border-line space-y-2">
              <span className="text-[13px] font-bold text-blue-600">🍺 생필체인 (주류 / 저온)</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[11px] text-ink-faint mb-1">아이디</span>
                  <input
                    type="text"
                    value={spchainId}
                    onChange={(e) => setSpchainId(e.target.value)}
                    placeholder="047458"
                    className={inputClass}
                  />
                </div>
                <div>
                  <span className="block text-[11px] text-ink-faint mb-1">비밀번호</span>
                  <input
                    type="password"
                    value={spchainPw}
                    onChange={(e) => setSpchainPw(e.target.value)}
                    placeholder="0474581227"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5. 자동 발주 옵션 */}
          <div className="bg-sunken/40 rounded-2xl p-4 border border-line/70 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-ink">
                <Zap className="w-4 h-4 text-sage" />
                <h3 className="text-[14px] font-bold">자동 발주 활성화</h3>
              </div>
              <p className="text-[12px] text-ink-faint break-keep">
                근무자 스캔 종료 30분 무반응 시, 검수된 품목에 대해 봇이 장바구니 담기를 자동으로 실행합니다.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={autoOrderEnabled}
                onChange={(e) => setAutoOrderEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-line after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
            </label>
          </div>
        </form>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-line bg-surface flex items-center justify-between gap-3 sticky bottom-0">
          <div className="text-[12px] text-ink-faint">
            등록된 마스터 상품 <span className="font-bold text-ink font-mono">{productCount}</span>개
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl text-sm font-medium text-ink-soft hover:bg-sunken transition-colors"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="h-10 px-6 rounded-xl bg-sage hover:bg-sage-deep text-white text-sm font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>저장되었습니다</span>
                </>
              ) : (
                <span>설정 저장</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
