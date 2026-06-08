#!/usr/bin/env node
/**
 * OpenBMC 邮件列表抓取工具 - 轻量版
 * 使用 RSS feed 抓取，避免反爬虫
 *
 * 使用方法:
 *   npm install
 *   node scraper-simple.js              # 抓取最新帖子
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { DOMParser } = require('linkedom');

// 配置
const CONFIG = {
    rssUrl: 'https://lore.kernel.org/openbmc/?feed=rss',
    baseUrl: 'https://lore.kernel.org/openbmc/',
    outputDir: './output',
    outputFile: './output/posts.json',
    summaryFile: './output/summary.md'
};

// 确保输出目录存在
function ensureOutputDir() {
    if (!fs.existsSync(CONFIG.outputDir)) {
        fs.mkdirSync(CONFIG.outputDir, { recursive: true });
        console.log(`[INFO] 创建输出目录: ${CONFIG.outputDir}`);
    }
}

// HTTP GET 请求
function httpGet(url) {
    return new Promise((resolve, reject) => {
        console.log(`[INFO] 请求: ${url}`);

        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; OpenBMC-Scraper/1.0)',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        }, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(data);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });

        }).on('error', (err) => {
            reject(err);
        });

        // 超时设置
        setTimeout(() => {
            reject(new Error('请求超时'));
        }, 30000);
    });
}

// 解析 RSS
function parseRSS(xml) {
    const posts = [];

    // 简单的 XML 解析
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const item = match[1];

        // 提取字段
        const getField = (tag) => {
            const regex = new RegExp(`<${tag}[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/${tag}>|<${tag}[^>]*>([\s\S]*?)<\/${tag}>`, 'i');
            const m = item.match(regex);
            return m ? (m[1] || m[2] || '').trim() : '';
        };

        const title = getField('title');
        const link = getField('link');
        const description = getField('description');
        const pubDate = getField('pubDate');
        const author = getField('author') || getField('dc:creator');
        const guid = getField('guid');

        // 清理 HTML 标签
        const cleanHtml = (str) => str.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();

        // 提取摘要
        const summary = cleanHtml(description).substring(0, 200);

        // 解析日期
        const date = pubDate ? new Date(pubDate).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '';

        if (title) {
            posts.push({
                id: guid || link,
                subject: cleanHtml(title),
                link: link,
                author: cleanHtml(author),
                date: date,
                pubDate: pubDate,
                summary: summary
            });
        }
    }

    return posts;
}

// 生成 Markdown
function generateMarkdown(posts) {
    const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

    let md = `# OpenBMC 邮件列表最新动态

> 自动生成于 ${now}

## 📊 统计

| 指标 | 数值 |
|------|------|
| 帖子总数 | ${posts.length} |

## 🔥 最新帖子

| 日期 | 作者 | 主题 |
|------|------|------|
`;

    posts.forEach(post => {
        const author = post.author.split('@')[0].split('<')[0].trim();
        const date = post.date.split(' ')[0];
        const link = post.link ? `[${post.subject}](${post.link})` : post.subject;
        md += `| ${date} | ${author.substring(0, 15)} | ${link} |\n`;
    });

    md += `
---

*🔗 来源: https://lore.kernel.org/openbmc/*

*[返回首页](/README)* | *[目录](/_sidebar)*`;

    return md;
}

// 主函数
async function main() {
    console.log('🚀 OpenBMC 邮件列表抓取工具 (轻量版)');
    console.log('='.repeat(50));

    ensureOutputDir();

    try {
        // 获取 RSS
        console.log('\n[1/3] 正在获取 RSS feed...');
        const xml = await httpGet(CONFIG.rssUrl);

        if (!xml || xml.length < 100) {
            throw new Error('RSS 内容为空');
        }

        fs.writeFileSync(`${CONFIG.outputDir}/feed.xml`, xml);
        console.log(`   ✅ 已保存原始 RSS 到: ${CONFIG.outputDir}/feed.xml`);

        // 解析
        console.log('\n[2/3] 正在解析帖子...');
        const posts = parseRSS(xml);
        console.log(`   ✅ 找到 ${posts.length} 条帖子`);

        // 保存 JSON
        const data = {
            meta: {
                source: CONFIG.rssUrl,
                scrapedAt: new Date().toISOString(),
                totalPosts: posts.length
            },
            posts: posts
        };

        fs.writeFileSync(CONFIG.outputFile, JSON.stringify(data, null, 2));
        console.log(`   ✅ 已保存 JSON 到: ${CONFIG.outputFile}`);

        // 生成 Markdown
        console.log('\n[3/3] 正在生成摘要...');
        const summary = generateMarkdown(posts);
        fs.writeFileSync(CONFIG.summaryFile, summary);
        console.log(`   ✅ 已保存摘要到: ${CONFIG.summaryFile}`);

        // 打印预览
        console.log('\n📋 帖子预览:');
        console.log('-'.repeat(80));
        posts.slice(0, 5).forEach((post, i) => {
            console.log(`${i + 1}. ${post.subject}`);
            console.log(`   作者: ${post.author}`);
            console.log(`   时间: ${post.date}`);
            console.log();
        });

        console.log('\n✅ 抓取完成！');

    } catch (error) {
        console.error(`\n❌ 抓取失败: ${error.message}`);
        console.log('\n💡 建议:');
        console.log('   1. 检查网络连接');
        console.log('   2. 手动访问 https://lore.kernel.org/openbmc/?feed=rss 查看是否正常');
        console.log('   3. 尝试使用 puppeteer 版本: npm install && node scraper.js');
    }
}

main();