import React from 'react';
import { Task, TaskUpdate } from '../types/task';
import { TaskItem } from './TaskItem';

interface TaskListProps {
    tasks: Task[];
    loading: boolean;
    error: string | null;
    total: number;
    onToggle: (id: number) => Promise<void>;
    onEdit: (id: number, updates: TaskUpdate) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
}

export function TaskList({
    tasks,
    loading,
    error,
    total,
    onToggle,
    onEdit,
    onDelete,
}: TaskListProps) {
    if (loading) {
        return (
            <div className="task-list-status">
                <div className="loading-spinner" />
                <p>Loading tasks...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="task-list-status error">
                <p>Error: {error}</p>
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="task-list-status empty">
                <p>No tasks found. Create one to get started!</p>
            </div>
        );
    }

    return (
        <div className="task-list">
            <div className="task-list-header">
                <span>
                    Showing {tasks.length} of {total} task{total !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="task-list-items">
                {tasks.map((task) => (
                    <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={onToggle}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
            </div>
        </div>
    );
}
