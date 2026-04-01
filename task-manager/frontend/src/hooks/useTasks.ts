import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, TaskCreate, TaskUpdate, TaskFilters } from '../types/task';
import * as taskApi from '../api/taskApi';

const DEBOUNCE_DELAY = 300; // milliseconds

export function useTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<string[]>([]);

    const [filters, setFilters] = useState<TaskFilters>({
        search: '',
        completed: null,
        priority: '',
        category: '',
    });

    // Ref to track the latest search term for debouncing
    const searchTimeoutRef = useRef<number | null>(null);

    /**
     * Load tasks from API with current filters.
     */
    const loadTasks = useCallback(async (currentFilters: TaskFilters) => {
        try {
            setLoading(true);
            setError(null);
            const response = await taskApi.fetchTasks(currentFilters);
            setTasks(response.tasks);
            setTotal(response.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load tasks');
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Load categories from API.
     */
    const loadCategories = useCallback(async () => {
        try {
            const cats = await taskApi.fetchCategories();
            setCategories(cats);
        } catch (err) {
            console.error('Failed to load categories:', err);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadTasks(filters);
        loadCategories();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /**
     * Update search filter with debouncing for real-time search.
     */
    const updateSearch = useCallback((search: string) => {
        setFilters(prev => ({ ...prev, search }));

        // Clear existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Set new debounced search
        searchTimeoutRef.current = window.setTimeout(() => {
            loadTasks({ ...filters, search });
        }, DEBOUNCE_DELAY);
    }, [filters, loadTasks]);

    /**
     * Update non-search filters (immediate, no debounce).
     */
    const updateFilters = useCallback((newFilters: Partial<TaskFilters>) => {
        const updated = { ...filters, ...newFilters };
        setFilters(updated);
        loadTasks(updated);
    }, [filters, loadTasks]);

    /**
     * Create a new task.
     */
    const addTask = useCallback(async (task: TaskCreate) => {
        try {
            setError(null);
            const newTask = await taskApi.createTask(task);
            setTasks(prev => [newTask, ...prev]);
            setTotal(prev => prev + 1);
            loadCategories(); // Refresh categories in case a new one was added
            return newTask;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create task');
            throw err;
        }
    }, [loadCategories]);

    /**
     * Update an existing task.
     */
    const editTask = useCallback(async (id: number, updates: TaskUpdate) => {
        try {
            setError(null);
            const updatedTask = await taskApi.updateTask(id, updates);
            setTasks(prev => prev.map(t => (t.id === id ? updatedTask : t)));
            loadCategories();
            return updatedTask;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update task');
            throw err;
        }
    }, [loadCategories]);

    /**
     * Toggle task completion.
     */
    const toggleTask = useCallback(async (id: number) => {
        try {
            setError(null);
            const updatedTask = await taskApi.toggleTaskCompletion(id);
            setTasks(prev => prev.map(t => (t.id === id ? updatedTask : t)));
            return updatedTask;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to toggle task');
            throw err;
        }
    }, []);

    /**
     * Delete a task.
     */
    const removeTask = useCallback(async (id: number) => {
        try {
            setError(null);
            await taskApi.deleteTask(id);
            setTasks(prev => prev.filter(t => t.id !== id));
            setTotal(prev => prev - 1);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete task');
            throw err;
        }
    }, []);

    /**
     * Refresh tasks with current filters.
     */
    const refresh = useCallback(() => {
        loadTasks(filters);
        loadCategories();
    }, [filters, loadTasks, loadCategories]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    return {
        tasks,
        total,
        loading,
        error,
        filters,
        categories,
        updateSearch,
        updateFilters,
        addTask,
        editTask,
        toggleTask,
        removeTask,
        refresh,
    };
}
