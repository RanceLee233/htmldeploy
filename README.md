# HTML部署工具 - Cloudflare Pages部署指南

这是一个简化版的HTML部署工具，专为Cloudflare Pages设计。本指南将帮助您将此工具部署到Cloudflare Pages。

## 文件说明

本项目只需保留以下必要文件：

- `index.html`: 主页面HTML文件
- `styles.css`: 样式表文件
- `script.js`: JavaScript功能实现
- `.env.example`: 环境变量示例文件（需复制为.env并填入您的Cloudflare信息）

## 部署到Cloudflare Pages

### 方法一：直接上传（最简单）

1. 登录您的Cloudflare账户，进入Dashboard
2. 在左侧菜单中找到并点击「Pages」
3. 点击「创建应用程序」按钮
4. 选择「直接上传」选项
5. 为您的项目命名，例如「html-deploy-tool」
6. 将本地项目文件（index.html、script.js、styles.css）打包成ZIP文件
7. 将ZIP文件拖拽到上传区域或点击选择文件进行上传
8. 点击「部署站点」按钮
9. 等待部署完成，Cloudflare会提供一个类似`https://your-project-name.pages.dev`的URL

### 方法二：通过GitHub（推荐用于持续更新）

1. 将项目代码推送到GitHub仓库
2. 登录Cloudflare Dashboard
3. 在左侧菜单中找到并点击「Pages」
4. 点击「创建应用程序」按钮
5. 选择「连接到Git」选项
6. 选择GitHub作为Git提供商，并授权Cloudflare访问您的GitHub账户
7. 选择包含HTML部署工具的仓库
8. 配置构建设置：
   - 构建命令：留空（因为这是静态HTML项目）
   - 构建输出目录：留空或填写 `.`（表示根目录）
9. 点击「保存并部署」按钮

## 使用Cloudflare API实现部署功能

要使此工具能够将HTML代码部署到Cloudflare Pages，您需要：

1. 创建Cloudflare API令牌：
   - 登录Cloudflare Dashboard
   - 进入「我的个人资料」>「API令牌」
   - 点击「创建令牌」
   - 选择「自定义令牌」
   - 添加权限：Account > Cloudflare Pages > Edit 和 Account > Account Settings > Read
   - 创建并保存生成的API令牌

2. 复制`.env.example`为`.env`并填入您的Cloudflare信息：
   - CLOUDFLARE_ACCOUNT_ID：您的Cloudflare账户ID
   - CLOUDFLARE_PROJECT_NAME：您的Cloudflare Pages项目名称
   - CLOUDFLARE_API_TOKEN：您创建的API令牌