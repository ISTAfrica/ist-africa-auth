/**
 * =====================================================================================
 * IST Africa Auth (IAA) - All-in-One Authentication Widget (v8)
 *
 * This script is a self-contained authentication solution. It handles:
 *  - Checking initial auth state.
 *  - Rendering a login button for unauthenticated users.
 *  - Hiding itself for authenticated users.
 *  - Initiating the modal (iframe) login flow.
 *  - Listening for postMessage auth callbacks.
 *  - Listening for cross-tab login/logout events.
 *  - Notifying the host application of auth changes via custom events.
 * =====================================================================================
 */
class IAAAuthWidget {
  constructor(config) {
    if (!config || !config.clientId || !config.redirectUri || !config.iaaFrontendUrl) {
      console.error('IAA Widget Error: `clientId`, `redirectUri`, and `iaaFrontendUrl` are required.');
      return;
    }
    this.clientId = config.clientId;
    this.redirectUri = config.redirectUri;
    this.iaaFrontendUrl = config.iaaFrontendUrl;
    this.backendUrl = config.backendUrl || null;
    this.iaaBackendUrl = config.iaaBackendUrl || this._detectBackendUrl();
    this.onAuthChange = config.onAuthChange || null;
    this.isAuthenticated = false;
    this._escHandler = null;

    window.iaa.engine = this;
    this.init();
  }

  init() {
    this.checkAuthStatus();
    this.listenForStorageChanges();
    this.listenForAuthMessage();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.render());
    } else {
      this.render();
    }
  }

  // ==================== Auth State ====================

  checkAuthStatus() {
    var token = localStorage.getItem('iaa_access_token');
    var refreshToken = localStorage.getItem('iaa_refresh_token');
    var wasAuthenticated = this.isAuthenticated;

    if (token && !this.isTokenExpired(token)) {
      this.isAuthenticated = true;
    } else if (refreshToken) {
      // Access token expired but refresh token exists — stay authenticated, refresh on next getValidToken()
      this.isAuthenticated = true;
    } else {
      localStorage.removeItem('iaa_access_token');
      this.isAuthenticated = false;
    }

    if (wasAuthenticated !== this.isAuthenticated) {
      this.notifyAuthChange();
    }
  }

  listenForStorageChanges() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'iaa_access_token') {
        this.checkAuthStatus();
        this.render();
      }
    });
  }

  listenForAuthMessage() {
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'iaa-auth-callback') {
        const { code, state } = event.data;
        if (code) {
          this.handleAuthCode(code, state);
        }
      }
    });
  }

  // ==================== Auth Code Exchange ====================

  async handleAuthCode(code, state) {
    var savedState = sessionStorage.getItem('oauth_state_iaa');
    if (savedState && state !== savedState) {
      console.error('[IAA Widget] State mismatch. Possible CSRF attack.');
      return;
    }
    sessionStorage.removeItem('oauth_state_iaa');

    this.closeModal();
    this.showLoading(true);

    try {
      var exchangeUrl = this.backendUrl
        ? this.backendUrl.replace(/\/$/, '') + '/api/auth/exchange'
        : this.redirectUri.replace(/\/callback.*$/, '') + '/api/auth/exchange';
      var res = await fetch(exchangeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code }),
      });

      if (!res.ok) {
        var err = await res.json().catch(function() { return {}; });
        throw new Error(err.message || 'Token exchange failed');
      }

      var data = await res.json();

      localStorage.setItem('iaa_access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('iaa_refresh_token', data.refresh_token);
      }

      this.isAuthenticated = true;
      this.notifyAuthChange();
      this.render();
    } catch (err) {
      console.error('[IAA Widget] Token exchange failed:', err);
    } finally {
      this.showLoading(false);
    }
  }

  // ==================== Render ====================

  render() {
    var existingWidget = document.getElementById('iaa-widget-container');

    if (this.isAuthenticated) {
      if (existingWidget) existingWidget.remove();
    } else {
      if (!existingWidget) {
        this.injectStyles();
        this.createWidget();
        this.attachEventListeners();
      }
    }
  }

  notifyAuthChange() {
    window.dispatchEvent(new CustomEvent('iaa-auth-change', {
      detail: {
        isAuthenticated: this.isAuthenticated,
        token: this.isAuthenticated ? localStorage.getItem('iaa_access_token') : null,
      }
    }));

    if (this.onAuthChange) {
      this.onAuthChange(this.isAuthenticated);
    }
  }

  // ==================== Modal (iframe) Login ====================

  initiateLogin() {
    var state = this.generateRandomState();
    sessionStorage.setItem('oauth_state_iaa', state);

    var params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: state,
      display: 'popup',
    });

    var loginUrl = this.iaaFrontendUrl + '/auth/login?' + params.toString();

    var overlay = document.createElement('div');
    overlay.id = 'iaa-modal-overlay';
    overlay.className = 'iaa-modal-overlay';
    overlay.innerHTML =
      '<div class="iaa-modal-container">' +
        '<button id="iaa-modal-close" class="iaa-modal-close" aria-label="Close">&times;</button>' +
        '<iframe id="iaa-modal-iframe" class="iaa-modal-iframe" src="' + loginUrl + '"></iframe>' +
      '</div>';

    document.body.appendChild(overlay);

    var self = this;

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) self.closeModal();
    });

    document.getElementById('iaa-modal-close').addEventListener('click', function() {
      self.closeModal();
    });

    this._escHandler = function(e) {
      if (e.key === 'Escape') self.closeModal();
    };
    document.addEventListener('keydown', this._escHandler);
  }

  closeModal() {
    var overlay = document.getElementById('iaa-modal-overlay');
    if (overlay) overlay.remove();
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
    }
  }

  showLoading(show) {
    var existing = document.getElementById('iaa-loading-overlay');
    if (existing) existing.remove();

    if (show) {
      var loader = document.createElement('div');
      loader.id = 'iaa-loading-overlay';
      loader.className = 'iaa-modal-overlay';
      loader.innerHTML =
        '<div class="iaa-loading-spinner">' +
          '<div class="iaa-spinner"></div>' +
          '<p>Completing login...</p>' +
        '</div>';
      document.body.appendChild(loader);
    }
  }

  // ==================== Public API ====================

  async logout(type) {
    type = type || 'single';
    var iaaBackend = this.iaaBackendUrl || this._detectBackendUrl();

    // Get a valid token (refreshes if expired) to ensure logout succeeds
    if (iaaBackend) {
      try {
        var token = await this.getValidToken();
        if (token) {
          await fetch(iaaBackend + '/api/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token,
            },
            body: JSON.stringify({ type: type }),
          });
        }
      } catch (e) {
        console.error('[IAA Widget] Server logout failed:', e);
      }
    }

    // Clear local state
    localStorage.removeItem('iaa_access_token');
    localStorage.removeItem('iaa_refresh_token');
    this.isAuthenticated = false;
    this.notifyAuthChange();
    this.render();
  }

  getToken() {
    var token = localStorage.getItem('iaa_access_token');
    if (token && !this.isTokenExpired(token)) return token;
    return null;
  }

  /**
   * Returns a valid token. Refreshes automatically if expired or about to expire.
   * Use this before every API call.
   */
  getUser() {
    var token = localStorage.getItem('iaa_access_token');
    if (!token) return null;
    try {
      var payload = JSON.parse(atob(token.split('.')[1]));
      return { sub: payload.sub, email: payload.email, name: payload.name };
    } catch (e) { return null; }
  }

  async getValidToken() {
    var token = localStorage.getItem('iaa_access_token');
    if (token && !this.isTokenExpired(token)) return token;
    return await this.refreshToken();
  }

  async refreshToken() {
    var refreshToken = localStorage.getItem('iaa_refresh_token');
    if (!refreshToken) {
      this.logout();
      return null;
    }

    var iaaBackend = this.iaaBackendUrl;

    try {
      var res = await fetch(iaaBackend + '/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshToken }),
      });

      if (!res.ok) {
        this.logout();
        return null;
      }

      var data = await res.json();
      localStorage.setItem('iaa_access_token', data.access_token || data.accessToken);
      if (data.refresh_token || data.refreshToken) {
        localStorage.setItem('iaa_refresh_token', data.refresh_token || data.refreshToken);
      }

      this.isAuthenticated = true;
      this.notifyAuthChange();
      return localStorage.getItem('iaa_access_token');
    } catch (err) {
      console.error('[IAA Widget] Token refresh failed:', err);
      this.logout();
      return null;
    }
  }

  // ==================== UI ====================

  injectStyles() {
    if (document.getElementById('iaa-widget-styles')) return;
    var style = document.createElement('style');
    style.id = 'iaa-widget-styles';
    style.innerHTML =
      '@keyframes iaa-fade-in { from { opacity: 0; } to { opacity: 1; } }' +
      '@keyframes iaa-slide-up { from { transform: translateY(1rem); opacity: 0; } to { transform: translateY(0); opacity: 1; } }' +
      '@keyframes iaa-spin { to { transform: rotate(360deg); } }' +

      '.iaa-widget-container {' +
        'position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 50;' +
        'animation: iaa-fade-in 0.5s ease-out, iaa-slide-up 0.5s ease-out;' +
      '}' +

      '.iaa-themed-btn {' +
        'display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;' +
        'white-space: nowrap; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500;' +
        'background-color: hsl(220 85% 45%); color: #fafafa;' +
        'height: 2.75rem; padding-left: 2rem; padding-right: 2rem;' +
        'box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);' +
        'transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);' +
        'border: none; cursor: pointer; font-family: system-ui, -apple-system, sans-serif;' +
      '}' +

      '.iaa-themed-btn:hover {' +
        'box-shadow: 0 10px 15px -3px rgb(26 26 26 / 0.3), 0 4px 6px -4px rgb(26 26 26 / 0.3);' +
        'transform: scale(1.05);' +
      '}' +

      '.iaa-themed-btn svg { height: 1.25rem; width: 1.25rem; pointer-events: none; flex-shrink: 0; }' +

      '.iaa-modal-overlay {' +
        'position: fixed; top: 0; left: 0; width: 100%; height: 100%;' +
        'background: rgba(0, 0, 0, 0.6);' +
        'display: flex; align-items: center; justify-content: center;' +
        'z-index: 10000; animation: iaa-fade-in 0.2s ease-out;' +
      '}' +

      '.iaa-modal-container {' +
        'position: relative; width: 440px; height: 580px;' +
        'max-width: 95vw; max-height: 90vh;' +
        'background: #fff; border-radius: 12px; overflow: hidden;' +
        'box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);' +
        'animation: iaa-slide-up 0.3s ease-out;' +
      '}' +

      '.iaa-modal-close {' +
        'position: absolute; top: 8px; right: 12px;' +
        'background: none; border: none; font-size: 24px; cursor: pointer;' +
        'color: #666; z-index: 10001; width: 32px; height: 32px;' +
        'display: flex; align-items: center; justify-content: center;' +
        'border-radius: 50%; transition: background 0.2s;' +
      '}' +

      '.iaa-modal-close:hover { background: rgba(0, 0, 0, 0.1); }' +

      '.iaa-modal-iframe { width: 100%; height: 100%; border: none; }' +

      '.iaa-loading-spinner { text-align: center; color: #fff; font-family: system-ui, -apple-system, sans-serif; }' +

      '.iaa-spinner {' +
        'width: 40px; height: 40px;' +
        'border: 3px solid rgba(255,255,255,0.3); border-top-color: #fff;' +
        'border-radius: 50%; animation: iaa-spin 0.8s linear infinite;' +
        'margin: 0 auto 12px;' +
      '}';

    document.head.appendChild(style);
  }

  createWidget() {
    var widgetContainer = document.createElement('div');
    widgetContainer.id = 'iaa-widget-container';
    widgetContainer.className = 'iaa-widget-container';
    widgetContainer.innerHTML =
      '<button id="iaa-login-btn" class="iaa-themed-btn">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>' +
          '<polyline points="10 17 15 12 10 7"/>' +
          '<line x1="15" x2="3" y1="12" y2="12"/>' +
        '</svg>' +
        'Login with IAA' +
      '</button>';
    document.body.appendChild(widgetContainer);
  }

  attachEventListeners() {
    var self = this;
    var loginButton = document.getElementById('iaa-login-btn');
    if (loginButton) {
      loginButton.addEventListener('click', function() { self.initiateLogin(); });
    }
  }

  // ==================== Utilities ====================

  _detectBackendUrl() {
    try {
      var scripts = document.querySelectorAll('script[src*="iaa-widget"]');
      if (scripts.length > 0) {
        var src = scripts[0].src;
        var url = new URL(src);
        return url.origin;
      }
    } catch (e) {}
    return null;
  }

  isTokenExpired(token) {
    try {
      var payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch (e) { return true; }
  }

  generateRandomState(length) {
    length = length || 16;
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for (var i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// Global exposure
window.IAAAuthWidget = IAAAuthWidget;
window.iaa = {
  engine: null,
  getToken: function() { return window.iaa.engine ? window.iaa.engine.getToken() : null; },
  getUser: function() { return window.iaa.engine ? window.iaa.engine.getUser() : null; },
  getValidToken: function() { return window.iaa.engine ? window.iaa.engine.getValidToken() : Promise.resolve(null); },
  refreshToken: function() { return window.iaa.engine ? window.iaa.engine.refreshToken() : Promise.resolve(null); },
  isAuthenticated: function() { return window.iaa.engine ? window.iaa.engine.isAuthenticated : false; },
  logout: function() { if (window.iaa.engine) window.iaa.engine.logout(); },
};

if (window.initIAAWidget && typeof window.initIAAWidget === 'function') {
  window.initIAAWidget();
}
