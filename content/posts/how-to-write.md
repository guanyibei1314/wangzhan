发一篇新文章只需要两步。

## 1. 写一个 Markdown 文件

在 `content/posts/` 里新建一个文件，比如 `my-first-post.md`，正文用 Markdown 写：

```markdown
## 小标题

正文，**加粗**，[链接](https://example.com)。

![图片说明](content/posts/img/photo.jpg)
```

图片放在 `content/posts/img/` 里，路径从网站根目录写起。

## 2. 在列表里登记

打开 `content/posts/index.json`，加一条：

```json
{
  "slug": "my-first-post",
  "title": "我的第一篇文章",
  "date": "2026-11-10",
  "tags": ["随笔"],
  "summary": "一句话简介。"
}
```

`slug` 要和文件名一致（不带 `.md`）。文章会按 `date` 从新到旧排列。

提交并推送之后，文章就上线了。
