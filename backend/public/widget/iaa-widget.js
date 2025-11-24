class IAAAuthWidget {
  constructor(config) {
    if (!config || !config.clientId || !config.redirectUri || !config.iaaFrontendUrl) {
      console.error('IAA Widget Error: `clientId`, `redirectUri`, and `iaaFrontendUrl` are required.');
      return;
    }
    this.clientId = config.clientId;
    this.redirectUri = config.redirectUri;
    this.iaaFrontendUrl = config.iaaFrontendUrl;
    this.isAuthenticated = false;
    this.init();
  }

  init() {
    this.checkAuthStatus();
    if (document.readyState === 'loading') {

      document.addEventListener('DOMContentLoaded', () => this.render());
    } else {

      this.render();
    }
  }

  checkAuthStatus() {
    const token = localStorage.getItem('iaa_access_token');
    if (token && !this.isTokenExpired(token)) {
      localStorage.setItem('iaa_authenticated', 'true');
      this.isAuthenticated = true;
    } else {
      localStorage.removeItem('iaa_access_token');
      localStorage.setItem('iaa_authenticated', 'false');
      this.isAuthenticated = false;
    }
  }

  render() {
    if (this.isAuthenticated) return;
    if (document.getElementById('iaa-widget-container')) return;
    this.createWidget();
    this.attachEventListeners();
  }

  createWidget() {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes iaa-fade-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes iaa-slide-in-from-bottom { from { transform: translateY(1rem); } to { transform: translateY(0); } }
      .iaa-widget-container { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 50; animation: iaa-fade-in 0.5s ease-out, iaa-slide-in-from-bottom 0.5s ease-out; }
      .iaa-themed-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; white-space: nowrap; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; background-color: hsl(220 85% 45%); color: #fafafa; height: 2.75rem; padding-left: 2rem; padding-right: 2rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 300ms; border: none; cursor: pointer; }
      .iaa-themed-btn:hover { background-color: hsl(220 85% 45%); box-shadow: 0 10px 15px -3px rgb(26 26 26 / 0.3), 0 4px 6px -4px rgb(26 26 26 / 0.3); transform: scale(1.05); }
      .iaa-themed-btn svg { margin-right: 0.5rem; height: 1.25rem; width: 1.25rem; pointer-events: none; flex-shrink: 0; }
    `;
    document.head.appendChild(style);
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'iaa-widget-container';
    widgetContainer.innerHTML = `<button id="iaa-login-btn" class="iaa-themed-btn"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>Login with IAA</button>`;
    document.body.appendChild(widgetContainer);
  }
  
  attachEventListeners() {
    const loginButton = document.getElementById('iaa-login-btn');
    if (loginButton) {
      loginButton.addEventListener('click', () => this.initiateLogin());
    } else {
      console.error('[IAA Widget] Could not find login button to attach event listener.');
    }
  }

  initiateLogin() {
    console.log('[IAA Widget] Login initiated.'); 
    const state = this.generateRandomState();
    sessionStorage.setItem('oauth_state_iaa', state);
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: state,
      display: 'popup',
    });
    const loginUrl = `${this.iaaFrontendUrl}/auth/login?${params.toString()}`;
    const width = 450, height = 500;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(loginUrl, 'iaa-login-popup', `width=${width},height=${height},left=${left},top=${top}`);
    if (popup) popup.focus();
    else alert('Popup blocked. Please allow popups for this site to log in.');
  }
  
  isTokenExpired(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch { return true; }
  }
  
  generateRandomState(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

window.IAAAuthWidget = IAAAuthWidget;

if (window.initIAAWidget && typeof window.initIAAWidget === 'function') {
  window.initIAAWidget();
}