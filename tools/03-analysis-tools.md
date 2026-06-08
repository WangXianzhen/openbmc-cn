# 固件分析工具

> BMC 固件的逆向工程和调试工具

## 📦 分析工具概览

### 静态分析工具

| 工具 | 说明 | 用途 |
|------|------|------|
| binwalk | 固件解包 | 提取固件文件系统 |
| strings | 字符串提取 | 查找硬编码信息 |
| file | 文件类型 | 识别固件格式 |
| hexdump | 十六进制查看 | 原始数据分析 |
| CRC32 | 校验计算 | 验证固件完整性 |

### 动态分析工具

| 工具 | 说明 | 用途 |
|------|------|------|
| QEMU | 模拟执行 | 运行固件 |
| strace | 系统调用 | 追踪程序行为 |
| gdb | 调试器 | 动态调试 |
| Wireshark | 网络抓包 | 协议分析 |

## 🔍 固件提取

### binwalk 基础使用

```bash
# 安装
sudo apt install binwalk

# 固件扫描
binwalk firmware.mtd

# 提取文件（自动）
binwalk -e firmware.mtd

# 递归提取
binwalk -eM firmware.mtd

# 提取并显示熵图
binwalk -E firmware.mtd
```

### 手动提取 MTD 分区

```bash
# 查看 MTD 分区
cat /proc/mtd

# 提取 MTD 分区
dd if=/dev/mtd0 of=firmware_backup.bin

# 使用 flashrom（如果可用）
flashrom -r backup.bin
```

### UBI 镜像提取

```bash
# 安装 ubi_reader
pip3 install ubi_reader

# 提取 UBI 镜像
ubireader_extract_images firmware.ubi
ubireader_extract_files firmware.ubi

# 查看结果
ls -la ubifs-root/
```

## 🔧 文件系统工具

### JFFS2

```bash
# 挂载 JFFS2（需要 root）
sudo modprobe mtdblock
sudo modprobe jffs2
sudo mount -t jffs2 /dev/mtdblock0 /mnt/jffs2

# 使用 jefferson 提取
pip3 install jefferson
jefferson -d output_dir firmware.jffs2

# 从 JFFS2 镜像提取
jefferson -f firmware.jffs2 -o extracted/
```

### UBIFS

```bash
# 安装 ubi_tools
sudo apt install mtd-utils

# 提取 UBIFS
ubidump extract firmware.ubi

# 从镜像挂载
ubiattach /dev/ubi_ctrl -d <device_id> -m <mtd_num>
ubimkvol /dev/ubi0 -N rootfs -s <size>
mount -t ubifs /dev/ubi0_0 /mnt/ubifs
```

### SquashFS

```bash
# 安装工具
sudo apt install squashfs-tools

# 提取 SquashFS
unsquashfs firmware.squashfs

# 查看内容
unsquashfs -l firmware.squashfs
```

## 🛠️ 反汇编工具

### Ghidra

```bash
# 下载安装
wget https://github.com/NationalSecurityAgency/ghidra/releases/download/ghidra_10.4/ghidra_10.4_PUBLIC_20240129.zip
unzip ghidra_*.zip
cd ghidra_*

# 启动
./ghidraRun
```

### Radare2

```bash
# 安装
sudo apt install radare2

# 分析二进制
r2 -A firmware.bin

# 常用命令
aaa        # 分析所有
afl        # 列出函数
pdf        # 反汇编当前函数
search     # 搜索
```

### IDA Pro / IDA Free

- 官方下载: https://hex-rays.com/ida-free/
- 支持 ARM、MIPS、x86 等多种架构

## 🔐 安全分析

### 字符串分析

```bash
# 提取字符串
strings firmware.bin > strings.txt

# 查找敏感字符串
strings firmware.bin | grep -iE "password|secret|key|token|api"

# 查找 URL
strings firmware.bin | grep -E "http|ftp"

# 提取可打印字符
strings -n 8 firmware.bin | head -100
```

### 密钥提取

```bash
# 查找可能的密钥
strings firmware.bin | grep -E "^[A-Za-z0-9+/=]{32,}$"

# 查找配置文件
strings firmware.bin | grep -E "\.pem|\.key|\.crt"
```

### 硬编码凭证检测

```bash
# 搜索常见默认密码
grep -r "admin\|root\|password" extracted/ 2>/dev/null

# 搜索 API 密钥模式
grep -rE "[A-Za-z0-9]{20,}" extracted/ 2>/dev/null
```

## 📊 固件结构分析

### 查看固件头部

```bash
# 十六进制查看
hexdump -C firmware.bin | head -50

# 查看特定偏移
xxd -s 0x1000 -l 256 firmware.bin

# 查看魔术字节
head -c 64 firmware.bin | xxd
```

### 常见固件格式

| 格式 | 魔术字节 | 说明 |
|------|----------|------|
| U-Boot | `2705 1956` | U-Boot 镜像 |
| FIT | `AA55 0000` | Flattened Image Tree |
| JFFS2 | `1985 0319` | JFFS2 文件系统 |
| SquashFS | `hsqs` | SquashFS |
| UBI | `UBI#` | UBI 卷 |

### 自动化分析脚本

```python
#!/usr/bin/env python3
"""固件分析脚本"""
import sys
import struct
import os

def analyze_firmware(filename):
    """分析固件结构"""
    with open(filename, 'rb') as f:
        data = f.read()

    print(f"固件大小: {len(data)} bytes")
    print(f"前 64 字节: {data[:64].hex()}")

    # 检查魔术字节
    if data[:4] == b'\x27\x05\x19\x56':
        print("检测到: U-Boot 镜像")
    elif data[:4] == b'\xaa\x55\x00\x00':
        print("检测到: FIT 镜像")
    elif data[:4] == b'hsqs':
        print("检测到: SquashFS")

    # 熵分析
    entropy = calculate_entropy(data)
    print(f"平均熵: {entropy:.2f}")

def calculate_entropy(data):
    """计算香农熵"""
    if not data:
        return 0
    freq = [0] * 256
    for byte in data:
        freq[byte] += 1
    entropy = 0
    for f in freq:
        if f:
            p = f / len(data)
            entropy -= p * (p ** 0.5)  # 简化计算
    return entropy

if __name__ == '__main__':
    if len(sys.argv) > 1:
        analyze_firmware(sys.argv[1])
    else:
        print("用法: python3 analyze.py <firmware_file>")
```

## 🔧 固件修改与重打包

### 修改 SquashFS

```bash
# 解压
unsquashfs firmware.squashfs

# 修改文件
vim squashfs-root/etc/config/network

# 重新打包
mksquashfs squashfs-root new-firmware.squashfs -comp xz
```

### 修改 JFFS2

```bash
# 使用 mtd-utils
# 挂载原始镜像
modprobe mtdblock
modprobe jffs2
mount -o loop firmware.jffs2 /mnt/jffs2

# 修改文件
cp new_config /mnt/jffs2/etc/

# 卸载并重新生成镜像
umount /mnt/jffs2
mkfs.jffs2 -r /path/to/filesystem -o new-firmware.jffs2
```

## 📡 固件模拟

### 使用 QEMU 运行固件

```bash
# 安装 QEMU
sudo apt install qemu-system-arm qemu-user-static

# ARM 模拟
qemu-arm -L /usr/arm-linux-gnueabihf ./my_binary

# 完整系统模拟
qemu-system-arm \
    -M vexpress-a9 \
    -kernel zImage \
    -initrd rootfs.cpio.gz \
    -nographic \
    -net nic -net user
```

### Firmadyne（自动化模拟）

```bash
# 安装
git clone https://github.com/mirror/firmadyne.git
cd firmadyne

# 配置数据库
./scripts/getArchitecture.sh firmware.bin

# 模拟
./scripts/run.sh
```

## 📚 参考资源

| 资源 | 链接 |
|------|------|
| binwalk | https://github.com/ReFirmLabs/binwalk |
| FirmAE | https://github.com/pr0v3rbs/FirmAE |
| Ghidra | https://github.com/NationalSecurityAgency/ghidra |
| Radare2 | https://github.com/radareorg/radare2 |
| BMC Firmware Analysis | https://github.com/ANSSI-FR/bmc-tools |

---

*[返回首页](../README.md)* | *[目录](../_sidebar.md)*