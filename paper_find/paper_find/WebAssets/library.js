// 储存库管理
class LibraryManager {
    constructor() {
        this.papers = [];
        this.filteredPapers = [];
        this.loadPapers();
        this.initElements();
        this.initEventListeners();
        this.render();
    }

    // 初始化DOM元素
    initElements() {
        this.elements = {
            papersGrid: document.getElementById('papersGrid'),
            emptyState: document.getElementById('emptyState'),
            totalCount: document.getElementById('totalCount'),
            todayCount: document.getElementById('todayCount'),
            searchInput: document.getElementById('searchInput'),
            sortSelect: document.getElementById('sortSelect'),
            clearAllBtn: document.getElementById('clearAllBtn')
        };
    }

    // 初始化事件监听
    initEventListeners() {
        // 搜索
        this.elements.searchInput.addEventListener('input', (e) => {
            this.filterPapers(e.target.value);
        });

        // 排序
        this.elements.sortSelect.addEventListener('change', (e) => {
            this.sortPapers(e.target.value);
        });

        // 清空所有
        this.elements.clearAllBtn.addEventListener('click', () => {
            this.clearAll();
        });
    }

    // 从localStorage加载论文
    loadPapers() {
        try {
            const saved = localStorage.getItem('savedPapers');
            this.papers = saved ? JSON.parse(saved) : [];
            this.filteredPapers = [...this.papers];
            console.log(`📚 加载了 ${this.papers.length} 篇论文`);
        } catch (error) {
            console.error('加载论文失败:', error);
            this.papers = [];
            this.filteredPapers = [];
        }
    }

    // 保存论文到localStorage
    savePapers() {
        try {
            localStorage.setItem('savedPapers', JSON.stringify(this.papers));
            console.log('💾 论文已保存');
        } catch (error) {
            console.error('保存论文失败:', error);
        }
    }

    // 删除单篇论文
    deletePaper(index) {
        if (confirm('确定要删除这篇论文吗？')) {
            this.papers.splice(index, 1);
            this.savePapers();
            this.filteredPapers = [...this.papers];
            this.render();
            this.showNotification('论文已删除', 'success');
        }
    }

    // 清空所有论文
    clearAll() {
        if (this.papers.length === 0) {
            this.showNotification('储存库已经是空的了', 'info');
            return;
        }

        if (confirm(`确定要清空所有 ${this.papers.length} 篇论文吗？此操作无法撤销！`)) {
            this.papers = [];
            this.filteredPapers = [];
            this.savePapers();
            this.render();
            this.showNotification('已清空储存库', 'success');
        }
    }

    // 过滤论文
    filterPapers(query) {
        const lowerQuery = query.toLowerCase().trim();
        
        if (!lowerQuery) {
            this.filteredPapers = [...this.papers];
        } else {
            this.filteredPapers = this.papers.filter(paper => {
                return (
                    paper.title.toLowerCase().includes(lowerQuery) ||
                    paper.authors.toLowerCase().includes(lowerQuery) ||
                    paper.abstract.toLowerCase().includes(lowerQuery) ||
                    (paper.tags && paper.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
                );
            });
        }
        
        this.render();
    }

    // 排序论文
    sortPapers(sortType) {
        switch (sortType) {
            case 'newest':
                this.filteredPapers.sort((a, b) => 
                    new Date(b.savedAt || 0) - new Date(a.savedAt || 0)
                );
                break;
            case 'oldest':
                this.filteredPapers.sort((a, b) => 
                    new Date(a.savedAt || 0) - new Date(b.savedAt || 0)
                );
                break;
            case 'title':
                this.filteredPapers.sort((a, b) => 
                    a.title.localeCompare(b.title, 'zh-CN')
                );
                break;
            case 'year':
                this.filteredPapers.sort((a, b) => 
                    (b.year || 0) - (a.year || 0)
                );
                break;
        }
        
        this.render();
    }

    // 获取今日新增数量
    getTodayCount() {
        const today = new Date().toDateString();
        return this.papers.filter(paper => {
            if (!paper.savedAt) return false;
            return new Date(paper.savedAt).toDateString() === today;
        }).length;
    }

    // 格式化日期
    formatDate(dateString) {
        if (!dateString) return '未知日期';
        
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;
        
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // 创建论文卡片
    createPaperCard(paper, index) {
        const card = document.createElement('div');
        card.className = 'library-paper-card';
        
        card.innerHTML = `
            <div class="paper-header">
                <div class="paper-meta">
                    ${paper.year ? `<span class="meta-badge">${paper.year}</span>` : ''}
                    ${paper.venue ? `<span class="meta-badge">${paper.venue}</span>` : ''}
                </div>
                <button class="delete-btn" onclick="library.deletePaper(${index})">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6 2h8v2H6V2zM4 6V4h12v2h2v2h-2v10H4V10H2V8h2zm2 2v8h8V8H6z"/>
                    </svg>
                </button>
            </div>
            
            <h3 class="paper-card-title">${paper.title}</h3>
            
            <div class="paper-card-authors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm2 2a6 6 0 00-4 0v3h8v-3a6 6 0 00-4 0z"/>
                </svg>
                <span>${paper.authors}</span>
            </div>
            
            <p class="paper-card-abstract">${paper.abstract}</p>
            
            ${paper.tags && paper.tags.length > 0 ? `
                <div class="paper-card-tags">
                    ${paper.tags.map(tag => `<span class="paper-card-tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
            
            <div class="paper-footer">
                <span class="saved-date">保存于 ${this.formatDate(paper.savedAt)}</span>
                <button class="expand-btn" onclick="library.showModal(${index})">查看详情</button>
            </div>
        `;
        
        return card;
    }

    // 显示详情模态框
    showModal(index) {
        const paper = this.filteredPapers[index];
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };
        
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                
                <h2 class="modal-paper-title">${paper.title}</h2>
                
                <div class="modal-paper-meta">
                    ${paper.year ? `<span class="meta-badge">${paper.year}</span>` : ''}
                    ${paper.venue ? `<span class="meta-badge">${paper.venue}</span>` : ''}
                    ${paper.tags && paper.tags.length > 0 ? 
                        paper.tags.map(tag => `<span class="meta-badge">${tag}</span>`).join('') 
                    : ''}
                </div>
                
                <div class="modal-paper-authors">
                    <strong>作者：</strong>${paper.authors}
                </div>
                
                <div class="modal-paper-abstract">
                    <strong>摘要：</strong><br><br>
                    ${paper.abstract}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    render() {
        const list = this.filteredPapers;
        
        this.elements.totalCount.textContent = String(this.papers.length);
        this.elements.todayCount.textContent = String(this.getTodayCount());
        
        this.elements.papersGrid.innerHTML = '';
        
        if (list.length === 0) {
            this.elements.emptyState.classList.remove('hidden');
            return;
        }
        
        this.elements.emptyState.classList.add('hidden');
        list.forEach((paper, idx) => {
            const card = this.createPaperCard(paper, idx);
            this.elements.papersGrid.appendChild(card);
        });
    }

    showNotification(message, type = 'info') {
        const div = document.createElement('div');
        div.className = `notification ${type}`;
        div.textContent = message;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 2400);
    }
}

let library;
document.addEventListener('DOMContentLoaded', () => {
    library = new LibraryManager();
});