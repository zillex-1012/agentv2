'use client';

import { Task } from '@/lib/types';
import { agentConfigs } from '@/lib/agents/roles';

interface Props {
  task: Task;
  onClose: () => void;
  onApprove: (taskId: string) => void;
  onReject: (taskId: string, feedback: string) => void;
}

export default function TaskDetailModal({ task, onClose, onApprove, onReject }: Props) {
  const agent = agentConfigs[task.assignee] || { name: task.assignee, coreFrameworks: [] };

  const handleReject = () => {
    const feedback = prompt('Nhập yêu cầu chỉnh sửa cho Agent:');
    if (feedback && feedback.trim()) {
      onReject(task.id, feedback.trim());
    }
  };

  const handleCopy = () => {
    if (task.output) {
      navigator.clipboard.writeText(task.output);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-agent-info">
            <span className={`badge ${task.assignee}`}>{agent.name}</span>
            <div className="modal-frameworks">
              {agent.coreFrameworks?.map((fw: string, i: number) => (
                <span key={i} className="framework-tag">📐 {fw}</span>
              ))}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <h2 className="modal-title">{task.title}</h2>
        
        <div className="modal-section">
          <h4>📋 Mô tả nhiệm vụ</h4>
          <p className="modal-desc">{task.description}</p>
        </div>

        {task.contextData && (
          <div className="modal-section context-passing-alert">
            <h4>🧠 Tính năng Context Passing</h4>
            <p>Agent này đã làm việc dựa trên dữ liệu từ các bước trước đó, không phải làm lại từ đầu.</p>
          </div>
        )}

        {task.output && (
          <div className="modal-section">
            <div className="output-header">
              <h4>📝 Kết quả từ Agent</h4>
              <button className="copy-btn" onClick={handleCopy}>📋 Copy</button>
            </div>
            <div className="modal-output">{task.output}</div>
          </div>
        )}

        {task.isExecuting && (
          <div className="modal-section">
            <div className="executing-indicator">
              <div className="spinner"></div>
              <span>Agent đang làm việc...</span>
            </div>
          </div>
        )}

        {task.feedback && (
          <div className="modal-section">
            <h4>💬 Phản hồi của bạn</h4>
            <p className="modal-feedback">{task.feedback}</p>
          </div>
        )}

        {task.status === 'needs_review' && (
          <div className="modal-actions">
            <button className="action-btn approve-btn" onClick={() => onApprove(task.id)}>
              ✅ Phê duyệt
            </button>
            <button className="action-btn reject-btn" onClick={handleReject}>
              ✏️ Yêu cầu sửa
            </button>
          </div>
        )}

        <style jsx>{`
          .modal-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
            z-index: 1000; display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.2s ease;
          }
          .modal-content {
            width: 90%; max-width: 720px; max-height: 85vh;
            overflow-y: auto; padding: 32px;
            background: rgba(15, 15, 25, 0.95); border: 1px solid rgba(255,255,255,0.1);
          }
          .modal-header {
            display: flex; justify-content: space-between; align-items: flex-start;
            margin-bottom: 20px;
          }
          .modal-agent-info { display: flex; flex-direction: column; gap: 8px; }
          .modal-frameworks { display: flex; flex-wrap: wrap; gap: 6px; }
          .framework-tag {
            font-size: 10px; padding: 3px 8px; border-radius: 4px;
            background: rgba(255,255,255,0.05); color: var(--text-dim);
          }
          .context-passing-alert {
            background: rgba(59, 130, 246, 0.1);
            border-left: 3px solid #3b82f6;
            padding: 12px; border-radius: 4px;
          }
          .context-passing-alert h4 { color: #3b82f6 !important; }
          .context-passing-alert p { font-size: 13px; color: #bfdbfe; margin-top: 4px; }
          
          .close-btn {
            background: rgba(255,255,255,0.05); color: white;
            width: 32px; height: 32px; border-radius: 8px; font-size: 14px;
          }
          .close-btn:hover { background: rgba(255,255,255,0.1); }
          .modal-title {
            font-size: 20px; font-weight: 700; margin-bottom: 24px;
            line-height: 1.4;
          }
          .modal-section { margin-bottom: 20px; }
          .modal-section h4 {
            font-size: 12px; text-transform: uppercase; letter-spacing: 1px;
            color: var(--text-dim); margin-bottom: 8px;
          }
          .modal-desc {
            font-size: 14px; line-height: 1.7; color: var(--text-dim);
            background: rgba(255,255,255,0.02); padding: 12px; border-radius: 8px;
          }
          .output-header {
            display: flex; justify-content: space-between; align-items: center;
          }
          .copy-btn {
            font-size: 11px; padding: 4px 10px; background: rgba(255,255,255,0.05);
            color: var(--text-dim); border-radius: 6px;
          }
          .copy-btn:hover { background: rgba(255,255,255,0.1); }
          .modal-output {
            font-size: 14px; line-height: 1.8; white-space: pre-wrap;
            background: rgba(255,255,255,0.02); padding: 16px; border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.05); max-height: 400px; overflow-y: auto;
          }
          .modal-feedback {
            font-size: 14px; color: #f59e0b; font-style: italic;
            background: rgba(245, 158, 11, 0.05); padding: 12px; border-radius: 8px;
          }
          .modal-actions {
            display: flex; gap: 12px; margin-top: 24px;
            padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05);
          }
          .action-btn {
            flex: 1; padding: 12px; font-size: 14px; font-weight: 600;
            border-radius: 10px; text-align: center;
          }
          .approve-btn { background: var(--success); color: white; }
          .approve-btn:hover { filter: brightness(1.15); }
          .reject-btn { background: rgba(245,158,11,0.15); color: #f59e0b; }
          .reject-btn:hover { background: rgba(245,158,11,0.25); }
          .executing-indicator {
            display: flex; align-items: center; gap: 12px;
            color: var(--accent); font-size: 14px;
          }
          .spinner {
            width: 16px; height: 16px;
            border: 2px solid rgba(99,102,241,0.3);
            border-top-color: var(--accent);
            border-radius: 50%; animation: spin 0.8s linear infinite;
          }
          .badge {
            padding: 4px 10px; border-radius: 6px;
            font-size: 11px; font-weight: 700; text-transform: uppercase;
          }
          .badge.chiefOfStaff { background: rgba(239,68,68,0.1); color: #ef4444; }
          .badge.analyst { background: rgba(59,130,246,0.1); color: #3b82f6; }
          .badge.strategist { background: rgba(168,85,247,0.1); color: #a855f7; }
          .badge.communicator { background: rgba(245,158,11,0.1); color: #f59e0b; }
          .badge.builder { background: rgba(16,185,129,0.1); color: #10b981; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}
