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

export interface TaskCreate {
    title: string;
    description?: string;
    completed?: boolean;
    priority?: 'low' | 'medium' | 'high';
    category?: string;
}

export interface TaskUpdate {
    title?: string;
    description?: string;
    completed?: boolean;
    priority?: 'low' | 'medium' | 'high';
    category?: string;
}

export interface TaskFilters {
    search: string;
    completed: boolean | null;
    priority: string;
    category: string;
}
