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
  
 // ========= Mapping van types naar container-wrappers =========
const typeToWrapper = {
    conversations: '[inbox]',
    messages: '[message]',
    orders: '[orders]', // voorbeeld
  };

  // ========= Startpunt =========
  (async () => {
    const userId = JSON.parse(localStorage.getItem('_ms-mem'))?.id;
    if (!userId) return;
  
    const conversations = await fetchConversations(userId);
    if (!Array.isArray(conversations)) return;

    renderDataList('conversations', conversations);
  })();

  // ========= API Call voor conversaties =========
  async function fetchConversations(userId) {
    try {
      const res = await fetch(`https://api.projectnocode.be/api:aZtvruQz/messages/get_conversations?user=${userId}`);
      return await res.json();
    } catch {
      return null;
    }
  }
  
  // ========= Tijd formattering =========
  function formatTime(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now - date;
    const min = Math.ceil(diff / 60000);
    const hrs = Math.ceil(diff / 3600000);
  
    if (min < 60) return `${min} min ago`;
    if (hrs < 24) return `${hrs} hours ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  // ========= Render algemene lijst op basis van type =========
  function renderDataList(type, items) {
    const wrapperSelector = typeToWrapper[type];
    if (!wrapperSelector) return;
  
    const wrapper = document.querySelector(wrapperSelector);
    if (!wrapper) return;
  
    const list = wrapper.querySelector(`[data-${type}="list"]`);
    const template = list?.querySelector('[data="template"]');
    if (!list || !template) return;
  
    const urlParams = new URLSearchParams(window.location.search);
    const selectedId = urlParams.get("id");
  
    list.innerHTML = '';
  
    items.forEach((item, index) => {
      const isActive = item.id === selectedId || (!selectedId && index === 0);
      const node = buildItemFromTemplate(item, template, isActive);
  
      if (!selectedId && index === 0) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('id', item.id);
        window.history.replaceState({}, '', newUrl);
      }
  
      list.appendChild(node);
    });
  }

  // ========= Template kopiëren en invullen =========
  function buildItemFromTemplate(item, template, isActive) {
    const clone = template.cloneNode(true);
    clone.removeAttribute('data');
    clone.setAttribute('id', item.id);
    if (isActive) clone.classList.add('active');

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

    return clone;
  }