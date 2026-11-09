# wangzhan

我的个人网站：发布作品和博客文章。界面像游戏机的主界面——选中一张「卡带」，它会展开铺满屏幕。

纯静态网站，没有构建步骤，没有依赖需要安装。

## 本地预览

```bash
python3 -m http.server 8000
```

然后打开 <http://localhost:8000>。（直接双击 `index.html` 不行，浏览器不允许本地文件读取内容。）

## 操作方式

| | 选择 | 进入 | 返回 | 切换栏目 |
|---|---|---|---|---|
| 键盘 | 方向键 | Enter | Esc / Backspace | Q / E |
| 手柄 | 十字键 / 左摇杆 | A | B | LB / RB |
| 触屏 / 鼠标 | 直接点 | | | 点顶部标签 |

## 都有什么

- **开机动画**：一台掌机亮屏，屏幕放大铺满页面（每次访问只播一次）。
- **主界面**：四张栏目卡带，选中的会放大、扫过高光，背景的颜色和大字跟着变；下方的内容架显示该栏目的最新内容。
- **启动画面**：进入栏目时卡带展开铺满屏幕，显示图标和加载条，再进入内容。
- **内容页**：顶部标签可在栏目间切换；作品和博客可按标签筛选；文章有字数、阅读时间和阅读进度条。
- **成就**：右上角奖杯。逛网站会解锁成就（其中两个是隐藏的），记录保存在访客自己的浏览器里。
- **设置**：右上角按钮。深色/浅色、按键音效、动态背景、重播开机动画。

## 修改内容

所有内容都在 `content/` 目录里：

| 文件 | 作用 |
|---|---|
| `content/site.json` | 网站名字、头像、首页那句话、开机画面文字、「链接」页的链接 |
| `content/about.md` | 「关于」页 |
| `content/works.json` | 作品列表 |
| `content/works/*.md` | 某件作品的详细介绍（可选） |
| `content/posts/index.json` | 文章列表 |
| `content/posts/*.md` | 文章正文 |

### 发一篇文章

1. 在 `content/posts/` 里新建 `文章名.md`，用 Markdown 写正文。
2. 在 `content/posts/index.json` 里加一条，`slug` 与文件名一致：

```json
{ "slug": "文章名", "title": "标题", "date": "2026-11-10", "tags": ["随笔"], "summary": "一句话简介" }
```

### 加一件作品

在 `content/works.json` 里加一条：

```json
{
  "id": "my-work",
  "title": "作品名",
  "year": "2026",
  "tags": ["标签"],
  "summary": "一句话介绍",
  "cover": "content/works/img/my-work.jpg",
  "content": "works/my-work.md",
  "links": [{ "label": "在线查看", "url": "https://example.com" }]
}
```

`cover`、`content`、`links` 都可以不填；没有封面时会自动生成一块彩色封面。

## 发布到 GitHub Pages

仓库页面 → **Settings → Pages** → Source 选 **Deploy from a branch**，分支选 `main`、目录选 `/ (root)`，保存。
之后每次推送到 `main`，网站会自动更新。

## 目录结构

```
index.html            页面骨架
assets/css/style.css  样式（颜色在文件开头的变量里）
assets/js/app.js      交互逻辑：路由、展开动画、键盘/手柄导航
assets/vendor/        marked（Markdown 渲染库，MIT 许可）
content/              你的内容
```
