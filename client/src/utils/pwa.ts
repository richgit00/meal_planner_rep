
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available
                  if (confirm('New version available! Reload to update?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
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

  const showInstallPromotion = () => {
    // Create install button if it doesn't exist
    if (!document.getElementById('pwa-install-btn')) {
      const installBtn = document.createElement('button');
      installBtn.id = 'pwa-install-btn';
      installBtn.innerHTML = '📱 Install App';
      installBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        background: #3b82f6;
        color: white;
        border: none;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      
      installBtn.addEventListener('click', () => {
        promptInstall();
        installBtn.remove();
      });
      
      document.body.appendChild(installBtn);
      
      // Auto-hide after 10 seconds
      setTimeout(() => {
        if (document.getElementById('pwa-install-btn')) {
          installBtn.remove();
        }
      }, 10000);
    }
  };

  const promptInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        deferredPrompt = null;
      });
    }
  };

  // Detect if app is running in standalone mode
  const isStandalone = () => {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone || 
           document.referrer.includes('android-app://');
  };

  return {
    promptInstall,
    isStandalone
  };
};
