
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

export const checkForPWAInstall = () => {
  let deferredPrompt: any;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPromotion();
  });

  const isIos = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  };

  const isInStandaloneMode = () => {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || 
           (window.navigator as any).standalone === true;
  };

  const showInstallPromotion = () => {
    if (!document.getElementById('pwa-install-banner')) {
      const banner = document.createElement('div');
      banner.id = 'pwa-install-banner';
      banner.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: #34a853;
        color: white;
        padding: 15px;
        border-radius: 8px;
        text-align: center;
        z-index: 9999;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      banner.innerHTML = `
        <div style="margin-bottom: 10px;">Install Meal Plan for a better experience!</div>
        <button id="install-button" style="margin-right: 10px; padding: 8px 16px; background: white; color: #34a853; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Install</button>
        <button id="dismiss-button" style="padding: 8px 16px; background: transparent; color: white; border: 1px solid white; border-radius: 4px; cursor: pointer;">Later</button>
      `;
      
      document.body.appendChild(banner);
      
      document.getElementById('install-button')?.addEventListener('click', () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult: any) => {
            deferredPrompt = null;
            banner.remove();
          });
        }
      });
      
      document.getElementById('dismiss-button')?.addEventListener('click', () => {
        banner.remove();
      });
    }
  };

  // iOS install instructions
  if (isIos() && !isInStandaloneMode()) {
    setTimeout(() => {
      if (!document.getElementById('ios-install-banner')) {
        const banner = document.createElement('div');
        banner.id = 'ios-install-banner';
        banner.style.cssText = `
          position: fixed;
          bottom: 20px;
          left: 20px;
          right: 20px;
          background: #007AFF;
          color: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          z-index: 9999;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        banner.innerHTML = `
          <div style="margin-bottom: 10px;">To install: Tap <strong>Share</strong> → <strong>Add to Home Screen</strong></div>
          <button onclick="this.parentElement.remove()" style="padding: 8px 16px; background: white; color: #007AFF; border: none; border-radius: 4px; font-weight: bold;">Got it</button>
        `;
        document.body.appendChild(banner);
      }
    }, 2000);
  }
};
