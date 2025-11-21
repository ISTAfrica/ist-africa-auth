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
    this.render();
  }

  checkAuthStatus() {
    const token = localStorage.getItem('iaa_access_token');
    if (token && !this.isTokenExpired(token)) {
      this.isAuthenticated = true;
    } else {
      localStorage.removeItem('iaa_access_token');
      this.isAuthenticated = false;
    }
  }

  render() {
    if (this.isAuthenticated) {
      return;
    }
    if (document.getElementById('iaa-auth-widget-container')) {
      return;
    }
    this.createWidget();
    this.attachEventListeners();
  }

  createWidget() {
    const style = document.createElement('style');
    style.innerHTML = `
      /* Keyframe animations to replicate tailwindcss-animate */
      @keyframes iaa-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes iaa-slide-in-from-bottom {
        from { transform: translateY(1rem); }
        to { transform: translateY(0); }
      }

      /* Container styles from your React component */
      .iaa-widget-container {
        position: fixed;
        bottom: 1.5rem; /* bottom-6 */
        right: 1.5rem;  /* right-6 */
        z-index: 50;
        /* Apply animations */
        animation: iaa-fade-in 0.5s ease-out, iaa-slide-in-from-bottom 0.5s ease-out;
      }

      /* Button styles based on your shadcn/ui Button component */
      .iaa-themed-btn {
        /* Base styles from cva */
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem; /* gap-2 */
        white-space: nowrap;
        border-radius: 0.375rem; /* rounded-md */
        font-size: 0.875rem; /* text-sm */
        font-weight: 500; /* font-medium */
        
        /* Default variant styles */
        background-color: hsl(220 85% 45%); /* bg-primary (placeholder, change if needed) */
        color: #fafafa; /* text-primary-foreground (placeholder) */
        
        /* LG size styles */
        height: 2.75rem; /* h-11 */
        padding-left: 2rem; /* px-8 */
        padding-right: 2rem; /* px-8 */

        /* Custom styles from your component */
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); /* shadow-lg */
        transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 300ms;
        border: none;
        cursor: pointer;
      }

      .iaa-themed-btn:hover {
        background-color: hsl(220 85% 45%); /* hover:bg-primary/90 (placeholder) */
        box-shadow: 0 10px 15px -3px rgb(26 26 26 / 0.3), 0 4px 6px -4px rgb(26 26 26 / 0.3); /* hover:shadow-primary/30 (placeholder) */
        transform: scale(1.05);
      }

      /* SVG Icon styles */
      .iaa-themed-btn svg {
        margin-right: 0.5rem; /* mr-2 */
        height: 1.25rem; /* h-5 */
        width: 1.25rem;  /* w-5 */
        pointer-events: none;
        flex-shrink: 0;
      }
    `;
    document.head.appendChild(style);

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'iaa-widget-container'; 
    widgetContainer.innerHTML = `
      <button id="iaa-login-btn" class="iaa-themed-btn">
        <!-- SVG for the Lucide LogIn icon -->
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
    const loginButton = document.getElementById('iaa-login-btn');
    if (loginButton) {
      loginButton.addEventListener('click', () => this.initiateLogin());
    }
  }

  initiateLogin() {
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

    const width = 450;
    const height = 500;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      loginUrl,
      'iaa-login-popup',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (popup) {
      popup.focus();
    } else {
      alert('Popup blocked. Please allow popups for this site to log in.');
    }
  }
  
  isTokenExpired(token) {
    try {
      const payloadBase64 = token.split('.')[1];
      const decodedJson = atob(payloadBase64);
      const payload = JSON.parse(decodedJson);
      const expirationTime = payload.exp * 1000;
      return Date.now() >= expirationTime;
    } catch {
      return true;
    }
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