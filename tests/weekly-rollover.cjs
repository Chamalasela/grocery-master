const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../app.js'), 'utf8');
const dates = source.slice(source.indexOf('  const dateKey'), source.indexOf('  const makeId'));
const rollover = source.slice(source.indexOf('  function rollover()'), source.indexOf('  function announce'));
const context = vm.createContext({assert});
vm.runInContext(`${dates}
${rollover}
let saved = 0;
const save = () => saved++;
assert.equal(weekOf(new Date('2026-09-20T23:59:00')), '2026-09-14');
assert.equal(weekOf(new Date('2026-09-21T00:00:00')), '2026-09-21');
assert.equal(nextWeek('2026-12-28'), '2027-01-04');
let state = {week: '2020-01-06', items: [{name:'Minced chicken', quantity:'250 g', done:true}]};
assert.equal(rollover(), true);
assert.equal(state.week, weekOf());
assert.equal(state.items[0].done, false);
assert.equal(state.items[0].quantity, '250 g');
assert.equal(saved, 1);
state.items[0].done = true;
assert.equal(rollover(), false);
assert.equal(state.items[0].done, true);
state.week = nextWeek(weekOf());
assert.equal(rollover(), false);
assert.equal(state.items[0].done, true);
`, context);
console.log('Passed: Sunday/Monday boundary, year boundary, missed weeks, quantities retained, same-week persistence, early next week.');
