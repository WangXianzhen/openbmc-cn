#!/bin/bash
# OpenBMC 邮件列表内容更新脚本
# 用于 GitHub Actions 定时任务自动更新邮件列表页面

# 需要设置 GitHub Token secret: GITHUB_TOKEN

set -e

# 配置
REPO_OWNER="WangXianzhen"
REPO_NAME="openbmc-cn"
FILE_PATH="resources/04-mailing-list.md"
BRANCH="master"

# 获取最新帖子（使用 curl + 处理 JSON）
# 由于 lore.kernel.org 有反爬虫，我们使用 RSS 方式或其他可用 API

fetch_mailing_list() {
    echo "正在获取 OpenBMC 邮件列表..."

    # 尝试使用 mbox 归档（如果可用）
    # 或者使用备用方法：RSS feed (如果有的话)

    # 这里我们用静态内容 + 日期
    cat << 'MAIL_CONTENT'
### 🔥 最近热门话题

| 日期 | 主题 | 摘要 |
|------|------|------|
| $(date +%Y-%m-%d) | 请访问 https://lore.kernel.org/openbmc/ 查看最新讨论 | - |

### 📝 今日更新

> 由于 lore.kernel.org 使用了反爬虫机制 (Anubis)，自动抓取需要浏览器执行 JavaScript 验证。
> 请通过以下方式获取最新内容：

1. **访问网页版**: https://lore.kernel.org/openbmc/
2. **订阅邮件**: https://lists.ozlabs.org/listinfo/openbmc
3. **使用 RSS 阅读器** 添加: https://lore.kernel.org/openbmc/?feed=rss

MAIL_CONTENT
}

# 更新文件
update_mailing_list_page() {
    echo "正在更新邮件列表页面..."

    # 获取当前日期
    CURRENT_DATE=$(date +%Y-%m-%d)
    UPDATE_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # 创建临时文件
    TMPFILE=$(mktemp)

    # 生成新内容（使用 sed 替换日期）
    cat << 'PAGE_HEADER' > "$TMPFILE"
# OpenBMC 邮件列表

> OpenBMC 开发者邮件列表，追踪社区最新讨论

## 📧 关于邮件列表

| 项目 | 说明 |
|------|------|
| **地址** | openbmc@lists.ozlabs.org |
| **订阅** | https://lists.ozlabs.org/listinfo/openbmc |
| **归档** | https://lore.kernel.org/openbmc/ |
| **RSS** | https://lore.kernel.org/openbmc/?feed=rss |

## 📰 最新讨论

> ⚠️ **注意**: lore.kernel.org 使用了反爬虫保护，无法自动抓取。请手动访问或订阅邮件列表获取最新内容。

<!-- 下方内容由自动脚本每周一 UTC 0:00 更新 -->

### 🔥 近期热门话题

> 请访问 https://lore.kernel.org/openbmc/ 查看最新讨论

### 💡 参与建议

1. **搜索优先**: 在 https://lore.kernel.org/openbmc/ 搜索你遇到的问题
2. **订阅获取通知**: 订阅后可直接通过邮件回复参与讨论
3. **使用 GitHub Discussions**: 也可访问 https://github.com/orgs/openbmc/discussions

## 📝 如何参与

### 订阅邮件列表

1. 访问 https://lists.ozlabs.org/listinfo/openbmc
2. 输入你的邮箱地址
3. 点击 Subscribe
4. 点击确认邮件中的链接

### 发送邮件

- **发送新帖**: openbmc@lists.ozlabs.org
- **回复帖子**: 直接回复收到的邮件即可
- **注意事项**:
  - 邮件主题清晰描述问题
  - 附上相关日志和代码
  - 使用英文书写

## 💡 讨论规范

### ✅ 建议做法

- 搜索归档确认问题未被讨论过
- 使用描述性的邮件主题
- 附上相关日志、配置、版本信息
- 使用纯文本邮件，避免 HTML

### ❌ 避免做法

- 重复发帖
- 偏离主题
- 发送大附件
- 发送敏感信息（密码、序列号等）

## 🏷️ 常见话题标签

| 标签 | 说明 |
|------|------|
| [meta-xxx] | 元层相关讨论 |
| [Build] | 构建问题 |
| [Patches] | 代码补丁提交 |
| [RFC] | 请求评论 |
| [Review] | 代码审查请求 |
| [Bug] | Bug 报告 |
| [Question] | 技术问题 |

## 🔍 搜索归档

使用 Lore.kernel.org 搜索：

```
site:lore.kernel.org/openbmc <关键词>
```

### 常用搜索

| 搜索类型 | 示例 |
|----------|------|
| 特定芯片 | `AST2600` 或 `AST2700` |
| 构建问题 | `bitbake error` |
| IPMI 相关 | `IPMI` |
| Redfish | `Redfish` |
| Yocto | `Yocto` 或 `bitbake` |

## 🔗 相关链接

- [OpenBMC 官网](https://openbmc.org)
- [GitHub 讨论](https://github.com/orgs/openbmc/discussions)
- [Discord 社区](https://discord.gg/69Km47zH98)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/openbmc)

## ⏰ 自动更新

本页面每周一 UTC 0:00 自动更新。

---

*最后更新: DATE_PLACEHOLDER*

---

*[返回首页](/README)* | *[目录](/_sidebar)*
PAGE_HEADER

    # 替换日期占位符
    sed -i "s/DATE_PLACEHOLDER/${CURRENT_DATE}/g" "$TMPFILE"

    # 输出结果
    cat "$TMPFILE"

    # 清理
    rm -f "$TMPFILE"
}

# 执行
update_mailing_list_page

echo ""
echo "✅ 邮件列表页面内容已生成"
echo "📅 更新日期: $(date)"