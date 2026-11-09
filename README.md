# wangzhan

我的个人网站：发布作品和博客文章。界面像游戏机的主界面——选中一张「卡带」，它会展开铺满屏幕。

纯静态网站，没有构建步骤，没有依赖需要安装。

## 本地预览

```bash
python3 -m http.server 8000
```

然后打开 <http://localhost:8000>。（直接双击 `index.html` 不行，浏览器不允许本地文件读取内容。）

## 操作方式

| | 选择 | 进入 | 返回 |
|---|---|---|---|
| 键盘 | 方向键 | Enter | Esc / Backspace |
| 手柄 | 十字键 / 左摇杆 | A | B |
| 触屏 / 鼠标 | 直接点 | | |

## 修改内容

所有内容都在 `content/` 目录里：

| 文件 | 作用 |
|---|---|
| `content/site.json` | 网站名字、首页那句话、开机画面文字、「链接」页的链接 |
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
