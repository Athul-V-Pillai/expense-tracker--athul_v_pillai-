/* ==========================================
   SPENDWISE - JAVASCRIPT CORE APPLICATION
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // Storage Key
  const STORAGE_KEY = 'spendwise_transactions_v2';

  // Category Color System
  const CATEGORY_COLORS = {
    'Bills': '#8B5CF6',         // Purple
    'Entertainment': '#F97316', // Orange
    'Food': '#F59E0B',          // Yellow / Amber
    'Healthcare': '#14B8A6',    // Teal
    'Shopping': '#EC4899',      // Pink / Magenta
    'Transport': '#3B82F6',     // Blue
    'Salary': '#10B981',        // Green
    'Other': '#64748B'          // Slate / Gray
  };

  // Application State
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let state = {
    transactions: [],
    selectedMonth: currentMonthKey, // 'YYYY-MM' or 'ALL'
    activeTypeToggle: 'Expense',     // 'Expense' | 'Income'
    filterType: 'ALL',               // 'ALL' | 'INCOME' | 'EXPENSE'
    filterCategory: 'ALL',           // 'ALL' | Category Name
    editingId: null
  };

  // DOM Elements
  const toastContainerEl = document.getElementById('toast-container');
  const monthSelectorEl = document.getElementById('month-selector');
  const overviewPeriodTagEl = document.getElementById('overview-period-tag');
  
  // Stat Card Elements
  const totalIncomeEl = document.getElementById('total-income');
  const totalExpensesEl = document.getElementById('total-expenses');
  const currentBalanceEl = document.getElementById('current-balance');
  const incomeCountEl = document.getElementById('income-count');
  const expensesCountEl = document.getElementById('expenses-count');
  const balanceStatusEl = document.getElementById('balance-status');
  
  // Dedicated Monthly Expense Summary Elements
  const summaryPeriodLabelEl = document.getElementById('summary-period-label');
  const summaryNetSavingsEl = document.getElementById('summary-net-savings');
  const summaryTopCategoryEl = document.getElementById('summary-top-category');
  const summaryDailyAvgEl = document.getElementById('summary-daily-avg');

  // Chart Elements
  const chartSvgSegments = document.getElementById('chart-segments');
  const chartLegendEl = document.getElementById('chart-legend');
  const chartTotalAmountEl = document.getElementById('chart-total-amount');
  const chartEmptyStateEl = document.getElementById('chart-empty-state');
  const chartSubheadingEl = document.getElementById('chart-subheading');

  // Form Elements
  const formEl = document.getElementById('transaction-form');
  const formTitleEl = document.getElementById('form-title');
  const formSubtitleEl = document.getElementById('form-subtitle');
  const btnSubmitTextEl = document.getElementById('btn-submit-text');
  const btnCancelEditEl = document.getElementById('btn-cancel-edit');
  const toggleExpenseBtn = document.getElementById('toggle-expense');
  const toggleIncomeBtn = document.getElementById('toggle-income');
  const formErrorBannerEl = document.getElementById('form-error-banner');
  const formErrorBannerTextEl = document.getElementById('form-error-banner-text');
  const descCharCounterEl = document.getElementById('desc-char-counter');
  
  const inputAmount = document.getElementById('tx-amount');
  const selectCategory = document.getElementById('tx-category');
  const inputDate = document.getElementById('tx-date');
  const inputDescription = document.getElementById('tx-description');
  
  const errAmount = document.getElementById('err-amount');
  const errCategory = document.getElementById('err-category');
  const errDate = document.getElementById('err-date');
  const errDescription = document.getElementById('err-description');

  // History Table Elements
  const txCounterTextEl = document.getElementById('tx-counter-text');
  const filterTypeBtns = document.querySelectorAll('.history-filters .filter-btn');
  const filterCategorySelect = document.getElementById('filter-category');
  const txTableBody = document.getElementById('tx-table-body');
  const mobileTxList = document.getElementById('mobile-tx-list');
  const tableEmptyStateEl = document.getElementById('table-empty-state');
  const btnResetFiltersEl = document.getElementById('btn-reset-filters');

  // ==========================================
  // INITIALIZATION
  // ==========================================
  function init() {
    setupDefaultDate();
    loadFromStorage();
    populateMonthSelector();
    bindEvents();
    renderAll();
  }

  function setupDefaultDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    inputDate.value = `${yyyy}-${mm}-${dd}`;
  }

  function populateMonthSelector() {
    const monthsSet = new Set();
    monthsSet.add(currentMonthKey);

    state.transactions.forEach(tx => {
      if (tx.date) {
        const key = tx.date.substring(0, 7);
        monthsSet.add(key);
      }
    });

    const sortedMonths = Array.from(monthsSet).sort().reverse();
    monthSelectorEl.innerHTML = '';

    sortedMonths.forEach(mKey => {
      const option = document.createElement('option');
      option.value = mKey;
      option.textContent = formatMonthKey(mKey);
      if (mKey === state.selectedMonth) {
        option.selected = true;
      }
      monthSelectorEl.appendChild(option);
    });

    const allOption = document.createElement('option');
    allOption.value = 'ALL';
    allOption.textContent = 'All Time Overview';
    if (state.selectedMonth === 'ALL') {
      allOption.selected = true;
    }
    monthSelectorEl.appendChild(allOption);
  }

  function formatMonthKey(mKey) {
    const parts = mKey.split('-');
    if (parts.length === 2) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const dateObj = new Date(year, monthIdx, 1);
      return dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    }
    return mKey;
  }

  // ==========================================
  // LOCAL STORAGE & SEED DATA
  // ==========================================
  function loadFromStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        state.transactions = JSON.parse(data);
      } catch (e) {
        console.error('Failed to parse localStorage data', e);
        state.transactions = getSampleSeedData();
        saveToStorage();
      }
    } else {
      state.transactions = getSampleSeedData();
      saveToStorage();
    }
  }

  function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.transactions));
  }

  function getSampleSeedData() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');

    return [
      {
        id: 'seed-1',
        type: 'Income',
        amount: 75000,
        category: 'Salary',
        date: `${yyyy}-${mm}-01`,
        description: 'Monthly Salary Credit'
      },
      {
        id: 'seed-2',
        type: 'Expense',
        amount: 18500,
        category: 'Bills',
        date: `${yyyy}-${mm}-02`,
        description: 'House Rent & Utilities'
      },
      {
        id: 'seed-3',
        type: 'Expense',
        amount: 5250,
        category: 'Food',
        date: `${yyyy}-${mm}-04`,
        description: 'Supermarket Grocery Run'
      },
      {
        id: 'seed-4',
        type: 'Expense',
        amount: 2100,
        category: 'Transport',
        date: `${yyyy}-${mm}-05`,
        description: 'Fuel & Commute'
      },
      {
        id: 'seed-5',
        type: 'Expense',
        amount: 1499,
        category: 'Entertainment',
        date: `${yyyy}-${mm}-06`,
        description: 'Movie & Streaming Subscriptions'
      },
      {
        id: 'seed-6',
        type: 'Expense',
        amount: 3200,
        category: 'Healthcare',
        date: `${yyyy}-${mm}-07`,
        description: 'Pharmacy & Health Diagnostics'
      },
      {
        id: 'seed-7',
        type: 'Expense',
        amount: 4750,
        category: 'Shopping',
        date: `${yyyy}-${mm}-08`,
        description: 'Apparel & Footwear'
      }
    ];
  }

  // ==========================================
  // TOAST NOTIFICATIONS
  // ==========================================
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'danger') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `${iconSvg} <span>${escapeHtml(message)}</span>`;
    toastContainerEl.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ==========================================
  // CURRENCY & DATE UTILITIES
  // ==========================================
  function formatCurrency(amount) {
    const num = Number(amount) || 0;
    const formattedStr = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
    return `₹${formattedStr}`;
  }

  function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  }

  // ==========================================
  // EVENT BINDINGS
  // ==========================================
  function bindEvents() {
    monthSelectorEl.addEventListener('change', (e) => {
      state.selectedMonth = e.target.value;
      renderAll();
    });

    toggleExpenseBtn.addEventListener('click', () => setFormType('Expense'));
    toggleIncomeBtn.addEventListener('click', () => setFormType('Income'));

    formEl.addEventListener('submit', handleFormSubmit);
    btnCancelEditEl.addEventListener('click', resetForm);

    inputAmount.addEventListener('input', () => clearError(inputAmount, errAmount));
    selectCategory.addEventListener('change', () => clearError(selectCategory, errCategory));
    inputDate.addEventListener('change', () => clearError(inputDate, errDate));
    
    inputDescription.addEventListener('input', () => {
      clearError(inputDescription, errDescription);
      updateCharCounter();
    });

    filterTypeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterTypeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.filterType = btn.dataset.type;
        renderTransactions();
      });
    });

    filterCategorySelect.addEventListener('change', (e) => {
      state.filterCategory = e.target.value;
      renderTransactions();
    });

    btnResetFiltersEl.addEventListener('click', () => {
      state.filterType = 'ALL';
      state.filterCategory = 'ALL';
      filterCategorySelect.value = 'ALL';
      filterTypeBtns.forEach(b => {
        if (b.dataset.type === 'ALL') b.classList.add('active');
        else b.classList.remove('active');
      });
      renderTransactions();
    });
  }

  function updateCharCounter() {
    const len = inputDescription.value.length;
    descCharCounterEl.textContent = `${len}/80`;
    if (len >= 80) {
      descCharCounterEl.style.color = 'var(--expense-color)';
    } else {
      descCharCounterEl.style.color = 'var(--text-muted)';
    }
  }

  function setFormType(type) {
    state.activeTypeToggle = type;
    if (type === 'Expense') {
      toggleExpenseBtn.className = 'toggle-btn active-expense';
      toggleIncomeBtn.className = 'toggle-btn';
    } else {
      toggleIncomeBtn.className = 'toggle-btn active-income';
      toggleExpenseBtn.className = 'toggle-btn';
    }
  }

  // ==========================================
  // RENDER ENGINE
  // ==========================================
  function renderAll() {
    updateSummary();
    renderChart();
    renderTransactions();
  }

  // --- 1. OVERVIEW & MONTHLY EXPENSE SUMMARY ---
  function updateSummary() {
    const selectedMonth = state.selectedMonth;
    const isAllTime = selectedMonth === 'ALL';
    const periodLabel = isAllTime ? 'All Time' : formatMonthKey(selectedMonth);

    overviewPeriodTagEl.textContent = periodLabel;
    summaryPeriodLabelEl.textContent = periodLabel;

    const periodTxs = state.transactions.filter(tx => {
      if (isAllTime) return true;
      return tx.date && tx.date.startsWith(selectedMonth);
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    let incomeCount = 0;
    let expensesCount = 0;
    const expenseCategoryTotals = {};

    periodTxs.forEach(tx => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'Income') {
        totalIncome += amt;
        incomeCount++;
      } else {
        totalExpenses += amt;
        expensesCount++;
        expenseCategoryTotals[tx.category] = (expenseCategoryTotals[tx.category] || 0) + amt;
      }
    });

    const netSavings = totalIncome - totalExpenses;

    totalIncomeEl.textContent = formatCurrency(totalIncome);
    totalExpensesEl.textContent = formatCurrency(totalExpenses);
    currentBalanceEl.textContent = formatCurrency(netSavings);

    incomeCountEl.textContent = `${incomeCount} transaction${incomeCount === 1 ? '' : 's'}`;
    expensesCountEl.textContent = `${expensesCount} transaction${expensesCount === 1 ? '' : 's'}`;

    if (netSavings >= 0) {
      balanceStatusEl.textContent = "You're on track";
      balanceStatusEl.className = "card-subtext text-muted-light";
    } else {
      balanceStatusEl.textContent = "Expenses exceed income";
      balanceStatusEl.className = "card-subtext color-expenses";
    }

    summaryNetSavingsEl.textContent = formatCurrency(netSavings);
    if (netSavings >= 0) {
      summaryNetSavingsEl.className = 'metric-val color-income';
    } else {
      summaryNetSavingsEl.className = 'metric-val color-expenses';
    }

    const categories = Object.keys(expenseCategoryTotals);
    if (categories.length > 0) {
      const topCat = categories.reduce((a, b) => expenseCategoryTotals[a] > expenseCategoryTotals[b] ? a : b);
      const topAmt = expenseCategoryTotals[topCat];
      summaryTopCategoryEl.textContent = `${topCat} (${formatCurrency(topAmt)})`;
      const catColor = CATEGORY_COLORS[topCat] || CATEGORY_COLORS['Other'];
      summaryTopCategoryEl.style.color = catColor;
      summaryTopCategoryEl.style.borderColor = catColor;
    } else {
      summaryTopCategoryEl.textContent = 'None';
      summaryTopCategoryEl.style.color = 'var(--navy-dark)';
    }

    let daysCount = 30;
    if (!isAllTime) {
      const parts = selectedMonth.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      daysCount = new Date(year, month, 0).getDate();
      
      const today = new Date();
      if (today.getFullYear() === year && (today.getMonth() + 1) === month) {
        daysCount = Math.max(1, today.getDate());
      }
    } else {
      daysCount = 30;
    }

    const dailyAvg = totalExpenses > 0 ? (totalExpenses / daysCount) : 0;
    summaryDailyAvgEl.textContent = `${formatCurrency(dailyAvg)} / day`;
  }

  // --- 2. SVG DONUT CHART RENDERER ---
  function renderChart() {
    chartSvgSegments.innerHTML = '';
    chartLegendEl.innerHTML = '';

    const selectedMonth = state.selectedMonth;
    const isAllTime = selectedMonth === 'ALL';
    const periodLabel = isAllTime ? 'All Time' : formatMonthKey(selectedMonth);

    chartSubheadingEl.textContent = `${periodLabel} breakdown`;

    const expenseTxs = state.transactions.filter(tx => {
      if (tx.type !== 'Expense') return false;
      if (!tx.date) return false;
      if (isAllTime) return true;
      return tx.date.startsWith(selectedMonth);
    });

    if (expenseTxs.length === 0) {
      document.querySelector('.chart-wrapper').classList.add('hidden');
      chartLegendEl.classList.add('hidden');
      chartEmptyStateEl.classList.remove('hidden');
      chartTotalAmountEl.textContent = formatCurrency(0);
      return;
    }

    document.querySelector('.chart-wrapper').classList.remove('hidden');
    chartLegendEl.classList.remove('hidden');
    chartEmptyStateEl.classList.add('hidden');

    const categoryTotals = {};
    let monthTotalExpense = 0;

    expenseTxs.forEach(tx => {
      const amt = Number(tx.amount) || 0;
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + amt;
      monthTotalExpense += amt;
    });

    chartTotalAmountEl.textContent = formatCurrency(monthTotalExpense);

    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    let cumulativePercent = 0;

    const categories = Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a]);

    categories.forEach(cat => {
      const amount = categoryTotals[cat];
      const percent = amount / monthTotalExpense;
      const strokeDasharray = `${percent * circumference} ${circumference}`;
      const strokeDashoffset = -cumulativePercent * circumference;
      const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other'];

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '100');
      circle.setAttribute('cy', '100');
      circle.setAttribute('r', radius.toString());
      circle.setAttribute('class', 'chart-segment');
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-dasharray', strokeDasharray);
      circle.setAttribute('stroke-dashoffset', strokeDashoffset.toString());
      
      circle.setAttribute('data-category', cat);
      circle.setAttribute('data-amount', formatCurrency(amount));

      circle.addEventListener('mouseenter', () => {
        chartTotalAmountEl.textContent = formatCurrency(amount);
      });
      circle.addEventListener('mouseleave', () => {
        chartTotalAmountEl.textContent = formatCurrency(monthTotalExpense);
      });

      chartSvgSegments.appendChild(circle);

      const legendItem = document.createElement('div');
      legendItem.className = 'legend-item';
      legendItem.innerHTML = `
        <div class="legend-left">
          <span class="legend-dot" style="background-color: ${color};"></span>
          <span class="legend-name">${escapeHtml(cat)}</span>
        </div>
        <span class="legend-amount">${formatCurrency(amount)}</span>
      `;
      chartLegendEl.appendChild(legendItem);

      cumulativePercent += percent;
    });
  }

  // --- 3. TRANSACTION HISTORY TABLE & MOBILE CARDS ---
  function renderTransactions() {
    txTableBody.innerHTML = '';
    mobileTxList.innerHTML = '';

    const selectedMonth = state.selectedMonth;
    const isAllTime = selectedMonth === 'ALL';

    const filtered = state.transactions.filter(tx => {
      if (!isAllTime && tx.date && !tx.date.startsWith(selectedMonth)) return false;
      if (state.filterType === 'INCOME' && tx.type !== 'Income') return false;
      if (state.filterType === 'EXPENSE' && tx.type !== 'Expense') return false;
      if (state.filterCategory !== 'ALL' && tx.category !== state.filterCategory) return false;
      return true;
    });

    txCounterTextEl.textContent = `Showing ${filtered.length} of ${state.transactions.length} transaction${state.transactions.length === 1 ? '' : 's'}`;

    if (filtered.length === 0) {
      tableEmptyStateEl.classList.remove('hidden');
      return;
    } else {
      tableEmptyStateEl.classList.add('hidden');
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    filtered.forEach(tx => {
      const categoryColor = CATEGORY_COLORS[tx.category] || CATEGORY_COLORS['Other'];
      const isIncome = tx.type === 'Income';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatDateDisplay(tx.date)}</td>
        <td style="font-weight: 600;">${escapeHtml(tx.description)}</td>
        <td>
          <div class="category-cell">
            <span class="category-badge-dot" style="background-color: ${categoryColor};"></span>
            <span>${escapeHtml(tx.category)}</span>
          </div>
        </td>
        <td>
          <span class="type-badge ${isIncome ? 'type-badge-income' : 'type-badge-expense'}">
            ${tx.type}
          </span>
        </td>
        <td class="text-right ${isIncome ? 'amount-income' : 'amount-expense'}">
          ${isIncome ? '+' : '−'}${formatCurrency(tx.amount)}
        </td>
        <td>
          <div class="action-btn-group">
            <button type="button" class="action-btn action-btn-edit" data-id="${tx.id}" title="Edit transaction">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button type="button" class="action-btn action-btn-delete" data-id="${tx.id}" title="Delete transaction">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      `;

      txTableBody.appendChild(tr);

      const mobileCard = document.createElement('div');
      mobileCard.className = 'mobile-tx-card';
      mobileCard.innerHTML = `
        <div class="mobile-card-top">
          <div class="category-cell">
            <span class="category-badge-dot" style="background-color: ${categoryColor};"></span>
            <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary);">${escapeHtml(tx.category)}</span>
          </div>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${formatDateDisplay(tx.date)}</span>
        </div>
        <div class="mobile-card-main">
          <span class="mobile-card-desc">${escapeHtml(tx.description)}</span>
          <span class="${isIncome ? 'amount-income' : 'amount-expense'}">
            ${isIncome ? '+' : '−'}${formatCurrency(tx.amount)}
          </span>
        </div>
        <div class="mobile-card-bottom">
          <span class="type-badge ${isIncome ? 'type-badge-income' : 'type-badge-expense'}">
            ${tx.type}
          </span>
          <div class="action-btn-group" style="opacity:1;">
            <button type="button" class="action-btn action-btn-edit" data-id="${tx.id}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button type="button" class="action-btn action-btn-delete" data-id="${tx.id}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      `;

      mobileTxList.appendChild(mobileCard);
    });

    document.querySelectorAll('.action-btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => handleEdit(e.currentTarget.dataset.id));
    });

    document.querySelectorAll('.action-btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => handleDelete(e.currentTarget.dataset.id));
    });
  }

  // ==========================================
  // FORM HANDLING & ENHANCED VALIDATION
  // ==========================================
  function handleFormSubmit(e) {
    e.preventDefault();

    const errorCount = validateForm();
    if (errorCount > 0) {
      showFormErrorBanner(`Please correct the ${errorCount} highlighted field${errorCount === 1 ? '' : 's'} below.`);
      return;
    }

    hideFormErrorBanner();

    const amountVal = parseFloat(inputAmount.value);
    const categoryVal = selectCategory.value;
    const dateVal = inputDate.value;
    const descVal = inputDescription.value.trim();
    const typeVal = state.activeTypeToggle;

    if (state.editingId) {
      // EDIT TRANSACTION
      state.transactions = state.transactions.map(tx => {
        if (tx.id === state.editingId) {
          return {
            ...tx,
            type: typeVal,
            amount: amountVal,
            category: categoryVal,
            date: dateVal,
            description: descVal
          };
        }
        return tx;
      });
      showToast('Transaction updated successfully!', 'success');
    } else {
      // ADD NEW TRANSACTION
      const newTx = {
        id: Date.now().toString(),
        type: typeVal,
        amount: amountVal,
        category: categoryVal,
        date: dateVal,
        description: descVal
      };
      state.transactions.unshift(newTx);
      showToast(`${typeVal} of ${formatCurrency(amountVal)} added!`, 'success');
    }

    saveToStorage();
    populateMonthSelector();
    resetForm();
    renderAll();
  }

  function validateForm() {
    let errorCount = 0;

    // 1. Validate Amount (> 0 and <= ₹10,000,000)
    const amountVal = parseFloat(inputAmount.value);
    if (isNaN(amountVal) || amountVal <= 0) {
      showError(inputAmount, errAmount, 'Amount must be greater than ₹0.00');
      errorCount++;
    } else if (amountVal > 10000000) {
      showError(inputAmount, errAmount, 'Amount cannot exceed ₹1,00,00,000.00');
      errorCount++;
    } else {
      clearError(inputAmount, errAmount);
    }

    // 2. Validate Category
    if (!selectCategory.value) {
      showError(selectCategory, errCategory, 'Please select a valid category');
      errorCount++;
    } else {
      clearError(selectCategory, errCategory);
    }

    // 3. Validate Date (Year between 2000 and 2099)
    if (!inputDate.value) {
      showError(inputDate, errDate, 'Please select a transaction date');
      errorCount++;
    } else {
      const year = parseInt(inputDate.value.substring(0, 4), 10);
      if (isNaN(year) || year < 2000 || year > 2099) {
        showError(inputDate, errDate, 'Date year must be between 2000 and 2099');
        errorCount++;
      } else {
        clearError(inputDate, errDate);
      }
    }

    // 4. Validate Description (1 to 80 chars)
    const descTrimmed = inputDescription.value.trim();
    if (!descTrimmed) {
      showError(inputDescription, errDescription, 'Please enter a description');
      errorCount++;
    } else if (descTrimmed.length > 80) {
      showError(inputDescription, errDescription, 'Description must not exceed 80 characters');
      errorCount++;
    } else {
      clearError(inputDescription, errDescription);
    }

    return errorCount;
  }

  function showFormErrorBanner(msg) {
    formErrorBannerTextEl.textContent = msg;
    formErrorBannerEl.classList.remove('hidden');
  }

  function hideFormErrorBanner() {
    formErrorBannerEl.classList.add('hidden');
  }

  function showError(inputEl, errorEl, message) {
    inputEl.classList.add('input-error');
    errorEl.textContent = message;
  }

  function clearError(inputEl, errorEl) {
    inputEl.classList.remove('input-error');
    errorEl.textContent = '';
    
    // Hide error banner if no field errors remain
    const activeErrors = formEl.querySelectorAll('.input-error');
    if (activeErrors.length === 0) {
      hideFormErrorBanner();
    }
  }

  function handleEdit(id) {
    const tx = state.transactions.find(t => t.id === id);
    if (!tx) return;

    state.editingId = id;
    setFormType(tx.type);
    inputAmount.value = tx.amount;
    selectCategory.value = tx.category;
    inputDate.value = tx.date;
    inputDescription.value = tx.description;

    updateCharCounter();
    hideFormErrorBanner();

    formTitleEl.textContent = 'Edit Transaction';
    formSubtitleEl.textContent = 'Update details for this transaction';
    btnSubmitTextEl.textContent = 'Save Changes';
    btnCancelEditEl.classList.remove('hidden');

    formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function handleDelete(id) {
    const tx = state.transactions.find(t => t.id === id);
    if (!tx) return;

    const confirmDelete = confirm(`Are you sure you want to delete "${tx.description}" (${formatCurrency(tx.amount)})?`);
    if (confirmDelete) {
      state.transactions = state.transactions.filter(t => t.id !== id);
      
      if (state.editingId === id) {
        resetForm();
      }

      saveToStorage();
      populateMonthSelector();
      renderAll();
      showToast('Transaction deleted', 'info');
    }
  }

  function resetForm() {
    state.editingId = null;
    formEl.reset();
    setupDefaultDate();
    setFormType('Expense');
    updateCharCounter();
    hideFormErrorBanner();

    formTitleEl.textContent = 'Add Transaction';
    formSubtitleEl.textContent = 'Record a new income or expense';
    btnSubmitTextEl.textContent = '+ Add Transaction';
    btnCancelEditEl.classList.add('hidden');

    clearError(inputAmount, errAmount);
    clearError(selectCategory, errCategory);
    clearError(inputDate, errDate);
    clearError(inputDescription, errDescription);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Launch app
  init();
});
