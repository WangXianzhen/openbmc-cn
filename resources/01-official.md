# 参考资源

> OpenBMC 开发相关的官方文档、开源项目和社区资源

## 📖 官方文档

### OpenBMC 项目

| 资源 | 链接 |
|------|------|
| OpenBMC 官网 | https://openbmc.org |
| 官方 GitHub | https://github.com/openbmc |
| 开发文档 | https://github.com/openbmc/docs |
| 官方博客 | https://openbmc.github.io |

### 协议规范

| 规范 | 链接 |
|------|------|
| IPMI 2.0 规范 | Intel Developer Zone (需注册) |
| Redfish 规范 (DSP0266) | https://www.dmtf.org/standards/redfish |
| DMTF 规范 | https://www.dmtf.org/standards |
| Redfish 示例 | https://redfish.dmtf.org |

### Yocto Project

| 资源 | 链接 |
|------|------|
| Yocto 官网 | https://www.yoctoproject.org |
| Yocto Mega Manual | https://docs.yoctoproject.org/mega-manual |
| BitBake 手册 | https://docs.yoctoproject.org/bitbake |
| OpenEmbedded | https://www.openembedded.org |

## 🛠️ 开发工具

### 必备工具

| 工具 | 说明 | 安装 |
|------|------|------|
| git | 版本控制 | `sudo apt install git` |
| bitbake | OpenBMC 构建工具 | OpenBMC 环境自带 |
| ipmitool | IPMI 管理工具 | `sudo apt install ipmitool` |
| curl | HTTP 客户端 | `sudo apt install curl` |
| jq | JSON 处理 | `sudo apt install jq` |

### 可选工具

| 工具 | 说明 | 安装 |
|------|------|------|
| Docker | 容器化编译环境 | https://docs.docker.com |
| QEMU | 模拟器 | `sudo apt install qemu-system-arm` |
| socat | 串口工具 | `sudo apt install socat` |
| minicom | 串口终端 | `sudo apt install minicom` |

## 📦 核心仓库

### OpenBMC 组织

```
openbmc/openbmc           # 主仓库
openbmc/docs              # 开发文档
openbmc/docs/development  # 教程
openbmc/phosphor-host-ipmid    # IPMI 处理
openbmc/phosphor-objmgr        # 对象管理
openbmc/phosphor-logging       # 日志服务
openbmc/phosphor-settingsd     # 设置管理
openbmc/phosphor-hwmon         # 硬件监控
openbmc/phosphor-networkd     # 网络管理
openbmc/bmcweb                # Redfish 服务
openbmc/sdbusplus             # D-Bus 绑定
openbmc/meta-aspeed           # ASPEED BSP
openbmc/meta-openpower        # OpenPower 支持
openbmc/linux                 # 内核源码
openbmc/u-boot                # U-Boot 源码
```

### 第三方实现

| 仓库 | 说明 | Stars |
|------|------|-------|
| [facebook/openbmc](https://github.com/facebook/openbmc) | Meta/Facebook 实现 | 680 |
| [ANSSI-FR/bmc-tools](https://github.com/ANSSI-FR/bmc-tools) | BMC 固件分析工具 | 665 |
| [randyrossi/bmc64](https://github.com/randyrossi/bmc64) | 64位 BMC 模拟器 | 568 |
| [turing-machines/BMC-Firmware](https://github.com/turing-machines/BMC-Firmware) | Turing Machines 开源 | 314 |
| [u-root/u-bmc](https://github.com/u-root/u-bmc) | Go 语言 BMC | 296 |

## 💬 社区资源

### 交流渠道

| 渠道 | 链接 |
|------|------|
| OpenBMC Discord | https://discord.gg/69Km47zH98 |
| 邮件列表 | openbmc@lists.ozlabs.org |
| 邮件归档 | https://lore.kernel.org/openbmc/ |
| Reddit | https://reddit.com/r/openbmc |

### 问题反馈

| 渠道 | 说明 |
|------|------|
| [GitHub Issues](https://github.com/openbmc/openbmc/issues) | 官方项目问题 |
| [Stack Overflow](https://stackoverflow.com/questions/tagged/openbmc) | 技术问答 |
| [Reddit](https://reddit.com/r/openbmc) | 社区讨论 |

## 📚 学习资源

### 推荐阅读

1. **OpenBMC 官方文档**
   - 开发环境搭建
   - 架构介绍
   - 开发教程

2. **Yocto 文档**
   - 构建系统基础
   - 层结构
   - 配方编写

3. **协议规范**
   - IPMI 2.0 Specification
   - Redfish Data Model Specification

### 视频教程

| 平台 | 内容 |
|------|------|
| YouTube - OpenBMC | 官方介绍视频 |
| YouTube - OpenBMC 社区 | 开发者分享 |
| B站 | 国内开发者教程（搜索 OpenBMC） |

## 🔧 芯片厂商

### 主要 BMC 芯片厂商

| 厂商 | 芯片系列 | 链接 |
|------|----------|------|
| ASPEED | AST2400/2500/2600/2700 | https://www.aspeedtech.com |
| 高通 | QCS404/610 | https://www.qualcomm.com |
| 英特尔 | BMC on Chip | https://www.intel.com |
| Nuvoton | NPCM7xx | https://www.nuvoton.com |

### 芯片参考设计

| 开发板 | SoC | 社区 |
|--------|-----|------|
| Romulus | AST2600 | OpenBMC 官方 |
| Palmetto | AST2400 | OpenBMC 官方 |
| Witherspoon | AST2600 | OpenPOWER |
| tiogapass | NPCM750 | OpenBMC 社区 |

## 📰 行业动态

| 来源 | 说明 |
|------|------|
| OpenBMC 博客 | https://openbmc.github.io/ |
| DMTF 新闻 | https://www.dmtf.org/news |
| Linux Foundation | BMC 相关新闻 |
| ServeTheHome | 服务器硬件评测 |
| ServeTheHome BMC | BMC 相关文章 |

---

*[返回首页](../README.md)* | *[目录](../_sidebar.md)*