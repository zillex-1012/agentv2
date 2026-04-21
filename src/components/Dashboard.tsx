'use client';

import { Task } from '@/lib/types';
import { agentConfigs } from '@/lib/agents/roles';

const statusConfig = {
  plan_review: { label: 'Kế hoạch', icon: '📋', color: '#6366f1' },
  working:     { label: 'Đang xử lý', icon: '⚡', color: '#3b82f6' },
  needs_review:{ label: 'Cần duyệt', icon: '👀', color: '#f59e0b' },
  revision:    { label: 'Đang sửa', icon: '✏️', color: '#ef4444' },
  done:        { label: 'Hoàn tất', icon: '✅', color: '#10b981' }
};

interface Props {
  tasks: Task[];
  onApprovePlan: () => void;
  onApproveTask: (taskId: string) => void;
  onRejectTask: (taskId: string, feedback: string) => void;
  onViewDetail: (taskId: string) => void;
  hasPendingPlan: boolean;
}

export default function Dashboard({ tasks, onApprovePlan, onApproveTask, onRejectTask, onViewDetail, hasPendingPlan }: Props) {
  const columns: Task['status'][] = ['plan_review', 'working', 'needs_review', 'revision', 'done'];

  const handleReject = (taskId: string) => {
    const feedback = prompt('Nhập yêu cầu chỉnh sửa:');
    if (feedback && feedback.trim()) {
      onRejectTask(taskId, feedback.trim());
    }
  };

  return (
    <div className="dashboard">
      {/* Nút duyệt kế hoạch tổng */}
      {hasPendingPlan && (
        <div className="plan-approval-bar glass-card">
          <div className="plan-info">
            <span className="plan-icon">🧠</span>
            <span>Chief of Staff đã lập kế hoạch xong. Duyệt để Agents bắt đầu làm việc.</span>
          </div>
          <button className="approve-plan-btn" onClick={onApprovePlan}>
            🚀 Duyệt & Khởi chạy Agents
          </button>
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">✦</div>
          <h3>Solopreneur OS sẵn sàng</h3>
          <p>Gõ lệnh vào thanh Omnibar để Council of Agents bắt đầu làm việc cho bạn.</p>
        </div>
      )}

      {/* Kanban Board */}
      {tasks.length > 0 && (
        <div className="kanban-grid">
          {columns.map((status) => {
            const config = statusConfig[status];
            const colTasks = tasks.filter(t => t.status === status);
            return (
              <div key={status} className="kanban-col">
                <h3 className="col-title">
                  <span>{config.icon} {config.label}</span>
                  <span className="count" style={{ color: config.color }}>{colTasks.length}</span>
                </h3>

                <div className="task-list">
                  {colTasks.map((task) => {
                    const agent = agentConfigs[task.assignee] || { name: task.assignee };
                    return (
                      <div key={task.id} className={`task-card glass-card ${task.isExecuting ? 'executing' : ''}`}>
                        <div className="task-header">
                          <span className={`badge ${task.assignee}`}>{agent.name}</span>
                          {task.isExecuting && <div className="mini-spinner"></div>}
                        </div>
                        
                        <div className="task-title">{task.title}</div>
                        
                        {task.output && (
                          <div className="task-preview">
                            {task.output.substring(0, 120)}...
                          </div>
                        )}

                        {/* Nút hành động theo trạng thái */}
                        {task.status === 'needs_review' && (
                          <div className="task-actions">
                            <button className="action-btn approve" onClick={() => onApproveTask(task.id)}>
                              ✅ Duyệt
                            </button>
                            <button className="action-btn reject" onClick={() => handleReject(task.id)}>
                              ✏️ Sửa
                            </button>
                            <button className="action-btn detail" onClick={() => onViewDetail(task.id)}>
                              👁 Chi tiết
                            </button>
                          </div>
                        )}

                        {task.status === 'done' && (
                          <div className="task-actions">
                            <button className="action-btn detail" onClick={() => onViewDetail(task.id)}>
                              👁 Xem kết quả
                            </button>
                          </div>
                        )}

                        {task.status === 'plan_review' && (
                          <div className="task-desc-preview">{task.description?.substring(0, 80)}...</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .dashboard { padding: 20px 0; }

        .plan-approval-bar {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 24px; margin-bottom: 24px;
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.2);
          animation: slideDown 0.3s ease;
        }
        .plan-info {
          display: flex; align-items: center; gap: 12px; font-size: 14px;
        }
        .plan-icon { font-size: 24px; }
        .approve-plan-btn {
          background: var(--accent); color: white;
          padding: 10px 24px; font-size: 14px; font-weight: 700;
          border-radius: 10px; white-space: nowrap;
        }
        .approve-plan-btn:hover {
          filter: brightness(1.15);
          transform: translateY(-1px);
          box-shadow: 0 4px 15px var(--accent-glow);
        }

        .empty-state {
          text-align: center; padding: 80px 20px;
          color: var(--text-dim);
        }
        .empty-icon {
          font-size: 48px; margin-bottom: 16px;
          color: var(--accent); filter: drop-shadow(0 0 20px var(--accent-glow));
        }
        .empty-state h3 { font-size: 20px; margin-bottom: 8px; color: white; }
        .empty-state p { font-size: 14px; }

        .kanban-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          min-width: 1200px;
          overflow-x: auto;
        }
        .col-title {
          font-size: 12px; font-weight: 600; color: var(--text-dim);
          text-transform: uppercase; letter-spacing: 1px;
          margin-bottom: 16px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .count {
          font-size: 18px; font-weight: 800;
        }

        .task-list { display: flex; flex-direction: column; gap: 12px; }

        .task-card {
          padding: 14px; display: flex; flex-direction: column; gap: 10px;
          border-radius: 12px;
        }
        .task-card.executing {
          border-color: rgba(99, 102, 241, 0.3);
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.1);
          animation: pulse 2s ease-in-out infinite;
        }
        .task-header {
          display: flex; justify-content: space-between; align-items: center;
        }
        .task-title { font-size: 14px; line-height: 1.5; font-weight: 500; }
        .task-preview {
          font-size: 12px; color: var(--text-dim); line-height: 1.5;
          background: rgba(255,255,255,0.02); padding: 8px; border-radius: 6px;
          border-left: 2px solid rgba(255,255,255,0.1);
        }
        .task-desc-preview {
          font-size: 11px; color: var(--text-dim); line-height: 1.5;
          font-style: italic;
        }

        .badge {
          padding: 3px 8px; border-radius: 5px;
          font-size: 9px; font-weight: 700; text-transform: uppercase;
        }
        .badge.chiefOfStaff { background: rgba(239,68,68,0.1); color: #ef4444; }
        .badge.analyst { background: rgba(59,130,246,0.1); color: #3b82f6; }
        .badge.strategist { background: rgba(168,85,247,0.1); color: #a855f7; }
        .badge.communicator { background: rgba(245,158,11,0.1); color: #f59e0b; }
        .badge.builder { background: rgba(16,185,129,0.1); color: #10b981; }

        .mini-spinner {
          width: 12px; height: 12px;
          border: 2px solid rgba(99,102,241,0.3);
          border-top-color: var(--accent);
          border-radius: 50%; animation: spin 0.8s linear infinite;
        }

        .task-actions { display: flex; gap: 6px; margin-top: 4px; }
        .action-btn {
          flex: 1; font-size: 11px; padding: 6px 4px;
          border-radius: 6px; font-weight: 600; text-align: center;
        }
        .action-btn.approve { background: rgba(16,185,129,0.15); color: #10b981; }
        .action-btn.approve:hover { background: rgba(16,185,129,0.25); }
        .action-btn.reject { background: rgba(245,158,11,0.15); color: #f59e0b; }
        .action-btn.reject:hover { background: rgba(245,158,11,0.25); }
        .action-btn.detail { background: rgba(255,255,255,0.05); color: var(--text-dim); }
        .action-btn.detail:hover { background: rgba(255,255,255,0.1); }

        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
