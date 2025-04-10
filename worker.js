// HTML部署工具 - Cloudflare Worker脚本

// KV命名空间绑定
// 在wrangler.toml中配置：kv_namespaces = [{ binding = "HTML_PAGES", id = "your-kv-namespace-id" }]

// 配置CORS头部，允许跨域访问API
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 处理API请求
  if (path.startsWith('/api/')) {
    return handleApiRequest(request, path);
  }
  
  // 处理页面请求 - 格式为 /p/{pageId}
  if (path.startsWith('/p/')) {
    const pageId = path.replace('/p/', '');
    return serveHtmlPage(pageId);
  }
  
  // 默认返回404
  return new Response('Not Found', { status: 404 });
}

async function handleApiRequest(request, path) {
  // 处理OPTIONS请求（预检请求）
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    });
  }
  
  // 处理部署请求
  if (path === '/api/deploy' && request.method === 'POST') {
    try {
      const data = await request.json();
      const { html, name } = data;
      
      if (!html) {
        return jsonResponse({ error: 'HTML内容不能为空' }, 400);
      }
      
      // 生成唯一ID
      const id = Date.now().toString();
      
      // 存储HTML到KV
      await HTML_PAGES.put(id, html);
      
      // 生成访问URL
      const pageUrl = `${new URL(request.url).origin}/p/${id}`;
      
      return jsonResponse({ 
        success: true, 
        id, 
        url: pageUrl,
        name: name || `页面 ${new Date().toLocaleString()}`
      })
    } catch (error) {
      return jsonResponse({ error: error.message }, 500);
    }
  }
  
  // 处理获取页面请求
  if (path.startsWith('/api/page/') && request.method === 'GET') {
    const id = path.replace('/api/page/', '');
    const html = await HTML_PAGES.get(id);
    
    if (!html) {
      return jsonResponse({ error: '页面不存在' }, 404);
    }
    
    return jsonResponse({ id, html });
  }
  
  return jsonResponse({ error: '无效的API请求' }, 400);
}

async function serveHtmlPage(pageId) {
  // 从KV获取HTML内容
  const html = await HTML_PAGES.get(pageId);
  
  if (!html) {
    return new Response('页面不存在', { status: 404 });
  }
  
  // 返回HTML页面，添加安全头部
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' https:; font-src 'self' https:;"
    },
  });
}

// 辅助函数：返回JSON响应
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    },
    status,
  });
}

// 注册事件监听器
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});