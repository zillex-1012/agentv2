'use client';

import { useState } from 'react';
import Omnibar from '@/components/Omnibar';
import Dashboard from '@/components/Dashboard';
import TaskDetailModal from '@/components/TaskDetailModal';
import { Task, AgentRole } from '@/lib/types';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // === BƯỚC 1: User gõ lệnh → Chief of Staff lập kế hoạch ===
  const handleCommand = async (cmd: string) => {
    if (!cmd.trim() || loading) return;
    
    setLoading(true);
    const batchId = Date.now().toString(36);

    // Thêm card "đang phân tích"
    const planningId = 'planning-' + batchId;
    setTasks(prev => [{
      id: planningId,
      title: '🧠 Chief of Staff đang phân tích yêu cầu...',
      assignee: 'chiefOfStaff' as AgentRole,
      status: 'plan_review',
      description: cmd,
      isExecuting: true,
      batchId
    }, ...prev]);

    try {
      // Gọi Orchestrate API (Chief of Staff)
      const response = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      });

      if (!response.ok) throw new Error('Không thể kết nối đến AI');
      if (!response.body) throw new Error('Không nhận được dữ liệu');

      // Đọc stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      // Parse kết quả từ Chief of Staff
      const plan = parsePlan(fullText, cmd, batchId);

      // Thay card "đang phân tích" bằng các tasks thực
      setTasks(prev => {
        const filtered = prev.filter(t => t.id !== planningId);
        return [...plan, ...filtered];
      });

    } catch (error: any) {
      setTasks(prev => prev.map(t => 
        t.id === planningId 
          ? { ...t, title: `❌ Lỗi: ${error.message}`, isExecuting: false, status: 'needs_review' as const }
          : t
      ));
    } finally {
      setLoading(false);
    }
  };

  // === BƯỚC 2: User duyệt kế hoạch → Agents làm việc TUẦN TỰ (Context Passing) ===
  const handleApprovePlan = async () => {
    const firstPlanTask = tasks.find(t => t.status === 'plan_review' && !t.isExecuting);
    if (!firstPlanTask) return;
    const targetBatchId = firstPlanTask.batchId;

    const planTasks = tasks.filter(t => t.status === 'plan_review' && t.batchId === targetBatchId && !t.isExecuting);
    if (planTasks.length === 0) return;

    // Chuyển nhóm task cùng batch sang working nhưng isExecuting = false để xếp hàng chờ
    setTasks(prev => prev.map(t => 
      planTasks.some(pt => pt.id === t.id)
        ? { ...t, status: 'working' as const, isExecuting: false }
        : t
    ));

    let currentContextData = '';

    for (const task of planTasks) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, isExecuting: true } : t));
      
      const output = await executeAgent({ ...task, contextData: currentContextData });
      
      if (output) {
        // Nâng cấp: Tích lũy ngữ cảnh (Accumulate Context) thay vì chỉ nhớ bước gần nhất.
        // Điều này giúp Agent cuối cùng (Builder) thấy được công trình của cả Analyst lẫn Strategist.
        currentContextData += `\n\n=== KẾT QUẢ TỪ BƯỚC: ${task.assignee.toUpperCase()} ===\n${output}`;
      } else {
        // CIRCUIT BREAKER
        setTasks(prev => prev.map(t => 
          t.status === 'working' && t.batchId === task.batchId && !t.isExecuting
            ? { ...t, status: 'done' as const, title: `🚫 ĐÃ HỦY (Do đứt gãy Context từ bước trước)`, output: 'Bước trước đó đã gặp lỗi nên hệ thống tự động hủy dây chuyền này để tránh lãng phí chi phí API và sinh ra rác (Hallucination).' }
            : t
        ));
        break;
      }
    }
  };

  // === BƯỚC 3: Gọi Agent thực thi nhiệm vụ ===
  const executeAgent = async (task: Task): Promise<string> => {
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignee: task.assignee,
          description: task.description,
          feedback: task.feedback,
          contextData: task.contextData
        })
      });

      if (!response.ok) throw new Error('Agent gặp sự cố');
      if (!response.body) throw new Error('Không nhận được output');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let output = '';
      let lastUpdateTime = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        output += decoder.decode(value, { stream: true });
        
        const now = Date.now();
        if (now - lastUpdateTime > 100) {
          lastUpdateTime = now;
          setTasks(prev => prev.map(t => 
            t.id === task.id ? { ...t, output, contextData: task.contextData } : t
          ));
        }
      }

      setTasks(prev => prev.map(t => 
        t.id === task.id 
          ? { ...t, output, status: 'needs_review' as const, isExecuting: false, contextData: task.contextData }
          : t
      ));
      return output;

    } catch (error: any) {
      setTasks(prev => prev.map(t => 
        t.id === task.id 
          ? { ...t, title: `❌ ${task.title} — ${error.message}`, status: 'needs_review' as const, isExecuting: false }
          : t
      ));
      return '';
    }
  };

  // === BƯỚC 4: User duyệt output → Hoàn tất ===
  const handleApproveTask = (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: 'done' as const } : t
    ));
    setSelectedTask(null);
  };

  // === BƯỚC 5: User yêu cầu sửa → Agent làm lại ===
  const handleRejectTask = async (taskId: string, feedback: string) => {
    setSelectedTask(null);
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Chuyển sang revision
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, status: 'revision' as const, feedback, isExecuting: true, output: '' }
        : t
    ));

    // Gọi Agent làm lại với feedback
    await executeAgent({ ...task, feedback, status: 'revision' });
  };

  // === Xem chi tiết ===
  const handleViewDetail = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) setSelectedTask(task);
  };

  // === Có kế hoạch chờ duyệt không? ===
  const hasPendingPlan = tasks.some(t => t.status === 'plan_review' && !t.isExecuting);

  return (
    <main className="container">
      <header className="header">
        <div className="logo">SOLOPRENEUR<span>OS</span></div>
        <div className="user-profile">
          <div className="avatar">K</div>
          <span className="name">Welcome, Kieun</span>
        </div>
      </header>

      <div className="content">
        <Omnibar onCommand={handleCommand} />
        {loading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <span>Chief of Staff đang phân tích yêu cầu...</span>
          </div>
        )}
        <Dashboard 
          tasks={tasks} 
          onApprovePlan={handleApprovePlan}
          onApproveTask={handleApproveTask}
          onRejectTask={handleRejectTask}
          onViewDetail={handleViewDetail}
          hasPendingPlan={hasPendingPlan}
        />
      </div>

      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onApprove={handleApproveTask}
          onReject={handleRejectTask}
        />
      )}

      <style jsx>{`
        .container {
          max-width: 1600px; margin: 0 auto; padding: 0 32px;
          min-height: 100vh; display: flex; flex-direction: column;
        }
        .header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 24px 0;
        }
        .logo { font-size: 24px; font-weight: 800; letter-spacing: -1px; }
        .logo span {
          background: linear-gradient(to right, var(--accent), #f3eedd);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .user-profile {
          display: flex; align-items: center; gap: 12px;
          background: rgba(255,255,255,0.03); padding: 6px 16px 6px 6px;
          border-radius: 99px; border: 1px solid rgba(255,255,255,0.05);
        }
        .avatar {
          width: 32px; height: 32px; background: var(--accent);
          border-radius: 50%; display: flex; align-items: center;
          justify-content: center; font-weight: 700; font-size: 14px;
        }
        .name { font-size: 14px; font-weight: 500; color: var(--text-dim); }
        .content { flex: 1; display: flex; flex-direction: column; gap: 20px; }
        .loading-indicator {
          display: flex; align-items: center; gap: 12px;
          justify-content: center; padding: 12px;
          color: var(--accent); font-size: 14px;
          animation: pulse 2s ease-in-out infinite;
        }
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(99,102,241,0.3);
          border-top-color: var(--accent);
          border-radius: 50%; animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </main>
  );
}

// === UTILITY FUNCTIONS ===

function parsePlan(text: string, originalCommand: string, batchId: string): Task[] {
  const validAssignees: AgentRole[] = ['analyst', 'strategist', 'communicator', 'builder'];

  // Thử parse JSON
  try {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      if (data.tasks && Array.isArray(data.tasks) && data.tasks.length > 0) {
        
        // Chuẩn hóa và làm sạch roles (đề phòng model trả về viết hoa/có khoảng trắng)
        const parsedTasks = data.tasks
          .map((t: any) => ({ ...t, cleanedAssignee: String(t.assignee || t.role || '').toLowerCase().trim() }))
          .filter((t: any) => validAssignees.includes(t.cleanedAssignee as AgentRole))
          .map((t: any, i: number) => ({
            id: `${batchId}-${i}`,
            assignee: t.cleanedAssignee as AgentRole,
            status: 'plan_review' as const,
            title: t.title || t.task_description || `Nhiệm vụ bước ${i + 1}`,
            description: t.description || t.task_description || originalCommand,
            batchId
          }));

        // Tránh lỗi JSON hợp lệ nhưng lại không có task nào hợp lệ
        if (parsedTasks.length > 0) {
          return parsedTasks;
        }
      }
    }
  } catch {}

  // Fallback ĐẶC BIỆT: Cứu hộ JSON bị cắt xén (Do Netlify Timeout 10s cúp luồng stream)
  // Chúng ta sẽ xẻ thủ công đoạn text để moi móc assignee và description
  const rescuedTasks: Task[] = [];
  const parts = text.split(/"assignee"\s*:\s*"/);
  
  for (let i = 1; i < parts.length; i++) {
    const roleMatch = parts[i].match(/^([^"]+)"/);
    if (!roleMatch) continue;
    
    const role = String(roleMatch[1]).toLowerCase().trim() as AgentRole;
    if (!validAssignees.includes(role)) continue;
    
    const titleMatch = parts[i].match(/"title"\s*:\s*"([^"]*)"/);
    let title = titleMatch ? titleMatch[1] : `Nhiệm vụ của ${role.toUpperCase()}`;
    
    // Tìm mô tả, lấy mọi chuỗi ngay sau "description": " cho đến dấu " kết thúc, HOẶC nếu bị cụt thì lấy hết phần còn lại
    const descMatch = parts[i].match(/"description"\s*:\s*"([\s\S]*?)(?:"(?:\s*\}|\s*,)|$)/);
    let description = descMatch ? descMatch[1] : originalCommand;
    
    // Gọt giũa escape character do bị xẻ ngang rãnh
    description = description.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\/g, '');

    rescuedTasks.push({
      id: `${batchId}-${rescuedTasks.length}`,
      assignee: role,
      status: 'plan_review' as const,
      title: title.substring(0, 100),
      description,
      batchId
    });
  }

  if (rescuedTasks.length > 0) {
    return rescuedTasks;
  }

  // Fallback 1: Trích xuất nhiệm vụ dạng text thuần túy
  const lines = text.split('\n').filter(l => l.trim().length > 15);
  if (lines.length >= 2) {
    return lines.slice(0, 4).map((line, i) => ({
      id: `${batchId}-${i}`,
      assignee: validAssignees[i % validAssignees.length],
      status: 'plan_review' as const,
      title: line.replace(/^[\-\•\*\d\.\)]+\s*/, '').trim().substring(0, 60),
      description: line.trim(),
      batchId
    }));
  }

  // Fallback 2 (Bọc lót cuối): Ép về Single Task cho Communicator Agent
  return [
    { id: `${batchId}-0`, assignee: 'communicator', status: 'plan_review', title: `Xử lý luồng: ${originalCommand.substring(0,20)}...`, description: originalCommand, batchId }
  ];
}
