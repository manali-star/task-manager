import { Task, TaskCreate, TaskUpdate, TaskFilters } from '../types/task';

const API_BASE_URL = '[localhost](http://localhost:8000)';

interface TaskListResponse {
    tasks: Task[];
    total: number;
}

/**
 * Build query string from filters, excluding empty values.
 */
function buildQueryString(filters: Partial<TaskFilters>): string {
    const params = new URLSearchParams();

    if (filters.search?.trim()) {
        params.append('search', filters.search.trim());
    }
    if (filters.completed !== null && filters.completed !== undefined) {
        params.append('completed', String(filters.completed));
    }
    if (filters.priority) {
        params.append('priority', filters.priority);
    }
    if (filters.category) {
        params.append('category', filters.category);
    }

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
}

/**
 * Fetch all tasks with optional filtering.
 */
export async function fetchTasks(filters: Partial<TaskFilters> = {}): Promise<TaskListResponse> {
    const queryString = buildQueryString(filters);
    const response = await fetch(`${API_BASE_URL}/tasks${queryString}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Create a new task.
 */
export async function createTask(task: TaskCreate): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
    });

    if (!response.ok) {
        throw new Error(`Failed to create task: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Update an existing task.
 */
export async function updateTask(id: number, task: TaskUpdate): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
    });

    if (!response.ok) {
        throw new Error(`Failed to update task: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Toggle task completion status.
 */
export async function toggleTaskCompletion(id: number): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/toggle`, {
        method: 'PATCH',
    });

    if (!response.ok) {
        throw new Error(`Failed to toggle task: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Delete a task.
 */
export async function deleteTask(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.statusText}`);
    }
}

/**
 * Fetch all unique categories.
 */
export async function fetchCategories(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/categories`);

    if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    return response.json();
}
