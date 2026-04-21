// EDGE RUNTIME: Cho phép streaming và timeout dài
export type AgentRole = 'chiefOfStaff' | 'analyst' | 'strategist' | 'communicator' | 'builder';

// === TASK LIFECYCLE ===
// plan_review: Chief of Staff vửa lập kế hoạch, chờ User duyệt
// working:     Agent đang thực thi nhiệm vụ
// needs_review: Agent đã hoàn thành, chờ User duyệt output
// revision:    User yêu cầu sửa, Agent đang làm lại
// done:        User đã duyệt, hoàn tất

export type TaskStatus = 'plan_review' | 'working' | 'needs_review' | 'revision' | 'done';

export interface Task {
  id: string;
  assignee: AgentRole;
  status: TaskStatus;
  title: string;          // Tên nhiệm vụ ngắn gọn
  description: string;    // Mô tả chi tiết từ Chief of Staff cho Agent
  output?: string;        // Kết quả làm việc thực tế từ Agent
  contextData?: string;   // Dữ liệu ngữ cảnh nạp từ output của bước trước
  isExecuting?: boolean;  // Đang gọi API cho Agent này
  batchId?: string;       // Nhóm tasks cùng 1 lệnh
  feedback?: string;      // Phản hồi từ User khi yêu cầu sửa
}

export interface Session {
  id: string;
  command: string;        // Lệnh gốc từ User
  createdAt: number;
  tasks: Task[];
}
