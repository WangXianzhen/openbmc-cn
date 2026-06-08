# IPMITOOL 常用命令速查

> OpenBMC 官方命令速查表的中文版

## ⚙️ 连接参数说明

```bash
# 常用连接参数
ipmitool -I <interface> -H <host> -U <user> -P <password> <command>

# 接口类型
#   lanplus    - IPMI over LAN (RMCP+), 需要 -C 17
#   lan        - IPMI over LAN (RMCP)
#   open       - 本地 IPMI (需要 ipmi_si 驱动)
#   usb        - IPMI over USB
```

## 🔌 电源管理

```bash
# 查看电源状态
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc power status

# 开机
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc power on

# 关机（软关机）
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc power soft

# 硬关机
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc power off

# 重启
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc power reset

# 循环重启
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc power cycle
```

## 👤 用户管理

```bash
# 查看所有用户
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc user list

# 用户摘要
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc user summary

# 创建用户
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc user set name 3 newuser

# 设置密码
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc user set password 3 Password123

# 启用用户
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc user enable 3

# 禁用用户
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc user disable 3

# 设置用户权限
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc user priv 3 4  # 4=Administrator
```

## 🌡️ 传感器数据

```bash
# 查看所有传感器
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc sensor list

# 查看特定传感器
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc sensor get "CPU Temp"

# 查看传感器阈值
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc sensor thresh "CPU Temp"

# 读取 SDR 记录
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc sdr list
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc sdr info

# 查看完整 SDR
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc sdr list all
```

## 📋 FRU 信息

```bash
# 查看所有 FRU 信息
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc fru list

# 查看特定 FRU
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc fru print 0

# FRU 字段说明
#   Product Name     - 产品名称
#   Product Version  - 产品版本
#   Manufacturer     - 制造商
#   Serial Number    - 序列号
#   Part Number      - 零件号
```

## 🖥️ 机箱管理

```bash
# 机箱状态
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc chassis status

# 设置引导设备
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc chassis bootdev pxe
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc chassis bootdev disk
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc chassis bootdev bios
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc chassis bootdev none

# 持久化引导设置
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc chassis bootdev pxe options=persistent

# EFI 模式引导
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc chassis bootdev pxe options=efiboot

# 查看引导参数
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc chassis bootparam get 5

# 电源开启时间
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc chassis poh

# 重启原因
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc chassis restart_cause

# 电源策略
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc chassis policy list
```

## 🌐 网络配置

```bash
# 查看 LAN 配置
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc lan print

# 设置 IP 地址
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc lan set 1 ipsrc static
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc lan set 1 ipaddr 192.168.1.100
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc lan set 1 netmask 255.255.255.0
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc lan set 1 defgw ipaddr 192.168.1.1

# 设置 DHCP
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc lan set 1 ipsrc dhcp

# 设置 MAC 地址
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc lan set 1 macaddr 00:01:2E:3F:4A:5B

# 查看通道信息
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc channel info
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc channel info 1
```

## 📝 系统事件日志 (SEL)

```bash
# 查看 SEL 信息
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc sel info

# 列出所有事件
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc sel list

# 查看特定事件
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc sel get <entry_id>

# 清空 SEL
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc sel clear

# 删除特定事件
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc sel delete <entry_id>

# 获取 SEL 时间
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc sel time get

# 设置 SEL 时间
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc sel time set "06/08/2024 12:00:00"
```

## 🖥️ BMC 管理

```bash
# BMC 信息
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc mc info

# BMC 冷复位
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc mc reset cold

# BMC 热复位
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc mc reset warm

# 查看 BMC 启用选项
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc mc getenables

# 启用/禁用功能
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc mc setenables <option> [on|off]
```

## 🔄 Serial Over LAN (SOL)

```bash
# SOL 信息
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc sol info

# 激活 SOL 会话
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc sol activate

# 断开 SOL 会话
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc sol deactivate

# 配置 SOL
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc sol set <parameter> <value>
```

## 💬 会话管理

```bash
# 查看所有会话
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc session info all

# 查看特定会话
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc session info <session_id>
```

## 🔧 RAW 命令

```bash
# 发送 RAW 命令
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc raw <netfn> <cmd> [data...]

# 示例：读取 BMC 固件版本
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc raw 0x06 0x01

# 示例：读取 MAC 地址
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc raw 0x0c 0x01 0x01
```

## 🌐 其他常用命令

```bash
# 查看系统状态
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc mc guid

# 查看固件版本
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc mc firmware revision

# 读取 NTP 配置
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc raw 0x32 0x0d
```

## 📋 常用脚本

```bash
#!/bin/bash
# IPMI 批量操作脚本

BMC_IP="192.168.1.100"
USER="root"
PASS="0penBmc"

# 批量查询传感器
for sensor in $(ipmitool -I lanplus -H $BMC_IP -U $USER -P $PASS sensor list | awk '{print $1}'); do
    value=$(ipmitool -I lanplus -H $BMC_IP -U $USER -P $PASS sensor get "$sensor" 2>/dev/null | grep "Sensor Reading" | awk '{print $4}')
    echo "$sensor: $value"
done
```

---

*[返回首页](../README.md)* | *[目录](../_sidebar.md)*