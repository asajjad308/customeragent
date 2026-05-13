(function () {
  'use strict';

  var cfg = window.SupportAIConfig || {};
  var agentId = cfg.agentId;
  var position = cfg.position || 'bottom-right';
  var themeOverride = cfg.theme || null;

  if (!agentId) {
    console.warn('[SupportAI] window.SupportAIConfig.agentId is required');
    return;
  }

  // ── Resolve base URL (same origin as widget.js src) ──────────────────────
  var scripts = document.querySelectorAll('script[src]');
  var baseUrl = '';
  for (var i = 0; i < scripts.length; i++) {
    var src = scripts[i].getAttribute('src') || '';
    if (src.indexOf('widget.js') !== -1) {
      try { baseUrl = new URL(src).origin; } catch (e) { baseUrl = ''; }
      break;
    }
  }

  // ── Themes ────────────────────────────────────────────────────────────────
  var THEMES = {
    SOFT_AURORA: {
      bg: '#ffffff',
      headerBg: '#ffffff',
      headerBorder: '1px solid #e8e8ed',
      headerText: '#09090b',
      subText: '#71717a',
      inputBg: '#f4f4f5',
      inputBorder: '1px solid #e4e4e7',
      inputFocusBorder: '#2563eb',
      userBubble: '#2563eb',
      userText: '#ffffff',
      botBubble: '#f4f4f5',
      botText: '#09090b',
      botBorder: '1px solid #e4e4e7',
      windowBg: '#fafafa',
      shadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)',
      radius: '16px',
      sendBg: '#2563eb',
      sendHover: '#1d4ed8',
      chipBg: '#f4f4f5',
      chipBorder: '1px solid #e4e4e7',
      chipText: '#52525b',
      statusColor: '#16a34a',
      btnShadow: '0 4px 12px rgba(37,99,235,0.4)',
    },
    GLASSMORPHISM_DARK: {
      bg: 'rgba(18,18,20,0.92)',
      headerBg: 'rgba(26,26,30,0.95)',
      headerBorder: '1px solid rgba(255,255,255,0.08)',
      headerText: '#fafafa',
      subText: '#71717a',
      inputBg: 'rgba(255,255,255,0.06)',
      inputBorder: '1px solid rgba(255,255,255,0.1)',
      inputFocusBorder: '#3b82f6',
      userBubble: '#3b82f6',
      userText: '#ffffff',
      botBubble: 'rgba(255,255,255,0.07)',
      botText: '#e4e4e7',
      botBorder: '1px solid rgba(255,255,255,0.08)',
      windowBg: 'rgba(12,12,15,0.97)',
      shadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
      radius: '20px',
      sendBg: '#3b82f6',
      sendHover: '#2563eb',
      chipBg: 'rgba(255,255,255,0.06)',
      chipBorder: '1px solid rgba(255,255,255,0.1)',
      chipText: '#a1a1aa',
      statusColor: '#4ade80',
      btnShadow: '0 4px 20px rgba(59,130,246,0.5)',
      blur: 'blur(20px)',
    },
    NEO_BRUTALISM: {
      bg: '#ffffff',
      headerBg: '#ffdd00',
      headerBorder: '3px solid #000000',
      headerText: '#000000',
      subText: '#333333',
      inputBg: '#ffffff',
      inputBorder: '2px solid #000000',
      inputFocusBorder: '#000000',
      userBubble: '#000000',
      userText: '#ffdd00',
      botBubble: '#ffffff',
      botText: '#000000',
      botBorder: '2px solid #000000',
      windowBg: '#f5f5f5',
      shadow: '4px 4px 0 #000000',
      radius: '0px',
      sendBg: '#000000',
      sendHover: '#333333',
      chipBg: '#ffdd00',
      chipBorder: '2px solid #000000',
      chipText: '#000000',
      statusColor: '#16a34a',
      btnShadow: '3px 3px 0 #000',
    },
  };

  // ── State ─────────────────────────────────────────────────────────────────
  var agent = null;
  var history = [];
  var isOpen = false;
  var isStreaming = false;
  var abortCtrl = null;

  // ── DOM refs ──────────────────────────────────────────────────────────────
  var btn, panel, messagesEl, inputEl, sendBtn, chipsEl, typingEl;

  // ── Position helpers ──────────────────────────────────────────────────────
  function posStyle() {
    var right = position.indexOf('right') !== -1;
    var bottom = position.indexOf('top') === -1;
    return {
      side: right ? 'right' : 'left',
      vert: bottom ? 'bottom' : 'top',
    };
  }

  // ── CSS injection ─────────────────────────────────────────────────────────
  function injectCSS(t) {
    var pos = posStyle();
    var css = [
      '#sai-btn{position:fixed;' + pos.vert + ':20px;' + pos.side + ':20px;z-index:2147483646;width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s;box-shadow:' + t.btnShadow + ';}',
      '#sai-btn:hover{transform:scale(1.08);}',
      '#sai-btn svg{transition:transform .25s;}',
      '#sai-btn.open .sai-icon-chat{display:none;}',
      '#sai-btn.open .sai-icon-close{display:block!important;}',
      '#sai-panel{position:fixed;' + pos.vert + ':84px;' + pos.side + ':16px;z-index:2147483645;width:360px;height:560px;max-height:calc(100vh - 100px);display:flex;flex-direction:column;border-radius:' + t.radius + ';background:' + t.windowBg + ';box-shadow:' + t.shadow + ';overflow:hidden;transform-origin:' + (pos.side === 'right' ? 'bottom right' : 'bottom left') + ';transition:transform .25s cubic-bezier(.34,1.56,.64,1),opacity .2s;transform:scale(0.85);opacity:0;pointer-events:none;}',
      (t.blur ? '#sai-panel{backdrop-filter:' + t.blur + ';-webkit-backdrop-filter:' + t.blur + ';}' : ''),
      '#sai-panel.open{transform:scale(1);opacity:1;pointer-events:all;}',
      '#sai-header{display:flex;align-items:center;gap:10px;padding:12px 14px;background:' + t.headerBg + ';border-bottom:' + t.headerBorder + ';flex-shrink:0;}',
      '#sai-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;flex-shrink:0;}',
      '#sai-agent-name{font-size:13px;font-weight:600;color:' + t.headerText + ';font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}',
      '#sai-status{display:flex;align-items:center;gap:4px;font-size:10px;color:' + t.subText + ';font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}',
      '.sai-dot{width:6px;height:6px;border-radius:50%;background:' + t.statusColor + ';animation:sai-pulse 2s infinite;}',
      '@keyframes sai-pulse{0%,100%{transform:scale(1);opacity:1;}50%{transform:scale(1.4);opacity:.6;}}',
      '#sai-messages{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;background:' + t.windowBg + ';}',
      '#sai-messages::-webkit-scrollbar{width:4px;}',
      '#sai-messages::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.15);border-radius:4px;}',
      '.sai-msg{display:flex;max-width:82%;}',
      '.sai-msg.user{align-self:flex-end;}',
      '.sai-msg.bot{align-self:flex-start;}',
      '.sai-bubble{padding:9px 12px;border-radius:16px;font-size:13px;line-height:1.55;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;word-break:break-word;white-space:pre-wrap;}',
      '.sai-msg.user .sai-bubble{background:' + t.userBubble + ';color:' + t.userText + ';border-bottom-right-radius:4px;}',
      '.sai-msg.bot .sai-bubble{background:' + t.botBubble + ';color:' + t.botText + ';border:' + t.botBorder + ';border-bottom-left-radius:4px;}',
      '#sai-typing{align-self:flex-start;display:none;}',
      '#sai-typing.visible{display:flex;}',
      '.sai-dots{display:flex;align-items:center;gap:3px;padding:10px 14px;background:' + t.botBubble + ';border:' + t.botBorder + ';border-radius:16px;border-bottom-left-radius:4px;}',
      '.sai-dot-b{width:6px;height:6px;border-radius:50%;background:' + t.subText + ';animation:sai-bounce .9s infinite;}',
      '.sai-dot-b:nth-child(2){animation-delay:.15s;}',
      '.sai-dot-b:nth-child(3){animation-delay:.3s;}',
      '@keyframes sai-bounce{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-5px);}}',
      '#sai-chips{display:flex;gap:6px;flex-wrap:wrap;padding:6px 12px 0;flex-shrink:0;}',
      '.sai-chip{padding:5px 10px;border-radius:20px;background:' + t.chipBg + ';border:' + t.chipBorder + ';color:' + t.chipText + ';font-size:11px;cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;transition:opacity .15s;}',
      '.sai-chip:hover{opacity:.75;}',
      '#sai-footer{padding:10px 12px 12px;background:' + t.bg + ';border-top:' + t.headerBorder + ';flex-shrink:0;}',
      '#sai-form{display:flex;align-items:center;gap:8px;background:' + t.inputBg + ';border:' + t.inputBorder + ';border-radius:12px;padding:6px 6px 6px 12px;transition:border-color .15s;}',
      '#sai-form:focus-within{border-color:' + t.inputFocusBorder + ';}',
      '#sai-input{flex:1;border:none;background:transparent;font-size:13px;color:' + t.botText + ';outline:none;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;resize:none;max-height:80px;line-height:1.4;}',
      '#sai-input::placeholder{color:' + t.subText + ';}',
      '#sai-send{width:32px;height:32px;border-radius:8px;border:none;background:' + t.sendBg + ';color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s,transform .1s;flex-shrink:0;}',
      '#sai-send:hover{background:' + t.sendHover + ';}',
      '#sai-send:active{transform:scale(0.94);}',
      '#sai-send:disabled{opacity:.4;cursor:not-allowed;}',
      '#sai-branding{text-align:center;font-size:10px;color:' + t.subText + ';margin-top:6px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}',
      '#sai-branding a{color:inherit;text-decoration:none;}',
      '.sai-slots{background:' + t.botBubble + ';border:' + t.botBorder + ';border-radius:12px;padding:10px;margin:0;align-self:flex-start;max-width:90%;}',
      '.sai-slots-title{font-size:11px;font-weight:600;color:' + t.headerText + ';margin-bottom:8px;font-family:-apple-system,sans-serif;display:flex;align-items:center;gap:4px;}',
      '.sai-slots-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;}',
      '.sai-slot-btn{padding:6px 10px;background:' + t.bg + ';border:' + t.inputBorder + ';border-radius:8px;font-size:11px;font-weight:500;color:' + t.botText + ';cursor:pointer;font-family:-apple-system,sans-serif;text-align:left;display:flex;align-items:center;gap:4px;transition:border-color .15s;}',
      '.sai-slot-btn:hover{border-color:' + t.inputFocusBorder + ';}',
      '.sai-confirmed{background:#dcfce7;border:1px solid #86efac;border-radius:12px;padding:10px;align-self:flex-start;max-width:90%;}',
      '.sai-confirmed-title{font-size:11px;font-weight:600;color:#16a34a;margin-bottom:4px;font-family:-apple-system,sans-serif;display:flex;align-items:center;gap:4px;}',
      '.sai-confirmed-summary{font-size:11px;font-weight:500;color:#166534;font-family:-apple-system,sans-serif;margin-bottom:2px;}',
      '.sai-confirmed-time{font-size:10px;color:#4b7c59;font-family:-apple-system,sans-serif;margin-bottom:6px;}',
      '.sai-confirmed-link{font-size:10px;color:#16a34a;text-decoration:underline;font-family:-apple-system,sans-serif;}',
      '@media(max-width:420px){#sai-panel{width:calc(100vw - 24px);' + pos.side + ':12px;}}',
    ].join('');

    var el = document.createElement('style');
    el.id = 'sai-style';
    el.textContent = css;
    document.head.appendChild(el);
  }

  // ── Build DOM ─────────────────────────────────────────────────────────────
  function buildDOM(ag) {
    var t = THEMES[ag.widgetTheme] || THEMES.SOFT_AURORA;
    if (themeOverride && THEMES[themeOverride]) t = THEMES[themeOverride];

    injectCSS(t);

    // Launcher button
    btn = document.createElement('button');
    btn.id = 'sai-btn';
    btn.setAttribute('aria-label', 'Open chat');
    btn.style.background = ag.widgetColor || ag.avatarColor || '#2563eb';
    btn.innerHTML = [
      '<svg class="sai-icon-chat" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
      '</svg>',
      '<svg class="sai-icon-close" style="display:none" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">',
      '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
      '</svg>',
    ].join('');
    btn.addEventListener('click', togglePanel);
    document.body.appendChild(btn);

    // Chat panel
    panel = document.createElement('div');
    panel.id = 'sai-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', ag.name + ' chat');
    panel.innerHTML = [
      // Header
      '<div id="sai-header">',
      '  <div id="sai-avatar" style="background:' + (ag.avatarColor || '#2563eb') + '">' + ag.name.charAt(0).toUpperCase() + '</div>',
      '  <div style="flex:1;min-width:0">',
      '    <div id="sai-agent-name">' + escHtml(ag.name) + '</div>',
      '    <div id="sai-status"><span class="sai-dot"></span>Online</div>',
      '  </div>',
      '  <button id="sai-close" onclick="document.getElementById(\'sai-btn\').click()" style="background:none;border:none;cursor:pointer;padding:4px;color:' + t.subText + ';display:flex;align-items:center;" aria-label="Close">',
      '    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      '  </button>',
      '</div>',
      // Messages
      '<div id="sai-messages">',
      '  <div id="sai-typing"><div class="sai-dots"><div class="sai-dot-b"></div><div class="sai-dot-b"></div><div class="sai-dot-b"></div></div></div>',
      '</div>',
      // Quick-reply chips
      '<div id="sai-chips"></div>',
      // Input
      '<div id="sai-footer">',
      '  <div id="sai-form">',
      '    <textarea id="sai-input" rows="1" placeholder="Type a message…" aria-label="Message"></textarea>',
      '    <button id="sai-send" aria-label="Send" disabled>',
      '      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
      '    </button>',
      '  </div>',
      '  <div id="sai-branding">Powered by <a href="' + baseUrl + '" target="_blank" rel="noopener">SupportAI</a></div>',
      '</div>',
    ].join('');
    document.body.appendChild(panel);

    // Wire up refs
    messagesEl = document.getElementById('sai-messages');
    typingEl   = document.getElementById('sai-typing');
    inputEl    = document.getElementById('sai-input');
    sendBtn    = document.getElementById('sai-send');
    chipsEl    = document.getElementById('sai-chips');

    // Typing expand
    inputEl.addEventListener('input', function () {
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 80) + 'px';
      sendBtn.disabled = !inputEl.value.trim() || isStreaming;
    });

    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });

    sendBtn.addEventListener('click', sendMessage);

    // Render greeting
    appendMessage('bot', ag.greeting || 'Hi! How can I help you today?');

    // Quick replies
    if (ag.quickReplies && ag.quickReplies.length) {
      renderChips(ag.quickReplies.slice(0, 4));
    }
  }

  // ── Panel toggle ──────────────────────────────────────────────────────────
  function togglePanel() {
    isOpen = !isOpen;
    btn.classList.toggle('open', isOpen);
    panel.classList.toggle('open', isOpen);
    if (isOpen) setTimeout(function () { inputEl.focus(); }, 280);
  }

  // ── Message rendering ─────────────────────────────────────────────────────
  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function appendMessage(role, text) {
    // Remove typing indicator first
    if (typingEl.parentNode === messagesEl) messagesEl.removeChild(typingEl);

    var wrap = document.createElement('div');
    wrap.className = 'sai-msg ' + role;
    var bubble = document.createElement('div');
    bubble.className = 'sai-bubble';
    bubble.textContent = text;
    wrap.appendChild(bubble);
    messagesEl.appendChild(wrap);
    messagesEl.appendChild(typingEl); // always keep typing at bottom
    scrollBottom();
    return bubble;
  }

  function showTyping() {
    typingEl.classList.add('visible');
    scrollBottom();
  }

  function hideTyping() {
    typingEl.classList.remove('visible');
  }

  function scrollBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function renderChips(replies) {
    chipsEl.innerHTML = '';
    replies.forEach(function (r) {
      var chip = document.createElement('button');
      chip.className = 'sai-chip';
      chip.textContent = r;
      chip.addEventListener('click', function () {
        inputEl.value = r;
        chipsEl.innerHTML = '';
        sendMessage();
      });
      chipsEl.appendChild(chip);
    });
  }

  // ── Booking UI helpers ────────────────────────────────────────────────────
  function formatDateLabel(dateStr) {
    try {
      var d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    } catch (e) { return dateStr; }
  }

  function formatDateTimeLabel(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
      });
    } catch (e) { return iso; }
  }

  function renderBookingSlots(date, slots) {
    if (typingEl.parentNode === messagesEl) messagesEl.removeChild(typingEl);

    var wrap = document.createElement('div');
    wrap.className = 'sai-slots';

    var title = document.createElement('div');
    title.className = 'sai-slots-title';
    title.innerHTML = '&#128197; Available on ' + escHtml(formatDateLabel(date));
    wrap.appendChild(title);

    var grid = document.createElement('div');
    grid.className = 'sai-slots-grid';

    if (!slots || slots.length === 0) {
      grid.style.display = 'block';
      grid.style.fontSize = '11px';
      grid.style.color = '#71717a';
      grid.textContent = 'No available slots on this date.';
    } else {
      slots.forEach(function (slot) {
        var btn = document.createElement('button');
        btn.className = 'sai-slot-btn';
        btn.innerHTML = '&#128336; ' + escHtml(slot.label);
        btn.addEventListener('click', function () {
          if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
          // Force-end any in-progress stream so the message can be sent immediately
          isStreaming = false;
          if (abortCtrl) { try { abortCtrl.abort(); } catch(e) {} abortCtrl = null; }
          inputEl.value = "I'd like the " + slot.label + ' slot (start: ' + slot.start + ', end: ' + slot.end + ')';
          sendMessage();
        });
        grid.appendChild(btn);
      });
    }
    wrap.appendChild(grid);
    messagesEl.appendChild(wrap);
    messagesEl.appendChild(typingEl);
    scrollBottom();
  }

  function renderBookingConfirmed(event) {
    // Remove any open slot pickers
    var existing = messagesEl.querySelectorAll('.sai-slots');
    for (var i = 0; i < existing.length; i++) {
      if (existing[i].parentNode) existing[i].parentNode.removeChild(existing[i]);
    }
    if (typingEl.parentNode === messagesEl) messagesEl.removeChild(typingEl);

    var wrap = document.createElement('div');
    wrap.className = 'sai-confirmed';

    var title = document.createElement('div');
    title.className = 'sai-confirmed-title';
    title.innerHTML = '&#10003; Appointment Confirmed';
    wrap.appendChild(title);

    if (event.summary) {
      var summary = document.createElement('div');
      summary.className = 'sai-confirmed-summary';
      summary.textContent = event.summary;
      wrap.appendChild(summary);
    }

    if (event.start) {
      var timeEl = document.createElement('div');
      timeEl.className = 'sai-confirmed-time';
      timeEl.textContent = formatDateTimeLabel(event.start);
      wrap.appendChild(timeEl);
    }

    if (event.htmlLink) {
      var link = document.createElement('a');
      link.className = 'sai-confirmed-link';
      link.href = event.htmlLink;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Open in Google Calendar →';
      wrap.appendChild(link);
    }

    messagesEl.appendChild(wrap);
    messagesEl.appendChild(typingEl);
    scrollBottom();
  }

  // ── Send + stream ─────────────────────────────────────────────────────────
  function sendMessage() {
    var text = (inputEl.value || '').trim();
    if (!text || isStreaming) return;

    inputEl.value = '';
    inputEl.style.height = 'auto';
    sendBtn.disabled = true;
    chipsEl.innerHTML = '';

    appendMessage('user', text);
    history.push({ role: 'user', content: text });

    showTyping();
    isStreaming = true;
    abortCtrl = typeof AbortController !== 'undefined' ? new AbortController() : null;

    fetch(baseUrl + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: agentId, message: text, history: history.slice(0, -1) }),
      signal: abortCtrl ? abortCtrl.signal : undefined,
    })
    .then(function (res) {
      if (!res.ok || !res.body) throw new Error('Stream error');
      hideTyping();

      var bubble = appendMessage('bot', '');
      var reader = res.body.getReader();
      var dec = new TextDecoder();
      var buf = '';
      var fullContent = '';

      function read() {
        reader.read().then(function (result) {
          if (result.done) {
            history.push({ role: 'assistant', content: fullContent });
            isStreaming = false;
            sendBtn.disabled = !inputEl.value.trim();
            // Show chips again after response
            if (agent && agent.quickReplies && agent.quickReplies.length) {
              renderChips(agent.quickReplies.slice(0, 4));
            }
            return;
          }
          buf += dec.decode(result.value, { stream: true });
          var lines = buf.split('\n');
          buf = lines.pop() || '';
          lines.forEach(function (line) {
            if (line.indexOf('data: ') !== 0) return;
            var payload = line.slice(6);
            if (payload === '[DONE]') return;
            try {
              var parsed = JSON.parse(payload);
              if (parsed.type === 'replace_content') {
                bubble.textContent = parsed.content || '';
                fullContent = parsed.content || '';
                scrollBottom();
              } else if (parsed.type === 'handoff') {
                var notice = document.createElement('div');
                notice.style.cssText = 'font-size:11px;text-align:center;color:#71717a;padding:6px 12px;background:rgba(37,99,235,0.06);border-radius:8px;margin:4px 0;font-family:-apple-system,sans-serif;';
                notice.textContent = '↪ Transferring to ' + (parsed.toAgentName || 'another agent') + '…';
                if (typingEl.parentNode === messagesEl) {
                  messagesEl.insertBefore(notice, typingEl);
                } else {
                  messagesEl.appendChild(notice);
                  messagesEl.appendChild(typingEl);
                }
                scrollBottom();
              } else if (parsed.type === 'booking_slots') {
                renderBookingSlots(parsed.date, parsed.slots);
              } else if (parsed.type === 'booking_confirmed') {
                renderBookingConfirmed(parsed.event);
              } else if (parsed.type === 'booking_error') {
                appendMessage('bot', parsed.message || 'Booking error. Please try again.');
              } else if (parsed.content) {
                fullContent += parsed.content;
                bubble.textContent = fullContent;
                scrollBottom();
              }
            } catch (e) {}
          });
          read();
        }).catch(function () {
          hideTyping();
          isStreaming = false;
          sendBtn.disabled = !inputEl.value.trim();
        });
      }
      read();
    })
    .catch(function (err) {
      if (err && err.name === 'AbortError') return;
      hideTyping();
      appendMessage('bot', 'Sorry, something went wrong. Please try again.');
      isStreaming = false;
      sendBtn.disabled = !inputEl.value.trim();
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    fetch(baseUrl + '/api/embed/' + agentId)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.error) { console.warn('[SupportAI]', data.error); return; }
        agent = data;
        buildDOM(data);
      })
      .catch(function (e) {
        console.warn('[SupportAI] Failed to load agent:', e);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
