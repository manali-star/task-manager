import React from 'react';
import { TaskFilters } from '../types/task';

interface SearchBarProps {
    filters: TaskFilters;
    categories: string[];
    onSearchChange: (search: string) => void;
    onFiltersChange: (filters: Partial<TaskFilters>) => void;
}

export function SearchBar({
    filters,
    categories,
    onSearchChange,
    onFiltersChange,
}: SearchBarProps) {
    return (
        <div className="search-bar">
            <div className="search-input-wrapper">
                <input
                    type="text"
                    placeholder="Search tasks..."
                    value={filters.search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="search-input"
                />
                {filters.search && (
                    <button
                        className="clear-search"
                        onClick={() => onSearchChange('')}
                        aria-label="Clear search"
                    >
                        ×
                    </button>
                )}
            </div>

            <div className="filters">
                <select
                    value={filters.completed === null ? '' : String(filters.completed)}
                    onChange={(e) => {
                        const value = e.target.value;
                        onFiltersChange({
                            completed: value === '' ? null : value === 'true',
                        });
                    }}
                    className="filter-select"
                >
                    <option value="">All Status</option>
                    <option value="false">Active</option>
                    <option value="true">Completed</option>
                </select>

                <select
                    value={filters.priority}
                    onChange={(e) => onFiltersChange({ priority: e.target.value })}
                    className="filter-select"
                >
                    <option value="">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>

                <select
                    value={filters.category}
                    onChange={(e) => onFiltersChange({ category: e.target.value })}
                    className="filter-select"
                >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
