function getCurrentUser() {
  if (!currentUser) {
    const sessJson = localStorage.getItem(STORAGE_KEY_SESSION);
    currentUser = sessJson ? JSON.parse(sessJson) : null;
  }
  return currentUser;
}

function isAdmin() {
  const u = getCurrentUser();
  return u && u.role === 'admin';
}

function isBarber() {
  const u = getCurrentUser();
  return u && u.role === 'barbeiro';
}

function getLoggedInBarberId() {
  const u = getCurrentUser();
  return (u && u.barberId) ? u.barberId : null;
}

function quickFillLogin(user, pass) {
  const userInput = document.getElementById('adminUsername') || document.getElementById('loginUsername');
  const passInput = document.getElementById('adminPassword') || document.getElementById('loginPassword');
  if (userInput) userInput.value = user;
  if (passInput) passInput.value = pass;
  submitLogin();
}

function submitLogin(event) {
  if (event) event.preventDefault();

  const userInput = document.getElementById('adminUsername') || document.getElementById('loginUsername');
  const passInput = document.getElementById('adminPassword') || document.getElementById('loginPassword');
  const errBox = document.getElementById('loginErrorMessage');
  const cardBox = document.getElementById('adminLoginCard');

  if (!userInput || !passInput) return;

  const username = userInput.value.trim().toLowerCase();
  const password = passInput.value.trim();

  loadSystemDataFromStorage();

  let matchedUser = null;

  if (username === 'admin' && (password === '1234' || password === 'admin')) {
    matchedUser = {
      username: 'admin',
      role: 'admin',
      name: 'Administrador Geral'
    };
  } else if (username === 'caio' && (password === '12345' || password === '1234')) {
    matchedUser = {
      username: 'caio',
      role: 'barbeiro',
      barberId: 'caio',
      name: 'Caio Silva'
    };
  } else {
    let list = Array.isArray(systemUsers) ? systemUsers : (systemUsers && typeof systemUsers === 'object' ? Object.values(systemUsers) : []);
    matchedUser = list.find(u => 
      u && u.username && u.username.toLowerCase() === username && 
      (u.passwordHash === password || u.password === password)
    );
  }

  if (!matchedUser) {
    if (errBox) {
      errBox.textContent = "Usuário ou senha incorretos.";
      errBox.classList.remove('hidden');
    }
    if (cardBox) {
      cardBox.classList.remove('animate-shake');
      void cardBox.offsetWidth;
      cardBox.classList.add('animate-shake');
    }
    return;
  }

  currentUser = {
    username: matchedUser.username,
    role: matchedUser.role,
    name: matchedUser.name,
    barberId: matchedUser.barberId || null
  };

  saveSystemDataToStorage();

  if (errBox) errBox.classList.add('hidden');

  showToast(`Bem-vindo, ${currentUser.name}!`, "success");

  applyAuthInterface();

  if (typeof initAdminPanel === 'function') {
    initAdminPanel();
  }
}

function logout() {
  const former = currentUser ? currentUser.name : "Usuário";
  currentUser = null;
  saveSystemDataToStorage();
  showToast(`Sessão encerrada. Até logo!`, "info");
  applyAuthInterface();
}

function applyAuthInterface() {
  const user = getCurrentUser();
  const loginView = document.getElementById('adminLoginView');
  const appView = document.getElementById('adminAppView');
  const userBadge = document.getElementById('adminUserBadge');

  if (!user) {
    if (loginView) loginView.classList.remove('hidden');
    if (appView) appView.classList.add('hidden');
    return;
  }

  if (loginView) loginView.classList.add('hidden');
  if (appView) appView.classList.remove('hidden');

  if (userBadge) {
    if (user.role === 'admin') {
      userBadge.innerHTML = `
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gold-500/10 border border-gold-500/40 text-gold-400">
          <i data-lucide="shield-check" class="w-4 h-4 text-gold-400"></i>
          <span class="font-bold text-xs uppercase tracking-wider">Admin: ${user.name}</span>
        </div>
      `;
    } else {
      userBadge.innerHTML = `
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-obsidian-800 border border-obsidian-700 text-neutral-200">
          <i data-lucide="scissors" class="w-4 h-4 text-gold-400"></i>
          <span class="font-bold text-xs">Barbeiro: ${user.name}</span>
        </div>
      `;
    }
  }

  if (window.lucide) window.lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => {
  loadSystemDataFromStorage();
  applyAuthInterface();
});
