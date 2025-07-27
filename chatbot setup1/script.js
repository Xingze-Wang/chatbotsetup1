document.addEventListener('DOMContentLoaded', () => {
    console.log('[DEBUG] DOM is fully loaded. Initializing script...');

    const chatLog = document.getElementById('chat-log');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button'); // 获取发送按钮

    // --- API 配置 ---
    const API_URL = '/api/chat';
    console.warn('[SECURITY] API Key is exposed on the client-side. For development only.');
    console.log(`[CONFIG] API Endpoint set to: ${API_URL}`);
    
    // --- 事件监听器 ---

    // ✅ 新增: 监听输入框的键盘事件，实现回车发送
    userInput.addEventListener('keydown', (event) => {
        // 检查是否按下了 Enter 键，并且没有同时按住 Shift 键
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // 阻止默认的回车换行行为
            sendButton.click();     // 模拟点击发送按钮来提交表单
        }
    });

    // 监听表单提交事件 (通过点击按钮或按回车触发)
    chatForm.addEventListener('submit', async (event) => {
        console.log('[EVENT] Form submitted.');
        event.preventDefault();
        
        const userMessage = userInput.value.trim();
        if (userMessage === '') return;

        addMessage('You', userMessage);
        userInput.value = '';
        userInput.style.height = 'auto'; // 重置输入框高度

        const typingIndicator = addTypingIndicator();

        try {
            const aiResponse = await getGeminiResponse(userMessage);
            typingIndicator.remove();
            addMessage('AI', aiResponse);
        } catch (error) {
            typingIndicator.remove();
            console.error('[CRITICAL ERROR] Failed to get AI response. Full error object:', error);
            addMessage('AI', '抱歉，连接时出现问题。(详情请查看控制台)');
        }
    });
    
    // --- 核心功能函数 ---

    /**
     * 调用 Gemini API 获取回复
     * @param {string} prompt - 用户的当前输入
     * @returns {Promise<string>} AI 生成的回复
     */
    async function getGeminiResponse(prompt, signal) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: prompt }),
                signal: signal, // Pass the abort signal to the fetch request
            });

            if (!response.ok) {
                const errorData = await response.json();
                // Display a more user-friendly error from the server's clean response
                throw new Error(errorData.error || 'The server returned an error.');
            }

            const data = await response.json();
            
            // **This is the key fix:**
            // We now expect a simple object like { reply: "..." } from our backend.
            // This is much cleaner and more robust than parsing the complex API response here.
            return data.reply;

        } catch (error) {
            // If the request was aborted, re-throw the error so we can handle it in sendMessage
            if (error.name === 'AbortError') {
                throw error;
            }
            console.error('Error fetching Gemini response:', error);
            return "Sorry, I'm having trouble connecting to the server.";
        }
    }
    // --- UI 辅助函数 ---

    function addMessage(sender, message) {
        const messageElement = createMessageElement(sender, message);
        chatLog.appendChild(messageElement);
        scrollToBottom();
    }
    
    function addTypingIndicator() {
        const indicatorElement = createMessageElement('AI', '正在输入...', true);
        chatLog.appendChild(indicatorElement);
        scrollToBottom();
        return indicatorElement;
    }

    function createMessageElement(sender, message, isTyping = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        if (isTyping) {
            messageElement.classList.add('typing-indicator');
        }
        const senderElement = document.createElement('p');
        senderElement.classList.add('message-sender');
        if (sender === 'AI') {
            senderElement.classList.add('ai');
        }
        senderElement.textContent = sender;
        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        contentElement.innerHTML = `<p>${message.replace(/\n/g, '<br>')}</p>`;
        messageElement.appendChild(senderElement);
        messageElement.appendChild(contentElement);
        return messageElement;
    }

    function scrollToBottom() {
        chatLog.scrollTop = chatLog.scrollHeight;
    }
});