'use client';

import { useState } from 'react';

export default function Omnibar({ onCommand }: { onCommand: (cmd: string) => void }) {
  const [command, setCommand] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      onCommand(command);
      setCommand('');
    }
  };

  return (
    <div className="omnibar-container">
      <form onSubmit={handleSubmit} className="omnibar-form glass-card">
        <div className="omnibar-prefix">✦</div>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Bạn muốn AI làm gì hôm nay? (Vd: Nghiên cứu thị trường podcast...)"
          className="omnibar-input"
        />
        <div className="omnibar-hint">Press Enter to Dispatch</div>
      </form>

      <style jsx>{`
        .omnibar-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          position: sticky;
          top: 24px;
          z-index: 100;
        }

        .omnibar-form {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 8px 16px;
          background: rgba(15, 15, 20, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
        }

        .omnibar-prefix {
          font-size: 20px;
          color: var(--accent);
          filter: drop-shadow(0 0 8px var(--accent-glow));
        }

        .omnibar-input {
          flex: 1;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          font-size: 18px;
          padding: 12px 0;
        }

        .omnibar-hint {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-dim);
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 8px;
          border-radius: 4px;
          opacity: 0.6;
        }

        @media (max-width: 768px) {
          .omnibar-hint {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
