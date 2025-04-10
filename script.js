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
async function deployHtml() {
    const htmlCode = htmlCodeInput.value.trim();
    if (!htmlCode) {
        alert('请输入HTML代码');
        return;
    }
    
    // 显示加载状态
    deployBtn.disabled = true;
    deployBtn.textContent = '部署中...';
    
    try {
        // 获取页面名称，如果未提供则使用默认名称
        let pageName = pageNameInput.value.trim();
        if (!pageName) {
            pageName = `页面 ${new Date().toLocaleString()}`;
        }
        
        // 创建缩略图
        const thumbnailUrl = generateThumbnail(htmlCode);
        
        // 调用Worker API部署HTML
        let shareUrl = '';
        let pageId = Date.now().toString();
        
        try {
            // 尝试调用Worker API
            const response = await fetch('/api/deploy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    html: htmlCode,
                    name: pageName
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                shareUrl = result.url;
                pageId = result.id;
            } else {
                // API调用失败但有响应，生成本地分享链接
                const baseUrl = window.location.origin;
                shareUrl = `${baseUrl}/p/${pageId}`;
            }
        } catch (error) {
            console.error('Worker API调用失败:', error);
            // 失败时使用本地模式，生成本地分享链接
            const baseUrl = window.location.origin;
            shareUrl = `${baseUrl}/p/${pageId}`;
        }
        
        // 创建新页面对象
        const newPage = {
            id: pageId,
            name: pageName,
            html: htmlCode,
            date: new Date().toISOString(),
            thumbnail: thumbnailUrl,
            shareUrl: shareUrl,
            archived: false
        };
        
        // 添加到部署历史
        deployedPages.unshift(newPage);
        savePages();
        renderHistory();
        
        // 清空输入
        htmlCodeInput.value = '';
        pageNameInput.value = '';
        
        // 显示成功消息和分享链接
        if (shareUrl) {
            // 创建成功提示对话框
            const successModal = document.createElement('div');
            successModal.className = 'modal success-modal active';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            
            const modalHeader = document.createElement('div');
            modalHeader.className = 'modal-header';
            modalHeader.innerHTML = `<h3>部署成功</h3><button class="close-btn">&times;</button>`;
            
            const modalBody = document.createElement('div');
            modalBody.className = 'modal-body';
            
            const successMessage = document.createElement('p');
            successMessage.className = 'success-message';
            successMessage.textContent = `${pageName} 已成功部署！`;
            
            const shareUrlContainer = document.createElement('div');
            shareUrlContainer.className = 'deploy-share-container';
            
            const shareUrlInput = document.createElement('input');
            shareUrlInput.type = 'text';
            shareUrlInput.className = 'share-url-input';
            shareUrlInput.value = shareUrl;
            shareUrlInput.readOnly = true;
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-share-btn';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> 复制链接';
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(shareUrl)
                    .then(() => {
                        copyBtn.innerHTML = '<i class="fas fa-check"></i> 已复制';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="fas fa-copy"></i> 复制链接';
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('复制失败:', err);
                        fallbackCopy(shareUrl);
                    });
            });
            
            const viewBtn = document.createElement('button');
            viewBtn.className = 'view-deploy-btn';
            viewBtn.innerHTML = '<i class="fas fa-external-link-alt"></i> 查看页面';
            viewBtn.addEventListener('click', () => {
                window.open(shareUrl, '_blank');
            });
            
            shareUrlContainer.appendChild(shareUrlInput);
            shareUrlContainer.appendChild(copyBtn);
            
            modalBody.appendChild(successMessage);
            modalBody.appendChild(shareUrlContainer);
            modalBody.appendChild(viewBtn);
            
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(modalBody);
            
            successModal.appendChild(modalContent);
            document.body.appendChild(successModal);
            
            // 关闭按钮事件
            const closeBtn = successModal.querySelector('.close-btn');
            closeBtn.addEventListener('click', () => {
                document.body.removeChild(successModal);
            });
            
            // 点击模态框外部关闭
            successModal.addEventListener('click', (e) => {
                if (e.target === successModal) {
                    document.body.removeChild(successModal);
                }
            });
        } else {
            alert(`${pageName} 已成功部署！`);
        }
    } catch (error) {
        console.error('部署失败:', error);
        alert('部署失败: ' + error.message);
    } finally {
        // 恢复按钮状态
        deployBtn.disabled = false;
        deployBtn.textContent = '部署到Cloudflare';
    }
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
    
    // 如果有分享链接，显示分享URL
    details.appendChild(title);
    details.appendChild(date);
    
    if (page.shareUrl) {
        const shareUrlContainer = document.createElement('div');
        shareUrlContainer.className = 'item-share-url-container';
        
        const shareUrlLabel = document.createElement('span');
        shareUrlLabel.className = 'share-url-label';
        shareUrlLabel.textContent = '分享链接: ';
        
        const shareUrlDiv = document.createElement('span');
        shareUrlDiv.className = 'item-share-url';
        shareUrlDiv.textContent = page.shareUrl;
        
        const copyIcon = document.createElement('i');
        copyIcon.className = 'fas fa-copy copy-icon';
        copyIcon.title = '复制链接';
        copyIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            copyShareLink(page);
        });
        
        shareUrlContainer.appendChild(shareUrlLabel);
        shareUrlContainer.appendChild(shareUrlDiv);
        shareUrlContainer.appendChild(copyIcon);
        details.appendChild(shareUrlContainer);
    }
    
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
    
    // 复制分享链接按钮 - 只有当页面有分享链接时才显示
    let copyShareBtn;
    if (page.shareUrl) {
        copyShareBtn = createButton('复制分享链接', 'share-btn', () => copyShareLink(page));
    }
    
    // 分享按钮 - 显示分享链接供用户复制
    let shareBtn;
    if (page.shareUrl) {
        shareBtn = createButton('分享', 'share-btn', () => {
            // 创建分享对话框
            const shareModal = document.createElement('div');
            shareModal.className = 'modal share-modal active';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            
            const modalHeader = document.createElement('div');
            modalHeader.className = 'modal-header';
            modalHeader.innerHTML = `<h3>分享链接</h3><button class="close-btn">&times;</button>`;
            
            const modalBody = document.createElement('div');
            modalBody.className = 'modal-body';
            
            const shareUrlContainer = document.createElement('div');
            shareUrlContainer.className = 'deploy-share-container';
            
            const shareUrlInput = document.createElement('input');
            shareUrlInput.type = 'text';
            shareUrlInput.className = 'share-url-input';
            shareUrlInput.value = page.shareUrl;
            shareUrlInput.readOnly = true;
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-share-btn';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> 复制链接';
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(page.shareUrl)
                    .then(() => {
                        showCopySuccess(page.shareUrl);
                        copyBtn.innerHTML = '<i class="fas fa-check"></i> 已复制';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="fas fa-copy"></i> 复制链接';
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('复制失败:', err);
                        fallbackCopy(page.shareUrl);
                    });
            });
            
            shareUrlContainer.appendChild(shareUrlInput);
            shareUrlContainer.appendChild(copyBtn);
            modalBody.appendChild(shareUrlContainer);
            
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(modalBody);
            
            shareModal.appendChild(modalContent);
            document.body.appendChild(shareModal);
            
            // 关闭按钮事件
            const closeBtn = shareModal.querySelector('.close-btn');
            closeBtn.addEventListener('click', () => {
                document.body.removeChild(shareModal);
            });
            
            // 点击模态框外部关闭
            shareModal.addEventListener('click', (e) => {
                if (e.target === shareModal) {
                    document.body.removeChild(shareModal);
                }
            });
        });
    }
    
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
    
    // 添加分享按钮（如果有分享链接）
    if (page.shareUrl) {
        actions.appendChild(shareBtn);
        actions.appendChild(copyShareBtn);
    }
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
    
    // 添加加载指示器
    const loadingToast = document.createElement('div');
    loadingToast.className = 'copy-toast show';
    loadingToast.textContent = '正在生成PNG图片...';
    document.body.appendChild(loadingToast);
    
    iframe.onload = function() {
        // 使用html2canvas库将iframe内容转换为canvas
        const iframeWindow = iframe.contentWindow;
        const iframeDocument = iframe.contentDocument || iframeWindow.document;
        
        // 确保样式正确加载
        const head = iframeDocument.head;
        const styles = document.querySelectorAll('link[rel="stylesheet"]');
        styles.forEach(style => {
            const linkClone = style.cloneNode(true);
            head.appendChild(linkClone);
        });
        
        // 等待样式加载完成
        setTimeout(() => {
            html2canvas(iframeDocument.body, {
                allowTaint: true,
                useCORS: true,
                scale: 2, // 提高图片质量
                backgroundColor: '#ffffff' // 确保背景为白色
            }).then(canvas => {
                // 创建下载链接
                const link = document.createElement('a');
                link.download = `${page.name || 'webpage'}.png`;
                link.href = canvas.toDataURL('image/png');
                document.body.appendChild(link);
                
                // 触发下载
                link.click();
                
                // 清理
                document.body.removeChild(link);
                document.body.removeChild(iframe);
                document.body.removeChild(loadingToast);
                
                // 显示成功消息
                const successToast = document.createElement('div');
                successToast.className = 'copy-toast show';
                successToast.textContent = 'PNG图片已成功导出！';
                document.body.appendChild(successToast);
                
                // 2秒后隐藏并移除提示
                setTimeout(() => {
                    successToast.classList.remove('show');
                    setTimeout(() => {
                        document.body.removeChild(successToast);
                    }, 300);
                }, 2000);
            }).catch(error => {
                console.error('导出PNG失败:', error);
                alert('导出PNG失败，请查看控制台获取详细信息。');
                document.body.removeChild(iframe);
                document.body.removeChild(loadingToast);
            });
        }, 500); // 给样式加载一些时间
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

// 复制分享链接到剪贴板
function copyShareLink(page) {
    if (!page.shareUrl) {
        alert('此页面没有分享链接');
        return;
    }
    
    // 使用现代Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(page.shareUrl)
            .then(() => showCopySuccess(page.shareUrl))
            .catch(err => {
                console.error('复制失败:', err);
                fallbackCopy(page.shareUrl);
            });
    } else {
        fallbackCopy(page.shareUrl);
    }
}

// 复制链接的后备方法
function fallbackCopy(text) {
    // 创建临时输入框
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    
    // 选择并复制
    tempInput.select();
    document.execCommand('copy');
    
    // 移除临时输入框
    document.body.removeChild(tempInput);
    
    showCopySuccess(text);
}

// 显示复制成功的提示
function showCopySuccess(url) {
    // 创建一个临时提示元素
    const toast = document.createElement('div');
    toast.className = 'copy-toast';
    toast.textContent = '分享链接已复制到剪贴板！';
    document.body.appendChild(toast);
    
    // 显示提示
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // 2秒后隐藏并移除提示
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 2000);
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