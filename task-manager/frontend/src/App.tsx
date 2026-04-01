import React, { useState } from 'react';
import { useTasks } from './hooks/useTasks';
import { SearchBar } from './components/SearchBar';
import { TaskList } from './components/TaskList';
import { TaskForm } from './components/TaskForm';
import { TaskCreate } from './types/task';
import './App.css';

function App() {
  const {
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
  } = useTasks();

  const [showForm, setShowForm] = useState(false);

  const handleCreateTask = async (data: TaskCreate) => {
    await addTask(data);
    setShowForm(false);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Task Manager</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ New Task'}
        </button>
      </header>

      <main className="app-main">
        {showForm && (
          <div className="new-task-form">
            <TaskForm
              onSubmit={handleCreateTask}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        <SearchBar
          filters={filters}
          categories={categories}
          onSearchChange={updateSearch}
          onFiltersChange={updateFilters}
        />

        <TaskList
          tasks={tasks}
          loading={loading}
          error={error}
          total={total}
          onToggle={toggleTask}
          onEdit={editTask}
          onDelete={removeTask}
        />
      </main>
    </div>
  );
}

export default App;
