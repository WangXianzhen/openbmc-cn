# 开发环境搭建

> 本教程将指导你从零开始在 Linux 系统中搭建 OpenBMC 开发环境

## 📋 硬件要求

| 组件 | 最低要求 | 推荐配置 |
|------|----------|----------|
| CPU | 4 核 | 8 核以上 |
| 内存 | 8 GB | 16 GB 以上 |
| 硬盘 | 100 GB | 200 GB SSD |
| 系统 | Ubuntu 20.04+ | Ubuntu 22.04 LTS |

> ⚠️ 如果没有真实硬件，可使用 QEMU 模拟，无需额外硬件

## 🐧 Linux 环境准备

### 推荐使用 Ubuntu 22.04 LTS

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装基础依赖
sudo apt install -y build-essential git vim wget curl

# 安装 OpenBMC 编译依赖
sudo apt install -y \
    cmake \
    diffstat \
    docbook-xml \
    gawk \
    gcc \
    g++ \
    libncurses5-dev \
    libssl-dev \
    libtool \
    make \
    patch \
    python3 \
    python3-dev \
    python3-pip \
    rsync \
    bison \
    flex \
    autoconf \
    automake \
    libpixman-1-dev
```

### Ubuntu 24.04 特殊配置

如果你使用 Ubuntu 24.04，需要额外配置：

```bash
# 解决 AppArmor 限制问题
echo 'kernel.apparmor_restrict_unprivileged_userns = 0' | \
    sudo tee /etc/sysctl.d/99-bitbake.conf
sudo sysctl -p /etc/sysctl.d/99-bitbake.conf
```

## 📥 获取 OpenBMC 源码

### 方法一：官方仓库（推荐）

```bash
# 创建工作目录
mkdir -p ~/openbmc && cd ~/openbmc

# 克隆 OpenBMC 主仓库
git clone https://github.com/openbmc/openbmc.git

# 查看支持的开发板
ls openbmc/meta-* openbmc/meta-aspeed/
```

### 方法二：清华镜像（国内加速）

```bash
# 使用清华镜像加速
git clone https://mirrors.tuna.tsinghua.edu.cn/git/openbmc/openbmc.git
```

## 🏗️ 初始化构建环境

OpenBMC 支持多种开发板，以 Romulus 为例：

```bash
cd ~/openbmc

# 初始化构建环境
source openbmc-openbmc-fidos-20241024/.openbmc-env

# 或者使用 setup 脚本
. openbmc/scripts/setup romulus
```

### 支持的开发板

| 开发板 | SoC | 说明 |
|--------|-----|------|
| romulus | AST2600 | Facebook/Meta 的标准开发板 |
| palmetto | AST2400 | 较早的参考设计 |
| quanta-q71l | AST2500 | Quanta 产品 |
| witherspoon | AST2600 | IBM OpenPower 系统 |

## 🔨 编译固件

```bash
# 设置构建目录
export BUILDDIR=~/openbmc/build

# 初始化 bitbake 环境
cd ~/openbmc
TEMPLATECONF=meta-openbmc/meta-romulus/conf . openbmc/scripts/oe-init-build-env $BUILDDIR

# 开始编译（首次编译需要数小时）
cd $BUILDDIR
bitbake obmc-phosphor-image
```

### 编译输出

编译成功后，固件位于：

```
tmp/deploy/images/<machine>/
├── obmc-phosphor-image-<machine>.static.mtd    # 完整固件镜像
├── fitImage                                       # FIT 内核镜像
├── u-boot.bin                                    # U-Boot 引导程序
└── *
```

## 🐳 Docker 环境（可选）

使用 Docker 可以避免依赖冲突：

```bash
# 拉取 OpenBMC 编译环境镜像
docker pull ghcr.io/openbmc/openbmc-build:latest

# 运行容器
docker run --rm -it \
    -v ~/openbmc:/openbmc \
    -w /openbmc \
    ghcr.io/openbmc/openbmc-build:latest \
    bash
```

## ✅ 验证安装

```bash
# 检查依赖是否完整
bitbake --version

# 应该输出类似：
# BitBake 2.7.3
# BitBake Build System 2.7.3
```

## ❓ 常见问题

### Q: 编译失败，提示内存不足

```bash
# 增加 swap
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Q: 编译时间太长

- 首次编译需要 2-6 小时（取决于硬件）
- 使用 `-j$(nproc)` 参数并行编译
- 后续增量编译会快很多

## 📚 下一步

- [QEMU 模拟运行](02-qemu.md) - 无需硬件体验 OpenBMC
- [第一个 Hello World](03-hello-world.md) - 编写你的第一个程序

---

*[返回首页](../README.md)* | *[目录](../_sidebar.md)*