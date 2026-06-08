# 构建流程详解

> 深入理解 OpenBMC 固件的构建过程

## 🔄 构建流程概览

```
┌─────────────────────────────────────────────────────────────┐
│                      1. 环境准备                            │
│         克隆源码 → 安装依赖 → 初始化构建环境                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      2. 配置阶段                            │
│      选择机器 → 设置 local.conf → 选择发行版配置              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      3. 编译阶段                            │
│     BitBake 解析依赖 → 下载源码 → 编译 → 打包                │
│     (可能需要数小时，取决于硬件性能)                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      4. 输出阶段                            │
│          生成固件镜像 → 部署到目标设备                        │
└─────────────────────────────────────────────────────────────┘
```

## 📂 源码目录结构

```
openbmc/
├── bitbake/                    # BitBake 构建工具
├── meta-openbmc/               # OpenBMC 通用层
│   ├── conf/
│   ├── recipes-*/              # 各种配方
│   └── classes/                # BitBake 类
├── meta-openbmc-machines/      # 机器配置层
│   └── conf/machine/           # 机器配置文件
├── meta-aspeed/                # ASPEED 芯片 BSP
├── openbmc/                    # 构建脚本
│   ├── scripts/setup           # 环境初始化脚本
│   └── meta-*/                 # 其他 meta 层
└── build/                      # 构建输出目录
    ├── conf/
    │   ├── local.conf          # 本地配置
    │   └── bblayers.conf       # 层配置
    ├── tmp/
    │   ├── deploy/images/      # 最终固件镜像
    │   ├── work/               # 编译工作目录
    │   └── cache/              # 构建缓存
    └── sstate-cache/           # 共享状态缓存
```

## ⚙️ 构建配置

### local.conf 常用配置

```bash
# conf/local.conf

# 并行编译线程数
BB_NUMBER_THREADS ?= "8"
PARALLEL_MAKE ?= "-j 8"

# 下载目录（使用本地镜像加速）
SOURCE_MIRROR_URL ?= "http://example.com/mirror/"
INHERIT += "own-mirrors"

# 共享状态缓存（加速增量编译）
SSTATE_DIR ?= "/path/to/sstate-cache"

# 编译输出目录
DL_DIR ?= "/path/to/downloads"

# 机器配置
MACHINE ??= "romulus"

# 发行版配置
DISTRO ?= "openbmc-distro"

# 图像类型
IMAGE_FSTYPES += "tar.gz jffs2 static.mtd"

# 添加额外包
IMAGE_INSTALL_append = " i2c-tools strace tcpdump"

# 允许无签名包（调试用）
BB_SIGNATURE_HANDLER ?= "OEBasicHash"
```

### bblayers.conf 配置

```bash
# conf/bblayers.conf

# Yocto 核心层
BBLAYERS ?= " \
  ${OEROOT}/meta \
  ${OEROOT}/meta-poky \
  ${OEROOT}/meta-openembedded/meta-oe \
  ${OEROOT}/meta-openembedded/meta-python \
  ${OEROOT}/meta-openembedded/meta-networking \
  ${OEROOT}/meta-openbmc \
  ${OEROOT}/meta-openbmc-machines \
  ${OEROOT}/meta-aspeed \
  "
```

## 🏗️ 编译流程详解

### 阶段 1: 解析

```bash
# BitBake 解析所有配方和依赖
bitbake -p <package>

# 验证配置
bitbake -e | head -100
```

### 阶段 2: Fetch 下载

```bash
# 强制重新下载
bitbake -c fetchall <package>

# 查看下载的源码
ls -la ${DL_DIR}/
```

### 阶段 3: 编译

```bash
# 完整编译流程
bitbake <package>

# 编译特定阶段
bitbake -c configure <package>   # 配置
bitbake -c compile <package>     # 编译
bitbake -c install <package>     # 安装
bitbake -c package <package>     # 打包
```

### 阶段 4: 镜像构建

```bash
# 构建完整镜像
bitbake obmc-phosphor-image

# 构建带调试工具的镜像
bitbake obmc-phosphor-image-debug
```

## 📦 镜像输出

### 固件文件

```bash
# 查看生成的固件
ls -la tmp/deploy/images/<machine>/

# 常见输出文件：
# - obmc-phosphor-image-<machine>.static.mtd    # 完整固件
# - obmc-phosphor-image-<machine>.bootfiles     # 启动文件列表
# - fitImage                                    # FIT 内核镜像
# - u-boot.bin                                  # U-Boot
# - zImage                                      # Linux 内核
# - rootfs.cpio.lzma                            # 根文件系统
```

### 固件结构

```
+--------------------------+ 0x00000000
|       U-Boot (256KB)     |
+--------------------------+
|     U-Boot ENV (128KB)   |
+--------------------------+
|    Kernel + Initrd       |
|      (fitImage)          |
+--------------------------+
|    Root Filesystem       |
|      (JFFS2/UBIFS)       |
+--------------------------+
```

## 🔧 增量编译

```bash
# 修改代码后快速重新编译
bitbake <package> -f          # 强制重新执行上次任务
bitbake <package> -c compile  # 仅重新编译

# 清理单个包后编译
bitbake -c clean <package>
bitbake <package>

# 构建特定层
bitbake -c buildall meta-xxx
```

## 🐛 调试编译问题

```bash
# 查看详细编译日志
bitbake -DDD <package> 2>&1 | tee build.log

# 查看特定任务日志
cat tmp/work/<machine>/<package>/<version>/temp/log.do_compile.*

# 检查依赖
bitbake -g <package>
dot -Tpng package-depends.dot -o package-depends.png
```

## 📊 编译时间优化

| 优化方法 | 效果 |
|---------|------|
| 使用 SSD | 提升 30-50% |
| 增加并行线程 | 提升 20-40% |
| 启用 ccache | 增量编译提升 50%+ |
| 使用 SSTATE 缓存 | 重复构建提升 80%+ |
| 使用网络镜像 | 减少下载等待 |

### ccache 配置

```bash
# conf/local.conf 添加
INHERIT += "ccache"
CCACHE_DIR = "/path/to/ccache"
CCACHE_SIZE = "10G"
```

## 📝 完整示例

```bash
#!/bin/bash
# 完整构建脚本

set -e

export MACHINE=${MACHINE:-"ast2600-evb"}
export BUILD_DIR=~/openbmc/build
export TEMPLATECONF=meta-openbmc/conf

# 1. 克隆源码（如需要）
if [ ! -d "openbmc" ]; then
    git clone https://github.com/openbmc/openbmc.git
fi

# 2. 初始化构建环境
cd openbmc
. scripts/setup ${MACHINE}

# 3. 配置
cd ${BUILD_DIR}
cat >> conf/local.conf << 'EOF'
BB_NUMBER_THREADS = "8"
PARALLEL_MAKE = "-j 8"
IMAGE_INSTALL_append = " vim strace i2c-tools"
EOF

# 4. 构建
bitbake obmc-phosphor-image

# 5. 检查输出
ls -lh tmp/deploy/images/${MACHINE}/

echo "构建完成！"
```

## 📚 下一步

- [devtool 使用指南](../tools/02-devtool.md)
- [Yocto 开发指南](../development/02-yocto.md)

---

*[返回首页](/README)* | *[目录](/_sidebar)*