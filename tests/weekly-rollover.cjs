const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../app.js'), 'utf8');
const dates = source.slice(source.indexOf('  const dateKey'), source.indexOf('  const makeId'));
const rollover = source.slice(source.indexOf('  function startWeek('), source.indexOf('  function announce'));
const context = vm.createContext({assert});
vm.runInContext(`${dates}
${rollover}
let saved = 0;
const save = () => saved++;
assert.equal(weekOf(new Date('2026-09-20T23:59:00')), '2026-09-14');
assert.equal(weekOf(new Date('2026-09-21T00:00:00')), '2026-09-21');
assert.equal(nextWeek('2026-12-28'), '2027-01-04');
let state = {week: '2020-01-06', items: [{name:'Minced chicken', quantity:'250 g', buyCount:2, stock:3, repeatWeekly:true, active:true, done:true}]};
assert.equal(rollover(), true);
assert.equal(state.week, weekOf());
assert.equal(state.items[0].done, false);
assert.equal(state.items[0].quantity, '250 g');
assert.equal(saved, 1);
assert.equal(state.items[0].stock, 3);
assert.equal(state.items[0].buyCount, 2);
state.items[0].done = true;
assert.equal(rollover(), false);
assert.equal(state.items[0].done, true);
state.week = nextWeek(weekOf());
assert.equal(rollover(), false);
assert.equal(state.items[0].done, true);
`, context);
console.log('Passed: Sunday/Monday boundary, year boundary, missed weeks, quantities retained, same-week persistence, early next week.');

const migration = source.slice(source.indexOf('  // Extend existing'), source.indexOf("  let filter = 'all';"));
vm.runInContext(`
state = {items: [{name: 'Eggs', quantity: '6', done: true}, {name:'Chicken', quantity:'250 g', buyCount:2, stock:0, done:false}]};
${migration}
assert.equal(state.items[0].stock, null);
assert.equal(state.items[0].buyCount, 1);
assert.equal(state.items[0].quantity, '6');
assert.equal(state.items[0].done, true);
assert.equal(state.items[1].stock, 0);
assert.equal(state.items[1].buyCount, 2);
`, context);
console.log('Passed: stock survives rollover, existing list migration, unknown vs zero stock.');

vm.runInContext(`
state = {week: '2020-01-06', items: [
  {name:'Eggs', repeatWeekly:true, active:true, done:true, stock:2},
  {name:'Washing powder', repeatWeekly:false, active:true, done:true, stock:1},
  {name:'Occasional unbought', repeatWeekly:false, active:true, done:false, stock:0}
]};
assert.equal(rollover(), true);
assert.equal(state.items[0].active, true);
assert.equal(state.items[1].active, false);
assert.equal(state.items[2].active, false);
assert.equal(state.items[1].stock, 1);
state.items[1].active = true;
assert.equal(rollover(), false);
assert.equal(state.items[1].active, true);
startWeek(nextWeek(state.week));
assert.equal(state.items[1].active, false);
state.items[1].repeatWeekly = true;
startWeek(nextWeek(state.week));
assert.equal(state.items[1].active, true);
`, context);
console.log('Passed: selective automatic/manual rollover, saved stock, re-adding occasional items, enabling repeat.');
