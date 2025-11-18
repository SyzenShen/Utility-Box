// 状态管理
const state = {
    papers: [],
    currentIndex: 0,
    savedPapers: [],
    isDragging: false,
    startX: 0,
    startY: 0,
    currentCard: null
};

// API配置（支持外部配置文件）
let API_URL = 'http://localhost:5000/api'; // 默认开发环境地址（本地后端）

async function loadAppConfig() {
    try {
        // 尝试加载同目录下的配置文件（用于iOS封装或生产环境）
        const res = await fetch('app-config.json', { cache: 'no-cache' });
        if (res.ok) {
            const cfg = await res.json();
            if (cfg && typeof cfg.API_URL === 'string' && cfg.API_URL.trim() !== '') {
                API_URL = cfg.API_URL.trim();
                console.log('🔧 已加载外部配置 API_URL =', API_URL);
            } else {
                console.warn('⚠️ app-config.json 未提供有效 API_URL，使用默认值');
            }
        } else {
            console.warn('⚠️ 未找到 app-config.json，使用默认 API_URL');
        }
    } catch (e) {
        console.warn('⚠️ 加载 app-config.json 失败，使用默认 API_URL', e);
    }
}

// DOM元素
const elements = {
    searchSection: document.getElementById('searchSection'),
    cardSection: document.getElementById('cardSection'),
    completionSection: document.getElementById('completionSection'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    researchInput: document.getElementById('researchInput'),
    searchBtn: document.getElementById('searchBtn'),
    cardsContainer: document.getElementById('cardsContainer'),
    progressFill: document.getElementById('progressFill'),
    savedCount: document.getElementById('savedCount'),
    discardBtn: document.getElementById('discardBtn'),
    saveBtn: document.getElementById('saveBtn'),
    finalCount: document.getElementById('finalCount'),
    savedPapersList: document.getElementById('savedPapersList'),
    newSearchBtn: document.getElementById('newSearchBtn'),
    viewSavedBtn: document.getElementById('viewSavedBtn')
};

// 初始化
async function init() {
    // 先尝试加载外部配置
    await loadAppConfig();
    // 搜索按钮点击
    elements.searchBtn.addEventListener('click', handleSearch);
    
    // 输入框回车
    elements.researchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // 建议标签点击
    document.querySelectorAll('.suggestion-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            elements.researchInput.value = tag.textContent;
            handleSearch();
        });
    });
    
    // 动作按钮
    elements.discardBtn.addEventListener('click', () => handleCardAction('discard'));
    elements.saveBtn.addEventListener('click', () => handleCardAction('save'));
    
    // 完成界面按钮
    elements.newSearchBtn.addEventListener('click', resetToSearch);
    elements.viewSavedBtn.addEventListener('click', viewSavedPapers);
}

// 处理搜索
async function handleSearch() {
    const topic = elements.researchInput.value.trim();
    
    if (!topic) {
        showNotification('请输入研究方向', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        console.log('🔍 发送请求到:', `${API_URL}/get-papers`);
        console.log('📋 研究方向:', topic);
        
        const response = await fetch(`${API_URL}/get-papers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ research_topic: topic })
        });
        
        console.log('📡 响应状态:', response.status);
        
        const data = await response.json();
        console.log('✅ 收到数据:', data);
        
        // 检查API错误
        if (data.error) {
            console.error('❌ API错误:', data.error);
            throw new Error(data.error);
        }
        
        if (!response.ok) {
            const errorMsg = data.message || data.error || '未知错误';
            showNotification(errorMsg, 'error');
            showLoading(false);
            return;
        }
        
        // 解析论文数据
        const papers = parsePapersFromResponse(data);
        
        if (!Array.isArray(papers) || papers.length === 0) {
            showNotification('未解析到论文数据，使用模拟数据', 'warning');
            state.papers = generateMockPapers(10);
        } else {
            state.papers = papers;
        }
        
        initializeCards();
        showSection('card');
        updateSavedCount();
    } catch (error) {
        console.error('❌ 请求失败:', error);
        showNotification('请求失败，请检查网络或API配置', 'error');
    } finally {
        showLoading(false);
    }
}

function parsePapersFromResponse(data) {
    try {
        // 格式1: 标准格式
        if (data && Array.isArray(data.papers)) {
            return data.papers;
        }
        
        // 格式2: 嵌套格式
        if (data && typeof data === 'object') {
            for (const key in data) {
                const v = data[key];
                if (v && typeof v === 'object' && Array.isArray(v.papers)) {
                    return v.papers;
                }
                if (typeof v === 'string') {
                    try {
                        const parsed = JSON.parse(v);
                        if (parsed && Array.isArray(parsed.papers)) {
                            return parsed.papers;
                        }
                    } catch {}
                }
            }
        }
        
        // 格式3: OpenAI格式
        if (data && Array.isArray(data.choices) && data.choices.length > 0) {
            const choice = data.choices[0];
            let content = choice.delta?.content || choice.message?.content || null;
            if (content) {
                content = content.trim();
                // 尝试提取JSON代码块
                const match = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
                if (match) content = match[1];
                // 智能提取
                if (content.indexOf('{') !== -1) {
                    const start = content.indexOf('{');
                    let brace = 0, end = -1;
                    for (let i = start; i < content.length; i++) {
                        if (content[i] === '{') brace++;
                        else if (content[i] === '}') { brace--; if (brace === 0) { end = i + 1; break; } }
                    }
                    if (end !== -1) content = content.slice(start, end);
                }
                try {
                    const parsed = JSON.parse(content);
                    if (parsed && Array.isArray(parsed.papers)) return parsed.papers;
                } catch {}
            }
        }
        
        return [];
    } catch {
        return [];
    }
}

function generateMockPapers(count) {
    return Array.from({ length: count }, (_, i) => ({
        title: `示例论文标题 ${i + 1}`,
        authors: '张三, 李四',
        abstract: '这是一个示例摘要，用于在API不可用时展示界面效果。',
        year: 2024,
        venue: 'NeurIPS',
        tags: ['示例', 'AI']
    }));
}

function initializeCards() {
    state.currentIndex = 0;
    state.savedPapers = [];
    elements.cardsContainer.innerHTML = '';
    
    state.papers.forEach((paper, index) => {
        const card = createCard(paper, index);
        elements.cardsContainer.appendChild(card);
        addCardInteraction(card);
    });
    
    updateProgress();
    showSection('card');
}

function createCard(paper, index) {
    const card = document.createElement('div');
    card.className = 'paper-card';
    card.style.zIndex = (1000 - index).toString();
    
    card.innerHTML = `
        <div class="paper-number">论文 ${index + 1} / ${state.papers.length}</div>
        <h3 class="paper-title">${paper.title}</h3>
        <div class="paper-authors">${paper.authors}</div>
        <p class="paper-abstract">${paper.abstract}</p>
        ${paper.tags && paper.tags.length ? `<div class="paper-tags">${paper.tags.map(t => `<span class='paper-tag'>${t}</span>`).join('')}</div>` : ''}
    `;
    
    return card;
}

function addCardInteraction(card) {
    let startX = 0, currentX = 0;
    const threshold = 120;
    
    const onPointerDown = (e) => {
        card.setPointerCapture(e.pointerId);
        startX = e.clientX;
        card.classList.add('dragging');
    };
    const onPointerMove = (e) => {
        if (!card.classList.contains('dragging')) return;
        currentX = e.clientX - startX;
        card.style.transform = `translateX(${currentX}px) rotate(${currentX * 0.03}deg)`;
    };
    const onPointerUp = () => {
        card.classList.remove('dragging');
        if (currentX > threshold) {
            handleCardAction('save');
        } else if (currentX < -threshold) {
            handleCardAction('discard');
        } else {
            card.style.transform = '';
        }
    };
    
    card.addEventListener('pointerdown', onPointerDown);
    card.addEventListener('pointermove', onPointerMove);
    card.addEventListener('pointerup', onPointerUp);
}

function handleCardAction(action) {
    const index = state.currentIndex;
    if (index >= state.papers.length) return;
    const paper = state.papers[index];
    
    if (action === 'save') {
        state.savedPapers.push({ ...paper, savedAt: new Date().toISOString() });
        savePaperToLocalStorage(paper);
        showNotification('已保存此论文', 'success');
    } else {
        showNotification('已跳过此论文', 'info');
    }
    
    state.currentIndex++;
    updateProgress();
    
    if (state.currentIndex >= state.papers.length) {
        showCompletionScreen();
    }
}

async function showCompletionScreen() {
    elements.finalCount.textContent = String(state.savedPapers.length);
    elements.savedPapersList.innerHTML = state.savedPapers.map(p => `
        <div class="saved-paper-item">
            <div class="saved-paper-title">${p.title}</div>
            <div class="saved-paper-authors">${p.authors}</div>
        </div>
    `).join('');
    showSection('completion');
}

function showSection(section) {
    elements.searchSection.classList.toggle('hidden', section !== 'search');
    elements.cardSection.classList.toggle('hidden', section !== 'card');
    elements.completionSection.classList.toggle('hidden', section !== 'completion');
}

function updateProgress() {
    const progress = Math.min(100, Math.round((state.currentIndex / Math.max(1, state.papers.length)) * 100));
    elements.progressFill.style.width = `${progress}%`;
}

function updateSavedCount() {
    elements.savedCount.textContent = String(loadSavedCount());
}

function showLoading(show) {
    elements.loadingOverlay.classList.toggle('hidden', !show);
}

function showNotification(message, type = 'info') {
    const div = document.createElement('div');
    div.className = `notification ${type}`;
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2400);
}

function resetToSearch() {
    state.papers = [];
    state.currentIndex = 0;
    elements.cardsContainer.innerHTML = '';
    showSection('search');
}

function viewSavedPapers() {
    window.location.href = 'library.html';
}

function savePaperToLocalStorage(paper) {
    try {
        const saved = JSON.parse(localStorage.getItem('savedPapers') || '[]');
        saved.push({ ...paper, savedAt: new Date().toISOString() });
        localStorage.setItem('savedPapers', JSON.stringify(saved));
    } catch {}
}

function loadSavedCount() {
    try {
        const saved = JSON.parse(localStorage.getItem('savedPapers') || '[]');
        return Array.isArray(saved) ? saved.length : 0;
    } catch { return 0; }
}

document.addEventListener('DOMContentLoaded', async () => {
    await init();
    updateSavedCount();
});

