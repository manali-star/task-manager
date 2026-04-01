export interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface TaskPayload {
  title: string;
  description?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
}

export interface TaskFilters {
  search: string;
  status: 'all' | 'active' | 'completed';
  priority: 'all' | 'low' | 'medium' | 'high';
  category: string;
}
