import React, { useState } from 'react';
import { Task, TaskUpdate } from '../types/task';
import { timeAgo, formatDateTime } from '../utils/timeAgo';
import { TaskForm } from './TaskForm';

interface TaskItemProps {
    task: Task;
    onToggle: (id: number) => Promise<void>;
    onEdit: (id: number, updates: TaskUpdate) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
}

export function TaskItem({ task, onToggle, onEdit, onDelete }: TaskItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleToggle = async () => {
        await onToggle(task.id);
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            setIsDeleting(true);
            try {
                await onDelete(task.id);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const handleEdit = async (updates: TaskUpdate) => {
        await onEdit(task.id, updates);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="task-item editing">
                <TaskForm
                    task={task}
                    onSubmit={handleEdit}
                    onCancel={() => setIsEditing(false)}
                />
            </div>
        );
    }

    const priorityClass = `priority-${task.priority}`;
    const completedClass = task.completed ? 'completed' : '';

    return (
        <div className={`task-item ${priorityClass} ${completedClass}`}>
            <div className="task-checkbox">
                <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={handleToggle}
                    aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
                />
            </div>

            <div className="task-content">
                <h4 className="task-title">{task.title}</h4>

                {task.description && (
                    <p className="task-description">{task.description}</p>
                )}

                <div className="task-meta">
                    <span className={`priority-badge ${priorityClass}`}>
                        {task.priority}
                    </span>

                    {task.category && (
                        <span className="category-badge">{task.category}</span>
                    )}

                    <span className="task-time" title={formatDateTime(task.created_at)}>
                        Created {timeAgo(task.created_at)}
                    </span>

                    {task.updated_at && (
                        <span className="task-time" title={formatDateTime(task.updated_at)}>
                            · Updated {timeAgo(task.updated_at)}
                        </span>
                    )}
                </div>
            </div>

            <div className="task-actions">
                <button
                    className="btn btn-icon"
                    onClick={() => setIsEditing(true)}
                    aria-label="Edit task"
                    title="Edit"
                >
                    ✏️
                </button>
                <button
                    className="btn btn-icon btn-danger"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    aria-label="Delete task"
                    title="Delete"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
}
