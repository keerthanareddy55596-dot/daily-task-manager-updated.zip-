const taskForm = document.querySelector('#taskForm');
const taskInput = document.querySelector('#taskInput');
const priorityInput = document.querySelector('#priorityInput');
const taskList = document.querySelector('#taskList');
const emptyState = document.querySelector('#emptyState');
const totalCount = document.querySelector('#totalCount');
const completedCount = document.querySelector('#completedCount');
const remainingCount = document.querySelector('#remainingCount');
const clearCompletedButton = document.querySelector('#clearCompleted');
const filterButtons = document.querySelectorAll('[data-filter]');

let tasks = loadTasks();
let currentFilter = 'all';

function loadTasks() {
  try {
    const saved = localStorage.getItem('dailyTaskManagerTasks');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.warn('Could not load saved tasks:', error);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem('dailyTaskManagerTasks', JSON.stringify(tasks));
  } catch (error) {
    alert('Your browser could not save these tasks. Check your browser storage settings.');
  }
}

// Update date and time every second using the device's local time zone.
function updateDateTime() {
  const now = new Date();
  document.querySelector('#dayName').textContent =
    new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(now);
  document.querySelector('#todayDate').textContent =
    new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(now);
  document.querySelector('#currentTime').textContent =
    new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).format(now);
}

function updateSummary() {
  const completed = tasks.filter(task => task.completed).length;
  totalCount.textContent = tasks.length;
  completedCount.textContent = completed;
  remainingCount.textContent = tasks.length - completed;
}

function createTaskElement(task) {
  const item = document.createElement('li');
  item.className = `task-item${task.completed ? ' done' : ''}`;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-check';
  checkbox.checked = task.completed;
  checkbox.setAttribute('aria-label', `Mark ${task.title} as ${task.completed ? 'active' : 'completed'}`);
  checkbox.addEventListener('change', () => {
    tasks = tasks.map(entry => entry.id === task.id ? { ...entry, completed: checkbox.checked } : entry);
    saveTasks();
    renderTasks();
  });

  const content = document.createElement('div');
  content.className = 'task-content';

  const title = document.createElement('p');
  title.className = 'task-title';
  title.textContent = task.title;

  const meta = document.createElement('div');
  meta.className = 'task-meta';
  const priority = document.createElement('span');
  priority.className = `priority ${task.priority}`;
  priority.textContent = `${task.priority} priority`;
  const created = document.createElement('span');
  created.textContent = `Added ${task.createdAt}`;
  meta.append(priority, created);
  content.append(title, meta);

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'delete-button';
  deleteButton.textContent = '×';
  deleteButton.setAttribute('aria-label', `Delete ${task.title}`);
  deleteButton.addEventListener('click', () => {
    tasks = tasks.filter(entry => entry.id !== task.id);
    saveTasks();
    renderTasks();
  });

  item.append(checkbox, content, deleteButton);
  return item;
}

function renderTasks() {
  taskList.replaceChildren();
  const visibleTasks = tasks.filter(task => {
    if (currentFilter === 'active') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true;
  });

  visibleTasks.forEach(task => taskList.append(createTaskElement(task)));
  emptyState.hidden = visibleTasks.length > 0;
  if (tasks.length === 0) {
    emptyState.querySelector('h3').textContent = 'Your task list is empty';
    emptyState.querySelector('p').textContent = 'Add a task above to get your day moving.';
  } else if (visibleTasks.length === 0) {
    emptyState.querySelector('h3').textContent = 'No tasks in this view';
    emptyState.querySelector('p').textContent = 'Try another filter to see your tasks.';
  }
  updateSummary();
}

taskForm.addEventListener('submit', event => {
  event.preventDefault();
  const title = taskInput.value.trim();
  if (!title) {
    taskInput.focus();
    return;
  }

  tasks.unshift({
    id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    title,
    priority: priorityInput.value,
    completed: false,
    createdAt: new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date())
  });
  saveTasks();
  taskInput.value = '';
  priorityInput.value = 'medium';
  currentFilter = 'all';
  filterButtons.forEach(button => button.classList.toggle('active', button.dataset.filter === 'all'));
  renderTasks();
  taskInput.focus();
});

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach(filter => filter.classList.toggle('active', filter === button));
    renderTasks();
  });
});

clearCompletedButton.addEventListener('click', () => {
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  renderTasks();
});

updateDateTime();
setInterval(updateDateTime, 1000);
renderTasks();
