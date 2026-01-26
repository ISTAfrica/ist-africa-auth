class IAAAuthWidget {
  constructor(config) {
    if (!config || !config.clientId || !config.redirectUri || !config.iaaFrontendUrl) {
      console.error('IAA Widget Error: `clientId`, `redirectUri`, and `iaaFrontendUrl` are required.');
      return;
    }
    this.clientId = config.clientId;
    this.redirectUri = config.redirectUri;
    this.iaaFrontendUrl = config.iaaFrontendUrl;
    // Backend URL for API calls (optional - will derive from iaaFrontendUrl if not provided)
    this.iaaBackendUrl = config.iaaBackendUrl || this.deriveBackendUrl(config.iaaFrontendUrl);
    this.checkAuthEndpoint = config.checkAuthEndpoint || '/api/auth/status';

    this.isAuthenticated = false;

    this.init();
  }

  deriveBackendUrl(frontendUrl) {
    // Try to derive backend URL from frontend URL
    const url = frontendUrl.replace(/\/$/, '');
    // If it's localhost:3000, change to localhost:5000
    if (url.includes('localhost:3000')) {
      return url.replace(':3000', ':5000');
    }
    // If it's a production frontend URL, try to use the backend URL pattern
    // For ist-africa, frontend is on vercel, backend is on render
    if (url.includes('vercel.app') || url.includes('ist-africa')) {
      return 'http://localhost:5000';
    }
    // Default: assume backend is on port 5000
    return url.replace(/:\d+/, ':5000');
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

  // Show logout options modal
  showLogoutModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById('iaa-logout-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'iaa-logout-modal';
    modal.className = 'iaa-logout-modal-overlay';
    modal.innerHTML = `
      <div class="iaa-logout-modal">
        <h3 class="iaa-logout-modal-title">Logout Options</h3>
        <p class="iaa-logout-modal-text">Choose how you want to logout:</p>
        <div class="iaa-logout-modal-buttons">
          <button id="iaa-logout-single" class="iaa-logout-option-btn iaa-logout-single-btn">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            This Device Only
          </button>
          <button id="iaa-logout-all" class="iaa-logout-option-btn iaa-logout-all-btn">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
            </svg>
            All Devices
          </button>
        </div>
        <button id="iaa-logout-cancel" class="iaa-logout-cancel-btn">Cancel</button>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('iaa-logout-single').addEventListener('click', () => this.logout('single'));
    document.getElementById('iaa-logout-all').addEventListener('click', () => this.logout('all'));
    document.getElementById('iaa-logout-cancel').addEventListener('click', () => this.closeLogoutModal());

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeLogoutModal();
    });
  }

  closeLogoutModal() {
    const modal = document.getElementById('iaa-logout-modal');
    if (modal) modal.remove();
  }

  // Logout with backend API call
async logout(type = 'single') {
  this.closeLogoutModal();

  const tokens = JSON.parse(localStorage.getItem('auth_tokens') || '{}');
  const token = tokens.accessToken;

  if (!token) {
    console.warn('[IAA Widget] No access token found');
    return;
  }

  try {
    const response = await fetch(`${this.iaaBackendUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ type }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[IAA Widget] Logout failed:', error);
      return;
    }

    console.log('[IAA Widget] Logout success:', await response.json());

    // ✅ only now
    localStorage.clear();
    this.isAuthenticated = false;
    this.notifyAuthChange();
    window.location.href = window.location.origin;

  } catch (err) {
    console.error('[IAA Widget] Logout error:', err);
  }
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

      /* Logout Modal Styles */
      .iaa-logout-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: iaa-fade-in 0.2s ease-out;
      }

      .iaa-logout-modal {
        background: white;
        border-radius: 0.75rem;
        padding: 1.5rem;
        width: 90%;
        max-width: 360px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        animation: iaa-slide-in-from-bottom 0.3s ease-out;
      }

      .iaa-logout-modal-title {
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
        text-align: center;
      }

      .iaa-logout-modal-text {
        margin: 0 0 1.25rem 0;
        font-size: 0.875rem;
        color: #6b7280;
        text-align: center;
      }

      .iaa-logout-modal-buttons {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }

      .iaa-logout-option-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.2s ease;
      }

      .iaa-logout-option-btn svg {
        width: 1.25rem;
        height: 1.25rem;
      }

      .iaa-logout-single-btn {
        background-color: #f3f4f6;
        color: #374151;
        border: 1px solid #e5e7eb;
      }

      .iaa-logout-single-btn:hover {
        background-color: #e5e7eb;
      }

      .iaa-logout-all-btn {
        background-color: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
      }

      .iaa-logout-all-btn:hover {
        background-color: #fee2e2;
      }

      .iaa-logout-cancel-btn {
        width: 100%;
        padding: 0.625rem 1rem;
        background: transparent;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .iaa-logout-cancel-btn:hover {
        background-color: #f9fafb;
        color: #374151;
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
      logoutBtn.addEventListener('click', () => this.showLogoutModal());
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
