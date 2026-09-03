(() => {
  const todoInput = document.getElementById('todo-input');
  const todoForm = document.getElementById('todo-form');
  const todoList = document.getElementById('todo-list');
  const todoCount = document.getElementById('todo-count');
  const emptyState = document.getElementById('empty-state');
  const clearCompletedBtn = document.getElementById('clear-completed');
  const footer = document.getElementById('app-footer');
  const filterBtns = document.querySelectorAll('.filter-btn');

  let todos = JSON.parse(localStorage.getItem('maximalist-todos') || '[]');
  let currentFilter = 'all';

  function save() {
    localStorage.setItem('maximalist-todos', JSON.stringify(todos));
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function render() {
    const filtered = todos.filter(t => {
      if (currentFilter === 'active') return !t.done;
      if (currentFilter === 'completed') return t.done;
      return true;
    });

    todoList.innerHTML = '';

    filtered.forEach(todo => {
      const li = document.createElement('li');
      li.className = 'todo-item' + (todo.done ? ' completed' : '');
      li.dataset.id = todo.id;

      const checkbox = document.createElement('button');
      checkbox.className = 'todo-checkbox' + (todo.done ? ' checked' : '');
      checkbox.innerHTML = `<svg viewBox="0 0 14 14" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="2.5 7 5.5 10 11.5 4"/></svg>`;
      checkbox.onclick = () => toggleTodo(todo.id);

      const text = document.createElement('span');
      text.className = 'todo-text' + (todo.done ? ' completed' : '');
      text.textContent = todo.text;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'todo-delete';
      deleteBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
      deleteBtn.onclick = () => deleteTodo(todo.id, li);

      li.appendChild(checkbox);
      li.appendChild(text);
      li.appendChild(deleteBtn);
      todoList.appendChild(li);
    });

    const activeCount = todos.filter(t => !t.done).length;
    const completedCount = todos.filter(t => t.done).length;
    todoCount.textContent = `${activeCount} active / ${todos.length} total`;

    emptyState.style.display = todos.length === 0 ? 'block' : 'none';
    footer.style.display = completedCount > 0 ? 'block' : 'none';
    clearCompletedBtn.style.display = completedCount > 0 ? 'inline-flex' : 'none';
  }

  function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;

    todos.unshift({ id: generateId(), text, done: false, createdAt: Date.now() });
    todoInput.value = '';
    save();
    render();
    toast.success('Task added!');
  }

  function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    todo.done = !todo.done;
    save();
    render();

    if (todo.done) {
      toast.message(`"${todo.text}" completed!`, {
        preserve: false,
        onUndoAction: () => {
          todo.done = false;
          save();
          render();
          toast.message('Task restored!');
        }
      });
    }
  }

  function deleteTodo(id, el) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    el.classList.add('removing');
    setTimeout(() => {
      todos = todos.filter(t => t.id !== id);
      save();
      render();
      toast.error(`"${todo.text}" deleted`);
    }, 300);
  }

  function clearCompleted() {
    const count = todos.filter(t => t.done).length;
    todos = todos.filter(t => !t.done);
    save();
    render();
    toast.warning(`Cleared ${count} completed task${count !== 1 ? 's' : ''}`);
  }

  window.addTodo = addTodo;
  window.filterTodos = function (filter, btn) {
    currentFilter = filter;
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render();
  };
  window.clearCompleted = clearCompleted;

  todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTodo();
  });

  render();
})();
