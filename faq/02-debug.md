# Debug 技巧

> OpenBMC 开发中的调试方法和技巧

## 🔍 系统日志

### journalctl 基础

```bash
# 查看所有日志
journalctl

# 实时跟踪日志
journalctl -f

# 按服务查看
journalctl -u <service-name> -f

# 按时间范围
journalctl --since "1 hour ago"
journalctl --since "2024-01-01 00:00:00" --until "2024-01-01 23:59:59"

# 查看错误日志
journalctl -p err

# 查看内核日志
journalctl -k

# 查看上次启动日志
journalctl -b -1

# 限制输出行数
journalctl -n 100

# 查看详细日志
journalctl -xe
```

### OpenBMC 特定服务

```bash
# IPMI 服务
journalctl -u phosphor-host-ipmid -f

# Redfish 服务
journalctl -u bmcweb -f

# D-Bus 服务
journalctl -u dbus -f

# 实体管理器
journalctl -u entity-manager -f

# 网络服务
journalctl -u systemd-networkd -f

# 所有 OpenBMC 服务
journalctl -u "phosphor-*" -f
```

### 系统日志文件

```bash
# OpenBMC 日志目录
ls -la /var/log/

# 查看 dmesg
dmesg
dmesg | grep -i error
dmesg | tail -50

# 内核环形缓冲区
cat /proc/kmsg
```

## 🐛 D-Bus 调试

### 监控 D-Bus 消息

```bash
# 监控所有消息
busctl monitor

# 监控特定服务
busctl monitor --match "sender=:1.123"

# 监控特定接口
busctl monitor --match "interface=xyz.openbmc_project.Logging"

# 监控方法调用
busctl capture  # wireshark 格式
```

### 查看服务树

```bash
# 查看所有服务
busctl list | grep openbmc

# 查看对象树
busctl tree xyz.openbmc_project.Settings

# 查看接口详情
busctl introspect xyz.openbmc_project.Logging /xyz/openbmc_project/logging

# 查看所有属性
busctl get-property xyz.openbmc_project.Settings \
    /xyz/openbmc_project/settings \
    xyz.openbmc_project.Network.EthernetInterfaces \
    VLANs
```

### D-Bus 调用测试

```bash
# 调用方法
busctl call xyz.openbmc_project.Logging \
    /xyz/openbmc_project/logging \
    xyz.openbmc_project.Logging.Create \
    ssa{ss} "TestEvent" xyz.openbmc_project.Logging.Entry.Level.Warning 0

# 列出可用的方法和属性
busctl introspect <service> <path>
```

## 🌐 网络调试

### IPMI 调试

```bash
# 启用 IPMI 调试模式
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc -v mc info

# 发送 RAW 命令并显示详细信息
ipmitool -v -I lanplus -H <BMC_IP> -U root -P 0penBmc raw 0x06 0x01

# 抓包分析 IPMI 流量
tcpdump -i eth0 -w ipmi.pcap port 623

# 使用 ipmitool 本地调试
ipmitool -I open mc info
```

### Redfish 调试

```bash
# 查看原始请求/响应
curl -v -k -u root:0penBmc https://<BMC_IP>/redfish/v1/

# 保存请求头
curl -k -u root:0penBmc -D headers.txt https://<BMC_IP>/redfish/v1/

# 测试超时
curl -k -u root:0penBmc --max-time 5 https://<BMC_IP>/redfish/v1/

# 显示 JSON 格式化
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/ | jq .
```

### 网络连接测试

```bash
# Ping 测试
ping <BMC_IP>

# 端口扫描
nmap -p 443,623 <BMC_IP>

# 查看网络配置
ip addr
ip route
cat /etc/resolv.conf

# 测试 DNS
nslookup openbmc.org
```

## 🔧 应用调试

### GDB 调试

```bash
# 在 BMC 上安装 GDB
opkg update && opkg install gdb

# 附加到进程
gdb attach $(pgrep <process-name>)

# 启动时调试
gdb /usr/bin/my-app
(gdb) run
(gdb) bt  # backtrace
```

### strace 追踪

```bash
# 安装
opkg install strace

# 追踪系统调用
strace -p $(pgrep my-service)

# 追踪文件访问
strace -f -e openat my-app

# 追踪网络调用
strace -f -e socket,connect,sendto,recvfrom my-app

# 输出到文件
strace -o output.txt -p $(pgrep my-service)
```

### ltrace 追踪库调用

```bash
# 安装
opkg install ltrace

# 追踪库调用
ltrace -p $(pgrep my-service)
```

## 🔬 内核调试

### 内核日志

```bash
# 启用所有内核消息
dmesg -n 8

# 持续监控
dmesg -w

# 查看特定模块消息
dmesg | grep -i aspeed
dmesg | grep -i kcs
dmesg | grep -i i2c
```

### 模块调试

```bash
# 查看加载的模块
lsmod

# 查看模块信息
modinfo aspeed-kcs-bmc

# 手动加载模块（带调试）
modprobe aspeed-kcs-bmc debug=1

# 查看模块参数
cat /sys/module/aspeed_kcs_bmc/parameters/*
```

### I2C 调试

```bash
# 列出 I2C 总线
i2cdetect -l

# 扫描总线
i2cdetect -y 0

# 读写 I2C 设备
i2cget -y 0 0x50 0x00
i2cset -y 0 0x50 0x00 0xFF

# 查看 I2C 适配器信息
i2cdetect -l
i2cdetect -F 0
i2cdetect -y 0
```

## 💾 内存调试

### 设备内存访问

```bash
# 安装 devmem2
opkg install devmem2

# 读取内存
devmem2 0x1E789084 w

# 写入内存
devmem2 0x1E789084 w 0x12345678
```

### 进程内存

```bash
# 查看进程列表
ps aux

# 查看特定进程
ps | grep <name>

# 查看进程打开的文件
lsof -p $(pgrep <name>)

# 查看进程映射
cat /proc/$(pgrep <name>)/maps
```

## 🔄 内核调试接口

### proc 文件系统

```bash
# 内核配置
cat /proc/cmdline

# CPU 信息
cat /proc/cpuinfo

# 内存信息
cat /proc/meminfo

# 中断信息
cat /proc/interrupts

# MTD 设备
cat /proc/mtd

# I2C 设备
cat /sys/bus/i2c/devices/i2c-0/name
```

### sys 文件系统

```bash
# GPIO 状态
ls /sys/class/gpio/
cat /sys/class/gpio/gpio0/value

# I2C 设备
ls /sys/bus/i2c/devices/

# MMC 设备
ls /sys/bus/mmc/
```

## 📊 性能分析

### CPU 和内存

```bash
# 实时监控
top

# 内存使用
free -h

# CPU 信息
cat /proc/cpuinfo

# 进程统计
ps aux --sort=-%cpu
```

### 磁盘 I/O

```bash
# 查看磁盘使用
df -h

# I/O 统计
cat /proc/diskstats

# 查看 MTD
cat /proc/mtd
```

## 🛠️ 常用调试脚本

### 综合诊断脚本

```bash
#!/bin/bash
# BMC 诊断脚本

echo "==== BMC 诊断信息 ===="
echo

echo "--- 系统信息 ---"
uname -a
cat /etc/os-release

echo
echo "--- 运行时间 ---"
uptime

echo
echo "--- 内存 ---"
free -h

echo
echo "--- 磁盘 ---"
df -h

echo
echo "--- IPMI 服务状态 ---"
systemctl status phosphor-host-ipmid --no-pager

echo
echo "--- Redfish 服务状态 ---"
systemctl status bmcweb --no-pager

echo
echo "--- 网络状态 ---"
ip addr
netstat -tuln

echo
echo "--- 最近日志 ---"
journalctl -n 20 --no-pager
```

### 网络抓包脚本

```bash
#!/bin/bash
# 抓取 IPMI/Redfish 流量

INTERFACE="eth0"
OUTPUT="capture_$(date +%Y%m%d_%H%M%S).pcap"

echo "开始抓包，按 Ctrl+C 停止..."
tcpdump -i $INTERFACE -w $OUTPUT port 443 or port 623

echo "保存到: $OUTPUT"
```

## 📚 参考资源

- [OpenBMC 调试指南](https://github.com/openbmc/docs/blob/master/development/debug-guide.md)
- [systemd 调试](https://www.freedesktop.org/software/systemd/man/journalctl.html)
- [D-Bus 调试](https://dbus.freedesktop.org/doc/dbus-send.html)

---

*[返回首页](/README)* | *[目录](/_sidebar)*