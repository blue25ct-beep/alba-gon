import React, { useState } from 'react';
import { Store, Shield, Settings, User } from 'lucide-react';
import { PinModal } from './PinModal';
import { SettingsModal } from './SettingsModal';

interface HeaderProps {
  currentMode: 'WORKER' | 'ADMIN';
  onSwitchMode: (mode: 'WORKER' | 'ADMIN') => void;
  title?: string;
  theme?: 'sage' | 'blue' | 'neutral';
}

export const Header: React.FC<HeaderProps> = ({ currentMode, onSwitchMode, title, theme = 'neutral' }) => {
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'SWITCH_ADMIN' | 'OPEN_SETTINGS' | null>(null);

  const handleAdminClick = () => {
    if (currentMode === 'ADMIN') {
      onSwitchMode('WORKER');
    } else {
      setPendingAction('SWITCH_ADMIN');
      setShowPinModal(true);
    }
  };

  const handleSettingsClick = () => {
    setPendingAction('OPEN_SETTINGS');
    setShowPinModal(true);
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    if (pendingAction === 'SWITCH_ADMIN') {
      onSwitchMode('ADMIN');
    } else if (pendingAction === 'OPEN_SETTINGS') {
      setShowSettingsModal(true);
    }
    setPendingAction(null);
  };

  return (
    <>
      <header className={`text-white sticky top-0 z-[60] shadow-md ${theme === "blue" ? "bg-blue-600" : theme === "sage" ? "bg-sage" : "bg-ink"}`}>
        <div className="max-w-5xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 ${theme === "blue" ? "text-blue-600" : theme === "sage" ? "text-sage" : "text-ink"}`}>
              <Store className="w-[18px] h-[18px]" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-[16px] text-white truncate">{title || "편의점 자동발주"}</h1>
              
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleSettingsClick}
              title="설정"
              aria-label="설정"
              className={`w-9 h-9 rounded-full hover:text-white flex items-center justify-center transition-colors ${theme === "blue" ? "text-blue-100 hover:bg-blue-500" : theme === "sage" ? "text-sage-100 hover:bg-sage-deep" : "text-line hover:bg-ink-soft"}`}
            >
              <Settings className="w-[18px] h-[18px]" />
            </button>

            <button
              onClick={handleAdminClick}
              className={`flex items-center gap-2 h-9 px-4 rounded-full text-sm font-medium transition-colors ${
                currentMode === 'ADMIN'
                  ? 'text-blue-100 hover:text-white hover:bg-blue-500'
                  : 'bg-white text-blue-600 hover:bg-blue-50'
              }`}
            >
              {currentMode === 'ADMIN' ? (
                <>
                  <User className="w-4 h-4" />
                  <span>실사 화면</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>관리</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {showPinModal && (
        <PinModal
          onSuccess={handlePinSuccess}
          onClose={() => {
            setShowPinModal(false);
            setPendingAction(null);
          }}
        />
      )}

      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} />
      )}
    </>
  );
};
