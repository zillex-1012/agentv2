'use client';

import { Task } from '@/lib/types';
import { agentConfigs } from '@/lib/agents/roles';

const statusConfig = {
  plan_review: { label: 'Chờ duyệt kế hoạch', icon: '📜' },
  working:     { label: 'Đang hành thiền', icon: '🕯️' },
  needs_review:{ label: 'Chờ lĩnh hội', icon: '👁️' },
  revision:    { label: 'Chiêm nghiệm lại', icon: '✒️' },
  done:        { label: 'Viên mãn', icon: '✨' }
};

function cleanOutput(text: string) {
  if (!text) return '';
  let clean = text.replace(/```(?:json)?/g, '').replace(/```/g, '');
  clean = clean.replace(/"(thought|content|analysis|insight|strategy|solution|assignee|tasks)":\s*/g, '');
  clean = clean.replace(/[{}"]/g, ''); 
  return clean.trim();
}

interface Props {
  tasks: Task[];
  onApprovePlan: () => void;
  onApproveTask: (taskId: string) => void;
  onRejectTask: (taskId: string, feedback: string) => void;
  onViewDetail: (taskId: string) => void;
  hasPendingPlan: boolean;
}

export default function Dashboard({ tasks, onApprovePlan, onApproveTask, onRejectTask, onViewDetail, hasPendingPlan }: Props) {
  const handleReject = (taskId: string) => {
    const feedback = prompt('Chỉ dụ chỉnh sửa:');
    if (feedback && feedback.trim()) {
      onRejectTask(taskId, feedback.trim());
    }
  };

  return (
    <div className="dashboard">
      {hasPendingPlan && (
        <div className="plan-approval-bar glass-card">
          <div className="plan-info">
            <span className="plan-icon">📜</span>
            <span>Thiên cơ đã được hé lộ. Hãy duyệt để hội đồng thức tỉnh.</span>
          </div>
          <button className="approve-plan-btn" onClick={onApprovePlan}>
            Khởi Nguồn
          </button>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">✧</div>
          <h3>Đạo tràng tĩnh lặng</h3>
          <p>Truyền đạt ý niệm để vạn vật khởi sinh.</p>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="pipeline-flow">
          {tasks.map((task, index) => {
            const agent = agentConfigs[task.assignee] || { name: task.assignee };
            const config = statusConfig[task.status] || { icon: '•', label: '' };
            const isLast = index === tasks.length - 1;

            return (
              <div key={task.id} className="pipeline-node">
                <div className={`node-marker ${task.isExecuting ? 'pulsing' : ''} ${task.status === 'done' ? 'completed' : ''}`}>
                  {config.icon}
                </div>
                {!isLast && <div className="node-connector"></div>}
                
                <div className={`task-card glass-card ${task.isExecuting ? 'executing' : ''}`}>
                  <div className="task-header">
                    <div>
                      <span className="agency-name">{agent.name}</span>
                      <span className="status-label"> — {config.label}</span>
                    </div>
                    {task.isExecuting && <div className="zen-spinner"></div>}
                  </div>
                  
                  <div className="task-title">{task.title}</div>
                  
                  {task.status === 'plan_review' && (
                    <div className="task-desc-preview">{task.description?.substring(0, 100)}...</div>
                  )}

                  {task.output && (
                    <div className="task-preview">
                      {cleanOutput(task.output).substring(0, 180)}...
                    </div>
                  )}

                  {task.status === 'needs_review' && (
                    <div className="task-actions">
                      <button className="action-btn approve" onClick={() => onApproveTask(task.id)}>Tính ngộ (Duyệt)</button>
                      <button className="action-btn reject" onClick={() => handleReject(task.id)}>Sửa đổi</button>
                      <button className="action-btn detail" onClick={() => onViewDetail(task.id)}>Xem tường tận</button>
                    </div>
                  )}

                  {task.status === 'done' && (
                    <div className="task-actions">
                      <button className="action-btn detail outline" onClick={() => onViewDetail(task.id)}>Xem di sản</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .dashboard { padding: 20px 0; max-width: 900px; margin: 0 auto; }

        .plan-approval-bar {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 24px; margin-bottom: 40px;
          border-left: 3px solid var(--accent);
          animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .plan-info { display: flex; align-items: center; gap: 12px; font-size: 15px; font-style: italic; }
        .plan-icon { font-size: 22px; filter: sepia(1); }
        .approve-plan-btn {
          background: var(--accent); color: #0d0c0b;
          padding: 10px 28px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;
          border-radius: 2px;
        }
        .approve-plan-btn:hover { filter: brightness(1.2); box-shadow: 0 0 20px rgba(203,163,101,0.2); }

        .empty-state { text-align: center; padding: 100px 20px; color: var(--text-dim); }
        .empty-icon { font-size: 48px; margin-bottom: 24px; color: var(--accent); opacity: 0.8; }
        .empty-state h3 { font-size: 20px; font-weight: normal; margin-bottom: 12px; font-style: italic; color: var(--foreground); }

        .pipeline-flow { display: flex; flex-direction: column; gap: 0; padding-top: 20px; }
        
        .pipeline-node {
          display: flex; gap: 32px; position: relative; padding-bottom: 32px;
        }
        
        .node-marker {
          width: 40px; height: 40px; flex-shrink: 0;
          background: rgba(20,18,15,0.8); border: 1px solid var(--card-border);
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 16px; z-index: 2; position: relative;
        }
        .node-marker.completed { border-color: var(--accent); background: rgba(203,163,101,0.1); }
        .node-marker.pulsing {
          border-color: var(--accent);
          box-shadow: 0 0 15px var(--accent-glow);
          animation: breath 3s ease-in-out infinite;
        }
        
        .node-connector {
          position: absolute; top: 40px; bottom: 0; left: 19px;
          width: 2px; background: linear-gradient(to bottom, var(--card-border) 40%, transparent);
          z-index: 1;
        }

        .task-card {
          flex: 1; padding: 20px 24px;
          display: flex; flex-direction: column; gap: 14px;
        }
        .task-card.executing {
          border-color: rgba(203,163,101,0.4);
          background: linear-gradient(135deg, rgba(20,18,15,0.9), rgba(203,163,101,0.05));
        }

        .task-header { display: flex; justify-content: space-between; align-items: baseline; }
        .agency-name { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: var(--accent); }
        .status-label { font-size: 12px; font-style: italic; color: var(--text-dim); }
        
        .task-title { font-size: 18px; font-weight: normal; color: var(--foreground); line-height: 1.4; }
        
        .task-desc-preview, .task-preview {
          font-size: 14px; color: #a69c8a; line-height: 1.6;
          border-left: 1px solid rgba(203,163,101,0.2); padding-left: 16px;
        }
        .task-preview { font-style: italic; background: rgba(203,163,101,0.03); padding: 12px 16px; }

        .zen-spinner {
          width: 14px; height: 14px;
          border: 1px solid rgba(203,163,101,0.3);
          border-top-color: var(--accent);
          border-radius: 50%; animation: spin 1.5s linear infinite;
        }

        .task-actions { display: flex; gap: 12px; margin-top: 8px; }
        .action-btn {
          font-size: 12px; padding: 8px 20px; border-radius: 2px;
          text-transform: uppercase; letter-spacing: 1px; font-weight: normal;
        }
        .action-btn.approve { background: rgba(203,163,101,0.15); color: var(--accent); border: 1px solid rgba(203,163,101,0.3); }
        .action-btn.approve:hover { background: rgba(203,163,101,0.25); }
        .action-btn.reject { background: transparent; color: #a69c8a; }
        .action-btn.reject:hover { color: var(--foreground); }
        .action-btn.detail { background: transparent; color: var(--accent); text-decoration: underline; }
        .action-btn.detail.outline { border: 1px solid var(--card-border); text-decoration: none; }

        @keyframes breath { 0%, 100% { box-shadow: 0 0 10px rgba(203,163,101,0.1); } 50% { box-shadow: 0 0 25px rgba(203,163,101,0.4); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
