// run with: node --test tests/logic.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../script.js');

// same starting list for every test
function freshTasks() {
  app.setTasks([
    { id: 'a', name: 'A', completed: false },
    { id: 'b', name: 'B', completed: true },
    { id: 'c', name: 'C', completed: false },
  ]);
}

test('TC01 – adding a normal task appends it as incomplete', () => {
  freshTasks();
  const task = app.addTask('Complete the final project');
  assert.equal(task.name, 'Complete the final project');
  assert.equal(task.completed, false);
  assert.equal(app.getTasks().length, 4);
  assert.equal(app.getTasks().at(-1), task);
});

test('TC01b – surrounding spaces are trimmed', () => {
  freshTasks();
  assert.equal(app.addTask('   Buy milk   ').name, 'Buy milk');
});

test('TC02 – empty or whitespace-only tasks are NOT added', () => {
  freshTasks();
  assert.equal(app.addTask(''), null);
  assert.equal(app.addTask('     '), null);
  assert.equal(app.addTask(undefined), null);
  assert.equal(app.getTasks().length, 3);
});

test('TC03 – completing a task changes its status', () => {
  freshTasks();
  assert.equal(app.toggleTask('a'), true);
  assert.equal(app.getTasks().find((t) => t.id === 'a').completed, true);
});

test('TC04 – toggling again returns it to incomplete', () => {
  freshTasks();
  app.toggleTask('a');
  app.toggleTask('a');
  assert.equal(app.getTasks().find((t) => t.id === 'a').completed, false);
});

test('TC05 – deleting a task removes only that task', () => {
  freshTasks();
  assert.equal(app.deleteTask('b'), true);
  assert.deepEqual(app.getTasks().map((t) => t.id), ['a', 'c']);
  assert.equal(app.deleteTask('does-not-exist'), false);
});

test('TC06 – "incomplete" filter shows only incomplete tasks', () => {
  freshTasks();
  const result = app.getFilteredTasks(app.getTasks(), 'incomplete');
  assert.deepEqual(result.map((t) => t.name), ['A', 'C']);
});

test('TC07 – "completed" filter shows only completed tasks', () => {
  freshTasks();
  const result = app.getFilteredTasks(app.getTasks(), 'completed');
  assert.deepEqual(result.map((t) => t.name), ['B']);
});

test('TC06/07 – "all" filter shows everything and filtering never mutates data', () => {
  freshTasks();
  assert.equal(app.getFilteredTasks(app.getTasks(), 'all').length, 3);
  app.getFilteredTasks(app.getTasks(), 'completed');
  assert.equal(app.getTasks().length, 3);
});

test('TC08 – statistics update after add, complete and delete', () => {
  freshTasks();
  assert.deepEqual(app.getStats(app.getTasks()), { total: 3, incomplete: 2, completed: 1 });

  app.addTask('D');
  assert.deepEqual(app.getStats(app.getTasks()), { total: 4, incomplete: 3, completed: 1 });

  app.toggleTask('a');
  assert.deepEqual(app.getStats(app.getTasks()), { total: 4, incomplete: 2, completed: 2 });

  app.deleteTask('b');
  assert.deepEqual(app.getStats(app.getTasks()), { total: 3, incomplete: 2, completed: 1 });
});

test('saved data is validated before use', () => {
  assert.equal(app.isValidTask({ id: 'x', name: 'X', completed: false }), true);
  assert.equal(app.isValidTask({ id: 'x', name: 'X' }), false);
  assert.equal(app.isValidTask(null), false);
});
