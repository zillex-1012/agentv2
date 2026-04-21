'use client';

import { Task } from '@/lib/types';
import { agentConfigs } from '@/lib/agents/roles';

function cleanOutput(text: string) {
  if (!text) return '';
  let clean = text.replace(/```(?:json)?/g, '').replace(/```/g, '');
  clean = clean.replace(/"(thought|content|analysis|insight|strategy|solution|assignee|tasks)":\s*/g, '');
  clean = clean.replace(/[{}"]/g, '');
  // Giữ lại các khoảng trắng và xuống dòng
  return clean.trim();
}

interface Props {
  task: Task;
  onClose: () => void;
  onApprove: (taskId: string) => void;
  onReject: (taskId: string, feedback: string) => void;
}

export default function TaskDetailModal({ task, onClose, onApprove, onReject }: Props) {
  const agent = agentConfigs[task.assignee] || { name: task.assignee, coreFrameworks: [] };

  const handleReject = () => {
    const feedback = prompt('Truyền đạt chỉ dụ sửa đổi:');
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
            <span className="agency-name">{agent.name}</span>
            <div className="modal-frameworks">
              {agent.coreFrameworks?.map((fw: string, i: number) => (
                <span key={i} className="framework-tag">✧ {fw}</span>
              ))}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <h2 className="modal-title">{task.title}</h2>
        
        <div className="modal-section">
          <h4>Cội nguồn (Nhiệm vụ)</h4>
          <p className="modal-desc">{task.description}</p>
        </div>

        {task.contextData && (
          <div className="modal-section context-passing-alert">
            <h4>Dòng chảy ký ức</h4>
            <p>Hội đồng đã kế thừa di sản trí tuệ từ các bước trước đó để nối tiếp mạch nguồn sáng tạo.</p>
          </div>
        )}

        {task.output && (
          <div className="modal-section">
            <div className="output-header">
              <h4>Chân lý tụ hội (Kết quả)</h4>
              <button className="copy-btn" onClick={handleCopy}>Lưu truyền</button>
            </div>
            <div className="modal-output">{cleanOutput(task.output)}</div>
          </div>
        )}

        {task.isExecuting && (
          <div className="modal-section">
            <div className="executing-indicator">
              <div className="zen-spinner"></div>
              <span>Hội đồng đang tĩnh tâm khai mở...</span>
            </div>
          </div>
        )}

        {task.feedback && (
          <div className="modal-section">
            <h4>Chỉ dụ của bạn</h4>
            <p className="modal-feedback">{task.feedback}</p>
          </div>
        )}

        {task.status === 'needs_review' && (
          <div className="modal-actions">
            <button className="action-btn approve-btn" onClick={() => onApprove(task.id)}>
              Tính ngộ (Duyệt)
            </button>
            <button className="action-btn reject-btn" onClick={handleReject}>
              Hiệu chỉnh
            </button>
          </div>
        )}

        <style jsx>{`
          .modal-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
            z-index: 1000; display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.4s ease;
            padding: 20px;
          }
          .modal-content {
            width: 100%; max-width: 800px; max-height: 85vh;
            overflow-y: auto; padding: 48px;
            background: rgba(13, 12, 11, 0.95); border: 1px solid rgba(203,163,101,0.2);
            border-radius: 4px; box-shadow: 0 20px 60px rgba(0,0,0,0.8);
          }
          .modal-header {
            display: flex; justify-content: space-between; align-items: flex-start;
            margin-bottom: 32px;
          }
          .modal-agent-info { display: flex; flex-direction: column; gap: 12px; }
          .agency-name { color: var(--accent); font-size: 11px; text-transform: uppercase; letter-spacing: 3px; }
          .modal-frameworks { display: flex; flex-wrap: wrap; gap: 16px; }
          .framework-tag {
            font-size: 11px; color: var(--text-dim); font-style: italic;
          }
          .context-passing-alert {
            border-left: 2px solid var(--accent);
            padding: 16px; margin-top: 32px;
          }
          .context-passing-alert h4 { color: var(--accent) !important; }
          .context-passing-alert p { font-size: 14px; color: #a69c8a; font-style: italic; margin-top: 8px; }
          
          .close-btn {
            background: transparent; color: var(--text-dim); border: none;
            width: 32px; height: 32px; font-size: 20px; cursor: pointer; transition: color 0.3s;
          }
          .close-btn:hover { color: var(--accent); }

          .modal-title {
            font-size: 24px; font-weight: normal; margin-bottom: 32px;
            line-height: 1.5; color: var(--foreground);
          }
          .modal-section { margin-bottom: 32px; }
          .modal-section h4 {
            font-size: 11px; text-transform: uppercase; letter-spacing: 2px;
            color: var(--accent); opacity: 0.8; margin-bottom: 12px;
          }
          .modal-desc {
            font-size: 16px; line-height: 1.8; color: var(--foreground);
            padding-left: 20px; border-left: 2px solid rgba(203,163,101,0.3);
          }
          .output-header {
            display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
          }
          .copy-btn {
            font-size: 11px; padding: 6px 16px; background: transparent;
            color: var(--accent); border: 1px solid rgba(203,163,101,0.3); border-radius: 2px; text-transform: uppercase;
          }
          .copy-btn:hover { background: rgba(203,163,101,0.1); }

          .modal-output {
            font-size: 15px; line-height: 1.9; white-space: pre-wrap;
            background: rgba(20, 18, 15, 0.4); padding: 32px; border-radius: 2px;
            border: 1px solid rgba(203,163,101,0.1); color: #f3eedd;
          }
          .modal-feedback {
            font-size: 15px; color: #cba365; font-style: italic;
            padding: 16px; border-left: 2px solid #cba365; background: rgba(203,163,101,0.05);
          }
          .modal-actions {
            display: flex; gap: 16px; margin-top: 40px;
            padding-top: 32px; border-top: 1px solid rgba(203,163,101,0.1);
          }
          .action-btn {
            flex: 1; padding: 14px; font-size: 13px; font-weight: normal;
            border-radius: 2px; text-align: center; text-transform: uppercase; letter-spacing: 1px;
          }
          .approve-btn { background: var(--accent); color: #0d0c0b; }
          .approve-btn:hover { filter: brightness(1.15); box-shadow: 0 0 20px rgba(203,163,101,0.2); }
          .reject-btn { background: transparent; color: var(--accent); border: 1px solid rgba(203,163,101,0.3); }
          .reject-btn:hover { background: rgba(203,163,101,0.1); }
          
          .executing-indicator {
            display: flex; align-items: center; gap: 16px;
            color: var(--accent); font-size: 15px; font-style: italic;
            padding: 24px; border: 1px solid rgba(203,163,101,0.2); justify-content: center;
          }
          .zen-spinner {
            width: 18px; height: 18px;
            border: 2px solid rgba(203,163,101,0.3);
            border-top-color: var(--accent);
            border-radius: 50%; animation: spin 1.5s linear infinite;
          }
          @keyframes fadeIn { from { opacity: 0; backdrop-filter: blur(0px); } to { opacity: 1; backdrop-filter: blur(8px); } }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}
