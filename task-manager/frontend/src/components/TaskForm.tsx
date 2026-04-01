import React, { useState } from 'react';
import { Task, TaskCreate, TaskUpdate } from '../types/task';

interface TaskFormProps {
    task?: Task | null;
    onSubmit: (data: TaskCreate | TaskUpdate) => Promise<void>;
    onCancel: () => void;
}

export function TaskForm({ task, onSubmit, onCancel }: TaskFormProps) {
    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(
        task?.priority || 'medium'
    );
    const [category, setCategory] = useState(task?.category || '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEditing = !!task;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            await onSubmit({
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                category: category.trim() || undefined,
            });

            if (!isEditing) {
                // Reset form after creating
                setTitle('');
                setDescription('');
                setPriority('medium');
                setCategory('');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save task');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="task-form" onSubmit={handleSubmit}>
            <h3>{isEditing ? 'Edit Task' : 'Create New Task'}</h3>

            {error && <div className="form-error">{error}</div>}

            <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter task title"
                    disabled={submitting}
                    autoFocus
                />
            </div>

            <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter task description (optional)"
                    disabled={submitting}
                    rows={3}
                />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="priority">Priority</label>
                    <select
                        id="priority"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                        disabled={submitting}
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <input
                        id="category"
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g., Work, Personal"
                        disabled={submitting}
                    />
                </div>
            </div>

            <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
                </button>
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onCancel}
                    disabled={submitting}
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
