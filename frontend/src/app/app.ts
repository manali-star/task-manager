import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private readonly apiUrl = 'http://127.0.0.1:8000/api/tasks';
  private refreshTimerId: ReturnType<typeof setInterval> | null = null;

  tasks: Task[] = [];
  visibleTasks: Task[] = [];
  searchTerm = '';
  selectedStatus: TaskFilter = 'all';
  title = '';
  description = '';
  editingTaskId: number | null = null;
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  clockTick = Date.now();

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.loadTasks();
    this.refreshTimerId = setInterval(() => {
      this.clockTick = Date.now();
    }, 60_000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimerId) {
      clearInterval(this.refreshTimerId);
    }
  }

  loadTasks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<Task[]>(this.apiUrl).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load tasks. Start the Python API and try again.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.visibleTasks = this.tasks.filter((task) => {
      const matchesStatus =
        this.selectedStatus === 'all' ? true : task.status === this.selectedStatus;
      const matchesSearch =
        search.length === 0
          ? true
          : `${task.title} ${task.description}`.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }

  saveTask(): void {
    const payload = {
      title: this.title.trim(),
      description: this.description.trim(),
      status: this.getEditingTaskStatus()
    };

    if (!payload.title) {
      this.errorMessage = 'Please enter a task title.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    if (this.editingTaskId === null) {
      this.http
        .post<Task>(this.apiUrl, {
          title: payload.title,
          description: payload.description
        })
        .subscribe({
          next: (task) => {
            this.tasks = [task, ...this.tasks];
            this.resetForm();
            this.applyFilters();
            this.isSaving = false;
          },
          error: () => {
            this.errorMessage = 'Unable to create the task.';
            this.isSaving = false;
          }
        });
      return;
    }

    this.http.put<Task>(`${this.apiUrl}/${this.editingTaskId}`, payload).subscribe({
      next: (task) => {
        this.tasks = this.tasks.map((existingTask) =>
          existingTask.id === task.id ? task : existingTask
        );
        this.resetForm();
        this.applyFilters();
        this.isSaving = false;
      },
      error: () => {
        this.errorMessage = 'Unable to update the task.';
        this.isSaving = false;
      }
    });
  }

  editTask(task: Task): void {
    this.editingTaskId = task.id;
    this.title = task.title;
    this.description = task.description;
    this.errorMessage = '';
  }

  cancelEdit(): void {
    this.resetForm();
    this.errorMessage = '';
  }

  deleteTask(taskId: number): void {
    this.http.delete<{ message: string }>(`${this.apiUrl}/${taskId}`).subscribe({
      next: () => {
        this.tasks = this.tasks.filter((task) => task.id !== taskId);
        if (this.editingTaskId === taskId) {
          this.resetForm();
        }
        this.applyFilters();
      },
      error: () => {
        this.errorMessage = 'Unable to delete the task.';
      }
    });
  }

  toggleStatus(task: Task): void {
    const updatedStatus: TaskStatus = task.status === 'open' ? 'completed' : 'open';

    this.http
      .put<Task>(`${this.apiUrl}/${task.id}`, {
        title: task.title,
        description: task.description,
        status: updatedStatus
      })
      .subscribe({
        next: (updatedTask) => {
          this.tasks = this.tasks.map((existingTask) =>
            existingTask.id === updatedTask.id ? updatedTask : existingTask
          );

          if (this.editingTaskId === updatedTask.id) {
            this.title = updatedTask.title;
            this.description = updatedTask.description;
          }

          this.applyFilters();
        },
        error: () => {
          this.errorMessage = 'Unable to update task status.';
        }
      });
  }

  trackByTaskId(index: number, task: Task): number {
    return task.id;
  }

  formatTimeAgo(timestamp: string): string {
    this.clockTick;

    const date = new Date(timestamp);
    const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));

    if (seconds < 60) {
      return 'created just now';
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `created ${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `created ${hours} hour${hours === 1 ? '' : 's'} ago`;
    }

    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `created ${days} day${days === 1 ? '' : 's'} ago`;
    }

    const weeks = Math.floor(days / 7);
    if (weeks < 5) {
      return `created ${weeks} week${weeks === 1 ? '' : 's'} ago`;
    }

    const months = Math.floor(days / 30);
    if (months < 12) {
      return `created ${months} month${months === 1 ? '' : 's'} ago`;
    }

    const years = Math.floor(days / 365);
    return `created ${years} year${years === 1 ? '' : 's'} ago`;
  }

  private getEditingTaskStatus(): TaskStatus {
    if (this.editingTaskId === null) {
      return 'open';
    }

    return this.tasks.find((task) => task.id === this.editingTaskId)?.status ?? 'open';
  }

  private resetForm(): void {
    this.title = '';
    this.description = '';
    this.editingTaskId = null;
  }
}

type TaskStatus = 'open' | 'completed';
type TaskFilter = 'all' | TaskStatus;

interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}
