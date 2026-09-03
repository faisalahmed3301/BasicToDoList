(() => {
  const CLOSE_SVG = `<svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16"><path fillRule="evenodd" clipRule="evenodd" d="M12.4697 13.5303L13 14.0607L14.0607 13L13.5303 12.4697L9.06065 7.99999L13.5303 3.53032L14.0607 2.99999L13 1.93933L12.4697 2.46966L7.99999 6.93933L3.53032 2.46966L2.99999 1.93933L1.93933 2.99999L2.46966 3.53032L6.93933 7.99999L2.46966 12.4697L1.93933 13L2.99999 14.0607L3.53032 13.5303L7.99999 9.06065L12.4697 13.5303Z"/></svg>`;

  const UNDO_SVG = `<svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16"><path fillRule="evenodd" clipRule="evenodd" d="M13.5 8C13.5 4.96643 11.0257 2.5 7.96452 2.5C5.42843 2.5 3.29365 4.19393 2.63724 6.5H5.25H6V8H5.25H0.75C0.335787 8 0 7.66421 0 7.25V2.75V2H1.5V2.75V5.23347C2.57851 2.74164 5.06835 1 7.96452 1C11.8461 1 15 4.13001 15 8C15 11.87 11.8461 15 7.96452 15C5.62368 15 3.54872 13.8617 2.27046 12.1122L1.828 11.5066L3.03915 10.6217L3.48161 11.2273C4.48831 12.6051 6.12055 13.5 7.96452 13.5C11.0257 13.5 13.5 11.0336 13.5 8Z"/></svg>`;

  let toastId = 0;
  const toasts = new Map();

  function getContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function createToast(options) {
    const id = toastId++;
    const {
      text,
      type = 'message',
      preserve = false,
      action,
      onAction,
      onUndoAction
    } = options;

    const container = getContainer();

    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.style.width = '420px';
    el.style.position = 'relative';
    el.style.right = '0';
    el.style.bottom = '0';

    const body = document.createElement('div');
    body.className = 'toast-body';

    const row = document.createElement('div');
    row.className = 'toast-row';

    const textSpan = document.createElement('span');
    textSpan.className = 'toast-text';
    textSpan.textContent = text;
    row.appendChild(textSpan);

    if (!action) {
      const btnRow = document.createElement('div');
      btnRow.className = 'toast-btn-row';

      if (onUndoAction) {
        const undoBtn = document.createElement('button');
        undoBtn.className = 'toast-icon-btn';
        undoBtn.innerHTML = UNDO_SVG;
        undoBtn.onclick = () => {
          onUndoAction();
          dismiss();
        };
        btnRow.appendChild(undoBtn);
      }

      const closeBtn = document.createElement('button');
      closeBtn.className = 'toast-icon-btn';
      closeBtn.innerHTML = CLOSE_SVG;
      closeBtn.onclick = () => dismiss();
      btnRow.appendChild(closeBtn);

      row.appendChild(btnRow);
    }

    body.appendChild(row);

    if (action) {
      const actionRow = document.createElement('div');
      actionRow.className = 'toast-action-row';

      const dismissBtn = document.createElement('button');
      dismissBtn.className = 'toast-action-btn toast-action-dismiss';
      dismissBtn.textContent = 'Dismiss';
      dismissBtn.onclick = () => dismiss();
      actionRow.appendChild(dismissBtn);

      const primaryBtn = document.createElement('button');
      primaryBtn.className = 'toast-action-btn toast-action-primary';
      primaryBtn.textContent = action;
      primaryBtn.onclick = () => {
        if (onAction) onAction();
        dismiss();
      };
      actionRow.appendChild(primaryBtn);

      body.appendChild(actionRow);
    }

    el.appendChild(body);
    container.appendChild(el);

    let timeout = null;
    let remaining = 3000;
    let start = Date.now();

    function dismiss() {
      el.classList.remove('show');
      el.classList.add('hiding');
      setTimeout(() => {
        el.remove();
        toasts.delete(id);
        updateContainerHeight();
      }, 350);
      if (timeout) clearTimeout(timeout);
      toasts.delete(id);
    }

    function pause() {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
        remaining -= Date.now() - start;
      }
    }

    function resume() {
      if (!timeout) {
        start = Date.now();
        timeout = setTimeout(dismiss, remaining);
      }
    }

    const toastObj = { id, el, pause, resume, dismiss };
    toasts.set(id, toastObj);

    if (!preserve) {
      timeout = setTimeout(dismiss, remaining);
      el.addEventListener('mouseenter', pause);
      el.addEventListener('mouseleave', resume);
    }

    requestAnimationFrame(() => {
      el.classList.add('show');
    });

    updateContainerHeight();
    return toastObj;
  }

  function updateContainerHeight() {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const items = container.querySelectorAll('.toast');
    let totalHeight = 0;
    items.forEach((item, i) => {
      totalHeight += item.offsetHeight;
      if (i < items.length - 1) totalHeight += 10;
    });
    container.style.height = totalHeight + 'px';
  }

  window.toast = {
    message(text, opts = {}) {
      if (typeof text === 'string') {
        return createToast({ text, type: 'message', ...opts });
      }
      return createToast({ ...text, type: text.type || 'message' });
    },
    success(text, opts = {}) {
      return createToast({ text, type: 'success', ...opts });
    },
    warning(text, opts = {}) {
      return createToast({ text, type: 'warning', ...opts });
    },
    error(text, opts = {}) {
      return createToast({ text, type: 'error', ...opts });
    }
  };
})();
