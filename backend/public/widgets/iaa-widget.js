class IAAAuthWidget {
  constructor(config) {
    if (!config || !config.clientId || !config.redirectUri || !config.iaaFrontendUrl) {
      console.error('IAA Widget Error: `clientId`, `redirectUri`, and `iaaFrontendUrl` are required.');
      return;
    }
    this.clientId = config.clientId;
    this.redirectUri = config.redirectUri;
    this.iaaFrontendUrl = config.iaaFrontendUrl;
    this.checkAuthEndpoint = config.checkAuthEndpoint || '/api/auth/status';
    
    this.isAuthenticated = false;

    this.init();
  }

  async init() {
    this.validateState();
    this.listenForStorageChanges();
    this.startWatchdog();
    await this.postLoginSyncCheck();
    this.render();
  }

  validateState() {
    const authFlag = localStorage.getItem('iaa_authenticated') === 'true';
    const tokens = localStorage.getItem('auth_tokens');

    const prevAuth = this.isAuthenticated;

    if (authFlag && !tokens) {
      console.warn('[IAA Widget] Invalid state. Logging out.');
      this.logout();
    } else if (!authFlag && tokens) {
      console.warn('[IAA Widget] Tokens found but flag missing. Clearing tokens.');
      localStorage.removeItem('auth_tokens');
      this.isAuthenticated = false;
    } else {
      this.isAuthenticated = authFlag;
    }

    if (prevAuth !== this.isAuthenticated) {
      this.notifyAuthChange();
      this.render();
    }
  }

  startWatchdog() {
    setInterval(() => {
      this.validateState();
    }, 1000);
  }

  async postLoginSyncCheck() {
    const needsSync = sessionStorage.getItem('iaa_sync_flag') === 'true';
    if (needsSync) {
      sessionStorage.removeItem('iaa_sync_flag');
      this.validateState();
    }
  }

  render() {
    const existingWidget = document.getElementById('iaa-widget-container');
    if (existingWidget) existingWidget.remove();

    this.createWidget();
    this.attachEventListeners();
  }

  // ✅ UPDATED: Logout + Redirect
  logout() {
    console.log('[IAA Widget] Client-side logout initiated.');

    // Clear auth state
    localStorage.setItem('iaa_authenticated', 'false');
    localStorage.removeItem('auth_tokens');

    this.isAuthenticated = false;
    this.render();
    this.notifyAuthChange();

    // Redirect to client app start page
    window.location.href = window.location.origin;
  }

  listenForStorageChanges() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'iaa_authenticated' || e.key === 'auth_tokens') {
        this.validateState();
      }
    });
  }

  notifyAuthChange() {
    window.dispatchEvent(new CustomEvent('iaa-auth-change', {
      detail: { isAuthenticated: this.isAuthenticated }
    }));
  }

  // ---------- UI ----------
  createWidget() {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes iaa-fade-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes iaa-slide-in-from-bottom { from { transform: translateY(1rem); } to { transform: translateY(0); } }

      .iaa-widget-container {
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        z-index: 50;
        animation: iaa-fade-in 0.5s ease-out, iaa-slide-in-from-bottom 0.5s ease-out;
      }

      .iaa-themed-btn,
      .iaa-logout-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        height: 2.75rem;
        padding: 0 2rem;
        border: none;
        cursor: pointer;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1),
                    0 4px 6px -4px rgb(0 0 0 / 0.1);
        transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      .iaa-themed-btn {
        background-color: hsl(220 85% 45%);
        color: #fafafa;
      }

      .iaa-themed-btn:hover {
        transform: scale(1.05);
      }

      .iaa-logout-btn {
        background-color: #dc2626;
        color: #fff;
      }

      .iaa-logout-btn:hover {
        background-color: #b91c1c;
        transform: scale(1.05);
      }

      .iaa-themed-btn svg,
      .iaa-logout-btn svg {
        width: 1.25rem;
        height: 1.25rem;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);

    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'iaa-widget-container';
    widgetContainer.className = 'iaa-widget-container';

    widgetContainer.innerHTML = this.isAuthenticated
      ? `
        <button id="iaa-logout-btn" class="iaa-logout-btn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7"/>
          </svg>
          Logout
        </button>
      `
      : `
        <button id="iaa-login-btn" class="iaa-themed-btn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" x2="3" y1="12" y2="12"/>
          </svg>
          Login with IAA
        </button>
      `;

    document.body.appendChild(widgetContainer);
  }

  attachEventListeners() {
    const loginBtn = document.getElementById('iaa-login-btn');
    const logoutBtn = document.getElementById('iaa-logout-btn');

    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.initiateLogin());
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }
  }

  initiateLogin() {
    const state = this.generateRandomState();
    sessionStorage.setItem('oauth_state_iaa', state);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state,
      display: 'popup',
    });

    const loginUrl = `${this.iaaFrontendUrl}/auth/login?${params.toString()}`;

    // Calculate center position for popup
    const width = 450;
    const height = 500;
    const left = Math.round((window.screen.width - width) / 2);
    const top = Math.round((window.screen.height - height) / 2);

    const popup = window.open(
      loginUrl,
      'iaa-login-popup',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
    if (!popup) alert('Popup blocked.');
  }

  generateRandomState(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}

// Global exposure
window.iaa = {
  engine: null,
  initiateLogin: () => window.iaa.engine?.initiateLogin(),
  logout: () => window.iaa.engine?.logout(),
};

window.IAAAuthWidget = IAAAuthWidget;

if (window.initIAAWidget && typeof window.initIAAWidget === 'function') {
  window.initIAAWidget();
}
