// ========== Scrollbar verbergen op elementen met [disable-scroll] ==========
function applyDisableScrollAttribute() {
    document.querySelectorAll('[disable-scroll]').forEach(el => {
      el.style.overflow = 'auto'; // keep scrolling possible
      el.style.scrollbarWidth = 'none'; // Firefox
      el.style.msOverflowStyle = 'none'; // IE 10+
      el.classList.add('hide-scrollbar'); // for WebKit
    });
  }
  
  // Inject CSS om WebKit scrollbars te verbergen
  const style = document.createElement('style');
  style.innerHTML = `
    [disable-scroll].hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
  `;
  document.head.appendChild(style);
  
  applyDisableScrollAttribute();
  const observer = new MutationObserver(applyDisableScrollAttribute);
  observer.observe(document.body, { childList: true, subtree: true });
  
  // ========== Scroll automatisch naar onderen op [message-scroll] ==========
  window.addEventListener("load", () => {
    const el = document.querySelector('[message-scroll]');
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  });
  
  // ========== Haal conversaties op via API ==========
  (async () => {
    const userId = JSON.parse(localStorage.getItem('_ms-mem'))?.id;
    if (!userId) return console.error('❌ Geen user-id gevonden in localStorage (_ms-mem)');
  
    try {
      const res = await fetch(`https://api.projectnocode.be/api:aZtvruQz/messages/get_conversations?user=${userId}`);
      const data = await res.json();
  
      if (!Array.isArray(data)) {
        console.error('❌ Verwachte een array maar kreeg iets anders:', data);
        return;
      }
  
      const listContainer = document.querySelector('[data-conversations="list"]');
      const template = listContainer?.querySelector('[data="template"]');
      if (!listContainer || !template) {
        console.error('❌ Listcontainer of template ontbreekt in de DOM');
        return;
      }
  
      listContainer.innerHTML = '';
      const urlParams = new URLSearchParams(window.location.search);
      const selectedId = urlParams.get("id");
  
      const formatTime = (timestamp) => {
        const now = new Date();
        const date = new Date(timestamp);
        const diffMs = now - date;
        const diffMin = Math.ceil(diffMs / 60000);
        const diffHrs = Math.ceil(diffMs / 3600000);
  
        if (diffMin < 60) return `${diffMin} min ago`;
        if (diffHrs < 24) return `${diffHrs} hours ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      };
  
      data.forEach((item, index) => {
        const clone = template.cloneNode(true);
        clone.removeAttribute('data');
        clone.setAttribute('id', item.id);
  
        if (item.id === selectedId) {
          clone.classList.add('active');
        } else if (!selectedId && index === 0) {
          clone.classList.add('active');
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('id', item.id);
          window.history.replaceState({}, '', newUrl);
        }
  
        clone.querySelectorAll('[data]').forEach(el => {
          const key = el.getAttribute('data');
          const format = el.getAttribute('format');
          if (!key || !format || !(key in item)) return;
  
          switch (format) {
            case 'text':
              el.textContent = item[key];
              break;
            case 'background':
              el.style.backgroundImage = `url('${item[key]}')`;
              break;
            case 'time':
              el.textContent = formatTime(item[key]);
              break;
          }
        });
  
        listContainer.appendChild(clone);
      });
    } catch (err) {
      console.error('❌ Fout bij ophalen conversaties:', err);
    }
  })();