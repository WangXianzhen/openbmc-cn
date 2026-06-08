# OpenBMC 邮件列表抓取工具

用于自动抓取 https://lore.kernel.org/openbmc/ 的邮件列表内容。

## 📋 功能

- ✅ 抓取最新帖子列表
- ✅ 解析帖子标题、作者、日期
- ✅ 生成 JSON 格式数据
- ✅ 生成 Markdown 摘要文档
- ✅ 支持定时任务自动更新

## 🚀 快速开始

### 方法一：使用 RSS（推荐）

```bash
# 安装依赖
npm install

# 运行抓取
node scraper-simple.js
```

### 方法二：使用 Puppeteer（支持更多网站）

```bash
# 安装依赖
npm install

# 运行抓取（详细模式）
node scraper.js --verbose

# 抓取并更新文件
node scraper.js --update
```

## 📁 输出文件

```
output/
├── posts.json      # JSON 格式的完整数据
├── summary.md      # Markdown 摘要
├── raw.html        # 原始 HTML（完整版）
└── feed.xml        # 原始 RSS 内容
```

## ⏰ 设置定时任务

### Linux/Mac

```bash
# 编辑 crontab
crontab -e

# 每天早上 9 点运行
0 9 * * * cd /path/to/openbmc-scraper && node scraper-simple.js >> cron.log 2>&1

# 每周一早上 9 点运行
0 9 * * 1 cd /path/to/openbmc-scraper && node scraper.js --update >> cron.log 2>&1
```

### Windows

使用 Task Scheduler 或创建批处理文件。

### GitHub Actions（推荐）

创建 `.github/workflows/scrape.yml`:

```yaml
name: 抓取邮件列表

on:
  schedule:
    # 每天 UTC 0:00 (北京时间 8:00)
    - cron: '0 0 * * *'
  workflow_dispatch:  # 手动触发

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: node scraper-simple.js
      - name: 提交更改
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add output/
          git diff --staged --quiet || git commit -m "chore: 更新邮件列表 $(date +%Y-%m-%d)"
          git push
```

## 📊 集成到网站

你可以在网站中通过 JavaScript 加载 JSON 数据：

```html
<script>
fetch('./output/posts.json')
  .then(res => res.json())
  .then(data => {
    const posts = data.posts;
    console.log(`找到 ${posts.length} 条帖子`);
    posts.forEach(post => {
      console.log(`${post.date}: ${post.subject}`);
    });
  });
</script>
```

## ⚠️ 注意事项

1. **反爬虫**: lore.kernel.org 使用 Anubis 反爬虫保护，如遇验证码请手动访问一次
2. **频率限制**: 请勿过于频繁地抓取，建议间隔 6 小时以上
3. **数据归属**: 数据版权归原作者所有，本工具仅用于学习和研究

## 🔧 配置

编辑 `scraper.js` 顶部的 `CONFIG` 对象：

```javascript
const CONFIG = {
    baseUrl: 'https://lore.kernel.org/openbmc/',
    timeout: 120000,
    waitTime: 3000,
    maxRetries: 3,
    outputDir: './output',
    outputFile: './output/posts.json',
    summaryFile: './output/summary.md'
};
```

## 📝 示例输出

### JSON 格式

```json
{
  "meta": {
    "source": "https://lore.kernel.org/openbmc/?feed=rss",
    "scrapedAt": "2024-01-01T00:00:00.000Z",
    "totalPosts": 10
  },
  "posts": [
    {
      "id": "...",
      "subject": "[PATCH] Add support for AST2700",
      "link": "https://lore.kernel.org/openbmc/...",
      "author": "John Doe",
      "date": "2024-01-01 12:00:00",
      "summary": "..."
    }
  ]
}
```

### Markdown 格式

```markdown
# OpenBMC 邮件列表最新动态

> 自动生成于 2024-01-01 12:00:00

## 🔥 最新帖子

| 日期 | 作者 | 主题 |
|------|------|------|
| 2024-01-01 | John | [PATCH] Add support for AST2700 |
```

## 📜 许可证

MIT License