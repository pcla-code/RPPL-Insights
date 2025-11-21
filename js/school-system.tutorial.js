(function () {
  const LS_KEY = 'ttoExplainerSeen_v1'; // bump to re-show after updates

  function ensureModalDOM() {
    if (document.getElementById('ttoVideoModal')) return;

    const style = document.createElement('style');
    style.textContent = `
      #ttoVideoModal { position:fixed; inset:0; z-index:10000; display:none; }
      #ttoVideoModal .tto-backdrop { position:absolute; inset:0; background:rgba(0,0,0,.6); }
      #ttoVideoModal .tto-dialog {
        position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
        background:#111; color:#fff; width:min(960px,92vw); border-radius:14px;
        box-shadow:0 24px 80px rgba(0,0,0,.45); overflow:hidden;
      }
      #ttoVideoModal header {
        display:flex; align-items:center; justify-content:space-between;
        padding:10px 14px; background:#1a1a1a; font-weight:600;
      }
      #ttoVideoModal .tto-close {
        border:0; background:transparent; color:#ccc;
        font-size:22px; cursor:pointer;
      }
      #ttoVideoModal video {
        display:block; width:100%; height:auto; max-height:75vh;
      }
    `;
    document.head.appendChild(style);

    const wrap = document.createElement('div');
    wrap.id = 'ttoVideoModal';
    wrap.innerHTML = `
      <div class="tto-backdrop"></div>
      <div class="tto-dialog" role="dialog" aria-modal="true" aria-label="Trends Over Time Explainer">
        <header>
          <div>Trends Over Time: Quick Explainer</div>
          <button class="tto-close" aria-label="Close">×</button>
        </header>
        <video id="ttoVideo" playsinline controls preload="metadata"></video>
      </div>
    `;
    document.body.appendChild(wrap);
  }

  function openModal({ once }) {
    if (once && localStorage.getItem(LS_KEY)) return;

    ensureModalDOM();
    const modal = document.getElementById('ttoVideoModal');
    const video = document.getElementById('ttoVideo');

    // set video src (idempotent)
    if (!video.src.endsWith('/trendsovertimeexplainer.mp4')) {
      video.src = 'assets/trendsovertimeexplainer.mp4';
    }

    modal.style.display = 'block';
    document.documentElement.style.overflow = 'hidden';

    // Try to autoplay with sound (triggered by click). If blocked, retry muted.
    (async () => {
      try {
        await video.play();
      } catch {
        try {
          video.muted = true;
          await video.play();
        } catch {
          // ignore
        }
      }
    })();

    const close = () => {
      modal.style.display = 'none';
      document.documentElement.style.overflow = '';
      try { video.pause(); } catch {}
      if (once) localStorage.setItem(LS_KEY, '1');
      modal.querySelector('.tto-backdrop').removeEventListener('click', onBackdrop);
      modal.querySelector('.tto-close').removeEventListener('click', onBtn);
      document.removeEventListener('keydown', onEsc);
    };

    const onBackdrop = (e) => {
      if (e.target.classList.contains('tto-backdrop')) close();
    };
    const onBtn = () => close();
    const onEsc = (e) => {
      if (e.key === 'Escape') close();
    };

    modal.querySelector('.tto-backdrop').addEventListener('click', onBackdrop);
    modal.querySelector('.tto-close').addEventListener('click', onBtn);
    document.addEventListener('keydown', onEsc);
  }

  // Expose a simple API
  window.showTrendsOverTimeTutorial = (opts = {}) => {
    const { once = false } = opts;
    openModal({ once });
  };
})();