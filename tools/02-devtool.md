# devtool 使用指南

> Yocto 提供的开发工具，简化源码修改和调试流程

## 📖 devtool 概述

devtool 是 Yocto Project 提供的开发工作流工具，可以：
- 快速提取源码进行修改
- 自动构建和部署到目标
- 简化补丁管理

## 🔧 常用命令

### devtool add

添加一个新的软件包到构建系统：

```bash
# 从 Git 仓库添加
devtool add my-package https://github.com/user/my-package.git

# 从本地目录添加
devtool add my-package /path/to/local/source

# 从 tarball 添加
devtool add my-package https://example.com/my-package.tar.gz
```

### devtool modify

修改现有配方：

```bash
# 修改现有包（自动克隆源码到 workspace）
devtool modify <package-name>

# 示例
devtool modify linux-aspeed
devtool modify systemd
```

### devtool edit-recipe

编辑配方文件：

```bash
# 在默认编辑器中打开配方
devtool edit-recipe <package-name>

# 示例
devtool edit-recipe nginx
```

### devtool build

构建包：

```bash
# 构建包
devtool build <package-name>

# 构建并部署到目标
devtool build-image <image-name>
```

### devtool deploy-target

部署到目标设备：

```bash
# 部署单个包
devtool deploy-target <package-name> root@<target-ip>

# 示例
devtool deploy-target nginx root@192.168.1.100

# 部署整个镜像
devtool build-image obmc-phosphor-image
devtool deploy-image obmc-phosphor-image root@192.168.1.100
```

### devtool finish

完成开发，收回 workspace：

```bash
devtool finish <package-name> <source-dir>

# 示例
devtool finish nginx ~/poky/meta-nginx
```

### devtool reset

重置配方到原始状态：

```bash
# 重置单个包
devtool reset <package-name>

# 重置所有包
devtool reset --all
```

## 💻 实战示例

### 场景 1: 修改内核

```bash
# 1. 进入构建环境
cd ~/openbmc
. openbmc/scripts/setup ast2600-evb
cd build

# 2. 提取内核源码
devtool modify linux-aspeed

# 3. 修改源码
cd workspace/sources/linux-aspeed

# 编辑内核配置
make ARCH=arm menuconfig

# 修改代码
vim drivers/misc/aspeed-pwm-tacho.c

# 4. 构建
devtool build linux-aspeed

# 5. 部署到目标
devtool deploy-target linux-aspeed root@192.168.1.100

# 6. 测试后提交补丁
# 编辑配方
devtool edit-recipe linux-aspeed

# 7. 完成开发
devtool finish linux-aspeed ~/openbmc/meta-aspeed
```

### 场景 2: 添加新应用

```bash
# 1. 创建新应用（在新窗口）
# 创建 ~/workspace/myapp 目录，包含：
# - myapp.c
# - CMakeLists.txt

# 2. 在 OpenBMC 构建环境中
devtool add myapp /home/user/workspace/myapp

# 3. 编辑配方（自动打开编辑器）
devtool edit-recipe myapp

# 4. 验证构建
devtool build myapp

# 5. 部署测试
devtool deploy-target myapp root@192.168.1.100

# 6. 添加到镜像
# 在 local.conf 中
echo 'IMAGE_INSTALL_append = " myapp"' >> conf/local.conf

# 7. 完成
devtool finish myapp /home/user/workspace/myapp
```

### 场景 3: 调试服务

```bash
# 1. 提取服务
devtool modify phosphor-logging

# 2. 修改代码添加调试日志
vim src/logging.cpp

# 3. 构建
devtool build phosphor-logging

# 4. 部署
devtool deploy-target phosphor-logging root@192.168.1.100

# 5. SSH 到目标查看日志
ssh root@192.168.1.100
systemctl status phosphor-logging
journalctl -u phosphor-logging -f

# 6. 修改后重新部署
# 在 devtool 窗口
devtool build phosphor-logging
devtool deploy-target phosphor-logging root@192.168.1.100

# 7. 重启服务
# SSH 窗口
systemctl restart phosphor-logging
```

## ⚙️ devtool 配置

### 配置选项

```bash
# conf/local.conf

# devtool workspace 位置
DEVTOOL_WORKSPACE_PATH ?= "${TOPDIR}/workspace"

# devtool 添加的层位置
DEVTOOL_LAYERS ?= "${TOPDIR}/workspace/layers"
```

### 工作空间结构

```
workspace/
├── sources/              # 源码
│   ├── linux-aspeed/
│   ├── systemd/
│   └── my-package/
└── layers/               # 自动创建的 bbappend 层
    ├── meta-workspace/
    └── conf/
        └── layer.conf
```

## 🛠️ 高级用法

### 导入补丁

```bash
# 从 devtool workspace 导出补丁
devtool update-recipe <package-name> --mode=patch

# 查看生成的补丁
ls workspace/sources/<package-name>/*.patch
```

### 升级配方

```bash
# 升级到新版本
devtool upgrade <package-name> --version 2.0.0

# 指定源码位置
devtool upgrade <package-name> --version 2.0.0 \
    --srcrev 1234567 \
    --srcUri https://example.com/my-package-2.0.0.tar.gz
```

### 搜索包

```bash
# 搜索可用配方
devtool search <keyword>

# 示例
devtool search "nginx"
devtool search "python"
```

### 差异比较

```bash
# 比较 workspace 源码与原始源码
devtool diff <package-name>

# 比较配方与原始配方
devtool status <package-name>
```

## 📝 配方示例

devtool add 自动生成的配方：

```bash
# myapp_1.0.bb
SUMMARY = "My Application"
DESCRIPTION = "A custom application for OpenBMC"
HOMEPAGE = "https://github.com/user/myapp"
LICENSE = "MIT"
LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/MIT;md5=0835ade698e0bcf8506ecda2f7b4f302"

SRC_URI = "file://."
S = "${WORKDIR}"

inherit cmake

do_compile:prepend() {
    # 自定义编译步骤
}

do_install() {
    install -d ${D}${bindir}
    install -m 0755 ${S}/build/myapp ${D}${bindir}/
}
```

## 🐛 常见问题

### Q: devtool modify 失败

```bash
# 清理后重试
bitbake -c cleanall <package>
devtool modify <package>
```

### Q: 部署失败

```bash
# 检查 SSH 连接
ssh root@<target-ip> echo "OK"

# 检查密码
# 默认密码: 0penBmc

# 使用指定 SSH 密钥
export DEVTOOL_SSH_OPTIONS="-i ~/.ssh/mykey"
devtool deploy-target <package> root@<target-ip>
```

### Q: 源码冲突

```bash
# 如果 workspace 中有旧版本
devtool reset <package>
devtool modify <package>
```

## 📚 更多资源

- [Yocto devtool 文档](https://docs.yoctoproject.org/ref-manual/devtool-reference.html)
- [devtool 教程](https://docs.yoctoproject.org/dev/devtool.html)

---

*[返回首页](/README)* | *[目录](/_sidebar)*