const timeSlots = ['09:00', '09:45', '10:30', '11:15', '13:30', '14:15', '15:00', '15:45', '16:30', '17:15', '18:00', '18:45'];

let currentActiveView = 'agenda';
let currentAgendaDate = getTodayIsoDate();
let currentDashboardPeriod = 'today';
let currentRescheduleAppId = null;
let selectedRescheduleTime = null;
let currentServicesFilter = 'all';
let currentClubTab = 'members';
let currentCrmFilter = 'todos';
let currentCrmSearchQuery = '';
let currentInventoryCategory = 'todos';
let currentInventorySearchQuery = '';

function switchView(viewName) {
  const user = getCurrentUser();
  if (!user) {
    applyAuthInterface();
    return;
  }

  if (user.role === 'barbeiro') {
    if (viewName !== 'agenda' && viewName !== 'barberInventory') {
      viewName = 'agenda';
      showToast("Acesso restrito à sua agenda e estoque de venda.", "warning");
    }
  }

  currentActiveView = viewName;

  const views = [
    'viewAgenda', 
    'viewBarbers', 
    'viewServices', 
    'viewClubMembers', 
    'viewDashboard', 
    'viewClients', 
    'viewInventory', 
    'viewBarberInventory',
    'viewReports'
  ];

  views.forEach(vId => {
    const el = document.getElementById(vId);
    if (el) el.classList.add('hidden');
  });

  const activeEl = document.getElementById(`view${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`);
  if (activeEl) {
    activeEl.classList.remove('hidden');
    activeEl.classList.add('animate-fade-in');
  }

  renderAdminNav();

  if (viewName === 'agenda') {
    updateAgendaDateHeader();
    updateAgendaKpiVisibility();
    updateBarberPersonalGoalWidget();
    renderAgendaGrid();
    recalculateKPIs();
  } else if (viewName === 'barbers') {
    renderBarbersManagementList();
  } else if (viewName === 'services') {
    renderServicesManagementList();
  } else if (viewName === 'clubMembers') {
    renderClubMembersList();
    renderClubPlansList();
  } else if (viewName === 'dashboard') {
    renderDashboardCommissions();
    renderDashboardBarberRanking();
    renderDashboardPaymentMethods();
  } else if (viewName === 'clients') {
    renderClientsList();
  } else if (viewName === 'inventory') {
    renderInventoryModule();
  } else if (viewName === 'barberInventory') {
    renderBarberInventoryView();
  } else if (viewName === 'reports') {
    renderReportsView();
  }

  if (window.lucide) window.lucide.createIcons();
}

function renderAdminNav() {
  const navContainer = document.getElementById('adminNavItems');
  if (!navContainer) return;

  const user = getCurrentUser();
  const isAdminUser = user && user.role === 'admin';

  let navItems = [];

  if (isAdminUser) {
    navItems = [
      { id: 'agenda', label: 'Agenda Geral', icon: 'calendar' },
      { id: 'barbers', label: 'Barbeiros', icon: 'users' },
      { id: 'services', label: 'Serviços & Combos', icon: 'scissors' },
      { id: 'clubMembers', label: 'Clube', icon: 'award' },
      { id: 'dashboard', label: 'Dashboard', icon: 'trending-up' },
      { id: 'clients', label: 'Clientes CRM', icon: 'contact' },
      { id: 'inventory', label: 'Estoque da Loja', icon: 'package' },
      { id: 'reports', label: 'Relatórios', icon: 'file-text' }
    ];
  } else {
    navItems = [
      { id: 'agenda', label: 'Minha Agenda', icon: 'calendar' },
      { id: 'barberInventory', label: 'Estoque para Venda', icon: 'shopping-bag' }
    ];
  }

  navContainer.innerHTML = navItems.map(item => {
    const isActive = currentActiveView === item.id;
    return `
      <button 
        type="button" 
        onclick="switchView('${item.id}')" 
        class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
          isActive 
            ? 'bg-gold-500 text-obsidian-950 font-bold shadow-gold-glow' 
            : 'text-neutral-300 hover:text-white hover:bg-obsidian-800'
        }"
      >
        <i data-lucide="${item.icon}" class="w-3.5 h-3.5"></i>
        <span>${item.label}</span>
      </button>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function getVisibleBarbers() {
  const user = getCurrentUser();
  if (user && user.role === 'barbeiro' && user.barberId) {
    const myBarber = barbers.find(b => b.id === user.barberId);
    return myBarber ? [myBarber] : barbers.filter(b => b.active);
  }
  return barbers.filter(b => b.active);
}

function updateAgendaDateHeader() {
  const label = document.getElementById('agendaDateHeaderLabel');
  const input = document.getElementById('agendaDatePicker');
  if (label) label.textContent = formatFullDateHeader(currentAgendaDate);
  if (input) input.value = currentAgendaDate;
}

function setAgendaDate(newDateIso) {
  if (!newDateIso) return;
  currentAgendaDate = newDateIso;
  updateAgendaDateHeader();
  renderAgendaGrid();
  recalculateKPIs();
  updateBarberPersonalGoalWidget();
}

function navigateAgendaDate(days) {
  const parts = currentAgendaDate.split('-');
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  setAgendaDate(`${y}-${m}-${day}`);
}

function setAgendaDateToToday() {
  setAgendaDate(getTodayIsoDate());
}

function renderAgendaGrid() {
  const headerContainer = document.getElementById('agendaHeaderColumns');
  const gridContainer = document.getElementById('agendaGridBody');
  if (!gridContainer) return;

  const activeBarbers = getVisibleBarbers();
  const todayIso = getTodayIsoDate();
  const isToday = currentAgendaDate === todayIso;

  if (headerContainer) {
    headerContainer.innerHTML = `
      <div class="w-20 sm:w-24 p-3 text-center text-[11px] font-bold text-neutral-400 uppercase tracking-wider border-r border-obsidian-800 shrink-0">
        Horário
      </div>
      <div class="flex-1 grid grid-cols-${activeBarbers.length} divide-x divide-obsidian-800">
        ${activeBarbers.map(b => `
          <div class="p-3 text-center flex flex-col items-center justify-center gap-1.5">
            <div class="flex items-center gap-2">
              <img src="${b.avatar || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=80&q=80'}" class="w-8 h-8 rounded-full object-cover border border-gold-400">
              <div class="text-left leading-tight">
                <strong class="text-white text-xs block">${b.name}</strong>
                <span class="text-[10px] text-neutral-400 block">${b.role}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  gridContainer.innerHTML = timeSlots.map(time => {
    return `
      <div class="flex items-stretch min-h-[76px] hover:bg-obsidian-850/50 transition">
        <div class="w-20 sm:w-24 p-3 flex items-center justify-center font-mono text-xs font-bold text-gold-400 border-r border-obsidian-800 shrink-0">
          ${time}
        </div>
        <div class="flex-1 grid grid-cols-${activeBarbers.length} divide-x divide-obsidian-800">
          ${activeBarbers.map(barber => {
            const app = appointments.find(a => 
              (a.date === currentAgendaDate || (!a.date && isToday)) &&
              a.time === time && 
              a.barberId === barber.id &&
              a.status !== 'cancelado'
            );

            if (app) {
              const isConcluded = app.status === 'concluido';
              const isNoShow = app.status === 'no_show';
              const isClub = app.isClub || (app.paymentMethod === 'clube');

              let statusBg = 'bg-obsidian-850 border-gold-500/40 text-neutral-200';
              if (isConcluded) statusBg = 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200';
              if (isNoShow) statusBg = 'bg-rose-950/40 border-rose-500/50 text-rose-300 line-through';

              return `
                <div class="p-2 sm:p-2.5 flex flex-col justify-between">
                  <div class="p-2.5 rounded-xl border ${statusBg} shadow-sm space-y-1.5 transition">
                    <div class="flex items-start justify-between gap-1">
                      <div class="leading-tight">
                        <strong class="text-xs font-bold block text-white truncate">${app.client}</strong>
                        <span class="text-[10px] text-neutral-300 block truncate">${app.service}</span>
                      </div>
                      ${isClub ? '<span class="text-[9px] uppercase font-bold text-gold-400 bg-gold-500/10 border border-gold-500/30 px-1.5 py-0.5 rounded">Clube</span>' : ''}
                    </div>

                    <div class="flex items-center justify-between text-[11px] pt-1 border-t border-obsidian-750">
                      <span class="font-mono text-neutral-400">R$ ${(app.price || 0).toFixed(2).replace('.', ',')}</span>
                      <div class="flex items-center gap-1">
                        ${!isConcluded && !isNoShow ? `
                          <button onclick="concludeAppointment('${app.id}')" title="Concluir" class="p-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white transition">
                            <i data-lucide="check" class="w-3.5 h-3.5"></i>
                          </button>
                          <button onclick="openRescheduleModal('${app.id}')" title="Reagendar" class="p-1 rounded-lg bg-obsidian-750 hover:bg-gold-500 hover:text-black text-neutral-300 transition">
                            <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                          </button>
                          <button onclick="cancelAppointment('${app.id}')" title="Cancelar" class="p-1 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white transition">
                            <i data-lucide="x" class="w-3.5 h-3.5"></i>
                          </button>
                        ` : `
                          <span class="text-[10px] uppercase font-bold ${isConcluded ? 'text-emerald-400' : 'text-rose-400'}">
                            ${isConcluded ? 'Concluído' : 'No-Show'}
                          </span>
                        `}
                      </div>
                    </div>
                  </div>
                </div>
              `;
            } else {
              return `
                <div class="p-2 sm:p-2.5 flex items-center justify-center">
                  <button 
                    onclick="openQuickBookingModal('${barber.id}', '${time}')"
                    class="w-full h-full min-h-[50px] rounded-xl border border-dashed border-obsidian-800 hover:border-gold-500/60 hover:bg-gold-500/5 text-neutral-500 hover:text-gold-400 transition flex items-center justify-center gap-1.5 text-xs font-semibold group"
                  >
                    <i data-lucide="plus" class="w-3.5 h-3.5 transition-transform group-hover:scale-125"></i>
                    <span>Disponível</span>
                  </button>
                </div>
              `;
            }
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function concludeAppointment(appId) {
  const app = appointments.find(a => a.id === appId);
  if (!app) return;
  app.status = 'concluido';
  saveSystemDataToStorage();
  renderAgendaGrid();
  recalculateKPIs();
  updateBarberPersonalGoalWidget();
  showToast(`Atendimento de ${app.client} concluído!`, "success");
}

function cancelAppointment(appId) {
  const app = appointments.find(a => a.id === appId);
  if (!app) return;
  if (!confirm(`Deseja cancelar o agendamento de ${app.client}?`)) return;
  app.status = 'cancelado';
  saveSystemDataToStorage();
  renderAgendaGrid();
  recalculateKPIs();
  updateBarberPersonalGoalWidget();
  showToast(`Atendimento cancelado.`, "info");
}

function concludeAllAppointmentsToday() {
  const todayIso = getTodayIsoDate();
  const user = getCurrentUser();
  let count = 0;

  appointments.forEach(a => {
    if ((a.date === currentAgendaDate || (!a.date && currentAgendaDate === todayIso)) && a.status === 'confirmado') {
      if (user && user.role === 'barbeiro' && user.barberId) {
        if (a.barberId === user.barberId) {
          a.status = 'concluido';
          count++;
        }
      } else {
        a.status = 'concluido';
        count++;
      }
    }
  });

  if (count === 0) {
    showToast("Nenhum atendimento pendente para concluir nesta data.", "info");
    return;
  }

  saveSystemDataToStorage();
  renderAgendaGrid();
  recalculateKPIs();
  updateBarberPersonalGoalWidget();
  showToast(`${count} atendimento(s) concluído(s) em lote!`, "success");
}

function openQuickBookingModal(barberId = null, timeSlot = null) {
  const modal = document.getElementById('modalQuickBooking');
  const bSelect = document.getElementById('quickBarberSelect');
  const sSelect = document.getElementById('quickServiceSelect');
  const tInput = document.getElementById('quickTimeInput');

  if (bSelect) {
    bSelect.innerHTML = barbers.filter(b => b.active).map(b => `
      <option value="${b.id}" ${b.id === barberId ? 'selected' : ''}>${b.name}</option>
    `).join('');
  }

  if (sSelect) {
    sSelect.innerHTML = services.map(s => `
      <option value="${s.name}">${s.name} - R$ ${s.price.toFixed(2).replace('.', ',')}</option>
    `).join('');
  }

  if (tInput) {
    tInput.value = timeSlot || '09:00';
  }

  document.getElementById('quickClientName').value = "";
  document.getElementById('quickClientPhone').value = "";

  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function closeQuickBookingModal() {
  const modal = document.getElementById('modalQuickBooking');
  if (modal) modal.classList.add('hidden');
}

function saveQuickBooking() {
  const name = document.getElementById('quickClientName').value.trim();
  const phone = document.getElementById('quickClientPhone').value.trim();
  const barberId = document.getElementById('quickBarberSelect').value;
  const time = document.getElementById('quickTimeInput').value.trim();
  const serviceName = document.getElementById('quickServiceSelect').value;

  if (!name) {
    showToast("Informe o nome do cliente.", "warning");
    return;
  }

  const srv = services.find(s => s.name === serviceName);
  const price = srv ? srv.price : 55;
  const commission = srv ? (srv.commissionType === 'percent' ? (price * (srv.commissionValue / 100)) : srv.commissionValue) : 25;
  const matchedBarber = barbers.find(b => b.id === barberId);
  const barberName = matchedBarber ? matchedBarber.name : '';
  const slotDuration = getServiceDurationInMinutes(serviceName);
  const slotCheck = checkSlotAvailability(barberId, currentAgendaDate, time, slotDuration);
  if (!slotCheck.available) {
    showToast(`Não foi possível agendar: horário ${time} ${slotCheck.label.toLowerCase()}.`, "warning");
    return;
  }

  const newApp = {
    id: 'app-' + Date.now(),
    date: currentAgendaDate,
    time: time,
    barberId: barberId,
    barber: barberName,
    barberName: barberName,
    client: name,
    clientPhone: phone,
    service: serviceName,
    durationMinutes: slotDuration,
    price: price,
    commission: commission,
    paymentMethod: 'pix',
    status: 'confirmado',
    isClub: false
  };

  appointments.push(newApp);

  let cli = clients.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (!cli) {
    clients.push({
      id: 'cli-' + Date.now(),
      name: name,
      phone: phone || '',
      email: '',
      favBarberId: barberId,
      favBarberName: (barbers.find(b => b.id === barberId) || {}).name || '',
      isClub: false,
      clubPlanName: null,
      totalVisits: 1,
      totalSpent: price,
      lastVisitDate: currentAgendaDate,
      noShowsCount: 0,
      segment: 'recorrente',
      notes: ''
    });
  } else {
    cli.totalVisits = (cli.totalVisits || 0) + 1;
    cli.totalSpent = (cli.totalSpent || 0) + price;
    cli.lastVisitDate = currentAgendaDate;
  }

  saveSystemDataToStorage();
  closeQuickBookingModal();
  renderAgendaGrid();
  recalculateKPIs();
  updateBarberPersonalGoalWidget();
  showToast(`Encaixe confirmado para ${name} às ${time}!`, "success");
}

function openRescheduleModal(appId) {
  const app = appointments.find(a => a.id === appId);
  if (!app) return;

  currentRescheduleAppId = appId;
  selectedRescheduleTime = null;

  const modal = document.getElementById('modalRescheduleAppointment');
  const detailsEl = document.getElementById('rescheduleAppDetails');
  const dateInput = document.getElementById('rescheduleDateInput');
  const bSelect = document.getElementById('rescheduleBarberSelect');

  if (detailsEl) {
    detailsEl.innerHTML = `
      <div class="p-3 rounded-xl bg-obsidian-850 border border-obsidian-750 text-xs flex justify-between items-center">
        <div>
          <strong class="text-white block">${app.client}</strong>
          <span class="text-neutral-400 block">${app.service}</span>
        </div>
        <div class="text-right">
          <span class="text-gold-400 font-bold block">${formatDatePtBr(app.date)}</span>
          <span class="text-neutral-400 font-mono block">${app.time}</span>
        </div>
      </div>
    `;
  }

  if (dateInput) dateInput.value = app.date || currentAgendaDate;

  if (bSelect) {
    bSelect.innerHTML = barbers.filter(b => b.active).map(b => `
      <option value="${b.id}" ${b.id === app.barberId ? 'selected' : ''}>${b.name}</option>
    `).join('');
  }

  renderRescheduleSlots();

  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function closeRescheduleModal() {
  const modal = document.getElementById('modalRescheduleAppointment');
  if (modal) modal.classList.add('hidden');
}

function renderRescheduleSlots() {
  const container = document.getElementById('rescheduleSlotsContainer');
  const dateVal = document.getElementById('rescheduleDateInput').value;
  const barberId = document.getElementById('rescheduleBarberSelect').value;

  if (!container || !dateVal || !barberId) return;

  container.innerHTML = timeSlots.map(time => {
    const isOccupied = appointments.some(a => 
      a.id !== currentRescheduleAppId && 
      a.date === dateVal && 
      a.barberId === barberId && 
      a.time === time && 
      a.status !== 'cancelado'
    );

    const isSelected = selectedRescheduleTime === time;

    return `
      <button 
        type="button" 
        ${isOccupied ? 'disabled' : `onclick="selectRescheduleTimeSlot('${time}')"`}
        class="py-2 rounded-xl text-xs font-mono font-bold transition border ${
          isOccupied 
            ? 'bg-obsidian-950 text-neutral-600 border-obsidian-800 cursor-not-allowed line-through' 
            : (isSelected 
                ? 'bg-gold-500 text-obsidian-950 border-gold-400 font-bold' 
                : 'bg-obsidian-800 text-neutral-300 border-obsidian-700 hover:border-gold-500 hover:text-white')
        }"
      >
        ${time}
      </button>
    `;
  }).join('');
}

function selectRescheduleTimeSlot(time) {
  selectedRescheduleTime = time;
  renderRescheduleSlots();
}

function confirmRescheduleAppointment() {
  if (!currentRescheduleAppId || !selectedRescheduleTime) {
    showToast("Selecione um horário disponível para reagendar.", "warning");
    return;
  }

  const app = appointments.find(a => a.id === currentRescheduleAppId);
  if (!app) return;

  const newDate = document.getElementById('rescheduleDateInput').value;
  const newBarberId = document.getElementById('rescheduleBarberSelect').value;

  app.date = newDate;
  app.barberId = newBarberId;
  app.time = selectedRescheduleTime;
  app.status = 'confirmado';

  saveSystemDataToStorage();
  closeRescheduleModal();
  renderAgendaGrid();
  recalculateKPIs();
  updateBarberPersonalGoalWidget();
  showToast(`Atendimento de ${app.client} reagendado com sucesso para ${selectedRescheduleTime}!`, "success");
}

function updateAgendaKpiVisibility() {
  const container = document.getElementById('agendaKpiCardsContainer');
  const user = getCurrentUser();
  if (!container) return;

  if (user && user.role === 'barbeiro') {
    container.classList.add('hidden');
  } else {
    container.classList.remove('hidden');
  }
}

function updateBarberPersonalGoalWidget() {
  const widget = document.getElementById('barberPersonalGoalWidget');
  const user = getCurrentUser();
  if (!widget) return;

  if (!user || user.role !== 'barbeiro') {
    widget.classList.add('hidden');
    return;
  }

  const bId = user.barberId;
  const barber = barbers.find(b => b.id === bId);
  if (!barber) {
    widget.classList.add('hidden');
    return;
  }

  const todayIso = getTodayIsoDate();
  const dayCuts = appointments.filter(a => a.barberId === bId && (a.date === currentAgendaDate || (!a.date && currentAgendaDate === todayIso)) && a.status === 'concluido').length;
  const dailyGoal = (barber.goals && barber.goals.daily) || 8;
  const percent = Math.min(100, Math.round((dayCuts / dailyGoal) * 100));

  widget.innerHTML = `
    <div class="bg-obsidian-900 border border-gold-500/40 p-4 sm:p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
      <div class="flex items-center gap-3">
        <img src="${barber.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'}" class="w-12 h-12 rounded-full object-cover border-2 border-gold-400 shadow">
        <div>
          <h3 class="font-serif font-bold text-white text-base">Olá, ${barber.name}!</h3>
          <span class="text-xs text-neutral-400">Sua meta diária: <strong>${dayCuts} de ${dailyGoal} cortes</strong> concluídos</span>
        </div>
      </div>
      <div class="w-full sm:w-64 space-y-1.5">
        <div class="flex justify-between text-xs font-semibold">
          <span class="text-neutral-300">Progresso de Hoje</span>
          <span class="text-gold-400 font-bold">${percent}%</span>
        </div>
        <div class="w-full h-2 rounded-full bg-obsidian-800 overflow-hidden">
          <div class="h-full bg-gradient-to-r from-gold-500 to-emerald-400 transition-all duration-500" style="width: ${percent}%;"></div>
        </div>
      </div>
    </div>
  `;

  widget.classList.remove('hidden');
}

function recalculateKPIs() {
  const user = getCurrentUser();
  if (user && user.role === 'barbeiro') return;

  const todayIso = getTodayIsoDate();
  const dayApps = appointments.filter(a => (a.date === currentAgendaDate || (!a.date && currentAgendaDate === todayIso)) && a.status !== 'cancelado');
  const completed = dayApps.filter(a => a.status === 'concluido');
  const clubCount = dayApps.filter(a => a.isClub || a.paymentMethod === 'clube').length;
  const revenue = completed.reduce((sum, a) => sum + (a.price || 0), 0);

  const activeBarbers = getVisibleBarbers();
  const totalSlots = activeBarbers.length * timeSlots.length;
  const occupancy = totalSlots > 0 ? Math.round((dayApps.length / totalSlots) * 100) : 0;

  const revEl = document.getElementById('kpiDayRevenue');
  const appEl = document.getElementById('kpiDayAppointments');
  const compEl = document.getElementById('kpiDayCompleted');
  const clubEl = document.getElementById('kpiDayClub');
  const occEl = document.getElementById('kpiDayOccupancy');

  if (revEl) revEl.textContent = `R$ ${revenue.toFixed(2).replace('.', ',')}`;
  if (appEl) appEl.textContent = dayApps.length;
  if (compEl) compEl.textContent = completed.length;
  if (clubEl) clubEl.textContent = clubCount;
  if (occEl) occEl.textContent = `${occupancy}%`;
}

function renderBarbersManagementList() {
  const container = document.getElementById('barbersManagementList');
  if (!container) return;

  container.innerHTML = barbers.map(b => {
    return `
      <div class="bg-obsidian-900 border border-obsidian-800 hover:border-gold-500/50 p-5 rounded-2xl flex flex-col justify-between space-y-4 transition shadow-lg">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <img src="${b.avatar || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=120&q=80'}" class="w-14 h-14 rounded-full object-cover border-2 border-gold-400 shadow">
            <div>
              <div class="flex items-center gap-2">
                <strong class="text-white text-base">${b.name}</strong>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${b.active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}">
                  ${b.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <span class="text-xs text-gold-400 font-semibold block">${b.role}</span>
              <span class="text-[11px] text-neutral-400 block">${b.unit}</span>
            </div>
          </div>
          <span class="text-xs text-gold-400 font-bold bg-obsidian-800 px-2 py-1 rounded-lg">★ ${b.rating || '5.0'}</span>
        </div>

        <div class="grid grid-cols-3 gap-2 p-3 rounded-xl bg-obsidian-850 border border-obsidian-750 text-center text-xs">
          <div>
            <span class="text-[10px] text-neutral-500 uppercase block">Meta Dia</span>
            <strong class="text-white">${b.goals ? b.goals.daily : 8} cortes</strong>
          </div>
          <div>
            <span class="text-[10px] text-neutral-500 uppercase block">Meta Mês</span>
            <strong class="text-white">${b.goals ? b.goals.monthly : 160} cortes</strong>
          </div>
          <div>
            <span class="text-[10px] text-neutral-500 uppercase block">Comissão Prod</span>
            <strong class="text-gold-400">${b.productCommissionPercent || 10}%</strong>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-obsidian-800">
          <div class="flex items-center gap-2">
            <button onclick="editBarber('${b.id}')" class="px-3.5 py-1.5 rounded-xl bg-obsidian-800 hover:bg-gold-500 hover:text-black text-xs font-semibold text-white transition flex items-center gap-1.5">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              <span>Editar</span>
            </button>
            <button onclick="deleteBarber('${b.id}')" class="p-1.5 rounded-xl bg-obsidian-800 hover:bg-rose-950 text-neutral-400 hover:text-rose-400 transition" title="Excluir Barbeiro">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <button onclick="toggleBarberStatus('${b.id}')" class="px-3 py-1.5 rounded-xl ${b.active ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500 hover:text-black' : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500 hover:text-black'} text-xs font-semibold transition">
            ${b.active ? 'Desativar' : 'Ativar'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function openNewBarberModal() {
  const modal = document.getElementById('modalNewBarber');
  const title = document.getElementById('barberModalTitle');
  const idInput = document.getElementById('barberEditId');

  if (title) title.textContent = "Cadastrar Novo Barbeiro";
  if (idInput) idInput.value = "";

  document.getElementById('barberFormName').value = "";
  document.getElementById('barberFormRole').value = "Barbeiro Profissional";
  document.getElementById('barberFormPhone').value = "";
  document.getElementById('barberFormUnit').value = "Unidade Paulista (Matriz)";
  document.getElementById('barberFormUsername').value = "";
  document.getElementById('barberFormPassword').value = "12345";
  document.getElementById('barberFormDailyGoal').value = "8";
  document.getElementById('barberFormMonthlyGoal').value = "160";
  document.getElementById('barberFormProdComm').value = "10";
  document.getElementById('barberFormAvatar').value = "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=160&q=80";

  renderBarberCommissionsForm({});

  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function editBarber(barberId) {
  const b = barbers.find(x => x.id === barberId);
  if (!b) return;

  const modal = document.getElementById('modalNewBarber');
  const title = document.getElementById('barberModalTitle');
  const idInput = document.getElementById('barberEditId');

  if (title) title.textContent = `Editar Barbeiro — ${b.name}`;
  if (idInput) idInput.value = b.id;

  document.getElementById('barberFormName').value = b.name;
  document.getElementById('barberFormRole').value = b.role;
  document.getElementById('barberFormPhone').value = b.phone;
  document.getElementById('barberFormUnit').value = b.unit;

  const matchedUser = systemUsers.find(u => u.barberId === b.id || u.username === b.id);
  document.getElementById('barberFormUsername').value = matchedUser ? matchedUser.username : b.id;
  document.getElementById('barberFormPassword').value = matchedUser ? (matchedUser.passwordHash || matchedUser.password) : "12345";

  document.getElementById('barberFormDailyGoal').value = (b.goals && b.goals.daily) || 8;
  document.getElementById('barberFormMonthlyGoal').value = (b.goals && b.goals.monthly) || 160;
  document.getElementById('barberFormProdComm').value = b.productCommissionPercent || 10;
  document.getElementById('barberFormAvatar').value = b.avatar || "";

  renderBarberCommissionsForm(b.commissions || {});

  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function closeNewBarberModal() {
  const modal = document.getElementById('modalNewBarber');
  if (modal) modal.classList.add('hidden');
}

function renderBarberCommissionsForm(commMap = {}) {
  const container = document.getElementById('barberCommissionsFormContainer');
  if (!container) return;

  container.innerHTML = services.map(s => {
    const c = commMap[s.name] || { type: s.commissionType || 'percent', value: s.commissionValue || 50 };
    return `
      <div class="p-2.5 rounded-xl bg-obsidian-850 border border-obsidian-750 flex items-center justify-between gap-3 text-xs">
        <span class="text-white font-semibold truncate">${s.name}</span>
        <div class="flex items-center gap-2 shrink-0">
          <select id="commType_${s.id}" class="bg-obsidian-800 border border-obsidian-700 rounded-lg px-2 py-1 text-xs text-white outline-none">
            <option value="percent" ${c.type === 'percent' ? 'selected' : ''}>%</option>
            <option value="fixed" ${c.type === 'fixed' ? 'selected' : ''}>R$</option>
          </select>
          <input type="number" id="commVal_${s.id}" value="${c.value}" class="w-16 bg-obsidian-800 border border-obsidian-700 rounded-lg px-2 py-1 text-xs text-white text-center outline-none">
        </div>
      </div>
    `;
  }).join('');
}

function saveBarberForm() {
  const editId = document.getElementById('barberEditId').value;
  const name = document.getElementById('barberFormName').value.trim();
  const role = document.getElementById('barberFormRole').value.trim();
  const phone = document.getElementById('barberFormPhone').value.trim();
  const unit = document.getElementById('barberFormUnit').value;
  const username = document.getElementById('barberFormUsername').value.trim().toLowerCase();
  const password = document.getElementById('barberFormPassword').value.trim();
  const dailyGoal = parseInt(document.getElementById('barberFormDailyGoal').value, 10) || 8;
  const monthlyGoal = parseInt(document.getElementById('barberFormMonthlyGoal').value, 10) || 160;
  const prodComm = parseInt(document.getElementById('barberFormProdComm').value, 10) || 10;
  const avatar = document.getElementById('barberFormAvatar').value.trim();

  if (!name || !username || !password) {
    showToast("Preencha nome, usuário e senha.", "warning");
    return;
  }

  const commissions = {};
  services.forEach(s => {
    const typeEl = document.getElementById(`commType_${s.id}`);
    const valEl = document.getElementById(`commVal_${s.id}`);
    commissions[s.name] = {
      type: typeEl ? typeEl.value : 'percent',
      value: valEl ? parseFloat(valEl.value) : 50
    };
  });

  if (editId) {
    const b = barbers.find(x => x.id === editId);
    if (b) {
      b.name = name;
      b.role = role;
      b.phone = phone;
      b.unit = unit;
      b.avatar = avatar;
      b.goals = { daily: dailyGoal, weekly: dailyGoal * 5, monthly: monthlyGoal };
      b.commissions = commissions;
      b.productCommissionPercent = prodComm;
    }
    let u = systemUsers.find(x => x.barberId === editId);
    if (u) {
      u.name = name;
      u.username = username;
      u.password = password;
      u.passwordHash = password;
    }
    showToast(`Barbeiro ${name} atualizado!`, "success");
  } else {
    const newId = 'barber-' + Date.now();
    barbers.push({
      id: newId,
      name: name,
      role: role,
      phone: phone,
      unit: unit,
      rating: "5.0",
      active: true,
      avatar: avatar,
      goals: { daily: dailyGoal, weekly: dailyGoal * 5, monthly: monthlyGoal },
      commissions: commissions,
      productCommissionPercent: prodComm
    });
    systemUsers.push({
      username: username,
      password: password,
      passwordHash: password,
      role: "barbeiro",
      barberId: newId,
      name: name
    });
    showToast(`Novo barbeiro ${name} cadastrado!`, "success");
  }

  saveSystemDataToStorage();
  closeNewBarberModal();
  renderBarbersManagementList();
  renderAgendaGrid();
}

function toggleBarberStatus(barberId) {
  const b = barbers.find(x => x.id === barberId);
  if (!b) return;
  b.active = !b.active;
  saveSystemDataToStorage();
  renderBarbersManagementList();
  renderAgendaGrid();
  showToast(`Status de ${b.name}: ${b.active ? 'Ativo' : 'Inativo'}.`, "info");
}

function deleteBarber(barberId) {
  const b = barbers.find(x => x.id === barberId);
  if (!b) return;
  if (!confirm(`Tem certeza que deseja excluir o barbeiro ${b.name}?`)) return;

  barbers = barbers.filter(x => x.id !== barberId);
  systemUsers = systemUsers.filter(u => u.barberId !== barberId);
  saveSystemDataToStorage();
  renderBarbersManagementList();
  renderAgendaGrid();
  showToast(`Barbeiro ${b.name} removido.`, "info");
}

function setServicesFilter(category) {
  currentServicesFilter = category;
  ['all', 'cabelo', 'barba', 'combo', 'tratamento'].forEach(cat => {
    const btn = document.getElementById(`btnFilterSrv_${cat}`);
    if (btn) {
      if (cat === category) {
        btn.className = "px-3.5 py-1.5 rounded-xl font-bold bg-gold-500 text-obsidian-950 transition";
      } else {
        btn.className = "px-3.5 py-1.5 rounded-xl font-semibold bg-obsidian-850 hover:bg-obsidian-800 text-neutral-300 transition";
      }
    }
  });
  renderServicesManagementList();
}

function renderServicesManagementList() {
  const container = document.getElementById('servicesManagementList');
  if (!container) return;

  const filtered = services.filter(s => {
    if (currentServicesFilter === 'all') return true;
    return (s.category || '').toLowerCase() === currentServicesFilter.toLowerCase();
  });

  container.innerHTML = filtered.map(s => `
    <div class="p-4 rounded-2xl bg-obsidian-900 border border-obsidian-800 hover:border-gold-500/40 transition flex flex-col justify-between space-y-3 shadow-lg">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <strong class="text-white text-sm">${s.name}</strong>
            <span class="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-gold-500/20 text-gold-300 border border-gold-500/30">${s.category}</span>
          </div>
          <span class="text-neutral-400 text-xs block mt-1">${s.duration} min • Comissão: ${s.commissionValue}${s.commissionType === 'percent' ? '%' : ' R$'}</span>
          ${s.description ? `<p class="text-[11px] text-neutral-400 mt-1 line-clamp-2">${s.description}</p>` : ''}
        </div>
        <span class="font-serif font-bold text-gold-400 text-base shrink-0">R$ ${s.price.toFixed(2).replace('.', ',')}</span>
      </div>

      <div class="flex items-center justify-end gap-2 pt-2 border-t border-obsidian-800">
        <button onclick="editService('${s.id}')" class="px-3 py-1.5 rounded-xl bg-obsidian-800 hover:bg-gold-500 hover:text-black text-xs font-semibold text-white transition flex items-center gap-1.5">
          <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
          <span>Editar</span>
        </button>
        <button onclick="deleteService('${s.id}')" class="p-1.5 rounded-xl bg-obsidian-800 hover:bg-rose-950 text-neutral-400 hover:text-rose-400 transition" title="Excluir Serviço">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

function openNewServiceModal() {
  const modal = document.getElementById('modalServiceForm');
  const title = document.getElementById('serviceModalTitle');
  const idInput = document.getElementById('serviceFormId');

  if (title) title.textContent = "Novo Serviço no Catálogo";
  if (idInput) idInput.value = "";

  document.getElementById('serviceFormName').value = "";
  document.getElementById('serviceFormCategory').value = "cabelo";
  document.getElementById('serviceFormPrice').value = "55.00";
  document.getElementById('serviceFormDuration').value = "35";
  document.getElementById('serviceFormCommType').value = "percent";
  document.getElementById('serviceFormCommValue').value = "50";
  document.getElementById('serviceFormDescription').value = "";

  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function editService(serviceId) {
  const s = services.find(x => x.id === serviceId);
  if (!s) return;

  const modal = document.getElementById('modalServiceForm');
  const title = document.getElementById('serviceModalTitle');
  const idInput = document.getElementById('serviceFormId');

  if (title) title.textContent = `Editar Serviço — ${s.name}`;
  if (idInput) idInput.value = s.id;

  document.getElementById('serviceFormName').value = s.name;
  document.getElementById('serviceFormCategory').value = (s.category || 'cabelo').toLowerCase();
  document.getElementById('serviceFormPrice').value = s.price;
  document.getElementById('serviceFormDuration').value = s.duration || 35;
  document.getElementById('serviceFormCommType').value = s.commissionType || "percent";
  document.getElementById('serviceFormCommValue').value = s.commissionValue || 50;
  document.getElementById('serviceFormDescription').value = s.description || "";

  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function closeServiceModal() {
  const modal = document.getElementById('modalServiceForm');
  if (modal) modal.classList.add('hidden');
}

function saveServiceForm() {
  const editId = document.getElementById('serviceFormId').value;
  const name = document.getElementById('serviceFormName').value.trim();
  const category = document.getElementById('serviceFormCategory').value;
  const price = parseFloat(document.getElementById('serviceFormPrice').value) || 0;
  const duration = parseInt(document.getElementById('serviceFormDuration').value, 10) || 35;
  const commType = document.getElementById('serviceFormCommType').value;
  const commValue = parseFloat(document.getElementById('serviceFormCommValue').value) || 0;
  const description = document.getElementById('serviceFormDescription').value.trim();

  if (!name || price <= 0) {
    showToast("Preencha o nome e um preço válido.", "warning");
    return;
  }

  if (editId) {
    const s = services.find(x => x.id === editId);
    if (s) {
      s.name = name;
      s.category = category;
      s.price = price;
      s.duration = duration;
      s.commissionType = commType;
      s.commissionValue = commValue;
      s.description = description;
      s.isCombo = category === 'combo';
    }
    showToast(`Serviço ${name} atualizado!`, "success");
  } else {
    const newId = 'srv-' + Date.now();
    services.push({
      id: newId,
      name: name,
      category: category,
      price: price,
      duration: duration,
      commissionType: commType,
      commissionValue: commValue,
      description: description,
      isCombo: category === 'combo'
    });
    showToast(`Novo serviço ${name} adicionado!`, "success");
  }

  saveSystemDataToStorage();
  closeServiceModal();
  renderServicesManagementList();
}

function deleteService(serviceId) {
  const s = services.find(x => x.id === serviceId);
  if (!s) return;
  if (!confirm(`Excluir o procedimento "${s.name}"?`)) return;

  services = services.filter(x => x.id !== serviceId);
  saveSystemDataToStorage();
  renderServicesManagementList();
  showToast(`Serviço ${s.name} excluído.`, "info");
}

function switchClubTab(tab) {
  currentClubTab = tab;
  const membersTab = document.getElementById('tabBtnClubMembers');
  const plansTab = document.getElementById('tabBtnClubPlans');
  const membersView = document.getElementById('clubTabMembersView');
  const plansView = document.getElementById('clubTabPlansView');

  if (tab === 'members') {
    if (membersTab) membersTab.className = "px-4 py-2 rounded-xl font-bold bg-gold-500 text-obsidian-950 transition";
    if (plansTab) plansTab.className = "px-4 py-2 rounded-xl font-semibold text-neutral-400 hover:text-white hover:bg-obsidian-850 transition";
    if (membersView) membersView.classList.remove('hidden');
    if (plansView) plansView.classList.add('hidden');
  } else {
    if (membersTab) membersTab.className = "px-4 py-2 rounded-xl font-semibold text-neutral-400 hover:text-white hover:bg-obsidian-850 transition";
    if (plansTab) plansTab.className = "px-4 py-2 rounded-xl font-bold bg-gold-500 text-obsidian-950 transition";
    if (membersView) membersView.classList.add('hidden');
    if (plansView) plansView.classList.remove('hidden');
  }

  renderClubMembersList();
  renderClubPlansList();
}

function renderClubMembersList() {
  const container = document.getElementById('clubMembersList');
  const countBadge = document.getElementById('clubMembersCountBadge');
  if (countBadge) countBadge.textContent = clubMembers.length;
  if (!container) return;

  container.innerHTML = clubMembers.map(m => `
    <div class="p-4 rounded-2xl bg-obsidian-900 border border-obsidian-800 hover:border-gold-500/40 transition flex flex-col justify-between space-y-3 shadow-lg">
      <div class="flex items-start justify-between gap-2">
        <div>
          <strong class="text-white text-sm block">${m.name}</strong>
          <span class="text-xs text-gold-400 font-serif block">${m.planName}</span>
          <span class="text-[11px] text-neutral-400 block font-mono mt-0.5">${formatPhoneDisplay(m.phone)}</span>
          ${m.email ? `<span class="text-[10px] text-neutral-500 block truncate">${m.email}</span>` : ''}
        </div>
        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${m.status === 'ativo' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}">
          ${m.status === 'ativo' ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      <div class="p-2.5 rounded-xl bg-obsidian-850 border border-obsidian-750 text-xs flex justify-between text-neutral-300">
        <span>Início: <strong>${formatDatePtBr(m.startDate)}</strong></span>
        <span>Validade: <strong class="text-gold-400">${formatDatePtBr(m.expiryDate)}</strong></span>
      </div>

      <div class="flex items-center justify-end gap-2 pt-2 border-t border-obsidian-800">
        <button onclick="editClubMember('${m.id}')" class="px-3 py-1.5 rounded-xl bg-obsidian-800 hover:bg-gold-500 hover:text-black text-xs font-semibold text-white transition flex items-center gap-1.5">
          <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
          <span>Editar</span>
        </button>
        <button onclick="deleteClubMember('${m.id}')" class="p-1.5 rounded-xl bg-obsidian-800 hover:bg-rose-950 text-neutral-400 hover:text-rose-400 transition" title="Excluir Assinante">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

function renderClubPlansList() {
  const container = document.getElementById('clubPlansList');
  const countBadge = document.getElementById('clubPlansCountBadge');
  if (countBadge) countBadge.textContent = clubPlans.length;
  if (!container) return;

  container.innerHTML = clubPlans.map(p => `
    <div class="p-5 rounded-2xl bg-obsidian-900 border border-obsidian-800 hover:border-gold-500/40 transition flex flex-col justify-between space-y-4 shadow-lg">
      <div class="flex items-start justify-between">
        <div>
          <strong class="text-white text-base block font-serif">${p.name}</strong>
          ${p.badge ? `<span class="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gold-500/20 text-gold-400 border border-gold-500/30">${p.badge}</span>` : ''}
        </div>
        <div class="text-right">
          <span class="font-serif font-bold text-gold-400 text-lg">R$ ${p.price.toFixed(2).replace('.', ',')}</span>
          <span class="text-[10px] text-neutral-500 block">/mês</span>
        </div>
      </div>

      <div class="text-xs text-neutral-300 space-y-1.5 pt-2 border-t border-obsidian-800">
        <div class="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <i data-lucide="check" class="w-3.5 h-3.5"></i>
          <span>Desconto de ${p.discountProducts || 10}% em cosméticos</span>
        </div>
        <span class="text-[11px] text-neutral-400 block font-semibold mt-1">Serviços inclusos:</span>
        <div class="flex flex-wrap gap-1">
          ${(p.includedServices || []).map(s => `<span class="px-2 py-0.5 rounded-lg bg-obsidian-800 text-[10px] text-neutral-300">${s}</span>`).join('')}
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-2 border-t border-obsidian-800">
        <button onclick="editClubPlan('${p.id}')" class="px-3 py-1.5 rounded-xl bg-obsidian-800 hover:bg-gold-500 hover:text-black text-xs font-semibold text-white transition flex items-center gap-1.5">
          <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
          <span>Editar</span>
        </button>
        <button onclick="deleteClubPlan('${p.id}')" class="p-1.5 rounded-xl bg-obsidian-800 hover:bg-rose-950 text-neutral-400 hover:text-rose-400 transition" title="Excluir Plano">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

function openNewClubPlanModal() {
  const modal = document.getElementById('modalClubPlanForm');
  const title = document.getElementById('clubPlanModalTitle');
  const idInput = document.getElementById('clubPlanFormId');

  if (title) title.textContent = "Novo Plano de Clube";
  if (idInput) idInput.value = "";

  document.getElementById('clubPlanFormName').value = "";
  document.getElementById('clubPlanFormPrice').value = "99.90";
  document.getElementById('clubPlanFormDiscount').value = "10";
  document.getElementById('clubPlanFormBadge').value = "";

  renderClubPlanServicesCheckboxes([]);

  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function editClubPlan(planId) {
  const p = clubPlans.find(x => x.id === planId);
  if (!p) return;

  const modal = document.getElementById('modalClubPlanForm');
  const title = document.getElementById('clubPlanModalTitle');
  const idInput = document.getElementById('clubPlanFormId');

  if (title) title.textContent = `Editar Plano — ${p.name}`;
  if (idInput) idInput.value = p.id;

  document.getElementById('clubPlanFormName').value = p.name;
  document.getElementById('clubPlanFormPrice').value = p.price;
  document.getElementById('clubPlanFormDiscount').value = p.discountProducts || 10;
  document.getElementById('clubPlanFormBadge').value = p.badge || "";

  renderClubPlanServicesCheckboxes(p.includedServices || []);

  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function closeClubPlanModal() {
  const modal = document.getElementById('modalClubPlanForm');
  if (modal) modal.classList.add('hidden');
}

function renderClubPlanServicesCheckboxes(selectedList = []) {
  const container = document.getElementById('clubPlanServicesCheckboxes');
  if (!container) return;

  container.innerHTML = services.map(s => {
    const isChecked = selectedList.includes(s.name);
    return `
      <label class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-obsidian-800 cursor-pointer">
        <input type="checkbox" value="${s.name}" class="chkClubSrv" ${isChecked ? 'checked' : ''}>
        <span class="text-xs text-neutral-200">${s.name}</span>
      </label>
    `;
  }).join('');
}

function saveClubPlanForm() {
  const editId = document.getElementById('clubPlanFormId').value;
  const name = document.getElementById('clubPlanFormName').value.trim();
  const price = parseFloat(document.getElementById('clubPlanFormPrice').value) || 0;
  const discount = parseInt(document.getElementById('clubPlanFormDiscount').value, 10) || 10;
  const badge = document.getElementById('clubPlanFormBadge').value.trim();

  if (!name || price <= 0) {
    showToast("Preencha o nome e um preço válido.", "warning");
    return;
  }

  const selectedServices = [];
  document.querySelectorAll('.chkClubSrv:checked').forEach(chk => {
    selectedServices.push(chk.value);
  });

  if (editId) {
    const p = clubPlans.find(x => x.id === editId);
    if (p) {
      p.name = name;
      p.price = price;
      p.discountProducts = discount;
      p.badge = badge;
      p.includedServices = selectedServices;
    }
    showToast(`Plano ${name} atualizado!`, "success");
  } else {
    const newId = 'plan-' + Date.now();
    clubPlans.push({
      id: newId,
      name: name,
      price: price,
      interval: "mensal",
      discountProducts: discount,
      badge: badge,
      includedServices: selectedServices
    });
    showToast(`Novo plano ${name} criado!`, "success");
  }

  saveSystemDataToStorage();
  closeClubPlanModal();
  renderClubPlansList();
}

function deleteClubPlan(planId) {
  const p = clubPlans.find(x => x.id === planId);
  if (!p) return;
  if (!confirm(`Excluir o plano "${p.name}"?`)) return;

  clubPlans = clubPlans.filter(x => x.id !== planId);
  saveSystemDataToStorage();
  renderClubPlansList();
  showToast(`Plano ${p.name} excluído.`, "info");
}

function openNewClubMemberModal() {
  const modal = document.getElementById('modalClubMemberForm');
  const title = document.getElementById('clubMemberModalTitle');
  const idInput = document.getElementById('clubMemberFormId');
  const planSelect = document.getElementById('clubMemberFormPlanSelect');

  if (title) title.textContent = "Vincular Assinante ao Clube";
  if (idInput) idInput.value = "";

  document.getElementById('clubMemberFormName').value = "";
  document.getElementById('clubMemberFormPhone').value = "";
  document.getElementById('clubMemberFormEmail').value = "";
  document.getElementById('clubMemberFormStatus').value = "ativo";

  const todayIso = getTodayIsoDate();
  document.getElementById('clubMemberFormStartDate').value = todayIso;

  const parts = todayIso.split('-');
  const nextMonthYear = parseInt(parts[0], 10);
  const nextMonth = String((parseInt(parts[1], 10) % 12) + 1).padStart(2, '0');
  document.getElementById('clubMemberFormExpiryDate').value = `${nextMonth === '01' ? nextMonthYear + 1 : nextMonthYear}-${nextMonth}-${parts[2]}`;

  if (planSelect) {
    planSelect.innerHTML = clubPlans.map(p => `
      <option value="${p.name}">${p.name} - R$ ${p.price.toFixed(2).replace('.', ',')}/mês</option>
    `).join('');
  }

  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function editClubMember(memberId) {
  const m = clubMembers.find(x => x.id === memberId);
  if (!m) return;

  const modal = document.getElementById('modalClubMemberForm');
  const title = document.getElementById('clubMemberModalTitle');
  const idInput = document.getElementById('clubMemberFormId');
  const planSelect = document.getElementById('clubMemberFormPlanSelect');

  if (title) title.textContent = `Editar Assinante — ${m.name}`;
  if (idInput) idInput.value = m.id;

  document.getElementById('clubMemberFormName').value = m.name;
  document.getElementById('clubMemberFormPhone').value = m.phone;
  document.getElementById('clubMemberFormEmail').value = m.email || "";
  document.getElementById('clubMemberFormStartDate').value = m.startDate || getTodayIsoDate();
  document.getElementById('clubMemberFormExpiryDate').value = m.expiryDate || "";
  document.getElementById('clubMemberFormStatus').value = m.status || "ativo";

  if (planSelect) {
    planSelect.innerHTML = clubPlans.map(p => `
      <option value="${p.name}" ${p.name === m.planName ? 'selected' : ''}>${p.name} - R$ ${p.price.toFixed(2).replace('.', ',')}/mês</option>
    `).join('');
  }

  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function closeClubMemberModal() {
  const modal = document.getElementById('modalClubMemberForm');
  if (modal) modal.classList.add('hidden');
}

function saveClubMemberForm() {
  const editId = document.getElementById('clubMemberFormId').value;
  const name = document.getElementById('clubMemberFormName').value.trim();
  const phone = document.getElementById('clubMemberFormPhone').value.trim();
  const email = document.getElementById('clubMemberFormEmail').value.trim();
  const planName = document.getElementById('clubMemberFormPlanSelect').value;
  const startDate = document.getElementById('clubMemberFormStartDate').value;
  const expiryDate = document.getElementById('clubMemberFormExpiryDate').value;
  const status = document.getElementById('clubMemberFormStatus').value;

  if (!name || !phone) {
    showToast("Informe o nome e telefone do assinante.", "warning");
    return;
  }

  const selectedPlan = clubPlans.find(p => p.name === planName);
  const incServices = selectedPlan ? selectedPlan.includedServices : [];

  if (editId) {
    const m = clubMembers.find(x => x.id === editId);
    if (m) {
      m.name = name;
      m.phone = phone;
      m.email = email;
      m.planName = planName;
      m.startDate = startDate;
      m.expiryDate = expiryDate;
      m.status = status;
      m.includedServices = incServices;
    }
    showToast(`Assinatura de ${name} atualizada!`, "success");
  } else {
    const newId = 'mem-' + Date.now();
    clubMembers.push({
      id: newId,
      name: name,
      phone: phone,
      email: email,
      planName: planName,
      startDate: startDate,
      expiryDate: expiryDate,
      status: status,
      includedServices: incServices
    });
    showToast(`Novo assinante ${name} vinculado com sucesso!`, "success");
  }

  let cli = clients.find(c => c.name.toLowerCase() === name.toLowerCase() || (phone && c.phone === phone));
  if (cli) {
    cli.isClub = (status === 'ativo');
    cli.clubPlanName = (status === 'ativo') ? planName : null;
    cli.phone = phone;
    if (email) cli.email = email;
  } else {
    clients.push({
      id: 'cli-' + Date.now(),
      name: name,
      phone: phone,
      email: email,
      favBarberId: "dito",
      favBarberName: "Dito Mestre",
      isClub: (status === 'ativo'),
      clubPlanName: planName,
      totalVisits: 1,
      totalSpent: selectedPlan ? selectedPlan.price : 99.90,
      lastVisitDate: getTodayIsoDate(),
      noShowsCount: 0,
      segment: 'assinante',
      notes: `Assinante cadastrado do plano ${planName}.`
    });
  }

  saveSystemDataToStorage();
  closeClubMemberModal();
  renderClubMembersList();
  renderClientsList();
}

function deleteClubMember(memberId) {
  const m = clubMembers.find(x => x.id === memberId);
  if (!m) return;
  if (!confirm(`Remover a assinatura de ${m.name}?`)) return;

  clubMembers = clubMembers.filter(x => x.id !== memberId);

  let cli = clients.find(c => c.name.toLowerCase() === m.name.toLowerCase());
  if (cli) {
    cli.isClub = false;
    cli.clubPlanName = null;
  }

  saveSystemDataToStorage();
  renderClubMembersList();
  renderClientsList();
  showToast(`Assinatura removida.`, "info");
}

function setClientsFilter(filter) {
  currentCrmFilter = filter;
  ['todos', 'clube', 'avulso'].forEach(f => {
    const btn = document.getElementById(`btnFilterCli_${f}`);
    if (btn) {
      if (f === filter) {
        btn.className = "px-3.5 py-1.5 rounded-xl font-bold bg-gold-500 text-obsidian-950 transition";
      } else {
        btn.className = "px-3.5 py-1.5 rounded-xl font-semibold bg-obsidian-850 hover:bg-obsidian-800 text-neutral-300 transition";
      }
    }
  });
  renderClientsList();
}

function onCrmSearchChange(query) {
  currentCrmSearchQuery = (query || '').toLowerCase().trim();
  renderClientsList();
}

function renderClientsList() {
  const container = document.getElementById('clientsListContainer');
  const allEl = document.getElementById('cliCountAll');
  const clubEl = document.getElementById('cliCountClub');
  const regEl = document.getElementById('cliCountRegular');

  const clubCount = clients.filter(c => c.isClub).length;
  const regCount = clients.filter(c => !c.isClub).length;

  if (allEl) allEl.textContent = clients.length;
  if (clubEl) clubEl.textContent = clubCount;
  if (regEl) regEl.textContent = regCount;

  if (!container) return;

  const filtered = clients.filter(c => {
    if (currentCrmFilter === 'clube' && !c.isClub) return false;
    if (currentCrmFilter === 'avulso' && c.isClub) return false;

    if (currentCrmSearchQuery) {
      const matchName = (c.name || '').toLowerCase().includes(currentCrmSearchQuery);
      const matchPhone = (c.phone || '').includes(currentCrmSearchQuery);
      if (!matchName && !matchPhone) return false;
    }
    return true;
  });

  container.innerHTML = filtered.map(c => `
    <div class="p-4 rounded-2xl bg-obsidian-900 border border-obsidian-800 hover:border-gold-500/40 transition flex flex-col justify-between space-y-3 shadow-lg">
      <div class="flex items-start justify-between gap-2">
        <div>
          <div class="flex items-center gap-2">
            <strong class="text-white text-sm">${c.name}</strong>
            ${c.isClub 
              ? `<span class="px-2 py-0.5 rounded text-[9px] font-bold bg-gold-500/20 text-gold-300 border border-gold-500/30">⭐ ${c.clubPlanName || 'Clube'}</span>` 
              : '<span class="px-2 py-0.5 rounded text-[9px] font-semibold bg-obsidian-800 text-neutral-400">Avulso</span>'
            }
          </div>
          <span class="text-xs text-neutral-400 block font-mono mt-0.5">${formatPhoneDisplay(c.phone)}</span>
          ${c.email ? `<span class="text-[10px] text-neutral-500 block truncate">${c.email}</span>` : ''}
          <span class="text-[11px] text-gold-400/80 block mt-1">Barbeiro: ${c.favBarberName || 'Dito Mestre'}</span>
        </div>
        <div class="text-right text-xs">
          <span class="text-neutral-400 block">${c.totalVisits || 0} visitas</span>
          <span class="text-gold-400 font-serif font-bold text-sm">R$ ${(c.totalSpent || 0).toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      ${c.notes ? `<div class="p-2 rounded-xl bg-obsidian-850 text-[11px] text-neutral-300 border border-obsidian-800 italic">${c.notes}</div>` : ''}

      <div class="flex items-center justify-end gap-2 pt-2 border-t border-obsidian-800">
        <button onclick="editClient('${c.id}')" class="px-3 py-1.5 rounded-xl bg-obsidian-800 hover:bg-gold-500 hover:text-black text-xs font-semibold text-white transition flex items-center gap-1.5">
          <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
          <span>Editar</span>
        </button>
        <button onclick="deleteClient('${c.id}')" class="p-1.5 rounded-xl bg-obsidian-800 hover:bg-rose-950 text-neutral-400 hover:text-rose-400 transition" title="Excluir Cliente">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

function openNewClientModal() {
  const modal = document.getElementById('modalClientForm');
  const title = document.getElementById('clientFormModalTitle');
  const idInput = document.getElementById('clientFormId');
  const bSelect = document.getElementById('clientFormFavBarber');
  const pSelect = document.getElementById('clientFormClubPlan');

  if (title) title.textContent = "Cadastrar Novo Cliente";
  if (idInput) idInput.value = "";

  document.getElementById('clientFormName').value = "";
  document.getElementById('clientFormPhone').value = "";
  document.getElementById('clientFormEmail').value = "";
  document.getElementById('clientFormIsClub').checked = false;
  document.getElementById('clientFormVisits').value = "1";
  document.getElementById('clientFormSpent').value = "55.00";
  document.getElementById('clientFormNotes').value = "";

  toggleClientClubFields();

  if (bSelect) {
    bSelect.innerHTML = barbers.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
  }

  if (pSelect) {
    pSelect.innerHTML = clubPlans.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
  }

  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function editClient(clientId) {
  const c = clients.find(x => x.id === clientId);
  if (!c) return;

  const modal = document.getElementById('modalClientForm');
  const title = document.getElementById('clientFormModalTitle');
  const idInput = document.getElementById('clientFormId');
  const bSelect = document.getElementById('clientFormFavBarber');
  const pSelect = document.getElementById('clientFormClubPlan');

  if (title) title.textContent = `Editar Cliente — ${c.name}`;
  if (idInput) idInput.value = c.id;

  document.getElementById('clientFormName').value = c.name;
  document.getElementById('clientFormPhone').value = c.phone || "";
  document.getElementById('clientFormEmail').value = c.email || "";
  document.getElementById('clientFormIsClub').checked = !!c.isClub;
  document.getElementById('clientFormVisits').value = c.totalVisits || 0;
  document.getElementById('clientFormSpent').value = c.totalSpent || 0;
  document.getElementById('clientFormNotes').value = c.notes || "";

  toggleClientClubFields();

  if (bSelect) {
    bSelect.innerHTML = barbers.map(b => `
      <option value="${b.id}" ${b.id === c.favBarberId ? 'selected' : ''}>${b.name}</option>
    `).join('');
  }

  if (pSelect) {
    pSelect.innerHTML = clubPlans.map(p => `
      <option value="${p.name}" ${p.name === c.clubPlanName ? 'selected' : ''}>${p.name}</option>
    `).join('');
  }

  const member = clubMembers.find(m => m.name.toLowerCase() === c.name.toLowerCase());
  if (member) {
    document.getElementById('clientFormClubExpiry').value = member.expiryDate || "";
  }

  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function closeClientFormModal() {
  const modal = document.getElementById('modalClientForm');
  if (modal) modal.classList.add('hidden');
}

function toggleClientClubFields() {
  const chk = document.getElementById('clientFormIsClub');
  const box = document.getElementById('clientClubFieldsContainer');
  if (box && chk) {
    if (chk.checked) {
      box.classList.remove('hidden');
    } else {
      box.classList.add('hidden');
    }
  }
}

function saveClientForm() {
  const editId = document.getElementById('clientFormId').value;
  const name = document.getElementById('clientFormName').value.trim();
  const phone = document.getElementById('clientFormPhone').value.trim();
  const email = document.getElementById('clientFormEmail').value.trim();
  const favBarberId = document.getElementById('clientFormFavBarber').value;
  const favBarberName = (barbers.find(b => b.id === favBarberId) || {}).name || "Dito Mestre";
  const isClub = document.getElementById('clientFormIsClub').checked;
  const clubPlanName = isClub ? document.getElementById('clientFormClubPlan').value : null;
  const visits = parseInt(document.getElementById('clientFormVisits').value, 10) || 0;
  const spent = parseFloat(document.getElementById('clientFormSpent').value) || 0;
  const notes = document.getElementById('clientFormNotes').value.trim();

  if (!name || !phone) {
    showToast("Informe o nome e WhatsApp do cliente.", "warning");
    return;
  }

  if (editId) {
    const c = clients.find(x => x.id === editId);
    if (c) {
      c.name = name;
      c.phone = phone;
      c.email = email;
      c.favBarberId = favBarberId;
      c.favBarberName = favBarberName;
      c.isClub = isClub;
      c.clubPlanName = clubPlanName;
      c.totalVisits = visits;
      c.totalSpent = spent;
      c.notes = notes;
    }
    showToast(`Cliente ${name} atualizado!`, "success");
  } else {
    const newId = 'cli-' + Date.now();
    clients.push({
      id: newId,
      name: name,
      phone: phone,
      email: email,
      favBarberId: favBarberId,
      favBarberName: favBarberName,
      isClub: isClub,
      clubPlanName: clubPlanName,
      totalVisits: visits,
      totalSpent: spent,
      lastVisitDate: getTodayIsoDate(),
      noShowsCount: 0,
      segment: isClub ? 'assinante' : 'recorrente',
      notes: notes
    });
    showToast(`Cliente ${name} cadastrado no CRM!`, "success");
  }

  if (isClub) {
    let m = clubMembers.find(x => x.name.toLowerCase() === name.toLowerCase());
    const expiry = document.getElementById('clientFormClubExpiry').value || getTodayIsoDate();
    const selPlan = clubPlans.find(p => p.name === clubPlanName);
    if (!m) {
      clubMembers.push({
        id: 'mem-' + Date.now(),
        name: name,
        phone: phone,
        email: email,
        planName: clubPlanName,
        startDate: getTodayIsoDate(),
        expiryDate: expiry,
        status: "ativo",
        includedServices: selPlan ? selPlan.includedServices : []
      });
    } else {
      m.name = name;
      m.phone = phone;
      m.planName = clubPlanName;
      if (expiry) m.expiryDate = expiry;
      m.status = "ativo";
      if (selPlan) m.includedServices = selPlan.includedServices;
    }
  } else {
    clubMembers = clubMembers.filter(m => m.name.toLowerCase() !== name.toLowerCase());
  }

  saveSystemDataToStorage();
  closeClientFormModal();
  renderClientsList();
  renderClubMembersList();
}

function deleteClient(clientId) {
  const c = clients.find(x => x.id === clientId);
  if (!c) return;
  if (!confirm(`Tem certeza que deseja excluir o cliente ${c.name}?`)) return;

  clients = clients.filter(x => x.id !== clientId);
  clubMembers = clubMembers.filter(m => m.name.toLowerCase() !== c.name.toLowerCase());

  saveSystemDataToStorage();
  renderClientsList();
  renderClubMembersList();
  showToast(`Cliente ${c.name} removido.`, "info");
}

function setInventoryCategory(cat) {
  currentInventoryCategory = cat;
  ['todos', 'pomadas', 'barba', 'shampoos', 'tratamento'].forEach(c => {
    const btn = document.getElementById(`btnFilterInv_${c}`);
    if (btn) {
      if (c === cat) {
        btn.className = "px-3.5 py-1.5 rounded-xl font-bold bg-gold-500 text-obsidian-950 transition";
      } else {
        btn.className = "px-3.5 py-1.5 rounded-xl font-semibold bg-obsidian-850 hover:bg-obsidian-800 text-neutral-300 transition";
      }
    }
  });
  renderInventoryModule();
}

function onInventorySearchChange(q) {
  currentInventorySearchQuery = (q || '').toLowerCase().trim();
  renderInventoryModule();
}

function renderInventoryModule() {
  const container = document.getElementById('inventoryListContainer');
  if (!container) return;

  const filtered = inventory.filter(item => {
    if (currentInventoryCategory !== 'todos' && (item.category || '').toLowerCase() !== currentInventoryCategory.toLowerCase()) {
      return false;
    }
    if (currentInventorySearchQuery && !(item.name || '').toLowerCase().includes(currentInventorySearchQuery)) {
      return false;
    }
    return true;
  });

  container.innerHTML = filtered.map(item => {
    const isLow = item.currentStock <= item.minStock;
    const margin = item.costPrice > 0 ? Math.round(((item.salePrice - item.costPrice) / item.costPrice) * 100) : 100;

    return `
      <div class="p-4 rounded-2xl bg-obsidian-900 border ${isLow ? 'border-amber-500/50' : 'border-obsidian-800'} hover:border-gold-500/50 transition flex flex-col justify-between space-y-3 shadow-lg">
        <div>
          <div class="flex items-start justify-between gap-2">
            <div>
              <strong class="text-white text-sm block">${item.name}</strong>
              <span class="text-[10px] uppercase font-bold text-neutral-400 block">${item.category}</span>
            </div>
            <span class="font-serif font-bold text-gold-400 text-base">R$ ${item.salePrice.toFixed(2).replace('.', ',')}</span>
          </div>

          <div class="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-obsidian-850 border border-obsidian-750 text-xs text-center mt-3">
            <div>
              <span class="text-[9px] text-neutral-500 uppercase block">Custo</span>
              <strong class="text-white">R$ ${item.costPrice.toFixed(2).replace('.', ',')}</strong>
            </div>
            <div>
              <span class="text-[9px] text-neutral-500 uppercase block">Margem</span>
              <strong class="text-emerald-400">+${margin}%</strong>
            </div>
            <div>
              <span class="text-[9px] text-neutral-500 uppercase block">Estoque</span>
              <strong class="${isLow ? 'text-amber-400 animate-pulse' : 'text-white'} font-mono font-bold">${item.currentStock} un</strong>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-obsidian-800">
          <div class="flex items-center gap-1.5 bg-obsidian-850 p-1 rounded-xl border border-obsidian-750">
            <button onclick="quickAdjustStock('${item.id}', -1)" title="Dar Baixa (-1)" class="w-6 h-6 rounded-lg bg-obsidian-800 hover:bg-rose-950 text-neutral-300 hover:text-rose-300 font-bold flex items-center justify-center text-xs">-1</button>
            <span class="text-xs font-mono font-bold text-white px-1.5">${item.currentStock}</span>
            <button onclick="quickAdjustStock('${item.id}', 1)" title="Entrada (+1)" class="w-6 h-6 rounded-lg bg-obsidian-800 hover:bg-emerald-950 text-neutral-300 hover:text-emerald-300 font-bold flex items-center justify-center text-xs">+1</button>
          </div>

          <div class="flex items-center gap-1.5">
            <button onclick="editProduct('${item.id}')" class="px-2.5 py-1.5 rounded-xl bg-obsidian-800 hover:bg-gold-500 hover:text-black text-xs font-semibold text-white transition flex items-center gap-1">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              <span>Editar</span>
            </button>
            <button onclick="deleteProduct('${item.id}')" class="p-1.5 rounded-xl bg-obsidian-800 hover:bg-rose-950 text-neutral-400 hover:text-rose-400 transition" title="Excluir Produto">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function quickAdjustStock(productId, delta) {
  const item = inventory.find(x => x.id === productId);
  if (!item) return;

  const newStock = Math.max(0, (item.currentStock || 0) + delta);
  item.currentStock = newStock;

  saveSystemDataToStorage();
  renderInventoryModule();
  renderBarberInventoryView();
  showToast(`Estoque de "${item.name}": ${newStock} un.`, "info");
}

function openNewProductModal() {
  const modal = document.getElementById('modalProductForm');
  const title = document.getElementById('productModalTitle');
  const idInput = document.getElementById('productFormId');

  if (title) title.textContent = "Novo Produto no Estoque";
  if (idInput) idInput.value = "";

  document.getElementById('productFormName').value = "";
  document.getElementById('productFormCategory').value = "pomadas";
  document.getElementById('productFormCostPrice').value = "18.00";
  document.getElementById('productFormSalePrice').value = "45.00";
  document.getElementById('productFormCurrentStock').value = "15";
  document.getElementById('productFormMinStock').value = "5";

  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function editProduct(productId) {
  const item = inventory.find(x => x.id === productId);
  if (!item) return;

  const modal = document.getElementById('modalProductForm');
  const title = document.getElementById('productModalTitle');
  const idInput = document.getElementById('productFormId');

  if (title) title.textContent = `Editar Produto — ${item.name}`;
  if (idInput) idInput.value = item.id;

  document.getElementById('productFormName').value = item.name;
  document.getElementById('productFormCategory').value = (item.category || 'pomadas').toLowerCase();
  document.getElementById('productFormCostPrice').value = item.costPrice;
  document.getElementById('productFormSalePrice').value = item.salePrice;
  document.getElementById('productFormCurrentStock').value = item.currentStock;
  document.getElementById('productFormMinStock').value = item.minStock || 5;

  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function closeProductModal() {
  const modal = document.getElementById('modalProductForm');
  if (modal) modal.classList.add('hidden');
}

function saveProductForm() {
  const editId = document.getElementById('productFormId').value;
  const name = document.getElementById('productFormName').value.trim();
  const category = document.getElementById('productFormCategory').value;
  const cost = parseFloat(document.getElementById('productFormCostPrice').value) || 0;
  const sale = parseFloat(document.getElementById('productFormSalePrice').value) || 0;
  const stock = parseInt(document.getElementById('productFormCurrentStock').value, 10) || 0;
  const minStock = parseInt(document.getElementById('productFormMinStock').value, 10) || 0;

  if (!name || sale <= 0) {
    showToast("Preencha nome e preço de venda válido.", "warning");
    return;
  }

  if (editId) {
    const item = inventory.find(x => x.id === editId);
    if (item) {
      item.name = name;
      item.category = category;
      item.costPrice = cost;
      item.salePrice = sale;
      item.currentStock = stock;
      item.minStock = minStock;
    }
    showToast(`Produto ${name} atualizado!`, "success");
  } else {
    const newId = 'prod-' + Date.now();
    inventory.push({
      id: newId,
      name: name,
      category: category,
      costPrice: cost,
      salePrice: sale,
      currentStock: stock,
      minStock: minStock
    });
    showToast(`Novo produto ${name} adicionado!`, "success");
  }

  saveSystemDataToStorage();
  closeProductModal();
  renderInventoryModule();
  renderBarberInventoryView();
}

function deleteProduct(productId) {
  const item = inventory.find(x => x.id === productId);
  if (!item) return;
  if (!confirm(`Excluir o produto "${item.name}"?`)) return;

  inventory = inventory.filter(x => x.id !== productId);
  saveSystemDataToStorage();
  renderInventoryModule();
  renderBarberInventoryView();
  showToast(`Produto ${item.name} excluído.`, "info");
}

function renderBarberInventoryView() {
  const container = document.getElementById('barberInventoryCardsContainer');
  const commBadge = document.getElementById('barberProductCommBadge');
  const user = getCurrentUser();

  let barber = null;
  if (user && user.barberId) {
    barber = barbers.find(b => b.id === user.barberId);
  }
  const commPercent = barber ? (barber.productCommissionPercent || 10) : 10;
  if (commBadge) commBadge.textContent = `${commPercent}% de Comissão (${barber ? barber.name : 'Barbeiro'})`;

  if (!container) return;

  container.innerHTML = inventory.map(item => {
    const isAvailable = item.currentStock > 0;
    const barberComm = item.salePrice * (commPercent / 100);

    return `
      <div class="p-4 rounded-2xl bg-obsidian-900 border ${isAvailable ? 'border-obsidian-800 hover:border-gold-500/40' : 'border-rose-900/40 opacity-75'} transition flex flex-col justify-between space-y-3 shadow-lg">
        <div>
          <div class="flex items-start justify-between gap-2">
            <div>
              <strong class="text-white text-sm block">${item.name}</strong>
              <span class="text-[10px] uppercase font-bold text-gold-400 block">${item.category}</span>
            </div>
            <div class="text-right">
              <span class="font-serif font-bold text-gold-400 text-base">R$ ${item.salePrice.toFixed(2).replace('.', ',')}</span>
              <span class="text-[10px] text-emerald-400 font-bold block">+R$ ${barberComm.toFixed(2).replace('.', ',')} comissão</span>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-obsidian-850 border border-obsidian-750 flex items-center justify-between text-xs mt-3">
            <span class="text-neutral-400 font-semibold">Liberado para Venda:</span>
            <strong class="${isAvailable ? 'text-white' : 'text-rose-400'} font-mono text-sm">
              ${item.currentStock} unidades
            </strong>
          </div>
        </div>

        <div class="pt-2 border-t border-obsidian-800">
          <button 
            onclick="barberSellProduct('${item.id}')" 
            ${!isAvailable ? 'disabled' : ''}
            class="w-full py-2 rounded-xl bg-gold-500 hover:bg-gold-400 disabled:opacity-40 disabled:cursor-not-allowed text-obsidian-950 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-gold-glow"
          >
            <i data-lucide="shopping-bag" class="w-3.5 h-3.5"></i>
            <span>Vender 1 un</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function barberSellProduct(productId) {
  const item = inventory.find(x => x.id === productId);
  if (!item) return;

  if (item.currentStock <= 0) {
    showToast(`Produto "${item.name}" sem estoque liberado para venda.`, "warning");
    return;
  }

  const user = getCurrentUser();
  const barber = user && user.barberId ? barbers.find(b => b.id === user.barberId) : null;
  const commPercent = barber ? (barber.productCommissionPercent || 10) : 10;
  const commValue = item.salePrice * (commPercent / 100);

  item.currentStock = item.currentStock - 1;

  productSales.push({
    id: 'sale-' + Date.now(),
    productId: item.id,
    productName: item.name,
    quantity: 1,
    unitPrice: item.salePrice,
    totalPrice: item.salePrice,
    barberId: barber ? barber.id : 'dito',
    barberName: barber ? barber.name : 'Dito Mestre',
    commission: commValue,
    date: getTodayIsoDate()
  });

  saveSystemDataToStorage();
  renderBarberInventoryView();
  renderInventoryModule();
  showToast(`Venda de ${item.name} registrada! Comissão: +R$ ${commValue.toFixed(2).replace('.', ',')}`, "success");
}

function openProductSaleModal(productId = null) {
  const modal = document.getElementById('modalProductSale');
  const pSelect = document.getElementById('saleProductSelect');
  const bSelect = document.getElementById('saleBarberSelect');

  if (pSelect) {
    pSelect.innerHTML = inventory.map(item => `
      <option value="${item.id}" ${item.id === productId ? 'selected' : ''}>${item.name} (R$ ${item.salePrice.toFixed(2).replace('.', ',')})</option>
    `).join('');
  }

  if (bSelect) {
    const user = getCurrentUser();
    bSelect.innerHTML = barbers.filter(b => b.active).map(b => `
      <option value="${b.id}" ${user && user.barberId === b.id ? 'selected' : ''}>${b.name}</option>
    `).join('');
  }

  document.getElementById('saleQuantityInput').value = "1";

  onSaleProductSelectChange();

  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function closeProductSaleModal() {
  const modal = document.getElementById('modalProductSale');
  if (modal) modal.classList.add('hidden');
}

function onSaleProductSelectChange() {
  const pSelect = document.getElementById('saleProductSelect');
  if (!pSelect) return;
  const pId = pSelect.value;
  const item = inventory.find(x => x.id === pId);

  const priceEl = document.getElementById('saleProductUnitPriceDisplay');
  const badgeEl = document.getElementById('saleProductStockBadge');

  if (item) {
    if (priceEl) priceEl.textContent = `R$ ${item.salePrice.toFixed(2).replace('.', ',')}`;
    if (badgeEl) badgeEl.textContent = `${item.currentStock} un disponíveis`;
  }

  calculateSaleTotals();
}

function adjustSaleQuantity(delta) {
  const input = document.getElementById('saleQuantityInput');
  if (!input) return;
  const current = parseInt(input.value, 10) || 1;
  input.value = Math.max(1, current + delta);
  calculateSaleTotals();
}

function calculateSaleTotals() {
  const pSelect = document.getElementById('saleProductSelect');
  const input = document.getElementById('saleQuantityInput');
  const bSelect = document.getElementById('saleBarberSelect');
  if (!pSelect || !input) return;

  const item = inventory.find(x => x.id === pSelect.value);
  const qty = Math.max(1, parseInt(input.value, 10) || 1);
  const bId = bSelect ? bSelect.value : null;
  const barber = barbers.find(b => b.id === bId);
  const commPercent = barber ? (barber.productCommissionPercent || 10) : 10;

  if (item) {
    const total = item.salePrice * qty;
    const comm = total * (commPercent / 100);

    const totalEl = document.getElementById('saleTotalValueDisplay');
    const commEl = document.getElementById('saleCommissionValueDisplay');

    if (totalEl) totalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    if (commEl) commEl.textContent = `R$ ${comm.toFixed(2).replace('.', ',')}`;
  }
}

function confirmProductSale() {
  const pSelect = document.getElementById('saleProductSelect');
  const input = document.getElementById('saleQuantityInput');
  const bSelect = document.getElementById('saleBarberSelect');
  const methodSelect = document.getElementById('salePaymentMethodSelect');

  if (!pSelect || !input) return;

  const item = inventory.find(x => x.id === pSelect.value);
  if (!item) return;

  const qty = parseInt(input.value, 10) || 1;
  if (item.currentStock < qty) {
    showToast(`Estoque insuficiente! Disponível: ${item.currentStock} un.`, "warning");
    return;
  }

  const bId = bSelect ? bSelect.value : "dito";
  const barber = barbers.find(b => b.id === bId);
  const commPercent = barber ? (barber.productCommissionPercent || 10) : 10;
  const total = item.salePrice * qty;
  const comm = total * (commPercent / 100);

  item.currentStock = item.currentStock - qty;

  productSales.push({
    id: 'sale-' + Date.now(),
    productId: item.id,
    productName: item.name,
    quantity: qty,
    unitPrice: item.salePrice,
    totalPrice: total,
    barberId: bId,
    barberName: barber ? barber.name : "Dito Mestre",
    commission: comm,
    paymentMethod: methodSelect ? methodSelect.value : "pix",
    date: getTodayIsoDate()
  });

  saveSystemDataToStorage();
  closeProductSaleModal();
  renderInventoryModule();
  renderBarberInventoryView();
  showToast(`Venda concluída! Estoque atualizado (-${qty} un).`, "success");
}

function setDashboardPeriodFilter(period) {
  currentDashboardPeriod = period;
  renderDashboardCommissions();
  renderDashboardBarberRanking();
}

function renderDashboardCommissions() {
  const grossEl = document.getElementById('dashTotalGrossRevenue');
  const commEl = document.getElementById('dashTotalCommissions');
  const netShopEl = document.getElementById('dashNetShopRevenue');
  const countEl = document.getElementById('dashTotalCutsCount');
  const container = document.getElementById('dashBarbersCommissionsList');

  const todayIso = getTodayIsoDate();
  const completedApps = appointments.filter(a => {
    if (a.status !== 'concluido') return false;
    if (currentDashboardPeriod === 'today') {
      return (a.date === todayIso || !a.date);
    }
    return true;
  });

  const grossRevenue = completedApps.reduce((sum, a) => sum + (a.price || 0), 0);
  const commissionsTotal = completedApps.reduce((sum, a) => sum + (a.commission || 0), 0);
  const netShop = grossRevenue - commissionsTotal;

  if (grossEl) grossEl.textContent = `R$ ${grossRevenue.toFixed(2).replace('.', ',')}`;
  if (commEl) commEl.textContent = `R$ ${commissionsTotal.toFixed(2).replace('.', ',')}`;
  if (netShopEl) netShopEl.textContent = `R$ ${netShop.toFixed(2).replace('.', ',')}`;
  if (countEl) countEl.textContent = completedApps.length;

  if (container) {
    container.innerHTML = barbers.map(barber => {
      const bApps = completedApps.filter(a => a.barberId === barber.id);
      const bGross = bApps.reduce((sum, a) => sum + (a.price || 0), 0);
      const bComm = bApps.reduce((sum, a) => sum + (a.commission || 0), 0);

      return `
        <div class="p-4 rounded-2xl bg-obsidian-900 border border-obsidian-800 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <img src="${barber.avatar || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=80&q=80'}" class="w-10 h-10 rounded-full object-cover border border-gold-400">
              <div>
                <strong class="text-white text-sm block">${barber.name}</strong>
                <span class="text-[11px] text-neutral-400 block">${bApps.length} atendimentos</span>
              </div>
            </div>
            <div class="text-right">
              <span class="text-[10px] text-neutral-500 uppercase block">Comissão</span>
              <strong class="text-emerald-400 font-serif text-base">R$ ${bComm.toFixed(2).replace('.', ',')}</strong>
            </div>
          </div>
          <div class="flex justify-between text-xs pt-2 border-t border-obsidian-800 text-neutral-400">
            <span>Faturamento Bruto: <strong class="text-white">R$ ${bGross.toFixed(2).replace('.', ',')}</strong></span>
            <span>Retenção da Casa: <strong class="text-gold-400">R$ ${(bGross - bComm).toFixed(2).replace('.', ',')}</strong></span>
          </div>
        </div>
      `;
    }).join('');
  }
}

function renderDashboardBarberRanking() {
  const container = document.getElementById('dashBarberRankingContainer');
  if (!container) return;

  const todayIso = getTodayIsoDate();
  const completedApps = appointments.filter(a => a.status === 'concluido' && (a.date === todayIso || !a.date));

  const ranking = barbers.map(b => {
    const cuts = completedApps.filter(a => a.barberId === b.id).length;
    return { barber: b, cuts };
  }).sort((a, b) => b.cuts - a.cuts);

  container.innerHTML = ranking.map((item, idx) => `
    <div class="flex items-center justify-between p-3 rounded-xl bg-obsidian-850 border border-obsidian-750 text-xs">
      <div class="flex items-center gap-2.5">
        <span class="font-bold text-gold-400 text-sm w-4">#${idx + 1}</span>
        <strong class="text-white">${item.barber.name}</strong>
      </div>
      <span class="text-neutral-300 font-bold">${item.cuts} cortes</span>
    </div>
  `).join('');
}

function renderDashboardPaymentMethods() {
  const container = document.getElementById('dashPaymentMethodsContainer');
  if (!container) return;

  const todayIso = getTodayIsoDate();
  const completed = appointments.filter(a => a.status === 'concluido' && (a.date === todayIso || !a.date));
  const counts = { pix: 0, cartao: 0, dinheiro: 0, clube: 0 };

  completed.forEach(a => {
    const m = a.paymentMethod || 'pix';
    counts[m] = (counts[m] || 0) + 1;
  });

  container.innerHTML = `
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
      <div class="p-3 rounded-xl bg-obsidian-850 border border-obsidian-750"><span class="text-neutral-400 block text-[10px]">PIX</span><strong class="text-gold-400 text-base">${counts.pix || 0}</strong></div>
      <div class="p-3 rounded-xl bg-obsidian-850 border border-obsidian-750"><span class="text-neutral-400 block text-[10px]">Cartão</span><strong class="text-gold-400 text-base">${counts.cartao || 0}</strong></div>
      <div class="p-3 rounded-xl bg-obsidian-850 border border-obsidian-750"><span class="text-neutral-400 block text-[10px]">Dinheiro</span><strong class="text-gold-400 text-base">${counts.dinheiro || 0}</strong></div>
      <div class="p-3 rounded-xl bg-obsidian-850 border border-obsidian-750"><span class="text-neutral-400 block text-[10px]">Clube</span><strong class="text-emerald-400 text-base">${counts.clube || 0}</strong></div>
    </div>
  `;
}

function renderReportsView() {
  const container = document.getElementById('reportsViewContainer');
  if (!container) return;
  container.innerHTML = `
    <div class="p-6 rounded-2xl bg-obsidian-900 border border-obsidian-800 space-y-4 text-xs">
      <h3 class="font-serif font-bold text-lg text-white">Relatório de Fechamento Operacional</h3>
      <p class="text-neutral-300">Data: <strong>${formatFullDateHeader(currentAgendaDate)}</strong></p>
      <div class="p-4 rounded-xl bg-obsidian-850 border border-obsidian-750 space-y-2">
        <div class="flex justify-between"><span>Total de Reservas:</span><strong class="text-white">${appointments.length}</strong></div>
        <div class="flex justify-between"><span>Concluídos:</span><strong class="text-emerald-400">${appointments.filter(a => a.status === 'concluido').length}</strong></div>
        <div class="flex justify-between"><span>No-Show:</span><strong class="text-rose-400">${appointments.filter(a => a.status === 'no_show').length}</strong></div>
      </div>
    </div>
  `;
}

function initAdminPanel() {
  loadSystemDataFromStorage();
  const user = getCurrentUser();

  if (user) {
    if (user.role === 'barbeiro') {
      switchView(currentActiveView === 'barberInventory' ? 'barberInventory' : 'agenda');
    } else {
      switchView(currentActiveView || 'agenda');
    }
  }

  setInterval(() => {
    if (currentActiveView === 'agenda') {
      renderAgendaGrid();
    }
  }, 20000);
}

window.onSystemSyncReceived = function(data) {
  if (currentActiveView === 'agenda') {
    renderAgendaGrid();
    recalculateKPIs();
    updateBarberPersonalGoalWidget();
  } else if (currentActiveView === 'services') {
    renderServicesManagementList();
  } else if (currentActiveView === 'clubMembers') {
    renderClubMembersList();
    renderClubPlansList();
  } else if (currentActiveView === 'clients') {
    renderClientsList();
  } else if (currentActiveView === 'inventory') {
    renderInventoryModule();
  } else if (currentActiveView === 'barberInventory') {
    renderBarberInventoryView();
  }
};
