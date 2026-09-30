'use strict';

const STORAGE_KEY = 'task-manager.tasks.v1';
const FILTERS = ['all', 'incomplete', 'completed'];

// starter tasks, same as on the exercise sheet
const DEFAULT_TASKS = [
  { id: 'seed-1', name: 'Complete Web App', completed: false },
  { id: 'seed-2', name: 'Complete JavaScript Practice', completed: false },
  { id: 'seed-3', name: 'Complete Course Assignment', completed: true },
];

let tasks = loadTasks();
let currentFilter = 'all';


function loadTasks() {
  try {
    const raw = globalThis.localStorage && localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every(isValidTask)) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Could not read saved tasks, using defaults.', error);
  }
  return DEFAULT_TASKS.map((task) => ({ ...task }));
}

function saveTasks() {
  try {
    if (globalThis.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  } catch (error) {
    console.warn('Could not save tasks.', error);
  }
}

function isValidTask(task) {
  return (
    task !== null &&
    typeof task === 'object' &&
    typeof task.id === 'string' &&
    typeof task.name === 'string' &&
    typeof task.completed === 'boolean'
  );
}

function createId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}


// Adds a task. Returns null if the name is empty (or only spaces)
function addTask(name) {
  const cleanName = String(name ?? '').trim();
  if (cleanName === '') {
    return null;
  }

  const newTask = {
    id: createId(),
    name: cleanName,
    completed: false,
  };

  tasks.push(newTask);
  saveTasks();
  return newTask;
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return false;
  task.completed = !task.completed;
  saveTasks();
  return true;
}

function deleteTask(id) {
  const before = tasks.length;
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  return tasks.length < before;
}

// only returns a view, the tasks array itself stays untouched
function getFilteredTasks(list, filter) {
  switch (filter) {
    case 'incomplete':
      return list.filter((t) => !t.completed);
    case 'completed':
      return list.filter((t) => t.completed);
    default:
      return list;
  }
}

// always counts ALL tasks, no matter which filter is on
function getStats(list) {
  const completed = list.filter((t) => t.completed).length;
  return {
    total: list.length,
    completed,
    incomplete: list.length - completed,
  };
}


// grab the elements once (no document when running the node tests)
const hasDOM = typeof document !== 'undefined';
const form = hasDOM ? document.getElementById('task-form') : null;
const input = hasDOM ? document.getElementById('task-input') : null;
const message = hasDOM ? document.getElementById('form-message') : null;
const list = hasDOM ? document.getElementById('task-list') : null;
const filterGroup = hasDOM ? document.querySelector('.filters') : null;
const statTotal = hasDOM ? document.getElementById('stat-total') : null;
const statIncomplete = hasDOM ? document.getElementById('stat-incomplete') : null;
const statCompleted = hasDOM ? document.getElementById('stat-completed') : null;

// Redraws the whole UI from `tasks`, gets called after every change
function render() {
  renderTasks();
  renderFilterButtons();
  renderStats();
}

function renderTasks() {
  const visible = getFilteredTasks(tasks, currentFilter);
  list.replaceChildren();

  if (visible.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent =
      currentFilter === 'completed' ? 'No completed tasks yet.' :
      currentFilter === 'incomplete' ? 'No incomplete tasks.' :
      'No tasks yet.';
    list.append(empty);
    return;
  }

  for (const task of visible) {
    list.append(createTaskElement(task));
  }
}

function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = 'task-item' + (task.completed ? ' is-completed' : '');
  li.dataset.id = task.id;

  const label = document.createElement('label');
  label.className = 'task-label';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-toggle';
  checkbox.checked = task.completed;

  // textContent and not innerHTML, otherwise people could inject html
  const name = document.createElement('span');
  name.className = 'task-name';
  name.textContent = task.name;

  label.append(checkbox, name);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn btn-delete';
  deleteBtn.textContent = 'Delete';
  deleteBtn.setAttribute('aria-label', `Delete task "${task.name}"`);

  li.append(label, deleteBtn);
  return li;
}

function renderFilterButtons() {
  for (const btn of filterGroup.querySelectorAll('[data-filter]')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.filter === currentFilter));
  }
}

function renderStats() {
  const stats = getStats(tasks);
  statTotal.textContent = stats.total;
  statIncomplete.textContent = stats.incomplete;
  statCompleted.textContent = stats.completed;
}

function showMessage(text, type = 'error') {
  message.textContent = text;
  message.classList.toggle('is-success', type === 'success');
  input.classList.toggle('is-invalid', type === 'error' && text !== '');
  if (type === 'error' && text !== '') {
    input.setAttribute('aria-invalid', 'true');
  } else {
    input.removeAttribute('aria-invalid');
  }
}


// Add button + Enter both end up here
function handleSubmit(event) {
  event.preventDefault();

  const newTask = addTask(input.value);

  if (newTask === null) {
    showMessage('Please enter a task name — empty tasks cannot be added.', 'error');
    input.focus();
    return;
  }

  // otherwise the new task would be hidden behind the "Completed" filter
  if (currentFilter === 'completed') {
    currentFilter = 'all';
  }

  input.value = '';
  input.focus();
  showMessage(`Added "${newTask.name}".`, 'success');
  render();
}

// one listener on the <ul> for all rows, the li's get rebuilt anyway
function handleListChange(event) {
  if (!event.target.matches('.task-toggle')) return;
  const id = event.target.closest('.task-item').dataset.id;
  toggleTask(id);
  render();
}

function handleListClick(event) {
  const deleteBtn = event.target.closest('.btn-delete');
  if (!deleteBtn) return;
  const id = deleteBtn.closest('.task-item').dataset.id;
  deleteTask(id);
  render();
}

function handleFilterClick(event) {
  const btn = event.target.closest('[data-filter]');
  if (!btn || !FILTERS.includes(btn.dataset.filter)) return;
  currentFilter = btn.dataset.filter;
  render();
}

function handleInput() {
  if (message.textContent !== '') showMessage('');
}


if (hasDOM) {
  form.addEventListener('submit', handleSubmit);
  input.addEventListener('input', handleInput);
  list.addEventListener('change', handleListChange);
  list.addEventListener('click', handleListClick);
  filterGroup.addEventListener('click', handleFilterClick);

  render();
}

// for the node tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    addTask,
    toggleTask,
    deleteTask,
    getFilteredTasks,
    getStats,
    isValidTask,
    getTasks: () => tasks,
    setTasks: (next) => { tasks = next; },
  };
}
