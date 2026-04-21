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
        <div className="omnibar-prefix">✧</div>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Truyền đạt ý niệm để vạn vật khởi sinh..."
          className="omnibar-input"
        />
        <div className="omnibar-hint">Tĩnh Tâm & Khởi Tạo (Enter)</div>
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
          padding: 8px 24px;
          background: rgba(13, 12, 11, 0.9);
          border: 1px solid rgba(203, 163, 101, 0.2);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
          border-radius: 4px;
          transition: all 0.4s ease;
        }
        
        .omnibar-form:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 30px rgba(203, 163, 101, 0.15);
        }

        .omnibar-prefix {
          font-size: 24px;
          color: var(--accent);
          opacity: 0.8;
          font-weight: 300;
        }

        .omnibar-input {
          flex: 1;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          font-size: 18px;
          padding: 12px 0;
          color: var(--foreground);
          letter-spacing: normal;
        }
        
        .omnibar-input::placeholder {
          color: rgba(166, 156, 138, 0.5);
          font-style: italic;
          letter-spacing: normal;
        }

        .omnibar-hint {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--accent);
          opacity: 0.6;
          font-weight: normal;
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
