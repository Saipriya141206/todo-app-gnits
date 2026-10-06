import { useEffect, useState } from "react";
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} from "./api";

import { FILTERS } from "./filters";
import Sidebar from "./components/Sidebar";
import TodoForm from "./components/TodoForm";
import TodoItem from "./components/TodoItem";

function App() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // PAGINATION
  // =========================

  const [currentPage, setCurrentPage] = useState(1);

  const tasksPerPage = 5;

  // =========================
  // ERROR HANDLING
  // =========================

  function showError(err) {
    console.error(err);
    setError(err.message);
  }

  // =========================
  // LOAD TODOS
  // =========================

  useEffect(() => {
    async function loadTodos() {
      try {
        setError("");

        const data = await getTodos();

        setTodos(data);
      } catch (err) {
        showError(err);
      } finally {
        setLoading(false);
      }
    }

    loadTodos();
  }, []);

  // =========================
  // ADD TODO
  // =========================

  async function handleAdd(title) {
    try {
      setError("");

      const newTodo = await createTodo(title);

      setTodos((prev) => [newTodo, ...prev]);

      // New task is added at the top
      setCurrentPage(1);
    } catch (err) {
      showError(err);
    }
  }

  // =========================
  // UPDATE TODO
  // =========================

  async function handleUpdate(id, data) {
    try {
      setError("");

      const updated = await updateTodo(id, data);

      setTodos((prev) =>
        prev.map((todo) =>
          todo._id === id ? updated : todo
        )
      );
    } catch (err) {
      showError(err);
    }
  }

  // =========================
  // DELETE TODO
  // =========================

  async function handleDelete(id) {
    try {
      setError("");

      await deleteTodo(id);

      setTodos((prev) =>
        prev.filter((todo) => todo._id !== id)
      );
    } catch (err) {
      showError(err);
    }
  }

  // =========================
  // CLEAR COMPLETED
  // =========================

  async function handleClearDone() {
    try {
      setError("");

      const doneTodos = todos.filter(
        (todo) => todo.completed
      );

      for (const todo of doneTodos) {
        await deleteTodo(todo._id);
      }

      setTodos((prev) =>
        prev.filter((todo) => !todo.completed)
      );
    } catch (err) {
      showError(err);
    }
  }

  // =========================
  // FILTER TODOS
  // =========================

  const filteredTodos = todos.filter(
    FILTERS[filter].test
  );

  // =========================
  // TASK COUNT
  // =========================

  const taskWord =
    filteredTodos.length === 1
      ? "task"
      : "tasks";

  // =========================
  // TOTAL PAGES
  // =========================

  const totalPages = Math.ceil(
    filteredTodos.length / tasksPerPage
  );

  // =========================
  // KEEP PAGE VALID
  // =========================

  useEffect(() => {
    const validPages = Math.max(1, totalPages);

    if (currentPage > validPages) {
      setCurrentPage(validPages);
    }
  }, [totalPages, currentPage]);

  // =========================
  // CURRENT PAGE TODOS
  // =========================

  const startIndex =
    (currentPage - 1) * tasksPerPage;

  const currentTodos = filteredTodos.slice(
    startIndex,
    startIndex + tasksPerPage
  );

  // =========================
  // CHANGE PAGE
  // =========================

  function changePage(page) {
    if (page < 1 || page > totalPages) {
      return;
    }

    setCurrentPage(page);
  }

  // =========================
  // CHANGE FILTER
  // =========================

  function handleFilterChange(newFilter) {
    setFilter(newFilter);

    // Always start from first page
    setCurrentPage(1);
  }

  // =========================
  // PAGE NUMBERS
  // =========================

  function getPageNumbers() {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1
    );
  }

  // =========================
  // PAGINATION UI
  // =========================

  function renderPagination() {
    if (totalPages <= 1) {
      return null;
    }

    const pageNumbers = getPageNumbers();

    return (
      <div className="pagination-wrapper">
        <div className="pagination">

          {/* FIRST PAGE */}
          <button
            className="pagination-button navigation-button"
            onClick={() => changePage(1)}
            disabled={currentPage === 1}
            aria-label="First page"
            title="First page"
          >
            «
          </button>

          {/* PREVIOUS PAGE */}
          <button
            className="pagination-button navigation-button"
            onClick={() =>
              changePage(currentPage - 1)
            }
            disabled={currentPage === 1}
            aria-label="Previous page"
            title="Previous page"
          >
            ‹
          </button>

          {/* PAGE NUMBERS */}
          <div className="pagination-pages">
            {pageNumbers.map((page) => (
              <button
                key={page}
                className={`pagination-button page-button ${
                  currentPage === page
                    ? "active"
                    : ""
                }`}
                onClick={() => changePage(page)}
                aria-label={`Go to page ${page}`}
                aria-current={
                  currentPage === page
                    ? "page"
                    : undefined
                }
              >
                {page}
              </button>
            ))}
          </div>

          {/* NEXT PAGE */}
          <button
            className="pagination-button navigation-button"
            onClick={() =>
              changePage(currentPage + 1)
            }
            disabled={currentPage === totalPages}
            aria-label="Next page"
            title="Next page"
          >
            ›
          </button>

          {/* LAST PAGE */}
          <button
            className="pagination-button navigation-button"
            onClick={() =>
              changePage(totalPages)
            }
            disabled={currentPage === totalPages}
            aria-label="Last page"
            title="Last page"
          >
            »
          </button>

        </div>
      </div>
    );
  }

  // =========================
  // RENDER TODO LIST
  // =========================

  function renderTodos() {
    if (loading) {
      return (
        <p className="empty">
          Loading...
        </p>
      );
    }

    if (filteredTodos.length === 0) {
      let message =
        "You're all caught up. Add a task above.";

      if (filter === "done") {
        message = "Nothing completed yet";
      }

      return (
        <div className="empty">
          <img src="/logo.png" alt="" />
          <p>{message}</p>
        </div>
      );
    }

    return (
      <>
        <ul className="todo-list">
          {currentTodos.map((todo) => (
            <TodoItem
              key={todo._id}
              todo={todo}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </ul>

        {renderPagination()}
      </>
    );
  }

  // =========================
  // MAIN UI
  // =========================

  return (
    <div className="layout">

      <Sidebar
        todos={todos}
        filter={filter}
        onFilter={handleFilterChange}
        onClearDone={handleClearDone}
      />

      <main className="panel content">

        {/* HEADER */}
        <header className="content-header">

          <h2>
            {FILTERS[filter].label}
          </h2>

          <span className="content-count">
            {filteredTodos.length} {taskWord}
          </span>

        </header>

        {/* ADD TODO */}
        <TodoForm onAdd={handleAdd} />

        {/* ERROR */}
        {error && (
          <div
            className="error"
            role="alert"
          >
            <span>{error}</span>

            <button
              onClick={() => setError("")}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {/* TODO LIST */}
        {renderTodos()}

      </main>

    </div>
  );
}

export default App;