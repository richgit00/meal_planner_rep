
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
                  console.log('New content is available; please refresh.');
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
    console.log('beforeinstallprompt event fired');
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show install button/banner
    showInstallPromotion();
  });

  // For iOS Safari
  const isIos = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  };

  const isInStandaloneMode = () => {
    return ('standalone' in window.navigator) && (window.navigator as any).standalone;
  };

  const showInstallPromotion = () => {
    console.log('PWA install available');
    
    // Create a simple install banner
    if (!document.getElementById('pwa-install-banner')) {
      const banner = document.createElement('div');
      banner.id = 'pwa-install-banner';
      banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #000;
        color: white;
        padding: 10px;
        text-align: center;
        z-index: 9999;
        font-size: 14px;
      `;
      banner.innerHTML = `
        <span>Install this app for a better experience!</span>
        <button id="install-button" style="margin-left: 10px; padding: 5px 10px; background: white; color: black; border: none; border-radius: 3px; cursor: pointer;">Install</button>
        <button id="dismiss-button" style="margin-left: 5px; padding: 5px 10px; background: transparent; color: white; border: 1px solid white; border-radius: 3px; cursor: pointer;">×</button>
      `;
      
      document.body.appendChild(banner);
      
      // Add click handlers
      document.getElementById('install-button')?.addEventListener('click', () => {
        promptInstall();
        banner.remove();
      });
      
      document.getElementById('dismiss-button')?.addEventListener('click', () => {
        banner.remove();
      });
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

  // Show iOS install instructions
  if (isIos() && !isInStandaloneMode()) {
    setTimeout(() => {
      if (!document.getElementById('ios-install-banner')) {
        const banner = document.createElement('div');
        banner.id = 'ios-install-banner';
        banner.style.cssText = `
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #007AFF;
          color: white;
          padding: 15px;
          text-align: center;
          z-index: 9999;
          font-size: 14px;
        `;
        banner.innerHTML = `
          <div>To install this app, tap <strong>Share</strong> and then <strong>Add to Home Screen</strong></div>
          <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 5px 10px; background: white; color: #007AFF; border: none; border-radius: 3px;">Got it</button>
        `;
        document.body.appendChild(banner);
      }
    }, 3000);
  }

  return {
    promptInstall
  };
};
