let currentStep = 1;
let showAllServicesInBooking = false;
let bookingData = {
  unit: "Unidade Paulista (Matriz)",
  service: "Combo Mestre (Cabelo + Barba)",
  price: 95,
  barber: "Dito Mestre",
  selectedDate: "",
  date: "",
  time: "",
  clientName: "",
  clientPhone: "",
  isClub: false,
  clubMember: null,
  code: "SD-8921"
};

function openBookingModal(servicePreset) {
  loadSystemDataFromStorage();
  showAllServicesInBooking = false;
  bookingData.clientName = "";
  bookingData.clientPhone = "";
  bookingData.isClub = false;
  bookingData.clubMember = null;
  bookingData.time = "";

  if (servicePreset === 'corte-social-fade' || servicePreset === 'corte-club') {
    bookingData.service = "Corte Seu Dito Premium";
    bookingData.price = 55;
  } else if (servicePreset === 'barba-terapia') {
    bookingData.service = "Barboterapia Toalha Quente";
    bookingData.price = 50;
  } else if (servicePreset === 'combo-mestre' || servicePreset === 'cabelo-barba-club') {
    bookingData.service = "Combo Mestre (Cabelo + Barba)";
    bookingData.price = 95;
  } else if (servicePreset === 'pigmentacao') {
    bookingData.service = "Pigmentação Barba ou Cabelo";
    bookingData.price = 45;
  } else if (servicePreset === 'hidratacao' || servicePreset === 'black-master-club') {
    bookingData.service = "Hidratação & Ozonioterapia";
    bookingData.price = 60;
  } else if (servicePreset === 'pezinho') {
    bookingData.service = "Pezinho & Acabamento Navalha";
    bookingData.price = 30;
  }

  const todayIso = getTodayIsoDate();
  bookingData.selectedDate = todayIso;
  bookingData.date = formatDatePtBr(todayIso);

  currentStep = 1;
  bookingData.code = "SD-" + Math.floor(1000 + Math.random() * 9000);
  renderBookingStep();

  const modal = document.getElementById('modalBooking');
  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function openBookingModalWithUnit(unitName) {
  bookingData.unit = unitName;
  openBookingModal();
}

function closeBookingModal() {
  const modal = document.getElementById('modalBooking');
  if (modal) modal.classList.add('hidden');
}

function setBookingQuickDate(isoStr, label) {
  bookingData.selectedDate = isoStr;
  bookingData.date = label || formatDatePtBr(isoStr);
  bookingData.time = "";
  renderBookingStep();
}

function setBookingCustomDate(isoStr) {
  if (!isoStr) return;
  bookingData.selectedDate = isoStr;
  bookingData.date = formatDatePtBr(isoStr);
  bookingData.time = "";
  renderBookingStep();
}

function onBookingPhoneStep1Change(val) {
  bookingData.clientPhone = val;
  const clean = normalizePhone(val);
  const box = document.getElementById('bookingMemberRecognitionBox');
  if (!box) return;

  if (clean.length >= 8) {
    const matched = clubMembers.find(m => normalizePhone(m.phone).includes(clean) || clean.includes(normalizePhone(m.phone)));
    if (matched) {
      bookingData.clubMember = matched;
      bookingData.clientName = matched.name;
      const status = checkMemberActiveStatus(matched);
      if (status.isActive) {
        bookingData.isClub = true;
        box.innerHTML = `
          <div class="p-3.5 rounded-xl bg-gold-500/10 border border-gold-500/50 text-xs space-y-2 shadow-gold-glow animate-fade-in">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i data-lucide="crown" class="w-4 h-4 text-gold-400"></i>
                <strong class="text-gold-300 font-bold uppercase tracking-wider text-[11px]">Assinante Reconhecido!</strong>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Plano Ativo</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-neutral-300 pt-1 border-t border-gold-500/20">
              <div><span class="text-neutral-400">Nome:</span> <strong class="text-white">${matched.name}</strong></div>
              <div><span class="text-neutral-400">Telefone:</span> <span class="font-mono text-neutral-200">${formatPhoneDisplay(matched.phone)}</span></div>
              <div><span class="text-neutral-400">Plano:</span> <strong class="text-gold-400 font-serif">${matched.planName}</strong></div>
              <div><span class="text-neutral-400">Validade:</span> <span class="text-emerald-400 font-bold">${formatDatePtBr(matched.expiryDate)}</span></div>
            </div>
            <p class="text-[10px] text-gold-400/90 pt-1">
              ✨ No próximo passo, apenas os cortes e serviços inclusos no seu plano serão liberados com custo R$ 0,00.
            </p>
          </div>
        `;
      } else {
        bookingData.isClub = false;
        box.innerHTML = `
          <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-xs space-y-1.5 text-amber-200 animate-fade-in">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-400"></i>
                <span>Plano ${status.label}</span>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">Regularização Necessária</span>
            </div>
            <p class="text-[11px] text-neutral-300">
              Olá, <strong>${matched.name}</strong>. Seu plano <strong>${matched.planName}</strong> está ${status.label.toLowerCase()}. O agendamento será processado pela tabela de balcão. Fale com nossa recepção!
            </p>
          </div>
        `;
      }
      if (window.lucide) window.lucide.createIcons();
      return;
    }
  }

  bookingData.clubMember = null;
  bookingData.isClub = false;
  box.innerHTML = `
    <div class="p-2.5 rounded-xl bg-obsidian-850 border border-obsidian-750 text-[11px] text-neutral-400 flex items-center gap-2">
      <i data-lucide="info" class="w-3.5 h-3.5 text-gold-400 shrink-0"></i>
      <span>Clientes do Clube: digite seu WhatsApp para identificação instantânea.</span>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
}

function renderBookingStep() {
  const body = document.getElementById('bookingModalBody');
  const title = document.getElementById('bookingStepTitle');
  const badge = document.getElementById('bookingStepBadge');
  const progressBar = document.getElementById('stepProgressBar');
  const btnNext = document.getElementById('btnBookingNext');
  const btnBack = document.getElementById('btnBookingBack');

  if (!body || !title) return;

  if (badge) badge.textContent = `Passo ${currentStep} de 6`;
  if (progressBar) progressBar.style.width = `${(currentStep / 6) * 100}%`;
  if (btnBack) btnBack.style.visibility = (currentStep === 1 || currentStep === 6) ? 'hidden' : 'visible';

  if (currentStep === 1) {
    title.textContent = "Passo 1: Identificação & Unidade em Americana";
    if (btnNext) btnNext.innerHTML = `<span>Avançar</span> <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>`;
    body.innerHTML = `
      <div class="space-y-4">
        <div class="space-y-2 p-3.5 rounded-2xl bg-gradient-to-br from-obsidian-850 to-obsidian-900 border border-obsidian-750">
          <label class="block text-neutral-200 text-xs font-semibold flex items-center justify-between">
            <span class="flex items-center gap-1.5">
              <i data-lucide="phone" class="w-3.5 h-3.5 text-gold-400"></i>
              <span>WhatsApp / Telefone para Reconhecimento:</span>
            </span>
            <span class="text-[10px] text-gold-400 uppercase font-bold tracking-wider">Identificação do Clube</span>
          </label>
          <input 
            type="tel" 
            id="bookingPhoneStep1" 
            value="${bookingData.clientPhone || ''}" 
            oninput="onBookingPhoneStep1Change(this.value)" 
            placeholder="Ex: (19) 99999-9999" 
            class="w-full bg-obsidian-800 border border-obsidian-700 focus:border-gold-500 rounded-xl px-3.5 py-2.5 text-white outline-none font-mono text-sm transition"
          />
          <div id="bookingMemberRecognitionBox">
            <div class="p-2.5 rounded-xl bg-obsidian-850 border border-obsidian-750 text-[11px] text-neutral-400 flex items-center gap-2">
              <i data-lucide="info" class="w-3.5 h-3.5 text-gold-400 shrink-0"></i>
              <span>Clientes do Clube: digite seu WhatsApp para identificação instantânea.</span>
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <label class="block text-neutral-300 font-semibold text-xs flex items-center gap-1.5">
            <i data-lucide="map-pin" class="w-3.5 h-3.5 text-gold-400"></i>
            <span>Selecione a Unidade de Atendimento em Americana:</span>
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div onclick="selectUnit('Unidade Paulista (Matriz)')" class="p-3.5 rounded-xl border ${bookingData.unit === 'Unidade Paulista (Matriz)' ? 'border-gold-500 bg-obsidian-800 shadow-gold-glow' : 'border-obsidian-750 bg-obsidian-850 hover:border-gold-500/50'} cursor-pointer transition">
              <div class="flex justify-between items-center mb-1">
                <span class="text-[9px] uppercase font-bold text-gold-400">Matriz & Lounge</span>
                ${bookingData.unit === 'Unidade Paulista (Matriz)' ? '<i data-lucide="check-circle" class="w-4 h-4 text-gold-400"></i>' : ''}
              </div>
              <h4 class="font-bold text-white text-sm">Unidade Paulista</h4>
              <p class="text-[11px] text-neutral-400 mt-1">Av. Paulista, 1.200</p>
              <span class="text-[10px] text-neutral-500 mt-2 block">Mesa de sinuca & lounge VIP</span>
            </div>

            <div onclick="selectUnit('Unidade Carmine Feola')" class="p-3.5 rounded-xl border ${bookingData.unit === 'Unidade Carmine Feola' ? 'border-gold-500 bg-obsidian-800 shadow-gold-glow' : 'border-obsidian-750 bg-obsidian-850 hover:border-gold-500/50'} cursor-pointer transition">
              <div class="flex justify-between items-center mb-1">
                <span class="text-[9px] uppercase font-bold text-neutral-400">Espaço Clássico</span>
                ${bookingData.unit === 'Unidade Carmine Feola' ? '<i data-lucide="check-circle" class="w-4 h-4 text-gold-400"></i>' : ''}
              </div>
              <h4 class="font-bold text-white text-sm">Carmine Feola</h4>
              <p class="text-[11px] text-neutral-400 mt-1">Av. Carmine Feola, 406</p>
              <span class="text-[10px] text-neutral-500 mt-2 block">Vila Rio Branco</span>
            </div>

            <div onclick="selectUnit('Unidade Terramérica')" class="p-3.5 rounded-xl border ${bookingData.unit === 'Unidade Terramérica' ? 'border-gold-500 bg-obsidian-800 shadow-gold-glow' : 'border-obsidian-750 bg-obsidian-850 hover:border-gold-500/50'} cursor-pointer transition">
              <div class="flex justify-between items-center mb-1">
                <span class="text-[9px] uppercase font-bold text-neutral-400">Conceito Moderno</span>
                ${bookingData.unit === 'Unidade Terramérica' ? '<i data-lucide="check-circle" class="w-4 h-4 text-gold-400"></i>' : ''}
              </div>
              <h4 class="font-bold text-white text-sm">Terramérica</h4>
              <p class="text-[11px] text-neutral-400 mt-1">R. Limeira, 410</p>
              <span class="text-[10px] text-neutral-500 mt-2 block">Deck & Barba Moderna</span>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (currentStep === 2) {
    if (bookingData.isClub && bookingData.clubMember) {
      title.textContent = `Passo 2: Cortes do seu Plano (${bookingData.clubMember.planName})`;
      if (btnNext) btnNext.innerHTML = `<span>Avançar</span> <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>`;

      const coveredServices = services.filter(s => (bookingData.clubMember.includedServices || []).includes(s.name));
      const extraServices = services.filter(s => !(bookingData.clubMember.includedServices || []).includes(s.name));

      body.innerHTML = `
        <div class="space-y-3">
          <div class="p-3 rounded-xl bg-gold-500/10 border border-gold-500/40 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <i data-lucide="crown" class="w-4 h-4 text-gold-400"></i>
              <span class="text-gold-200">Plano Ativo: <strong>${bookingData.clubMember.planName}</strong></span>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Valor R$ 0,00</span>
          </div>

          <p class="text-neutral-300 text-xs">Procedimentos liberados para seu plano:</p>
          
          <div class="space-y-2">
            ${coveredServices.map(s => `
              <div onclick="selectService('${s.name}', 0)" class="p-3.5 rounded-xl border ${bookingData.service === s.name ? 'border-gold-500 bg-obsidian-800 shadow-gold-glow' : 'border-obsidian-750 bg-obsidian-850 hover:border-gold-500/50'} flex justify-between items-center cursor-pointer transition">
                <div>
                  <div class="flex items-center gap-2">
                    <strong class="text-white text-sm">${s.name}</strong>
                    <span class="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Incluso no Plano</span>
                  </div>
                  <span class="text-neutral-400 text-xs block mt-0.5">Procedimento coberto pela sua assinatura mensal</span>
                </div>
                <div class="text-right">
                  <span class="font-serif font-bold text-emerald-400 text-base">R$ 0,00</span>
                  <span class="text-[9px] text-neutral-500 block">Cobrança no plano</span>
                </div>
              </div>
            `).join('')}
          </div>

          ${extraServices.length > 0 ? `
            <div class="pt-2 border-t border-obsidian-800">
              <button type="button" onclick="showAllServicesInBooking = !showAllServicesInBooking; renderBookingStep();" class="text-xs text-gold-400 hover:text-gold-300 font-semibold underline flex items-center gap-1">
                <i data-lucide="${showAllServicesInBooking ? 'chevron-up' : 'chevron-down'}" class="w-3.5 h-3.5"></i>
                <span>${showAllServicesInBooking ? 'Ocultar outros serviços da barbearia' : 'Deseja agendar outro procedimento fora do plano? (Cobrança avulsa)'}</span>
              </button>

              ${showAllServicesInBooking ? `
                <div class="space-y-2 pt-2">
                  ${extraServices.map(s => `
                    <div onclick="selectService('${s.name}', ${s.price})" class="p-3 rounded-xl border ${bookingData.service === s.name ? 'border-gold-500 bg-obsidian-800 shadow-gold-glow' : 'border-obsidian-800 bg-obsidian-900 hover:border-obsidian-700'} flex justify-between items-center cursor-pointer transition">
                      <div>
                        <strong class="text-neutral-300 text-xs">${s.name}</strong>
                        <span class="text-[9px] uppercase text-neutral-500 block">Cobrança avulsa no balcão</span>
                      </div>
                      <span class="font-serif font-bold text-gold-400 text-sm">R$ ${s.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `;
    } else {
      title.textContent = "Passo 2: Escolha o Serviço ou Combo";
      if (btnNext) btnNext.innerHTML = `<span>Avançar</span> <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>`;
      
      body.innerHTML = `
        <div class="space-y-2.5">
          <p class="text-neutral-400 text-xs">Selecione o procedimento desejado:</p>
          ${services.map(s => `
            <div onclick="selectService('${s.name}', ${s.price})" class="p-3.5 rounded-xl border ${bookingData.service === s.name ? 'border-gold-500 bg-obsidian-800 shadow-gold-glow' : 'border-obsidian-750 bg-obsidian-850 hover:border-gold-500/50'} flex justify-between items-center cursor-pointer transition">
              <div>
                <div class="flex items-center gap-2">
                  <strong class="text-white text-sm">${s.name}</strong>
                  <span class="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-gold-500/20 text-gold-300">${s.category}</span>
                </div>
                <span class="text-neutral-400 text-xs block mt-0.5">${s.description || 'Padrão de excelência Seu Dito'}</span>
              </div>
              <span class="font-serif font-bold text-gold-400 text-base">R$ ${s.price.toFixed(2).replace('.', ',')}</span>
            </div>
          `).join('')}
        </div>
      `;
    }
  } else if (currentStep === 3) {
    title.textContent = "Passo 3: Escolha o Barbeiro";
    if (btnNext) btnNext.innerHTML = `<span>Avançar</span> <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>`;
    
    const unitBarbers = barbers.filter(b => b.active && (b.unit === bookingData.unit || !b.unit));
    const barbersToDisplay = unitBarbers.length > 0 ? unitBarbers : barbers.filter(b => b.active);
    if (!barbersToDisplay.some(b => b.name === bookingData.barber)) {
      bookingData.barber = barbersToDisplay[0] ? barbersToDisplay[0].name : '';
    }

    body.innerHTML = `
      <div class="space-y-3">
        <p class="text-neutral-400 text-xs">Escolha o barbeiro de sua preferência:</p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          ${barbersToDisplay.map(b => `
            <div onclick="selectBarber('${b.name}')" class="p-4 rounded-xl border ${bookingData.barber === b.name ? 'border-gold-500 bg-obsidian-800 shadow-gold-glow' : 'border-obsidian-750 bg-obsidian-850 hover:border-gold-500/50'} cursor-pointer transition flex flex-col items-center">
              <img src="${b.avatar || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=120&q=80'}" class="w-16 h-16 rounded-full object-cover border-2 border-gold-400 mb-2 shadow-sm">
              <strong class="text-white text-sm block truncate w-full">${b.name}</strong>
              <span class="text-[10px] text-gold-400 block font-semibold truncate w-full">${b.role}</span>
              <span class="text-[10px] text-neutral-400 mt-1">Avaliação ★ ${b.rating || '5.0'}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else if (currentStep === 4) {
    title.textContent = "Passo 4: Selecione a Data e o Horário";
    if (btnNext) btnNext.innerHTML = `<span>Avançar</span> <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>`;

    const quickDates = getQuickDateOptions();
    const curSelectedDate = bookingData.selectedDate || getTodayIsoDate();
    const matchedBarber = barbers.find(b => b.name === bookingData.barber) || barbers[0];
    const barberId = matchedBarber ? matchedBarber.id : 'dito';
    const reqDuration = getServiceDurationInMinutes(bookingData.service);

    const slotsToOffer = ['09:00', '09:45', '10:30', '11:15', '13:30', '14:15', '15:00', '15:45', '16:30', '17:15', '18:00', '18:45'];

    if (bookingData.time) {
      const checkCur = checkSlotAvailability(barberId, curSelectedDate, bookingData.time, reqDuration);
      if (!checkCur.available) {
        bookingData.time = "";
      }
    }

    const allSlotsUnavailable = slotsToOffer.every(s => !checkSlotAvailability(barberId, curSelectedDate, s, reqDuration).available);

    body.innerHTML = `
      <div class="space-y-4">
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-neutral-300 font-semibold text-xs flex items-center gap-1.5">
              <i data-lucide="calendar" class="w-3.5 h-3.5 text-gold-400"></i>
              <span>Selecione a Data do Agendamento:</span>
            </label>
            <span class="text-[11px] text-gold-400 font-bold font-mono">${bookingData.date}</span>
          </div>

          <div class="grid grid-cols-3 gap-2 mb-2.5">
            ${quickDates.map(qd => `
              <button type="button" onclick="setBookingQuickDate('${qd.iso}', '${qd.label}')" class="py-2 px-1 rounded-xl text-xs font-bold transition truncate ${curSelectedDate === qd.iso ? 'bg-gold-500 text-obsidian-950 shadow-gold-glow' : 'bg-obsidian-800 text-neutral-300 hover:bg-obsidian-750'}">
                ${qd.label}
              </button>
            `).join('')}
          </div>

          <div class="p-3 rounded-xl bg-obsidian-850 border border-obsidian-750 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 text-neutral-300 text-xs">
              <i data-lucide="calendar-days" class="w-4 h-4 text-gold-400 shrink-0"></i>
              <span>Ou escolha outra data no calendário:</span>
            </div>
            <input 
              type="date" 
              id="bookingDateInput" 
              min="${getTodayIsoDate()}" 
              value="${curSelectedDate}" 
              onchange="setBookingCustomDate(this.value)" 
              class="bg-obsidian-800 border border-obsidian-700 focus:border-gold-500 rounded-xl px-3 py-1.5 text-xs text-white outline-none font-sans cursor-pointer hover:border-gold-500/60 transition [color-scheme:dark]"
            >
          </div>
        </div>

        <div class="space-y-2.5">
          <div class="flex items-center justify-between mb-1">
            <label class="block text-neutral-300 font-semibold text-xs">
              Horários para ${bookingData.barber} em ${formatDatePtBr(curSelectedDate)}:
            </label>
            <span class="text-[10px] text-gold-400/90 font-mono">Duração: ${reqDuration} min</span>
          </div>

          <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
            ${slotsToOffer.map(t => {
              const check = checkSlotAvailability(barberId, curSelectedDate, t, reqDuration);
              if (!check.available) {
                let labelTxt = 'Ocupado';
                let labelColor = 'text-rose-400';
                if (check.reason === 'passado') {
                  labelTxt = 'Passou';
                  labelColor = 'text-neutral-500';
                } else if (check.reason === 'fechado') {
                  labelTxt = 'Fechado';
                  labelColor = 'text-amber-500';
                } else if (check.reason === 'almoco') {
                  labelTxt = 'Almoço';
                  labelColor = 'text-amber-500';
                }
                return `
                  <button type="button" disabled class="py-2.5 px-1 rounded-xl bg-obsidian-950/40 border border-obsidian-850 text-neutral-600 cursor-not-allowed flex flex-col items-center justify-center opacity-45 select-none transition">
                    <span class="line-through text-xs font-mono">${t}</span>
                    <span class="text-[9px] uppercase font-bold ${labelColor}">${labelTxt}</span>
                  </button>
                `;
              } else {
                const isSelected = bookingData.time === t;
                return `
                  <button type="button" onclick="selectTime('${t}')" class="py-2.5 px-1 rounded-xl font-bold text-xs transition flex flex-col items-center justify-center gap-0.5 ${isSelected ? 'bg-gold-500 text-obsidian-950 shadow-gold-glow border border-gold-400 scale-[1.02]' : 'bg-obsidian-800 text-white hover:bg-obsidian-750 hover:border-gold-500 border border-transparent'}">
                    <span class="font-mono">${t}</span>
                    <span class="text-[8px] uppercase tracking-wider font-semibold ${isSelected ? 'text-obsidian-900' : 'text-emerald-400'}">Livre</span>
                  </button>
                `;
              }
            }).join('')}
          </div>

          ${allSlotsUnavailable ? `
            <div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center space-y-1">
              <div class="font-bold flex items-center justify-center gap-1.5">
                <i data-lucide="calendar-x" class="w-4 h-4 text-amber-400"></i>
                <span>Sem horários disponíveis para ${bookingData.barber} em ${formatDatePtBr(curSelectedDate)}</span>
              </div>
              <p class="text-[11px] text-neutral-400">Escolha outra data acima ou retorne ao passo anterior e escolha outro barbeiro.</p>
            </div>
          ` : ''}

          <div class="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2.5 text-[10px] sm:text-[11px] text-neutral-400 border-t border-obsidian-800">
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Disponível</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Ocupado (Reservado)</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-neutral-600"></span>
              <span>Passado (Encerrado)</span>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (currentStep === 5) {
    title.textContent = "Passo 5: Seus Dados para Confirmação";
    if (btnNext) btnNext.innerHTML = `<span>Finalizar Agendamento</span> <i data-lucide="check" class="w-3.5 h-3.5"></i>`;
    body.innerHTML = `
      <div class="space-y-4">
        <div class="space-y-3">
          <div>
            <label class="block text-neutral-300 text-xs font-semibold mb-1">Seu Nome Completo *</label>
            <input type="text" id="custName" value="${bookingData.clientName || ''}" placeholder="Nome e sobrenome" class="w-full bg-obsidian-800 border border-obsidian-700 focus:border-gold-500 rounded-xl px-3.5 py-2.5 text-white outline-none text-xs">
          </div>

          <div>
            <label class="block text-neutral-300 text-xs font-semibold mb-1">WhatsApp para Confirmação e Lembrete *</label>
            <input type="tel" id="custPhone" value="${bookingData.clientPhone || ''}" placeholder="(19) 90000-0000" class="w-full bg-obsidian-800 border border-obsidian-700 focus:border-gold-500 rounded-xl px-3.5 py-2.5 text-white outline-none font-mono text-xs">
          </div>

          ${bookingData.isClub && bookingData.clubMember ? `
            <div class="p-3 bg-gradient-to-r from-gold-500/15 to-gold-400/5 border border-gold-500/40 rounded-xl text-xs flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i data-lucide="shield-check" class="w-4 h-4 text-gold-400"></i>
                <span class="text-neutral-200">Assinante Confirmado: <strong class="text-gold-300">${bookingData.clubMember.planName}</strong></span>
              </div>
              <span class="text-emerald-400 font-bold text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">Isenção no Balcão</span>
            </div>
          ` : `
            <div class="p-2.5 bg-obsidian-850 border border-obsidian-750 rounded-xl text-xs text-neutral-400 flex items-center gap-2">
              <i data-lucide="credit-card" class="w-3.5 h-3.5 text-gold-400"></i>
              <span>Atendimento avulso com pagamento no balcão após o serviço.</span>
            </div>
          `}
        </div>

        <div class="p-4 rounded-xl bg-gradient-to-br from-obsidian-850 to-obsidian-900 border border-gold-500/40 space-y-2">
          <span class="text-[10px] uppercase font-bold text-gold-400 block tracking-wider">Resumo da Reserva:</span>
          <div class="flex justify-between text-xs"><span class="text-neutral-400">Unidade:</span><span class="text-white font-semibold">${bookingData.unit}</span></div>
          <div class="flex justify-between text-xs"><span class="text-neutral-400">Serviço:</span><span class="text-white font-semibold">${bookingData.service}</span></div>
          <div class="flex justify-between text-xs"><span class="text-neutral-400">Barbeiro:</span><span class="text-gold-300 font-semibold">${bookingData.barber}</span></div>
          <div class="flex justify-between text-xs"><span class="text-neutral-400">Data e Hora:</span><span class="text-white font-semibold">${bookingData.date} às ${bookingData.time}</span></div>
          <div class="flex justify-between items-baseline pt-2 border-t border-obsidian-750">
            <span class="font-bold text-neutral-300 uppercase text-xs">Total a pagar:</span>
            <span class="text-xl font-serif font-bold text-gold-400">
              ${bookingData.isClub ? 'R$ 0,00 (Plano Ativo)' : 'R$ ' + (bookingData.price || 0).toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </div>
    `;
  } else if (currentStep === 6) {
    title.textContent = "Agendamento Confirmado!";
    if (btnNext) btnNext.innerHTML = `<span>Concluir</span> <i data-lucide="check" class="w-3.5 h-3.5"></i>`;

    const [year, month, day] = (bookingData.selectedDate || getTodayIsoDate()).split('-');
    const [hour, min] = (bookingData.time || '15:30').split(':');
    const gCalStart = `${year}${month}${day}T${hour}${min}00`;
    const endHour = String(parseInt(hour, 10) + 1).padStart(2, '0');
    const gCalEnd = `${year}${month}${day}T${endHour}${min}00`;
    const gCalDates = `${gCalStart}/${gCalEnd}`;

    const gCalTitle = encodeURIComponent(`Seu Dito Barbearia - ${bookingData.service}`);
    const gCalDetails = encodeURIComponent(`Agendamento confirmado na Seu Dito Barbearia & Club.\nServiço: ${bookingData.service}\nBarbeiro: ${bookingData.barber}\nCódigo de Reserva: ${bookingData.code}\nData: ${bookingData.date}\nHorário: ${bookingData.time}\nUnidade: ${bookingData.unit}`);
    const gCalLocation = encodeURIComponent(bookingData.unit + ", Americana - SP");
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${gCalTitle}&dates=${gCalDates}&details=${gCalDetails}&location=${gCalLocation}`;

    const cleanPhone = (bookingData.clientPhone || '19998765432').replace(/\D/g, '');
    const waMsg = encodeURIComponent(`*Confirmação de Agendamento - Seu Dito Barbearia & Club*\n\nOlá, ${bookingData.clientName || 'Cliente'}! Seu horário está confirmado.\n\n📍 *Unidade:* ${bookingData.unit}\n💈 *Serviço:* ${bookingData.service}\n✂️ *Barbeiro:* ${bookingData.barber}\n📅 *Data/Hora:* ${bookingData.date} às ${bookingData.time}\n🔑 *Código da Reserva:* ${bookingData.code}\n\nTe esperamos com café passado na hora e atendimento de primeira!`);
    const waUrl = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${waMsg}`;

    body.innerHTML = `
      <div class="text-center py-2 space-y-3">
        <img 
          src="img/logo.png" 
          onerror="onLogoImgError(this)" 
          alt="Logo Seu Dito Barber Club" 
          class="h-11 sm:h-12 w-auto max-w-[200px] mx-auto object-contain filter drop-shadow-[0_2px_10px_rgba(217,163,66,0.3)] mb-1" 
        />
        <div class="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500 flex items-center justify-center mx-auto text-xl font-bold shadow-lg">
          ✓
        </div>
        
        <div class="space-y-1">
          <span class="inline-block px-3 py-1 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/30 text-xs font-mono font-bold tracking-widest">
            CÓDIGO: ${bookingData.code}
          </span>
          <h3 class="font-serif font-bold text-xl sm:text-2xl text-white">Seu horário está garantido!</h3>
          <p class="text-neutral-400 text-xs">
            Reserva salva no sistema para <strong>${bookingData.clientName || 'Cliente'}</strong>.
          </p>
        </div>

        <div class="p-4 rounded-xl bg-obsidian-850 border border-obsidian-750 text-left text-xs space-y-2">
          <div class="flex justify-between"><span class="text-neutral-400">Unidade:</span><span class="text-white font-semibold">${bookingData.unit}</span></div>
          <div class="flex justify-between"><span class="text-neutral-400">Barbeiro Escolhido:</span><span class="text-gold-300 font-semibold">${bookingData.barber}</span></div>
          <div class="flex justify-between"><span class="text-neutral-400">Serviço:</span><span class="text-white font-semibold">${bookingData.service}</span></div>
          <div class="flex justify-between"><span class="text-neutral-400">Data & Hora:</span><span class="text-white font-semibold">${bookingData.date} às ${bookingData.time}</span></div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <a href="${gCalUrl}" target="_blank" class="py-3 px-4 rounded-xl bg-obsidian-800 hover:bg-obsidian-750 text-white text-xs font-semibold border border-obsidian-700 flex items-center justify-center gap-2 transition hover:border-gold-500">
            <i data-lucide="calendar-plus" class="w-4 h-4 text-gold-400"></i>
            Salvar no Google Agenda
          </a>
          <a href="${waUrl}" target="_blank" class="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-lg">
            <i data-lucide="message-circle" class="w-4 h-4"></i>
            Enviar no WhatsApp
          </a>
        </div>
      </div>
    `;
  }

  if (window.lucide) window.lucide.createIcons();
}

function selectUnit(unitName) {
  bookingData.unit = unitName;
  bookingData.time = "";
  nextBookingStep();
}

function selectService(name, price) {
  bookingData.service = name;
  bookingData.price = price;
  nextBookingStep();
}

function selectBarber(barberName) {
  bookingData.barber = barberName;
  bookingData.time = "";
  nextBookingStep();
}

function selectTime(timeStr) {
  loadSystemDataFromStorage();

  const matchedBarber = barbers.find(b => b.name === bookingData.barber || b.id === bookingData.barber) || barbers[0];
  const barberId = matchedBarber ? matchedBarber.id : 'dito';
  const appDate = bookingData.selectedDate || getTodayIsoDate();
  const reqDuration = getServiceDurationInMinutes(bookingData.service);
  const check = checkSlotAvailability(barberId, appDate, timeStr, reqDuration);
  if (!check.available) {
    showToast(check.label || "Esse horário não está mais disponível. Por favor, escolha outro.", "warning");
    renderBookingStep();
    return;
  }
  bookingData.time = timeStr;
  nextBookingStep();
}

function nextBookingStep() {
  if (currentStep === 4) {
    if (!bookingData.time) {
      showToast("Por favor, selecione um horário disponível na grade para avançar.", "warning");
      return;
    }
    loadSystemDataFromStorage();
    const matchedBarber = barbers.find(b => b.name === bookingData.barber || b.id === bookingData.barber) || barbers[0];
    const barberId = matchedBarber ? matchedBarber.id : 'dito';
    const appDate = bookingData.selectedDate || getTodayIsoDate();
    const reqDuration = getServiceDurationInMinutes(bookingData.service);
    const check = checkSlotAvailability(barberId, appDate, bookingData.time, reqDuration);
    if (!check.available) {
      bookingData.time = "";
      showToast(check.label || "Esse horário não está mais disponível. Por favor, escolha outro.", "warning");
      renderBookingStep();
      return;
    }
  }

  if (currentStep === 5) {
    const nameInput = document.getElementById('custName');
    const phoneInput = document.getElementById('custPhone');
    if (nameInput) bookingData.clientName = nameInput.value.trim();
    if (phoneInput) bookingData.clientPhone = phoneInput.value.trim();

    if (!bookingData.clientName) {
      alert("Por favor, digite seu nome completo.");
      return;
    }

    if (!bookingData.time) {
      alert("Por favor, selecione um horário disponível.");
      currentStep = 4;
      renderBookingStep();
      return;
    }

    loadSystemDataFromStorage();

    const matchedBarber = barbers.find(b => b.name === bookingData.barber || b.id === bookingData.barber) || barbers[0];
    const barberId = matchedBarber ? matchedBarber.id : 'dito';
    const barberName = matchedBarber ? matchedBarber.name : bookingData.barber;
    const appDate = bookingData.selectedDate || getTodayIsoDate();
    const reqDuration = getServiceDurationInMinutes(bookingData.service);

    const check = checkSlotAvailability(barberId, appDate, bookingData.time, reqDuration);
    if (!check.available) {
      alert("Esse horário acabou de ser reservado ou não está mais disponível. Por favor, escolha outro horário.");
      bookingData.time = "";
      currentStep = 4;
      renderBookingStep();
      return;
    }

    const alreadyBooked = appointments.some(a => {
      if (!a.status || a.status === 'cancelado' || a.status === 'livre') return false;
      const aDate = a.date || getTodayIsoDate();
      if (aDate !== appDate) return false;
      const aBarberId = a.barberId || (barbers.find(b => b.name === a.barber || b.name === a.barberName) || {}).id;
      const matches = (aBarberId === barberId || a.barberId === barberId || a.barber === barberName || a.barberName === barberName);
      return matches && a.time === bookingData.time;
    });

    if (alreadyBooked) {
      alert("Esse horário já foi reservado para este barbeiro. Por favor, escolha outro horário.");
      bookingData.time = "";
      currentStep = 4;
      renderBookingStep();
      return;
    }

    const commissionVal = calculateAppointmentCommission(matchedBarber, {
      service: bookingData.service,
      price: bookingData.isClub ? 0 : bookingData.price,
      isClub: bookingData.isClub
    });

    const newBookingAppointment = {
      id: 'client-app-' + Date.now(),
      date: appDate,
      time: bookingData.time,
      barberId: barberId,
      barber: barberName,
      barberName: barberName,
      client: bookingData.clientName + (bookingData.isClub ? ' (Clube)' : ''),
      clientPhone: bookingData.clientPhone,
      service: bookingData.service,
      durationMinutes: reqDuration,
      price: bookingData.isClub ? 0 : bookingData.price,
      commission: commissionVal,
      paymentMethod: bookingData.isClub ? 'clube' : 'pix',
      status: 'confirmado',
      isClub: bookingData.isClub,
      clubMemberId: bookingData.clubMember ? bookingData.clubMember.id : null,
      clubPlanName: bookingData.clubMember ? bookingData.clubMember.planName : null
    };

    appointments.push(newBookingAppointment);

    const cleanPhone = normalizePhone(bookingData.clientPhone);
    let matchedClient = null;
    if (cleanPhone && cleanPhone.length >= 8) {
      matchedClient = clients.find(c => normalizePhone(c.phone) === cleanPhone);
    }
    if (!matchedClient && bookingData.clientName) {
      matchedClient = clients.find(c => c.name.toLowerCase().includes(bookingData.clientName.toLowerCase()));
    }
    if (matchedClient) {
      if (!matchedClient.favBarberId && matchedBarber) {
        matchedClient.favBarberId = matchedBarber.id;
        matchedClient.favBarberName = matchedBarber.name;
      }
      if (bookingData.isClub) {
        matchedClient.isClub = true;
        if (bookingData.clubMember && bookingData.clubMember.planName) {
          matchedClient.clubPlanName = bookingData.clubMember.planName;
        }
      }
    } else {
      clients.push({
        id: 'cli-' + Date.now(),
        name: bookingData.clientName,
        phone: cleanPhone || '19999990000',
        email: '',
        favBarberId: matchedBarber ? matchedBarber.id : 'dito',
        favBarberName: matchedBarber ? matchedBarber.name : 'Dito Mestre',
        isClub: bookingData.isClub,
        clubPlanName: bookingData.clubMember ? bookingData.clubMember.planName : null,
        totalVisits: 1,
        totalSpent: bookingData.isClub ? 0 : bookingData.price,
        lastVisitDate: appDate,
        noShowsCount: 0,
        segment: bookingData.isClub ? 'assinante' : 'novos',
        notes: 'Cliente cadastrado via agendamento online.'
      });
    }

    saveSystemDataToStorage();
    broadcastSystemSync('agenda_update', { action: 'book', app: newBookingAppointment });
  }

  if (currentStep >= 6) {
    closeBookingModal();
    showToast("Agendamento concluído e salvo com sucesso!", "success");
    return;
  }

  currentStep++;
  renderBookingStep();
}

function prevBookingStep() {
  if (currentStep > 1) {
    currentStep--;
    renderBookingStep();
  }
}
