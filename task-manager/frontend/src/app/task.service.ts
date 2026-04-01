import { Injectable } from '@angular/core';
import { Task, TaskListResponse, TaskPayload } from './task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly apiBaseUrl = 'http://localhost:8000';

  async getTasks(): Promise<Task[]> {
    const response = await fetch(`${this.apiBaseUrl}/tasks`);

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }

    const data = (await response.json()) as TaskListResponse;
    return data.tasks;
  }

  async createTask(payload: TaskPayload): Promise<Task> {
    const response = await fetch(`${this.apiBaseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to create task: ${response.statusText}`);
    }

    return (await response.json()) as Task;
  }

  async updateTask(taskId: number, payload: TaskPayload): Promise<Task> {
    const response = await fetch(`${this.apiBaseUrl}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to update task: ${response.statusText}`);
    }

    return (await response.json()) as Task;
  }

  async toggleTask(taskId: number): Promise<Task> {
    const response = await fetch(`${this.apiBaseUrl}/tasks/${taskId}/toggle`, {
      method: 'PATCH',
    });

    if (!response.ok) {
      throw new Error(`Failed to update task: ${response.statusText}`);
    }

    return (await response.json()) as Task;
  }

  async deleteTask(taskId: number): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/tasks/${taskId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete task: ${response.statusText}`);
    }
  }
}
