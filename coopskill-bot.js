(function () {
  const config = window.CoopSkillBotConfig || {};
  const apiUrl = config.apiUrl || 'http://localhost:8000/chat';
  const userContext = config.userContext || window.CoopSkillUserContext || {};

  const style = `
    <style>
      .coopskill-bot-widget {
        position: fixed;
        right: 24px;
        bottom: 24px;
        z-index: 9999;
        font-family: Arial, sans-serif;
      }
      .coopskill-bot-toggle {
        background: #1f6feb;
        color: white;
        border: none;
        border-radius: 999px;
        width: 62px;
        height: 62px;
        font-size: 26px;
        cursor: pointer;
        box-shadow: 0 12px 28px rgba(31, 111, 235, 0.3);
      }
      .coopskill-bot-panel {
        position: absolute;
        right: 0;
        bottom: 78px;
        width: 360px;
        max-width: 88vw;
        height: 470px;
        background: #ffffff;
        border: 1px solid #dfe6f1;
        border-radius: 18px;
        box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
        display: none;
        overflow: hidden;
      }
      .coopskill-bot-panel.open {
        display: block;
      }
      .coopskill-bot-header {
        background: linear-gradient(135deg, #1f6feb, #5b8def);
        color: white;
        padding: 14px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
      }
      .coopskill-bot-messages {
        height: 320px;
        overflow-y: auto;
        padding: 16px;
        background: #f7f9fc;
      }
      .coopskill-bot-message {
        margin-bottom: 12px;
        max-width: 82%;
        padding: 10px 12px;
        border-radius: 12px;
        line-height: 1.45;
        font-size: 14px;
      }
      .coopskill-bot-message.user {
        margin-left: auto;
        background: #dfeafc;
        color: #153e75;
      }
      .coopskill-bot-message.bot {
        background: white;
        border: 1px solid #e5ebf3;
        color: #1e293b;
      }
      .coopskill-bot-form {
        display: flex;
        gap: 8px;
        padding: 12px;
        border-top: 1px solid #edf2f7;
        background: white;
      }
      .coopskill-bot-input {
        flex: 1;
        border: 1px solid #dfe6f1;
        border-radius: 10px;
        padding: 10px 12px;
        font-size: 14px;
      }
      .coopskill-bot-send {
        border: none;
        background: #1f6feb;
        color: white;
        border-radius: 10px;
        padding: 10px 14px;
        cursor: pointer;
        font-weight: 600;
      }
      .coopskill-bot-status {
        font-size: 12px;
        color: #64748b;
        padding: 0 16px 10px;
      }
    </style>
  `;

  const container = document.createElement('div');
  container.className = 'coopskill-bot-widget';
  container.innerHTML = `
    ${style}
    <div class="coopskill-bot-panel" id="coopskill-bot-panel">
      <div class="coopskill-bot-header">
        <span>CoopSkill Assistant</span>
        <button type="button" id="coopskill-bot-close" aria-label="Close chat" style="background: transparent; color: white; border: none; font-size: 22px; cursor: pointer;">×</button>
      </div>
      <div class="coopskill-bot-messages" id="coopskill-bot-messages">
        <div class="coopskill-bot-message bot">Hi! I can help with skill gaps, learning plans, and course recommendations.</div>
      </div>
      <div class="coopskill-bot-status" id="coopskill-bot-status">Ready</div>
      <form class="coopskill-bot-form" id="coopskill-bot-form">
        <input id="coopskill-bot-input" class="coopskill-bot-input" type="text" placeholder="Ask about your skills..." />
        <button class="coopskill-bot-send" type="submit">Send</button>
      </form>
    </div>
    <button type="button" class="coopskill-bot-toggle" id="coopskill-bot-toggle" aria-label="Open chatbot">💬</button>
  `;

  document.body.appendChild(container);

  const panel = document.getElementById('coopskill-bot-panel');
  const toggle = document.getElementById('coopskill-bot-toggle');
  const closeButton = document.getElementById('coopskill-bot-close');
  const form = document.getElementById('coopskill-bot-form');
  const input = document.getElementById('coopskill-bot-input');
  const messages = document.getElementById('coopskill-bot-messages');
  const status = document.getElementById('coopskill-bot-status');

  function addMessage(text, type) {
    const message = document.createElement('div');
    message.className = `coopskill-bot-message ${type}`;
    message.textContent = text;
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
  }

  function togglePanel() {
    panel.classList.toggle('open');
  }

  toggle.addEventListener('click', togglePanel);
  closeButton.addEventListener('click', togglePanel);

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    input.value = '';
    status.textContent = 'Thinking...';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          user_context: userContext,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Unable to get a response.');
      }

      addMessage(data.reply, 'bot');
      status.textContent = 'Ready';
    } catch (error) {
      addMessage(error.message || 'Something went wrong.', 'bot');
      status.textContent = 'Error';
    }
  });
})();
