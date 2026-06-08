# Yocto 开发指南

> OpenBMC 使用 Yocto Project 作为构建系统

## 📖 Yocto 简介

Yocto Project 是一个开源协作项目，提供模板、工具和方法，帮助开发者创建定制的基于 Linux 的嵌入式系统。

### OpenBMC 中的 Yocto

```
OpenBMC 架构
├── Poky           # Yocto 参考发行版
├── BitBake        # 构建引擎
├── OpenEmbedded   # 元层集合
└── meta-openbmc   # OpenBMC 特定层
```

## 📂 Yocto 层结构

```
OpenBMC 层依赖关系
─────────────────────────────
         ┌─────────────┐
         │   Poky      │  ← 构建核心
         └──────┬──────┘
                │
         ┌──────▼──────┐
         │ meta-oe     │  ← OpenEmbedded 基础层
         └──────┬──────┘
                │
         ┌──────▼──────┐
         │ meta-python │  ← Python 包
         └──────┬──────┘
                │
         ┌──────▼──────┐
         │ meta-networking │  ← 网络相关
         └──────┬──────┘
                │
         ┌──────▼──────┐
         │ meta-openbmc │  ← OpenBMC 通用
         └──────┬──────┘
                │
         ┌──────▼──────┐
         │ meta-openbmc-machines │  ← 机器配置
         └──────┬──────┘
                │
         ┌──────▼──────┐
         │ meta-aspeed │  ← 芯片 BSP
         └─────────────┘
```

## 📝 BitBake 配方

### 配方文件结构

```bash
# recipe.bb
SUMMARY = "简短描述"
DESCRIPTION = "详细描述"
HOMEPAGE = "http://example.com"
AUTHOR = "Name <email@example.com>"
LICENSE = "MIT"
LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/MIT;md5=0835ade698e0bcf8506ecda2f7b4f302"

# 源码位置
SRC_URI = "git://github.com/user/repo.git;branch=main"

# 版本
PV = "1.0"
SRCREV = "${AUTOREV}"

# 依赖
DEPENDS = "systemd glib-2.0"
RDEPENDS:${PN} = "bash"

# 编译选项
EXTRA_OEMAKE = "CC='${CC}'"

# 工作目录
S = "${WORKDIR}/git"
```

### .bbclass 类文件

```bash
# 继承常用类
inherit cmake         # CMake 项目
inherit autotools     # Autotools 项目
inherit python3-dir   # Python 包
inherit systemd       # Systemd 服务
inherit pkgconfig     # pkg-config 支持
```

### .bbappend 追加文件

```bash
# myapp_1.0.bbappend
# 用于修改现有配方

# 添加补丁
SRC_URI += "file://fix-bug.patch"

# 修改变量
EXTRA_OEMAKE += "DEBUG=1"

# 添加文件
do_install:append() {
    install -d ${D}${datadir}/myapp
    install -m 0644 ${S}/data/* ${D}${datadir}/myapp/
}
```

## 🔧 添加自定义层

### 创建新层

```bash
# 使用 bitbake-layers 创建
bitbake-layers create-layer meta-myboard

# 或手动创建
mkdir -p meta-myboard/conf/layer.conf
mkdir -p meta-myboard/recipes-apps/myapp
mkdir -p meta-myboard/recipes-bsp/linux
```

### layer.conf 配置

```bash
# conf/layer.conf
# 我们自己的层
BBPATH .= ":${LAYERDIR}"

BBFILES += "${LAYERDIR}/recipes-*/*/*.bb \
            ${LAYERDIR}/recipes-*/*/*.bbappend"

BBFILE_COLLECTIONS += "myboard"
BBFILE_PATTERN_myboard = "^${LAYERDIR}/"
BBFILE_PRIORITY_myboard = "6"

LAYERDEPENDS_myboard = "core openbmc"
LAYERSERIES_COMPAT_myboard = "kirkstone langdale"
```

### 将层添加到构建

```bash
# 添加到 bblayers.conf
bitbake-layers add-layer meta-myboard

# 验证
bitbake-layers show-layers
```

## 📦 镜像配方

### 创建自定义镜像

```bash
# my-image.bb
require recipes-core/images/obmc-phosphor-image.bb

IMAGE_INSTALL += " \
    my-custom-app \
    extra-tools \
    development-packages \
"

IMAGE_FEATURES += " \
    package-management \
    ssh-server-openssh \
"
```

### 在镜像中添加工具

```bash
# 在 local.conf 中
IMAGE_INSTALL_append = " \
    vim \
    curl \
    wget \
    htop \
    strace \
    lsof \
    i2c-tools \
    ipmitool \
    python3-pip \
"

# 或在镜像配方中
IMAGE_INSTALL += "my-debug-tools"
```

## 🛠️ devtool 使用

### devtool 常用命令

```bash
# 添加新软件
devtool add <recipe-name> <source-path-or-url>

# 修改现有软件
devtool modify <recipe-name>

# 编辑配方
devtool edit-recipe <recipe-name>

# 构建
devtool build <recipe-name>

# 部署到目标
devtool deploy-target <recipe-name> <user@host>

# 查看可用配方
devtool search <keyword>

# 重置更改
devtool reset <recipe-name>

# 升级配方
devtool upgrade <recipe-name>
```

### 实际示例

```bash
# 1. 添加新应用
devtool add hello https://github.com/myuser/hello.git

# 2. 修改现有包
devtool modify nginx

# 3. 编辑配方
devtool edit-recipe nginx

# 4. 重新构建
devtool build nginx

# 5. 部署到 BMC
devtool deploy-target nginx root@192.168.1.100

# 6. 完成后的收尾
devtool finish nginx /path/to/source
```

## 🔨 构建流程

### 完整构建流程

```bash
# 1. 初始化环境
cd ~/openbmc
TEMPLATECONF=meta-openbmc/conf . openbmc/scripts/setup <machine>

# 2. 进入构建目录
cd build

# 3. 配置（可选）
cat >> conf/local.conf << 'EOF'
BB_NUMBER_THREADS = "8"
PARALLEL_MAKE = "-j 8"
IMAGE_INSTALL_append = "vim htop"
EOF

# 4. 触发构建
bitbake obmc-phosphor-image

# 5. 完成后检查输出
ls -lh tmp/deploy/images/<machine>/
```

### 增量构建

```bash
# 仅重新构建特定包
bitbake <package-name>

# 清理后重建
bitbake -c cleanall <package-name>
bitbake <package-name>

# 强制重新编译
bitbake -f <package-name>
```

## 🐛 调试

### 查看日志

```bash
# 包构建日志
cat tmp/work/<machine>/<package>/<version>/temp/log.do_compile*

# 系统日志
cat tmp/deploy/images/<machine>/obmc-phosphor-image-<machine>.rootfs/var/log/

# 远程查看 BMC 日志
ssh root@<BMC_IP> journalctl -xe
```

### 依赖分析

```bash
# 生成依赖图
bitbake -g <package>
ls *.dot

# 查看配方信息
bitbake -e <package> | grep -E "^(DESCRIPTION|SUMMARY|DEPENDS|RDEPENDS)="
```

## 📦 包管理

### 在运行时安装包

```bash
# 登录 BMC
ssh root@<BMC_IP>

# 使用 opkg（OpenBMC 默认包管理器）
opkg update
opkg install vim
opkg list
opkg list-installed

# 卸载包
opkg remove <package>
```

### 查看包信息

```bash
# 在构建主机上
bitbake -s | grep <package>
bitbake -e <package> | grep RDEPENDS
```

## 📝 常用配置变量

```bash
# conf/local.conf

# 并行编译
BB_NUMBER_THREADS = "8"
PARALLEL_MAKE = "-j 8"

# 下载目录
DL_DIR = "/path/to/downloads"

# 共享状态缓存
SSTATE_DIR = "/path/to/sstate"

# 编译输出目录
TMPDIR = "/path/to/build-tmp"

# 包管理
PACKAGE_CLASSES = "package_ipk"  # 或 package_rpm, package_deb

# 镜像类型
IMAGE_FSTYPES = "tar.gz jffs2 static.mtd"

# 调试符号
EXTRA_IMAGE_FEATURES += "dbg-pkgs"
```

## 📚 更多资源

- [Yocto 官方文档](https://docs.yoctoproject.org/)
- [BitBake 手册](https://docs.yoctoproject.org/bitbake/)
- [OpenEmbedded 维基](https://www.openembedded.org/wiki/Main_Page)
- [OpenBMC 开发文档](https://github.com/openbmc/docs)

---

*[返回首页](/README)* | *[目录](/_sidebar)*