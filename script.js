// 存储部署的HTML页面数据
let deployedPages = JSON.parse(localStorage.getItem('deployedPages')) || [];

// DOM元素
const htmlCodeInput = document.getElementById('html-code');
const pageNameInput = document.getElementById('page-name');
const deployBtn = document.getElementById('deploy-btn');
const historyContainer = document.getElementById('history-container');
const listViewBtn = document.getElementById('list-view-btn');
const gridViewBtn = document.getElementById('grid-view-btn');
const sourceModal = document.getElementById('source-modal');
const sourceCode = document.getElementById('source-code');
const updateSourceBtn = document.getElementById('update-source-btn');
const renameModal = document.getElementById('rename-modal');
const newNameInput = document.getElementById('new-name');
const confirmRenameBtn = document.getElementById('confirm-rename-btn');
const previewContainer = document.getElementById('preview-container');
const previewFrame = document.getElementById('preview-frame');
const previewTitle = document.getElementById('preview-title');
const closePreviewBtn = document.getElementById('close-preview-btn');

// 当前选中的页面ID
let currentPageId = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    renderHistory();
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    // 部署按钮
    deployBtn.addEventListener('click', deployHtml);
    
    // 视图切换
    listViewBtn.addEventListener('click', () => switchView('list'));
    gridViewBtn.addEventListener('click', () => switchView('grid'));
    
    // 关闭模态框
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === sourceModal) closeAllModals();
        if (e.target === renameModal) closeAllModals();
    });
    
    // 更新源代码
    updateSourceBtn.addEventListener('click', updateSourceCode);
    
    // 确认重命名
    confirmRenameBtn.addEventListener('click', confirmRename);
    
    // 关闭预览
    closePreviewBtn.addEventListener('click', closePreview);
}

// 部署HTML
function deployHtml() {
    const htmlCode = htmlCodeInput.value.trim();
    if (!htmlCode) {
        alert('请输入HTML代码');
        return;
    }
    
    // 生成唯一ID
    const id = Date.now().toString();
    const date = new Date();
    
    // 获取页面名称，如果未提供则使用默认名称
    let pageName = pageNameInput.value.trim();
    if (!pageName) {
        pageName = `页面 ${date.toLocaleString()}`;
    }
    
    // 创建缩略图
    const thumbnailUrl = generateThumbnail(htmlCode);
    
    // 创建新页面对象
    const newPage = {
        id,
        name: pageName,
        html: htmlCode,
        date: date.toISOString(),
        thumbnail: thumbnailUrl,
        archived: false
    };
    
    // 添加到部署历史
    deployedPages.unshift(newPage);
    savePages();
    renderHistory();
    
    // 清空输入
    htmlCodeInput.value = '';
    pageNameInput.value = '';
    
    // 显示成功消息
    alert(`${pageName} 已成功部署！`);
}

// 生成缩略图 (使用Data URL)
function generateThumbnail(htmlCode) {
    // 这里简单返回一个占位图，实际项目中可以使用html2canvas等库生成真实缩略图
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="#f0f0f0"/><text x="50%" y="50%" font-family="Arial" font-size="14" text-anchor="middle" fill="#666">HTML预览</text></svg>');
}

// 保存页面到localStorage
function savePages() {
    localStorage.setItem('deployedPages', JSON.stringify(deployedPages));
}

// 渲染历史记录
function renderHistory() {
    // 清空容器
    historyContainer.innerHTML = '';
    
    // 如果没有部署记录
    if (deployedPages.length === 0) {
        historyContainer.innerHTML = '<div class="empty-history">暂无部署记录</div>';
        return;
    }
    
    // 先显示非归档项目，然后是归档项目
    const nonArchived = deployedPages.filter(page => !page.archived);
    const archived = deployedPages.filter(page => page.archived);
    
    // 渲染非归档项目
    nonArchived.forEach(page => {
        historyContainer.appendChild(createHistoryItem(page));
    });
    
    // 渲染归档项目
    archived.forEach(page => {
        historyContainer.appendChild(createHistoryItem(page));
    });
}

// 创建历史记录项
function createHistoryItem(page) {
    const item = document.createElement('div');
    item.className = `history-item ${page.archived ? 'archived' : ''}`;
    item.dataset.id = page.id;
    
    // 创建缩略图
    const thumbnail = document.createElement('div');
    thumbnail.className = 'thumbnail';
    const img = document.createElement('img');
    img.src = page.thumbnail;
    img.alt = page.name;
    thumbnail.appendChild(img);
    
    // 创建详情区域
    const details = document.createElement('div');
    details.className = 'item-details';
    
    const title = document.createElement('div');
    title.className = 'item-title';
    title.textContent = page.name;
    
    const date = document.createElement('div');
    date.className = 'item-date';
    date.textContent = new Date(page.date).toLocaleString();
    
    details.appendChild(title);
    details.appendChild(date);
    
    // 创建操作按钮
    const actions = document.createElement('div');
    actions.className = 'item-actions';
    
    // 预览按钮
    const previewBtn = createButton('预览', 'preview-btn', () => previewPage(page));
    
    // 查看源代码按钮
    const viewSourceBtn = createButton('查看源代码', '', () => viewSource(page));
    
    // 重命名按钮
    const renameBtn = createButton('重命名', '', () => openRenameModal(page));
    
    // 导出PNG按钮
    const exportPngBtn = createButton('导出PNG', '', () => exportAsPng(page));
    
    // 归档/取消归档按钮
    const archiveBtn = createButton(
        page.archived ? '取消归档' : '归档', 
        '', 
        () => toggleArchive(page.id)
    );
    
    // 删除按钮
    const deleteBtn = createButton('删除', 'delete-btn', () => deletePage(page.id));
    
    actions.appendChild(previewBtn);
    actions.appendChild(viewSourceBtn);
    actions.appendChild(renameBtn);
    actions.appendChild(exportPngBtn);
    actions.appendChild(archiveBtn);
    actions.appendChild(deleteBtn);
    
    // 组装项目
    item.appendChild(thumbnail);
    item.appendChild(details);
    item.appendChild(actions);
    
    return item;
}

// 创建按钮辅助函数
function createButton(text, className, clickHandler) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = `action-btn ${className}`;
    button.addEventListener('click', clickHandler);
    return button;
}

// 切换视图 (列表/网格)
function switchView(viewType) {
    if (viewType === 'list') {
        historyContainer.className = 'list-view';
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
    } else {
        historyContainer.className = 'grid-view';
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
    }
}

// 预览页面
function previewPage(page) {
    previewTitle.textContent = `预览: ${page.name}`;
    
    // 设置iframe内容
    const iframe = previewFrame;
    iframe.srcdoc = page.html;
    
    // 显示预览容器
    previewContainer.classList.remove('hidden');
}

// 关闭预览
function closePreview() {
    previewContainer.classList.add('hidden');
    previewFrame.srcdoc = '';
}

// 查看源代码
function viewSource(page) {
    currentPageId = page.id;
    sourceCode.value = page.html;
    sourceModal.classList.add('active');
}

// 更新源代码
function updateSourceCode() {
    if (!currentPageId) return;
    
    const pageIndex = deployedPages.findIndex(page => page.id === currentPageId);
    if (pageIndex === -1) return;
    
    deployedPages[pageIndex].html = sourceCode.value;
    savePages();
    closeAllModals();
    renderHistory();
    
    alert('源代码已更新！');
}

// 打开重命名模态框
function openRenameModal(page) {
    currentPageId = page.id;
    newNameInput.value = page.name;
    renameModal.classList.add('active');
}

// 确认重命名
function confirmRename() {
    if (!currentPageId) return;
    
    const newName = newNameInput.value.trim();
    if (!newName) {
        alert('请输入有效的名称');
        return;
    }
    
    const pageIndex = deployedPages.findIndex(page => page.id === currentPageId);
    if (pageIndex === -1) return;
    
    deployedPages[pageIndex].name = newName;
    savePages();
    closeAllModals();
    renderHistory();
    
    alert('重命名成功！');
}

// 导出为PNG
function exportAsPng(page) {
    // 创建一个隐藏的iframe来渲染HTML
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.width = '1024px';
    iframe.style.height = '768px';
    document.body.appendChild(iframe);
    
    iframe.onload = function() {
        // 使用html2canvas库将iframe内容转换为canvas
        // 注意：实际项目中需要引入html2canvas库
        alert(`导出功能需要html2canvas库支持。\n在实际项目中，这里会将 ${page.name} 导出为PNG图片。`);
        document.body.removeChild(iframe);
    };
    
    iframe.srcdoc = page.html;
}

// 切换归档状态
function toggleArchive(id) {
    const pageIndex = deployedPages.findIndex(page => page.id === id);
    if (pageIndex === -1) return;
    
    // 切换归档状态
    deployedPages[pageIndex].archived = !deployedPages[pageIndex].archived;
    
    // 如果归档，移动到数组末尾
    if (deployedPages[pageIndex].archived) {
        const archivedPage = deployedPages.splice(pageIndex, 1)[0];
        deployedPages.push(archivedPage);
    } else {
        // 如果取消归档，移动到非归档项的末尾
        const unarchivedPage = deployedPages.splice(pageIndex, 1)[0];
        const lastNonArchivedIndex = deployedPages.findIndex(page => page.archived) - 1;
        
        if (lastNonArchivedIndex >= 0) {
            deployedPages.splice(lastNonArchivedIndex + 1, 0, unarchivedPage);
        } else {
            deployedPages.unshift(unarchivedPage);
        }
    }
    
    savePages();
    renderHistory();
}

// 删除页面
function deletePage(id) {
    if (!confirm('确定要删除此页面吗？此操作不可撤销。')) return;
    
    deployedPages = deployedPages.filter(page => page.id !== id);
    savePages();
    renderHistory();
}

// 关闭所有模态框
function closeAllModals() {
    sourceModal.classList.remove('active');
    renameModal.classList.remove('active');
    currentPageId = null;
}

// 添加Cloudflare部署功能（模拟）
function deployToCloudflare(htmlCode) {
    // 实际项目中，这里会调用Cloudflare API进行部署
    console.log('部署到Cloudflare:', htmlCode);
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                success: true,
                url: 'https://your-site.pages.dev'
            });
        }, 1000);
    });
}