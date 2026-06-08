#!/usr/bin/env node
/**
 * OpenBMC 邮件列表抓取工具
 * 用于抓取 lore.kernel.org/openbmc 的邮件列表内容
 *
 * 使用方法:
 *   npm install
 *   node scraper.js              # 抓取最新帖子
 *   node scraper.js --verbose    # 详细输出
 *   node scraper.js --update     # 抓取并更新 JSON 文件
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 配置
const CONFIG = {
    baseUrl: 'https://lore.kernel.org/openbmc/',
    timeout: 120000, // 2分钟超时
    waitTime: 3000,  // 等待时间
    maxRetries: 3,   // 最大重试次数
    outputDir: './output',
    outputFile: './output/posts.json',
    summaryFile: './output/summary.md'
};

// 命令行参数
const args = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');
const updateMode = args.includes('--update') || args.includes('-u');

// 日志函数
const log = {
    info: (msg) => console.log(`[INFO] ${msg}`),
    warn: (msg) => console.log(`[WARN] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`),
    debug: (msg) => verbose && console.log(`[DEBUG] ${msg}`)
};

// 确保输出目录存在
function ensureOutputDir() {
    if (!fs.existsSync(CONFIG.outputDir)) {
        fs.mkdirSync(CONFIG.outputDir, { recursive: true });
        log.info(`创建输出目录: ${CONFIG.outputDir}`);
    }
}

// 延迟函数
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 获取网页内容
async function fetchPage(url, retries = CONFIG.maxRetries) {
    for (let i = 0; i < retries; i++) {
        try {
            log.info(`正在访问: ${url}`);

            const browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--window-size=1920x1080',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process'
                ]
            });

            const page = await browser.newPage();

            // 设置 User-Agent
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            // 设置视口
            await page.setViewport({ width: 1920, height: 1080 });

            // 导航到页面
            await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: CONFIG.timeout
            });

            // 等待页面加载完成
            await sleep(CONFIG.waitTime);

            // 检查是否有 Anubis 挑战页面
            const title = await page.title();
            if (title.includes('not a bot') || title.includes('Anubis')) {
                log.warn('检测到反爬虫挑战，等待手动验证...');

                // 等待用户手动验证
                await page.waitForSelector('#testarea', { timeout: 0 }).catch(() => {});
                await sleep(5000);

                // 再次检查
                const newTitle = await page.title();
                if (newTitle.includes('not a bot') || newTitle.includes('Anubis')) {
                    log.warn('Anubis 挑战未通过，保存截图');
                    await page.screenshot({ path: `${CONFIG.outputDir}/anubis-challenge.png` });
                    await browser.close();
                    return null;
                }
            }

            // 获取页面内容
            const content = await page.content();

            await browser.close();

            return content;

        } catch (error) {
            log.error(`获取页面失败 (尝试 ${i + 1}/${retries}): ${error.message}`);
            if (i < retries - 1) {
                await sleep(3000); // 等待后重试
            }
        }
    }

    return null;
}

// 解析帖子列表
function parsePostList(html) {
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);
    const posts = [];

    // 查找帖子列表
    // lore.kernel.org 使用特定的 HTML 结构
    $('.thread').each((index, element) => {
        const $element = $(element);

        // 提取帖子信息
        const subject = $element.find('.subject a, .toggler').text().trim();
        const author = $element.find('.author, .from').text().trim();
        const date = $element.find('.date, .time').text().trim();
        const link = $element.find('.subject a, .toggler').attr('href');
        const threadId = $element.attr('id') || $element.find('[id]').attr('id');

        // 提取摘要（前几行）
        const body = $element.find('.body, .content, .msg').text().trim();
        const summary = body.substring(0, 200).trim() + (body.length > 200 ? '...' : '');

        if (subject) {
            posts.push({
                id: threadId || `post-${index}`,
                subject: subject.replace(/\s+/g, ' '),
                author: author.trim(),
                date: date.trim(),
                link: link ? `https://lore.kernel.org${link}` : null,
                summary: summary
            });
        }
    });

    // 备选解析方式：使用列表
    if (posts.length === 0) {
        log.debug('尝试备选解析方式...');

        // 查找所有帖子条目
        $('tr.subject, tr.thread, .thread-item, .email-item').each((index, element) => {
            const $element = $(element);

            const subjectEl = $element.find('a.subject, .subject a, .t');
            const authorEl = $element.find('.f, .from, .author');
            const dateEl = $element.find('.d, .date, .time');
            const summaryEl = $element.find('.l, .body, .snippet');

            const subject = subjectEl.text().trim() || $element.find('a').first().text().trim();

            if (subject) {
                posts.push({
                    id: `post-${index}`,
                    subject: subject.replace(/\s+/g, ' '),
                    author: authorEl.text().trim(),
                    date: dateEl.text().trim(),
                    link: subjectEl.attr('href') ? `https://lore.kernel.org${subjectEl.attr('href')}` : null,
                    summary: summaryEl.text().trim().substring(0, 200)
                });
            }
        });
    }

    return posts;
}

// 解析单个帖子详情
async function fetchPostDetail(url) {
    const content = await fetchPage(url);
    if (!content) return null;

    const cheerio = require('cheerio');
    const $ = cheerio.load(content);

    // 提取帖子详情
    const subject = $('h1.subject, h1').first().text().trim();
    const author = $('.author, .from').first().text().trim() || $('[rel="author"]').text().trim();
    const date = $('time, .date, .datetime').first().text().trim();
    const body = $('.body, .content, .msg, .email-body').first().html() || '';

    // 提取附件
    const attachments = [];
    $('a.attachment, .attachments a').each((i, el) => {
        attachments.push({
            name: $(el).text().trim(),
            url: `https://lore.kernel.org${$(el).attr('href')}`
        });
    });

    // 提取引用
    const references = [];
    $('a.msgid, .references a').each((i, el) => {
        references.push($(el).attr('href'));
    });

    return {
        subject,
        author,
        date,
        body: body.replace(/<[^>]*>/g, '').trim().substring(0, 5000),
        attachments,
        references
    };
}

// 生成 Markdown 摘要
function generateMarkdownSummary(posts, stats) {
    let md = `# OpenBMC 邮件列表最新动态

> 自动生成于 ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}

## 📊 统计信息

| 指标 | 数值 |
|------|------|
| 总帖子数 | ${stats.totalPosts} |
| 今日新增 | ${stats.todayPosts} |
| 本周帖子 | ${stats.weekPosts} |
| 数据更新时间 | ${stats.updateTime} |

## 🔥 最新帖子

`;

    // 按日期分组
    const byDate = {};
    posts.forEach(post => {
        const date = post.date || '未知日期';
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push(post);
    });

    // 生成表格
    let count = 0;
    for (const [date, datePosts] of Object.entries(byDate)) {
        if (count >= 50) break; // 最多显示50条

        md += `\n### 📅 ${date}\n\n`;
        md += `| 时间 | 作者 | 主题 |\n`;
        md += `|------|------|------|\n`;

        datePosts.slice(0, 10).forEach(post => {
            const authorShort = post.author.split('@')[0].split('<')[0].trim().substring(0, 15);
            const subjectShort = post.subject.substring(0, 50) + (post.subject.length > 50 ? '...' : '');
            const link = post.link ? `[${subjectShort}](${post.link})` : subjectShort;

            md += `| ${post.date.split(' ').pop() || ''} | ${authorShort} | ${link} |\n`;
            count++;
        });
    }

    md += `
---

*⚠️ 本文件由自动脚本生成，内容可能不完整*

*🔗 完整数据请访问: https://lore.kernel.org/openbmc/*

*[返回首页](/README)* | *[目录](/_sidebar)*`;

    return md;
}

// 主函数
async function main() {
    log.info('🚀 OpenBMC 邮件列表抓取工具启动');

    ensureOutputDir();

    try {
        // 获取主页内容
        log.info('正在获取邮件列表页面...');
        const html = await fetchPage(CONFIG.baseUrl);

        if (!html) {
            log.error('无法获取页面内容，请手动访问 https://lore.kernel.org/openbmc/ 验证');
            process.exit(1);
        }

        // 保存原始 HTML
        fs.writeFileSync(`${CONFIG.outputDir}/raw.html`, html);
        log.info(`已保存原始页面到: ${CONFIG.outputDir}/raw.html`);

        // 解析帖子列表
        log.info('正在解析帖子...');
        const posts = parsePostList(html);

        log.info(`找到 ${posts.length} 个帖子`);

        if (posts.length === 0) {
            log.warn('未找到帖子，可能页面结构已变化');
            // 保存截图帮助调试
            log.info('请查看 raw.html 和截图进行分析');
        }

        // 统计数据
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        const stats = {
            totalPosts: posts.length,
            todayPosts: posts.filter(p => p.date && p.date.includes(today)).length,
            weekPosts: posts.filter(p => p.date).length,
            updateTime: now.toISOString()
        };

        log.info(`📊 统计: 总计 ${stats.totalPosts} 条帖子`);

        // 保存 JSON 数据
        const data = {
            meta: {
                source: CONFIG.baseUrl,
                scrapedAt: now.toISOString(),
                ...stats
            },
            posts: posts
        };

        fs.writeFileSync(CONFIG.outputFile, JSON.stringify(data, null, 2));
        log.info(`已保存 JSON 数据到: ${CONFIG.outputFile}`);

        // 生成 Markdown 摘要
        const summary = generateMarkdownSummary(posts, stats);
        fs.writeFileSync(CONFIG.summaryFile, summary);
        log.info(`已保存摘要到: ${CONFIG.summaryFile}`);

        // 打印前几条
        if (verbose && posts.length > 0) {
            log.info('\n📋 最近帖子预览:');
            console.log('─'.repeat(80));
            posts.slice(0, 10).forEach((post, i) => {
                console.log(`${i + 1}. ${post.subject}`);
                console.log(`   作者: ${post.author}`);
                console.log(`   时间: ${post.date}`);
                console.log('─'.repeat(80));
            });
        }

        log.info('\n✅ 抓取完成！');
        log.info(`📁 输出文件:`);
        log.info(`   - JSON 数据: ${CONFIG.outputFile}`);
        log.info(`   - Markdown 摘要: ${CONFIG.summaryFile}`);
        log.info(`   - 原始页面: ${CONFIG.outputDir}/raw.html`);

    } catch (error) {
        log.error(`抓取失败: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// 导出函数供其他模块使用
module.exports = {
    fetchPage,
    parsePostList,
    fetchPostDetail,
    generateMarkdownSummary
};

// 运行主函数
main();