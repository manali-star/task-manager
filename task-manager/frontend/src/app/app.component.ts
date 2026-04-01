import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Task, TaskFilters, TaskPayload } from './task.model';
import { TaskService } from './task.service';
import { formatDateTime, timeAgo } from './time-ago.util';

type TaskDraft = Required<Pick<TaskPayload, 'title' | 'description' | 'priority' | 'category'>>;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  loading = true;
  saving = false;
  deletingTaskId: number | null = null;
  errorMessage = '';
  showCreateForm = false;
  editingTaskId: number | null = null;

  readonly filters: TaskFilters = {
    search: '',
    status: 'all',
    priority: 'all',
    category: '',
  };

  readonly createDraft: TaskDraft = this.buildDraft();
  editDraft: TaskDraft = this.buildDraft();

  constructor(private readonly taskService: TaskService) {}

  ngOnInit(): void {
    void this.loadTasks();
  }

  get categoryOptions(): string[] {
    return [...new Set(this.tasks.map((task) => task.category?.trim()).filter(Boolean) as string[])].sort();
  }

  get completedCount(): number {
    return this.tasks.filter((task) => task.completed).length;
  }

  async loadTasks(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      this.tasks = await this.taskService.getTasks();
      this.applyFilters();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Failed to load tasks.';
    } finally {
      this.loading = false;
    }
  }

  applyFilters(): void {
    const searchTerm = this.filters.search.trim().toLowerCase();

    this.filteredTasks = this.tasks.filter((task) => {
      const matchesSearch =
        !searchTerm ||
        task.title.toLowerCase().includes(searchTerm) ||
        (task.description ?? '').toLowerCase().includes(searchTerm) ||
        (task.category ?? '').toLowerCase().includes(searchTerm);

      const matchesStatus =
        this.filters.status === 'all' ||
        (this.filters.status === 'completed' && task.completed) ||
        (this.filters.status === 'active' && !task.completed);

      const matchesPriority =
        this.filters.priority === 'all' || task.priority === this.filters.priority;

      const matchesCategory =
        !this.filters.category || (task.category ?? '') === this.filters.category;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }

  openCreateForm(): void {
    this.showCreateForm = true;
    this.resetDraft(this.createDraft);
  }

  closeCreateForm(): void {
    this.showCreateForm = false;
    this.resetDraft(this.createDraft);
  }

  beginEdit(task: Task): void {
    this.editingTaskId = task.id;
    this.editDraft.title = task.title;
    this.editDraft.description = task.description ?? '';
    this.editDraft.priority = task.priority;
    this.editDraft.category = task.category ?? '';
  }

  cancelEdit(): void {
    this.editingTaskId = null;
    this.editDraft = this.buildDraft();
  }

  async submitCreate(form: NgForm): Promise<void> {
    if (form.invalid || this.saving) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    try {
      const createdTask = await this.taskService.createTask(this.toPayload(this.createDraft));
      this.tasks = [createdTask, ...this.tasks];
      this.applyFilters();
      this.closeCreateForm();
      form.resetForm({
        title: '',
        description: '',
        priority: 'medium',
        category: '',
      });
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Failed to create task.';
    } finally {
      this.saving = false;
    }
  }

  async submitEdit(form: NgForm): Promise<void> {
    if (!this.editingTaskId || form.invalid || this.saving) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    try {
      const updatedTask = await this.taskService.updateTask(this.editingTaskId, this.toPayload(this.editDraft));
      this.tasks = this.tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task));
      this.applyFilters();
      this.cancelEdit();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Failed to update task.';
    } finally {
      this.saving = false;
    }
  }

  async toggleTask(task: Task): Promise<void> {
    try {
      const updatedTask = await this.taskService.toggleTask(task.id);
      this.tasks = this.tasks.map((item) => (item.id === updatedTask.id ? updatedTask : item));
      this.applyFilters();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Failed to update task.';
    }
  }

  async deleteTask(task: Task): Promise<void> {
    const shouldDelete = window.confirm(`Delete "${task.title}"?`);

    if (!shouldDelete) {
      return;
    }

    this.deletingTaskId = task.id;
    this.errorMessage = '';

    try {
      await this.taskService.deleteTask(task.id);
      this.tasks = this.tasks.filter((item) => item.id !== task.id);
      this.applyFilters();
      if (this.editingTaskId === task.id) {
        this.cancelEdit();
      }
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Failed to delete task.';
    } finally {
      this.deletingTaskId = null;
    }
  }

  trackByTaskId(_: number, task: Task): number {
    return task.id;
  }

  relativeTime(value: string): string {
    return timeAgo(value);
  }

  absoluteTime(value: string | null): string {
    return value ? formatDateTime(value) : '';
  }

  private buildDraft(): TaskDraft {
    return {
      title: '',
      description: '',
      priority: 'medium',
      category: '',
    };
  }

  private resetDraft(draft: TaskDraft): void {
    draft.title = '';
    draft.description = '';
    draft.priority = 'medium';
    draft.category = '';
  }

  private toPayload(draft: TaskDraft): TaskPayload {
    return {
      title: draft.title.trim(),
      description: draft.description.trim() || undefined,
      priority: draft.priority,
      category: draft.category.trim() || undefined,
    };
  }
}
