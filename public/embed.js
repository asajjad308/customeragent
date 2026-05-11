(function () {
  'use strict';

  var config = window.SupportAIConfig || {};
  var botId = config.botId || 'default';
  var position = config.position || 'bottom-right';
  var primaryColor = config.primaryColor || '#6366F1';
  var greeting = config.greeting || "Hi! How can I help you?";

  var WIDGET_URL = (function () {
    var scripts = document.querySelectorAll('script[src*="embed.js"]');
    var src = scripts.length ? scripts[scripts.length - 1].src : '';
    try { return new URL(src).origin; } catch (_) { return window.location.origin; }
  })();

  var isOpen = false;
  var unreadCount = 0;
  var iframe = null;
  var launcher = null;
  var badge = null;
  var container = null;

  function positionStyle() {
    var base = 'position:fixed;bottom:24px;z-index:2147483647;';
    if (position === 'bottom-right') return base + 'right:24px;';
    if (position === 'bottom-left') return base + 'left:24px;';
    return base + 'left:50%;transform:translateX(-50%);';
  }

  function injectStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '.sai-container{' + positionStyle() + 'display:flex;flex-direction:column;align-items:flex-end;gap:12px;}',
      '.sai-iframe{width:380px;height:560px;border:none;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,0.18);transition:opacity 0.25s,transform 0.25s;transform-origin:bottom right;}',
      '.sai-iframe.hidden{opacity:0;transform:scale(0.9) translateY(20px);pointer-events:none;}',
      '.sai-launcher{width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.2);transition:transform 0.2s,box-shadow 0.2s;position:relative;outline:none;}',
      '.sai-launcher:hover{transform:scale(1.08);box-shadow:0 6px 24px rgba(0,0,0,0.25);}',
      '.sai-launcher:focus-visible{outline:3px solid ' + primaryColor + ';outline-offset:3px;}',
      '.sai-launcher svg{width:26px;height:26px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}',
      '.sai-badge{position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;border-radius:50%;width:18px;height:18px;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #fff;transition:opacity 0.2s;}',
      '.sai-badge.hidden{opacity:0;}',
      '@media(max-width:480px){.sai-iframe{width:100vw!important;height:100dvh!important;bottom:0!important;right:0!important;left:0!important;border-radius:0!important;position:fixed!important;top:0!important;}.sai-container{bottom:16px;right:16px;}}',
    ].join('');
    document.head.appendChild(style);
  }

  function buildLauncher() {
    container = document.createElement('div');
    container.className = 'sai-container';

    iframe = document.createElement('iframe');
    iframe.className = 'sai-iframe hidden';
    iframe.src = WIDGET_URL + '/widget?botId=' + encodeURIComponent(botId);
    iframe.title = 'SupportAI Chat';
    iframe.setAttribute('allow', 'clipboard-write');

    launcher = document.createElement('button');
    launcher.className = 'sai-launcher';
    launcher.style.background = primaryColor;
    launcher.setAttribute('aria-label', 'Open chat');
    launcher.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

    badge = document.createElement('span');
    badge.className = 'sai-badge hidden';
    badge.textContent = '1';
    launcher.appendChild(badge);

    launcher.addEventListener('click', toggleWidget);
    launcher.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleWidget(); }
    });

    container.appendChild(iframe);
    container.appendChild(launcher);
    document.body.appendChild(container);

    // Show unread badge after 3s to simulate a greeting message
    setTimeout(function () {
      if (!isOpen) { unreadCount = 1; updateBadge(); }
    }, 3000);
  }

  function toggleWidget() {
    isOpen = !isOpen;
    if (isOpen) {
      iframe.classList.remove('hidden');
      launcher.setAttribute('aria-label', 'Close chat');
      launcher.innerHTML = '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      unreadCount = 0;
      updateBadge();
    } else {
      iframe.classList.add('hidden');
      launcher.setAttribute('aria-label', 'Open chat');
      launcher.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
      var b = document.createElement('span');
      b.className = 'sai-badge hidden';
      b.textContent = '1';
      launcher.appendChild(b);
      badge = b;
    }
  }

  function updateBadge() {
    if (!badge) return;
    if (unreadCount > 0) {
      badge.textContent = String(unreadCount);
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  // Listen for close events from iframe
  window.addEventListener('message', function (e) {
    if (e.data === 'sai:close' && isOpen) toggleWidget();
    if (e.data === 'sai:unread' && !isOpen) { unreadCount += 1; updateBadge(); }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { injectStyles(); buildLauncher(); });
  } else {
    injectStyles();
    buildLauncher();
  }
})();
