let items = [];
let filteredItems = [];

// Загрузка данных
async function loadItems() {
  try {
    const res = await fetch('/api/items');
    items = await res.json();
    filterItems();
  } catch (e) {
    console.error('Ошибка загрузки:', e);
    alert('Не удалось загрузить данные. Проверьте, что сервер запущен.');
  }
}

// Отрисовка таблицы
function renderTable() {
  const tbody = document.getElementById('itemsTable');
  const emptyState = document.getElementById('emptyState');

  if (filteredItems.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  tbody.innerHTML = filteredItems.map(item => `
    <tr data-id="${item.id}">
      <td class="px-3 py-3 font-medium text-gray-900">${escapeHtml(item.type)}</td>
      <td class="px-3 py-3 text-gray-700">${escapeHtml(item.grade || '—')}</td>
      <td class="px-3 py-3 text-gray-700">${escapeHtml(item.size1 || '—')}</td>
      <td class="px-3 py-3 text-gray-700">${escapeHtml(item.size2 || '—')}</td>
      <td class="px-3 py-3">
        <input type="number" 
               value="${item.quantity}" 
               min="0"
               class="quantity-input w-24 px-2 py-1.5 border border-gray-300 rounded-md text-center font-semibold"
               onchange="updateQuantity('${item.id}', this.value)"
               onfocus="this.select()">
      </td>
      <td class="px-3 py-3">
        <input type="text" 
               value="${escapeHtml(item.comment || '')}" 
               class="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
               onchange="updateComment('${item.id}', this.value)"
               placeholder="—">
      </td>
      <td class="px-3 py-3 text-center">
        <button onclick="deleteItem('${item.id}')" 
                class="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition"
                title="Удалить">
          ✕
        </button>
      </td>
    </tr>
  `).join('');
}

// Обновление количества
async function updateQuantity(id, newQty) {
  const quantity = Number(newQty);
  if (isNaN(quantity) || quantity < 0) return;

  try {
    const res = await fetch(`/api/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity })
    });

    if (!res.ok) throw new Error('Ошибка сохранения');

    const item = items.find(i => i.id === id);
    if (item) item.quantity = quantity;
  } catch (e) {
    console.error(e);
    alert('Не удалось сохранить количество');
    loadItems();
  }
}

// Обновление комментария
async function updateComment(id, newComment) {
  try {
    const res = await fetch(`/api/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: newComment })
    });

    if (!res.ok) throw new Error('Ошибка сохранения');

    const item = items.find(i => i.id === id);
    if (item) item.comment = newComment;
  } catch (e) {
    console.error(e);
    alert('Не удалось сохранить комментарий');
    loadItems();
  }
}

// Добавление
async function addItem(e) {
  e.preventDefault();

  const data = {
    type: document.getElementById('type').value,
    grade: document.getElementById('grade').value,
    size1: document.getElementById('size1').value,
    size2: document.getElementById('size2').value,
    quantity: document.getElementById('quantity').value,
    comment: document.getElementById('comment').value
  };

  try {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error('Ошибка добавления');

    closeAddModal();
    document.getElementById('addForm').reset();
    await loadItems();
  } catch (e) {
    console.error(e);
    alert('Не удалось добавить позицию');
  }
}

// Удаление
async function deleteItem(id) {
  if (!confirm('Удалить эту позицию?')) return;

  try {
    const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Ошибка удаления');
    await loadItems();
  } catch (e) {
    console.error(e);
    alert('Не удалось удалить');
  }
}

// Фильтрация по каждому столбцу
function filterItems() {
  const fType = (document.getElementById('filter-type')?.value || '').toLowerCase().trim();
  const fGrade = (document.getElementById('filter-grade')?.value || '').toLowerCase().trim();
  const fSize1 = (document.getElementById('filter-size1')?.value || '').toLowerCase().trim();
  const fSize2 = (document.getElementById('filter-size2')?.value || '').toLowerCase().trim();
  const fQty = (document.getElementById('filter-quantity')?.value || '').toLowerCase().trim();
  const fComment = (document.getElementById('filter-comment')?.value || '').toLowerCase().trim();

  filteredItems = items.filter(item => {
    if (fType && !(item.type || '').toLowerCase().includes(fType)) return false;
    if (fGrade && !(item.grade || '').toLowerCase().includes(fGrade)) return false;
    if (fSize1 && !(item.size1 || '').toLowerCase().includes(fSize1)) return false;
    if (fSize2 && !(item.size2 || '').toLowerCase().includes(fSize2)) return false;
    if (fQty && !String(item.quantity).includes(fQty)) return false;
    if (fComment && !(item.comment || '').toLowerCase().includes(fComment)) return false;
    return true;
  });

  renderTable();
}

// Сброс всех фильтров
function clearFilters() {
  document.getElementById('filter-type').value = '';
  document.getElementById('filter-grade').value = '';
  document.getElementById('filter-size1').value = '';
  document.getElementById('filter-size2').value = '';
  document.getElementById('filter-quantity').value = '';
  document.getElementById('filter-comment').value = '';
  filterItems();
}

// ===== БЭКАП =====

// Скачать бэкап
function downloadBackup() {
  const dataStr = JSON.stringify(items, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `metal-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Загрузить бэкап
async function uploadBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!confirm('Загрузить бэкап? Текущие данные будут полностью заменены!')) {
    event.target.value = '';
    return;
  }

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!Array.isArray(data)) {
      alert('Неверный формат файла бэкапа');
      return;
    }

    const res = await fetch('/api/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error('Ошибка восстановления');

    alert('Бэкап успешно загружен!');
    await loadItems();
  } catch (e) {
    console.error(e);
    alert('Не удалось загрузить бэкап. Проверьте файл.');
  }

  event.target.value = '';
}

// Модалка
function openAddModal() {
  document.getElementById('addModal').classList.remove('hidden');
  document.getElementById('addModal').classList.add('flex');
  document.getElementById('type').focus();
}

function closeAddModal() {
  document.getElementById('addModal').classList.add('hidden');
  document.getElementById('addModal').classList.remove('flex');
}

document.getElementById('addModal').addEventListener('click', (e) => {
  if (e.target.id === 'addModal') closeAddModal();
});

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Автообновление каждые 10 секунд
setInterval(loadItems, 10000);

// Старт
loadItems();
