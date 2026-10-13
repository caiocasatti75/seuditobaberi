const STORAGE_KEY_SERVICES = "SEU_DITO_SERVICES_v1";
const STORAGE_KEY_USERS = "SEU_DITO_USERS_v1";
const STORAGE_KEY_BARBERS = "SEU_DITO_BARBERS_v1";
const STORAGE_KEY_APPOINTMENTS = "SEU_DITO_APPOINTMENTS_v1";
const STORAGE_KEY_SESSION = "SEU_DITO_SESSION_v1";
const STORAGE_KEY_MEMBERS = "SEU_DITO_MEMBERS_v1";
const STORAGE_KEY_CLIENTS = "SEU_DITO_CLIENTS_v1";
const STORAGE_KEY_INVENTORY = "SEU_DITO_INVENTORY_v1";
const STORAGE_KEY_STOCK_LOGS = "SEU_DITO_STOCK_LOGS_v1";
const STORAGE_KEY_PRODUCT_SALES = "SEU_DITO_PRODUCT_SALES_v1";
const STORAGE_KEY_PLANS = "SEU_DITO_PLANS_v1";

const OFFICIAL_LOGO_SRC = 'img/logo.png';
const OFFICIAL_AMBIENTE_SRC = 'img/barbearia_ambiente.png';
const OFFICIAL_CORTE_SRC = 'img/corte_atendimento.png';
const OFFICIAL_EQUIPE_SRC = 'img/equipe_barbearia.png';
const OFFICIAL_TERRAMERICA_SRC = 'img/unidade_terramerica.png';
const OFFICIAL_PAULISTA_SRC = 'img/unidade_paulista.png';
const OFFICIAL_CARMINE_SRC = 'img/unidade_carmine_feola.png';

function onImgErrorFallback(img, type) {
  if (!img) return;
  const fallbacks = {
    terramerica: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80',
    paulista: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    carmine: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=800&q=80',
    ambiente: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=1200&q=80',
    corte: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80',
    equipe: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80',
    logo: 'img/logo.png'
  };
  img.onerror = null;
  img.src = fallbacks[type] || fallbacks.ambiente;
}

function onLogoImgError(img) {
  if (!img) return;
  img.onerror = null;
  img.src = 'img/logo.png';
}

const DEFAULT_INITIAL_SERVICES = [
  { id: "srv-corte", name: "Corte Seu Dito Premium", category: "cabelo", price: 55, duration: 35, commissionType: "percent", commissionValue: 50, description: "Degradê fade preciso ou tesoura clássica, lavagem refrescante e café cortesia." },
  { id: "srv-barba", name: "Barboterapia Toalha Quente", category: "barba", price: 50, duration: 35, commissionType: "percent", commissionValue: 50, description: "Esfoliação facial, duas toalhas quentes com eucalipto, navalha e pós-barba." },
  { id: "srv-combo", name: "Combo Mestre (Cabelo + Barba)", category: "combo", price: 95, duration: 60, commissionType: "percent", commissionValue: 50, isCombo: true, perks: ["Toalha Quente", "Corte Estilizado", "Alinhamento Sobrancelha"], description: "Tratamento VIP completo: cabelo, barba desenhada e alinhamento facial." },
  { id: "srv-pigmentacao", name: "Pigmentação Barba ou Cabelo", category: "barba", price: 45, duration: 30, commissionType: "percent", commissionValue: 40, description: "Correção de falhas e disfarce de fios brancos sem amônia." },
  { id: "srv-hidratacao", name: "Hidratação & Ozonioterapia", category: "tratamento", price: 60, duration: 30, commissionType: "percent", commissionValue: 40, description: "Vapor de ozônio e máscara reconstrutora para couro cabeludo." },
  { id: "srv-pezinho", name: "Pezinho & Acabamento Navalha", category: "cabelo", price: 30, duration: 20, commissionType: "fixed", commissionValue: 15, description: "Alinhamento do contorno do cabelo e costeletas com navalha afiada." }
];

const DEFAULT_INITIAL_BARBERS = [
  {
    id: "dito",
    name: "Dito Mestre",
    role: "Master Barber & Visagista",
    phone: "(19) 99876-1201",
    unit: "Unidade Paulista (Matriz)",
    rating: "5.0",
    active: true,
    avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=160&q=80",
    goals: { daily: 10, weekly: 50, monthly: 200 },
    commissions: {
      "Corte Seu Dito Premium": { type: "percent", value: 50 },
      "Barboterapia Toalha Quente": { type: "percent", value: 50 },
      "Combo Mestre (Cabelo + Barba)": { type: "percent", value: 50 },
      "Pigmentação Barba ou Cabelo": { type: "percent", value: 50 },
      "Hidratação & Ozonioterapia": { type: "percent", value: 40 },
      "Pezinho & Acabamento Navalha": { type: "percent", value: 50 }
    },
    productCommissionPercent: 10
  },
  {
    id: "caio",
    name: "Caio Silva",
    role: "Especialista Fade & Degradê",
    phone: "(19) 99876-1202",
    unit: "Unidade Paulista (Matriz)",
    rating: "4.9",
    active: true,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
    goals: { daily: 8, weekly: 40, monthly: 160 },
    commissions: {
      "Corte Seu Dito Premium": { type: "percent", value: 50 },
      "Barboterapia Toalha Quente": { type: "percent", value: 50 },
      "Combo Mestre (Cabelo + Barba)": { type: "percent", value: 50 },
      "Pigmentação Barba ou Cabelo": { type: "percent", value: 45 },
      "Hidratação & Ozonioterapia": { type: "percent", value: 40 },
      "Pezinho & Acabamento Navalha": { type: "percent", value: 50 }
    },
    productCommissionPercent: 10
  },
  {
    id: "lucas",
    name: "Lucas Duarte",
    role: "Barba Terapia Clássica",
    phone: "(19) 99876-1203",
    unit: "Unidade Carmine Feola",
    rating: "4.9",
    active: true,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
    goals: { daily: 8, weekly: 40, monthly: 160 },
    commissions: {
      "Corte Seu Dito Premium": { type: "percent", value: 45 },
      "Barboterapia Toalha Quente": { type: "percent", value: 50 },
      "Combo Mestre (Cabelo + Barba)": { type: "percent", value: 50 },
      "Pigmentação Barba ou Cabelo": { type: "percent", value: 40 },
      "Hidratação & Ozonioterapia": { type: "percent", value: 40 },
      "Pezinho & Acabamento Navalha": { type: "percent", value: 45 }
    },
    productCommissionPercent: 8
  },
  {
    id: "matheus",
    name: "Matheus Santos",
    role: "Visagismo Moderno & Texturas",
    phone: "(19) 99876-1204",
    unit: "Unidade Terramérica",
    rating: "4.8",
    active: true,
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=160&q=80",
    goals: { daily: 8, weekly: 40, monthly: 160 },
    commissions: {
      "Corte Seu Dito Premium": { type: "percent", value: 45 },
      "Barboterapia Toalha Quente": { type: "percent", value: 45 },
      "Combo Mestre (Cabelo + Barba)": { type: "percent", value: 48 },
      "Pigmentação Barba ou Cabelo": { type: "percent", value: 40 },
      "Hidratação & Ozonioterapia": { type: "percent", value: 40 },
      "Pezinho & Acabamento Navalha": { type: "percent", value: 45 }
    },
    productCommissionPercent: 10
  }
];

const DEFAULT_INITIAL_USERS = [
  { username: "admin", password: "1234", passwordHash: "1234", role: "admin", name: "Administrador Geral" },
  { username: "caio", password: "12345", passwordHash: "12345", role: "barbeiro", barberId: "caio", name: "Caio Silva" },
  { username: "dito", password: "12345", passwordHash: "12345", role: "barbeiro", barberId: "dito", name: "Dito Mestre" },
  { username: "lucas", password: "12345", passwordHash: "12345", role: "barbeiro", barberId: "lucas", name: "Lucas Duarte" },
  { username: "matheus", password: "12345", passwordHash: "12345", role: "barbeiro", barberId: "matheus", name: "Matheus Santos" }
];

const CLUB_PLANS_CATALOG = [
  {
    id: "corte-club",
    name: "Corte Club",
    price: 79.90,
    interval: "mensal",
    badge: "Plano Essencial",
    includedServices: ["Corte Seu Dito Premium", "Pezinho & Acabamento Navalha"],
    discountProducts: 5
  },
  {
    id: "cabelo-barba-club",
    name: "Cabelo & Barba Club",
    price: 99.90,
    interval: "mensal",
    badge: "Mais Vendido em Americana",
    includedServices: ["Corte Seu Dito Premium", "Barboterapia Toalha Quente", "Combo Mestre (Cabelo + Barba)", "Pezinho & Acabamento Navalha"],
    discountProducts: 10
  },
  {
    id: "black-master-club",
    name: "Black Master Club",
    price: 149.90,
    interval: "mensal",
    badge: "Master VIP",
    includedServices: ["Corte Seu Dito Premium", "Barboterapia Toalha Quente", "Combo Mestre (Cabelo + Barba)", "Pigmentação Barba ou Cabelo", "Hidratação & Ozonioterapia", "Pezinho & Acabamento Navalha"],
    discountProducts: 15
  }
];

const DEFAULT_INITIAL_MEMBERS = [
  {
    id: "mem-001",
    name: "Rodrigo Alcantara",
    phone: "(19) 99123-4567",
    email: "rodrigo.alcantara@gmail.com",
    planId: "cabelo-barba-club",
    planName: "Cabelo & Barba Club",
    status: "ativo",
    startDate: "2026-01-15",
    expiryDate: "2026-11-15",
    includedServices: ["Corte Seu Dito Premium", "Barboterapia Toalha Quente", "Combo Mestre (Cabelo + Barba)", "Pezinho & Acabamento Navalha"]
  },
  {
    id: "mem-002",
    name: "Fernando Guimarães",
    phone: "(19) 98765-4321",
    email: "fernando.gui@hotmail.com",
    planId: "corte-club",
    planName: "Corte Club",
    status: "ativo",
    startDate: "2026-02-01",
    expiryDate: "2026-12-01",
    includedServices: ["Corte Seu Dito Premium", "Pezinho & Acabamento Navalha"]
  },
  {
    id: "mem-003",
    name: "Marcelo Pires",
    phone: "(19) 99345-6789",
    email: "marcelo.pires@empresa.com.br",
    planId: "black-master-club",
    planName: "Black Master Club",
    status: "ativo",
    startDate: "2026-03-10",
    expiryDate: "2026-11-10",
    includedServices: ["Corte Seu Dito Premium", "Barboterapia Toalha Quente", "Combo Mestre (Cabelo + Barba)", "Pigmentação Barba ou Cabelo", "Hidratação & Ozonioterapia", "Pezinho & Acabamento Navalha"]
  }
];

const DEFAULT_INITIAL_INVENTORY = [
  { id: "prod-pomada-matte", name: "Pomada Modeladora Efeito Matte 100g", category: "pomadas", costPrice: 22.00, salePrice: 48.00, currentStock: 18, minStock: 5 },
  { id: "prod-oleo-barba", name: "Óleo para Barba Amadeirado 30ml", category: "barba", costPrice: 18.00, salePrice: 42.00, currentStock: 14, minStock: 4 },
  { id: "prod-balm-barba", name: "Balm Hidratante Efeito Refrescante 120ml", category: "barba", costPrice: 19.50, salePrice: 45.00, currentStock: 12, minStock: 4 },
  { id: "prod-shampoo-mentol", name: "Shampoo Mentolado Ice Refresh 250ml", category: "shampoos", costPrice: 16.00, salePrice: 38.00, currentStock: 8, minStock: 5 },
  { id: "prod-tonico-crescimento", name: "Tônico Fortalecedor Capilar 100ml", category: "tratamento", costPrice: 28.00, salePrice: 65.00, currentStock: 3, minStock: 5 }
];

const DEFAULT_INITIAL_CLIENTS = [
  { id: "cli-1", name: "Rodrigo Alcantara", phone: "19991234567", email: "rodrigo.alcantara@gmail.com", favBarberId: "dito", favBarberName: "Dito Mestre", isClub: true, clubPlanName: "Cabelo & Barba Club", totalVisits: 8, totalSpent: 799.20, lastVisitDate: "2026-10-10", noShowsCount: 0, segment: "assinante", notes: "Assinante fiel do plano Ouro." },
  { id: "cli-2", name: "Fernando Guimarães", phone: "19987654321", email: "fernando.gui@hotmail.com", favBarberId: "caio", favBarberName: "Caio Silva", isClub: true, clubPlanName: "Corte Club", totalVisits: 5, totalSpent: 399.50, lastVisitDate: "2026-10-08", noShowsCount: 0, segment: "assinante", notes: "Prefere degradê navalhado." },
  { id: "cli-3", name: "Gustavo Henrique", phone: "19997112233", email: "", favBarberId: "dito", favBarberName: "Dito Mestre", isClub: false, clubPlanName: null, totalVisits: 4, totalSpent: 280.00, lastVisitDate: "2026-10-05", noShowsCount: 0, segment: "recorrente", notes: "Cliente avulso frequente." }
];

function generateInitialAppointments(todayIso) {
  return [
    { id: "app-101", date: todayIso, time: "09:00", barberId: "dito", client: "Rodrigo Alcantara (Clube)", clientPhone: "(19) 99123-4567", service: "Combo Mestre (Cabelo + Barba)", price: 0, commission: 47.50, paymentMethod: "clube", status: "concluido", isClub: true, clubPlanName: "Cabelo & Barba Club" },
    { id: "app-102", date: todayIso, time: "09:45", barberId: "dito", client: "Gustavo Henrique", clientPhone: "(19) 99711-2233", service: "Corte Seu Dito Premium", price: 55, commission: 27.50, paymentMethod: "pix", status: "confirmado", isClub: false },
    { id: "app-103", date: todayIso, time: "10:30", barberId: "dito", client: "Bruno Ferreira", clientPhone: "(19) 99888-4455", service: "Barboterapia Toalha Quente", price: 50, commission: 25.00, paymentMethod: "cartao", status: "confirmado", isClub: false },
    { id: "app-104", date: todayIso, time: "09:00", barberId: "caio", client: "Fernando Guimarães (Clube)", clientPhone: "(19) 98765-4321", service: "Corte Seu Dito Premium", price: 0, commission: 27.50, paymentMethod: "clube", status: "concluido", isClub: true, clubPlanName: "Corte Club" },
    { id: "app-105", date: todayIso, time: "10:30", barberId: "caio", client: "Vinicius Prado", clientPhone: "(19) 99112-3344", service: "Combo Mestre (Cabelo + Barba)", price: 95, commission: 47.50, paymentMethod: "dinheiro", status: "confirmado", isClub: false }
  ];
}

let services = [];
let systemUsers = [];
let barbers = [];
let appointments = [];
let clubMembers = [];
let clients = [];
let inventory = [];
let stockLogs = [];
let productSales = [];
let clubPlans = [];
let currentUser = null;

let syncChannel = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    syncChannel = new BroadcastChannel('seu_dito_system_sync');
    syncChannel.onmessage = (event) => {
      if (event && event.data) {
        loadSystemDataFromStorage();
        if (typeof window.onSystemSyncReceived === 'function') {
          window.onSystemSyncReceived(event.data);
        }
      }
    };
  }
} catch (e) {}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if ([STORAGE_KEY_APPOINTMENTS, STORAGE_KEY_BARBERS, STORAGE_KEY_SERVICES, STORAGE_KEY_INVENTORY, STORAGE_KEY_MEMBERS, STORAGE_KEY_CLIENTS, STORAGE_KEY_PLANS].includes(e.key)) {
      loadSystemDataFromStorage();
    }
  });
}

function broadcastSystemSync(type, data) {
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type, data, timestamp: Date.now() });
    } catch (e) {}
  }
}

function loadSystemDataFromStorage() {
  const todayIso = getTodayIsoDate();

  const srvJson = localStorage.getItem(STORAGE_KEY_SERVICES);
  services = srvJson ? JSON.parse(srvJson) : JSON.parse(JSON.stringify(DEFAULT_INITIAL_SERVICES));

  const bJson = localStorage.getItem(STORAGE_KEY_BARBERS);
  barbers = bJson ? JSON.parse(bJson) : JSON.parse(JSON.stringify(DEFAULT_INITIAL_BARBERS));

  const uJson = localStorage.getItem(STORAGE_KEY_USERS);
  try {
    const parsed = uJson ? JSON.parse(uJson) : null;
    if (Array.isArray(parsed)) {
      systemUsers = parsed;
    } else if (parsed && typeof parsed === 'object') {
      systemUsers = Object.values(parsed);
    } else {
      systemUsers = JSON.parse(JSON.stringify(DEFAULT_INITIAL_USERS));
    }
  } catch(e) {
    systemUsers = JSON.parse(JSON.stringify(DEFAULT_INITIAL_USERS));
  }
  if (!Array.isArray(systemUsers) || systemUsers.length === 0) {
    systemUsers = JSON.parse(JSON.stringify(DEFAULT_INITIAL_USERS));
  }
  if (!systemUsers.some(u => u && u.username && u.username.toLowerCase() === 'admin')) {
    systemUsers.push({ username: "admin", password: "1234", passwordHash: "1234", role: "admin", name: "Administrador Geral" });
  }
  if (!systemUsers.some(u => u && u.username && u.username.toLowerCase() === 'caio')) {
    systemUsers.push({ username: "caio", password: "12345", passwordHash: "12345", role: "barbeiro", barberId: "caio", name: "Caio Silva" });
  }

  const mJson = localStorage.getItem(STORAGE_KEY_MEMBERS);
  clubMembers = mJson ? JSON.parse(mJson) : JSON.parse(JSON.stringify(DEFAULT_INITIAL_MEMBERS));

  const aJson = localStorage.getItem(STORAGE_KEY_APPOINTMENTS);
  appointments = aJson ? JSON.parse(aJson) : generateInitialAppointments(todayIso);

  const cJson = localStorage.getItem(STORAGE_KEY_CLIENTS);
  clients = cJson ? JSON.parse(cJson) : JSON.parse(JSON.stringify(DEFAULT_INITIAL_CLIENTS));

  const iJson = localStorage.getItem(STORAGE_KEY_INVENTORY);
  inventory = iJson ? JSON.parse(iJson) : JSON.parse(JSON.stringify(DEFAULT_INITIAL_INVENTORY));

  const slJson = localStorage.getItem(STORAGE_KEY_STOCK_LOGS);
  stockLogs = slJson ? JSON.parse(slJson) : [];

  const psJson = localStorage.getItem(STORAGE_KEY_PRODUCT_SALES);
  productSales = psJson ? JSON.parse(psJson) : [];

  const plJson = localStorage.getItem(STORAGE_KEY_PLANS);
  clubPlans = plJson ? JSON.parse(plJson) : JSON.parse(JSON.stringify(CLUB_PLANS_CATALOG));

  const sessJson = localStorage.getItem(STORAGE_KEY_SESSION);
  currentUser = sessJson ? JSON.parse(sessJson) : null;
}

function saveSystemDataToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(services));
    localStorage.setItem(STORAGE_KEY_BARBERS, JSON.stringify(barbers));
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(systemUsers));
    localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(clubMembers));
    localStorage.setItem(STORAGE_KEY_APPOINTMENTS, JSON.stringify(appointments));
    localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(clients));
    localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(inventory));
    localStorage.setItem(STORAGE_KEY_STOCK_LOGS, JSON.stringify(stockLogs));
    localStorage.setItem(STORAGE_KEY_PRODUCT_SALES, JSON.stringify(productSales));
    localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(clubPlans));
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    }
  } catch (err) {}
}

function getTodayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDatePtBr(isoDate) {
  if (!isoDate) return "";
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dayOfWeek = daysOfWeek[d.getDay()];
  const dayStr = parts[2];
  const monthStr = parts[1];

  const todayIso = getTodayIsoDate();
  if (isoDate === todayIso) return `Hoje (${dayStr}/${monthStr})`;
  return `${dayOfWeek}, ${dayStr}/${monthStr}`;
}

function formatFullDateHeader(isoDate) {
  if (!isoDate) return "";
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${daysOfWeek[d.getDay()]}, ${parts[2]} de ${months[d.getMonth()]} de ${parts[0]}`;
}

function getQuickDateOptions() {
  const options = [];
  const todayIso = getTodayIsoDate();
  const parts = todayIso.split('-');
  const baseDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const daysShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  for (let i = 0; i < 6; i++) {
    const cur = new Date(baseDate);
    cur.setDate(baseDate.getDate() + i);
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${d}`;
    let label = `${daysShort[cur.getDay()]} (${d}/${m})`;
    if (i === 0) label = `Hoje (${d}/${m})`;
    else if (i === 1) label = `Amanhã (${d}/${m})`;
    options.push({ iso, label });
  }
  return options;
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
}

function minutesToTime(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function getServiceDurationInMinutes(serviceName) {
  const s = services.find(x => x.name === serviceName);
  return s && s.duration ? s.duration : 45;
}

function isShopClosedOnDate(dateIso) {
  if (!dateIso) return false;
  const parts = dateIso.split('-');
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return d.getDay() === 0;
}

function checkSlotAvailability(barberId, targetDate, reqTime, durationMinutes = 45) {
  const todayIso = getTodayIsoDate();
  const effectiveTargetDate = targetDate || todayIso;
  const reqStart = timeToMinutes(reqTime);
  const reqEnd = reqStart + durationMinutes;

  if (isShopClosedOnDate(effectiveTargetDate)) {
    return { available: false, reason: 'fechado', label: 'Fechado (Domingo)' };
  }

  const lunchStart = 12 * 60;
  const lunchEnd = 13 * 60 + 30;
  if ((reqStart >= lunchStart && reqStart < lunchEnd) || (reqStart < lunchStart && reqEnd > lunchStart)) {
    return { available: false, reason: 'almoco', label: 'Almoço da Equipe' };
  }

  const closingTime = 19 * 60 + 30;
  if (reqEnd > closingTime) {
    return { available: false, reason: 'expirado', label: 'Após Encerramento' };
  }

  if (effectiveTargetDate === todayIso) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    if (reqStart <= currentMinutes + 10) {
      return { available: false, reason: 'passado', label: 'Horário Passou' };
    }
  }

  const foundBarber = barbers.find(b => b.id === barberId || b.name === barberId);
  const targetBarberId = foundBarber ? foundBarber.id : barberId;
  const targetBarberName = foundBarber ? foundBarber.name : '';

  const conflicting = appointments.find(a => {
    if (!a.status || a.status === 'cancelado' || a.status === 'livre') return false;
    const aDate = a.date || todayIso;
    if (aDate !== effectiveTargetDate) return false;

    const aBarberId = a.barberId || (barbers.find(b => b.name === a.barber || b.name === a.barberName) || {}).id;
    const matchesBarber = (
      aBarberId === targetBarberId || 
      a.barberId === targetBarberId || 
      (targetBarberName && (a.barber === targetBarberName || a.barberName === targetBarberName))
    );
    if (!matchesBarber) return false;

    if (a.time === reqTime) return true;

    const aStart = timeToMinutes(a.time);
    const aDur = a.durationMinutes || getServiceDurationInMinutes(a.service) || 45;
    const aEnd = aStart + aDur;
    return (reqStart < aEnd && reqEnd > aStart);
  });

  if (conflicting) {
    return { available: false, reason: 'ocupado', label: `Ocupado (${conflicting.client || 'Reservado'})` };
  }

  return { available: true, reason: 'livre', label: 'Disponível' };
}

function isSlotOccupiedForBarber(barberId, targetDate, timeStr, duration = 45) {
  const check = checkSlotAvailability(barberId, targetDate, timeStr, duration);
  return !check.available;
}

function normalizePhone(phoneStr) {
  return (phoneStr || '').replace(/\D/g, '');
}

function formatPhoneDisplay(phoneStr) {
  const clean = normalizePhone(phoneStr);
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return phoneStr || "";
}

function checkMemberActiveStatus(member) {
  if (!member) return { isActive: false, label: 'Não encontrado' };
  if (member.status === 'bloqueado') return { isActive: false, label: 'Bloqueado' };
  if (member.status === 'cancelado') return { isActive: false, label: 'Cancelado' };
  const todayIso = getTodayIsoDate();
  if (member.expiryDate && member.expiryDate < todayIso) {
    return { isActive: false, label: 'Expirado' };
  }
  return { isActive: true, label: 'Ativo' };
}

function findMemberByPhoneOrName(query) {
  if (!query) return null;
  const clean = normalizePhone(query);
  if (clean.length >= 8) {
    const byPhone = clubMembers.find(m => normalizePhone(m.phone).includes(clean) || clean.includes(normalizePhone(m.phone)));
    if (byPhone) return byPhone;
  }
  const qLower = query.toLowerCase().trim();
  return clubMembers.find(m => m.name.toLowerCase().includes(qLower));
}

function calculateAppointmentCommission(barber, app) {
  if (!barber || !app) return 0;
  const srv = services.find(s => s.name === app.service);
  const basePrice = app.isClub ? (srv ? srv.price : 55) : (app.price || (srv ? srv.price : 55));
  const config = (barber.commissions && barber.commissions[app.service]) || (srv && { type: srv.commissionType, value: srv.commissionValue }) || { type: 'percent', value: 50 };

  if (config.type === 'fixed') {
    return Number(config.value) || 0;
  }
  const pct = Number(config.value) || 50;
  return Number(((basePrice * pct) / 100).toFixed(2));
}

function showToast(message, type = "success") {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;
  const inner = document.getElementById('toastInner');
  const msg = document.getElementById('toastMessage');
  const icon = document.getElementById('toastIcon');

  if (msg) msg.textContent = message;

  if (inner) {
    if (type === 'error') {
      inner.className = "flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold backdrop-blur-md bg-rose-950/90 border-rose-500/60 text-rose-200";
      if (icon) icon.setAttribute('data-lucide', 'alert-circle');
    } else if (type === 'warning') {
      inner.className = "flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold backdrop-blur-md bg-amber-950/90 border-amber-500/60 text-amber-200";
      if (icon) icon.setAttribute('data-lucide', 'alert-triangle');
    } else if (type === 'info') {
      inner.className = "flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold backdrop-blur-md bg-obsidian-850/95 border-gold-500/50 text-gold-300";
      if (icon) icon.setAttribute('data-lucide', 'info');
    } else {
      inner.className = "flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold backdrop-blur-md bg-emerald-950/90 border-emerald-500/60 text-emerald-200";
      if (icon) icon.setAttribute('data-lucide', 'check-circle');
    }
  }

  if (window.lucide) window.lucide.createIcons();
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.remove('translate-y-5', 'opacity-0');
  }, 30);

  setTimeout(() => {
    toast.classList.add('translate-y-5', 'opacity-0');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 3500);
}

loadSystemDataFromStorage();
