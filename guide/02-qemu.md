# QEMU 模拟运行 OpenBMC

> 无需真实硬件，用 QEMU 体验 OpenBMC！

## 📋 准备工作

### 安装 QEMU

```bash
# Ubuntu/Debian
sudo apt install -y qemu-system-arm qemu-efi-aarch64

# 检查安装
qemu-system-arm --version
```

### 下载预编译镜像

如果你不想从源码编译，可以下载预编译镜像：

```bash
# 下载 Romulus 镜像（AST2600 开发板）
cd ~/openbmc
curl -LO https://jenkins.openbmc.org/job/latest-master/label=docker-builder,target=romulus/lastSuccessfulBuild/artifact/openbmc/build/tmp/deploy/images/romulus/obmc-phosphor-image-romulus.static.mtd
```

## 🚀 使用 OpenBMC 的 QEMU 分支

OpenBMC 官方提供了支持 QEMU 的分支：

```bash
# 克隆 OpenBMC
git clone https://github.com/openbmc/openbmc.git
cd openbmc

# 切换到 QEMU 分支或使用主线
git checkout openbmc主线分支

# 初始化 QEMU 环境
TEMPLATECONF=meta-openbmc-machines/conf . openbmc/scripts/oe-init-build-env build-qemu
```

## 🏗️ 编译 QEMU 专用镜像

```bash
# 在构建目录中
cd build-qemu

# 使用 qemuarm 机器配置
echo 'MACHINE = "qemuarm"' >> conf/local.conf

# 编译镜像
bitbake obmc-phosphor-image-qemuarm
```

## ▶️ 启动 QEMU

### 方法一：使用脚本启动

```bash
# 启动 QEMU（需要 root 权限）
cd build-qemu
./tmp/deploy/images/qemuarm/obmc-phosphor-image-qemuarm-qemuarm.qemuboot.conf \
    --machine virt \
    -nographic \
    -net nic -net user,hostfwd=tcp::2222-:22,hostfwd=tcp::4443-:443,hostfwd=tcp::4444-:4444
```

### 方法二：手动启动 QEMU

```bash
# 启动命令
qemu-system-arm \
    -M ast2600-evb \
    -m 512M \
    -nographic \
    -nic user,hostfwd=tcp::2222-:22,hostfwd=tcp::4443-:443 \
    -drive file=obmc-phosphor-image-qemuarm.static.mtd,format=raw,if=mtd \
    -kernel fitImage \
    -append "console=ttyAMA0,115200"
```

## 🌐 访问 OpenBMC

QEMU 启动后，可以通过以下方式访问：

### Web 界面

```
https://localhost:4443
用户名: root
密码: 0penBmc
```

### SSH

```bash
ssh -p 2222 root@localhost
# 密码: 0penBmc
```

### IPMI

```bash
# 安装 ipmitool
sudo apt install -y ipmitool

# 连接 BMC
ipmitool -I lanplus -H localhost -p 6223 -U root -P 0penBmc power status

# 获取传感器数据
ipmitool -I lanplus -H localhost -p 6223 -U root -P 0penBmc sensor list
```

### Redfish API

```bash
# 获取系统信息
curl -k -u root:0penBmc https://localhost:4443/redfish/v1/

# 获取传感器数据
curl -k -u root:0penBmc https://localhost:4443/redfish/v1/Chassis/1/Thermal
```

## 🎮 QEMU 常用操作

### 保存/恢复快照

```bash
# 保存快照
virsh save qemu-openbmc openbmc-snapshot.sav

# 恢复快照
virsh restore openbmc-snapshot.sav
```

### 端口映射

| 服务 | 宿主机端口 | BMC 端口 |
|------|-----------|---------|
| SSH | 2222 | 22 |
| HTTPS | 4443 | 443 |
| IPMI | 6223 | 623 |

## 🐛 调试技巧

### 查看启动日志

QEMU 启动时串口输出会显示在终端，可以看到完整的启动过程。

### 连接串口

```bash
# 使用 socat 连接串口
socat -,raw,echo=0,escape=0x1d /dev/pts/X

# 或者使用 minicom
sudo minicom -D /dev/pts/X
```

### 启用调试信息

```bash
# 在启动参数中添加
debug panic kernel_panic=60
```

## 📝 常见问题

### Q: QEMU 启动很慢

这是正常的，首次启动需要初始化文件系统，可以耐心等待。

### Q: 网络连接失败

检查端口是否被占用：
```bash
netstat -tlnp | grep -E '2222|4443|6223'
```

### Q: 串口无输出

尝试添加 `-serial mon:stdio` 参数。

## 📚 下一步

- [第一个 Hello World](03-hello-world.md) - 在 OpenBMC 上运行你的第一个程序
- [开发环境搭建](01-environment.md) - 了解更多构建选项

---

*[返回首页](/README)* | *[目录](/_sidebar)*