(() => {
  'use strict';
  const STORAGE_KEY = 'pantry.weekly.v1';
  const $ = (id) => document.getElementById(id);
  const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const parseDate = (key) => new Date(`${key}T12:00:00`);
  function weekOf(date = new Date()) {
    const monday = new Date(date);
    monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
    return dateKey(monday);
  }
  function nextWeek(key) {
    const date = parseDate(key);
    date.setDate(date.getDate() + 7);
    return dateKey(date);
  }
  const makeId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const defaults = () => ({version: 1, week: weekOf(), items: [
    ['Minced chicken', '250 g'], ['Greek yogurt', '1 tub'], ['Eggs', '12-egg box'],
    ['Avocados', '2'], ['Bananas', '6'], ['Baby spinach', '1 bag'],
    ['Oat milk', '1 L'], ['Sourdough bread', '1 loaf']
  ].map(([name, quantity]) => ({id: makeId(), name, quantity, buyCount: 1, stock: null, done: false}))});
  let storageAvailable = true;
  let state;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    state = saved ? JSON.parse(saved) : defaults();
    if (state.version !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(state.week) || !Number.isFinite(parseDate(state.week).getTime()) || !Array.isArray(state.items) || !state.items.every(item => typeof item.id === 'string' && typeof item.name === 'string' && typeof item.quantity === 'string' && typeof item.done === 'boolean')) throw new Error('Invalid saved list');
  } catch {
    state = defaults();
    storageAvailable = false;
  }
  // Extend existing saved lists without changing quantities or checkmarks.
  state.items.forEach(item => {
    item.buyCount = Number.isSafeInteger(item.buyCount) && item.buyCount > 0 ? item.buyCount : 1;
    item.stock = Number.isSafeInteger(item.stock) && item.stock >= 0 ? item.stock : null;
  });
  let filter = 'all';
  let editingId = null;
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageAvailable = true; }
    catch { storageAvailable = false; }
    $('save-status').textContent = storageAvailable ? 'Changes saved on this device' : 'Storage unavailable — keep this page open';
  }
  function rollover() {
    const current = weekOf();
    if (current > state.week) {
      state.week = current;
      state.items.forEach(item => { item.done = false; });
      save();
      return true;
    }
    return false;
  }
  function announce(message) { $('announcement').textContent = message; }
  function render() {
    const done = state.items.filter(item => item.done).length;
    const total = state.items.length;
    const remaining = total - done;
    const start = parseDate(state.week);
    const end = parseDate(state.week); end.setDate(end.getDate() + 6);
    const format = date => date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
    $('week-label').textContent = `${format(start)} – ${format(end)}`;
    $('progress-count').replaceChildren(document.createTextNode(`${done} `), Object.assign(document.createElement('span'), {textContent: `/ ${total}`}));
    $('progress-bar').style.width = `${total ? done / total * 100 : 0}%`;
    $('progress-title').textContent = total && !remaining ? 'That’s your week in the bag.' : done ? 'Your basket is coming together.' : 'Let’s fill that basket.';
    $('progress-description').textContent = total && !remaining ? 'All done. Your staples are ready for next week.' : done ? `${remaining} more ${remaining === 1 ? 'item' : 'items'} to go. You’ve got this.` : 'A small list. A smoother week.';
    $('item-count').textContent = total;
    $('remaining-count').textContent = remaining;
    $('footer-count').textContent = `${remaining} ${remaining === 1 ? 'item' : 'items'} left to pick up`;
    $('rollover-detail').textContent = `Next refresh: ${parseDate(nextWeek(state.week)).toLocaleDateString('en-US', {weekday: 'long', month: 'short', day: 'numeric'})}.`;
    const visible = state.items.filter(item => filter === 'all' || (filter === 'done' ? item.done : !item.done));
    const list = $('shopping-list'); list.replaceChildren();
    visible.forEach(item => {
      const row = document.createElement('li'); row.className = `grocery-row${item.done ? ' done' : ''}`;
      const check = document.createElement('button'); check.type = 'button'; check.className = 'check-button'; check.setAttribute('role', 'checkbox'); check.setAttribute('aria-checked', String(item.done)); check.setAttribute('aria-label', `${item.name}, ${item.quantity}`); check.textContent = item.done ? '✓' : '';
      check.addEventListener('click', () => {
        rollover(); item.done = !item.done; save(); render();
        const checks = [...list.querySelectorAll('.check-button')];
        (checks.find(button => button.getAttribute('aria-label') === `${item.name}, ${item.quantity}`) || checks[0] || $('item-name')).focus();
        announce(`${item.name} ${item.done ? 'added to basket' : 'marked to buy'}.`);
      });
      const name = document.createElement('span'); name.className = 'item-label';
      const title = document.createElement('span'); title.className = 'item-title'; title.textContent = item.name;
      const pack = document.createElement('small'); pack.className = 'pack-size'; pack.textContent = item.quantity;
      name.append(title, pack);
      const quantity = document.createElement('span'); quantity.className = 'quantity-badge'; quantity.textContent = `Buy × ${item.buyCount}`; quantity.setAttribute('aria-label', `Buy ${item.buyCount} of ${item.quantity}`);
      const stock = document.createElement('button'); stock.type = 'button'; stock.className = `stock-badge${item.stock === 0 ? ' no-stock' : ''}`; stock.textContent = `At home: ${item.stock === null ? 'Not set' : item.stock}`; stock.setAttribute('aria-label', `Update stock for ${item.name}: ${item.stock === null ? 'not set' : item.stock}`); stock.title = 'Update stock at home';
      stock.addEventListener('click', () => openEdit(item, true));
      const actions = document.createElement('div'); actions.className = 'row-actions';
      const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = '✎'; edit.setAttribute('aria-label', `Edit ${item.name}`); edit.title = 'Edit item';
      edit.addEventListener('click', () => openEdit(item));
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', `Remove ${item.name}`); remove.title = 'Remove item';
      remove.addEventListener('click', () => { state.items = state.items.filter(entry => entry.id !== item.id); save(); render(); $('item-name').focus(); announce(`${item.name} removed.`); });
      actions.append(edit, remove); row.append(check, name, quantity, stock, actions); list.append(row);
    });
    $('empty-state').hidden = visible.length > 0;
    $('empty-state').textContent = !total ? 'A fresh list awaits. Add your first weekly staple above.' : filter === 'done' ? 'Your basket is empty. Check off an item to get started.' : 'Everything is in the basket. Happy shopping!';
    document.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
    $('save-status').textContent = storageAvailable ? 'Changes saved on this device' : 'Storage unavailable — keep this page open';
  }
  function openEdit(item, focusStock = false) {
    editingId = item.id;
    $('edit-name').value = item.name;
    $('edit-quantity').value = item.quantity;
    $('edit-buy-count').value = item.buyCount;
    $('edit-stock').value = item.stock ?? '';
    $('edit-dialog').showModal();
    if (focusStock) $('edit-stock').focus();
  }
  function readCounts(prefix) {
    const buyCount = Number($(`${prefix}-buy-count`).value);
    const rawStock = $(`${prefix}-stock`).value.trim();
    const stock = rawStock === '' ? null : Number(rawStock);
    if (!Number.isSafeInteger(buyCount) || buyCount < 1 || (stock !== null && (!Number.isSafeInteger(stock) || stock < 0))) return null;
    return {buyCount, stock};
  }
  $('add-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = $('item-name').value.trim(); const quantity = $('item-quantity').value.trim();
    const counts = readCounts('item');
    if (!name || !quantity || !counts) return;
    rollover(); state.items.push({id: makeId(), name, quantity, ...counts, done: false}); filter = 'all'; save(); render(); $('add-form').reset(); $('item-name').focus(); announce(`${name} added to your weekly list.`);
  });
  $('edit-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = $('edit-name').value.trim(); const quantity = $('edit-quantity').value.trim();
    const counts = readCounts('edit');
    if (!name || !quantity || !counts) return;
    const item = state.items.find(entry => entry.id === editingId);
    if (item) Object.assign(item, {name, quantity, ...counts});
    $('edit-dialog').close(); save(); render(); announce('Item updated.');
  });
  $('cancel-edit').addEventListener('click', () => $('edit-dialog').close());
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => { filter = button.dataset.filter; render(); }));
  $('reset-button').addEventListener('click', () => { state.items.forEach(item => { item.done = false; }); save(); render(); announce('All items marked to buy.'); });
  $('next-week-button').addEventListener('click', () => {
    if (!confirm('Start next week now? Your items and quantities will carry over, and all checkmarks will clear.')) return;
    state.week = nextWeek(state.week); state.items.forEach(item => { item.done = false; }); filter = 'all'; save(); render(); announce('Your next week is ready.');
  });
  window.addEventListener('focus', () => { if (rollover()) render(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && rollover()) render(); });
  setInterval(() => { if (rollover()) render(); }, 60000);
  rollover(); save(); render();
})();
