# IPMI 2.0 协议详解

> Intelligent Platform Management Interface - 智能平台管理接口

## 📖 概述

IPMI 是一种硬件管理接口规范，允许系统管理员：
- 远程监控系统硬件状态
- 控制服务器电源
- 收集传感器数据
- 访问系统事件日志

## 🏗️ IPMI 架构

```
┌─────────────────────────────────────────┐
│           远程管理客户端                  │
│        (ipmitool, IPMIView)              │
└─────────────────┬───────────────────────┘
                  │ IPMI over LAN (RMCP+)
                  │ UDP Port: 623
┌─────────────────▼───────────────────────┐
│              BMC 固件                    │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │ IPMI Message │  │  Sensor/Control │  │
│  │   Handler    │  │    Subsystem    │  │
│  └──────┬──────┘  └────────┬────────┘  │
│         │                  │            │
│  ┌──────▼──────────────────▼────────┐  │
│  │         System Interface         │  │
│  │    (KCS, SMIC, BT, SSIF)         │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 📡 IPMI 消息格式

### NetFn 和 CMD

```
┌────────┬────────┬────────┬────────┬──────────┬─────────────┐
│ 字节 1 │ 字节 2 │ 字节 3 │ 字节 4 │  字节 5  │  字节 6+    │
├────────┼────────┼────────┼────────┼──────────┼─────────────┤
│ NetFn  │  RsLun │  rsAddr │  Cmd  │ Data...  │    Data...  │
│ (7:2)  │ (1:0)  │        │       │          │             │
│  校验和  │        │  校验和 │       │          │             │
└────────┴────────┴────────┴────────┴──────────┴─────────────┘
```

### NetFn 类型

| NetFn | 类型 | 说明 |
|-------|------|------|
| 0x0C | Chassis | 机箱管理 |
| 0x0E | Bridge | 桥接管理 |
| 0x18 | Group Extension | 组扩展 |
| 0x20 | Sensor/Event | 传感器/事件 |
| 0x22 | FRU | FRU 信息 |
| 0x24 | SDR | 传感器数据记录 |
| 0x28 | SEL | 系统事件日志 |
| 0x2C | OEM | OEM 定义 |
| 0x30 | Application | 应用命令 |
| 0x32 | Transport | 传输配置 |

### 常用命令

```bash
# 获取 BMC 信息
ipmitool -I lanplus -H <BMC_IP> -U admin -P admin mc info

# 读取传感器数据
ipmitool -I lanplus -H <BMC_IP> -U admin -P admin sensor list

# 电源控制
ipmitool -I lanplus -H <BMC_IP> -U admin -P admin power on/off/reset/cycle

# 查看 FRU 信息
ipmitool -I lanplus -H <BMC_IP> -U admin -P admin fru list

# 查看系统事件日志
ipmitool -I lanplus -H <BMC_IP> -U admin -P admin sel list
```

## 🌐 IPMI over LAN

### RMCP+ 认证流程

```
1. 客户端 → BMC: Session Setup Request
2. BMC → 客户端: Session Setup Response (+ Challenge)
3. 客户端 → BMC: Session Authenticate (密码验证)
4. BMC → 客户端: Session Authenticate ACK
5. 客户端 ↔ BMC: RMCP+ Session Active
```

### 安全配置

```bash
# 查看 LAN 配置
ipmitool -I lanplus -H <BMC_IP> -U admin -P admin lan print

# 设置 IP 地址
ipmitool -I lanplus -H <BMC_IP> -U admin -P admin lan set 1 ipaddr 192.168.1.100

# 启用/禁用 IPMI
ipmitool -I lanplus -H <BMC_IP> -U admin -P admin raw 0x3C 0x01 0x01 0x00
```

## 🔧 在 OpenBMC 中使用 IPMI

### OpenBMC IPMI 架构

OpenBMC 使用 D-Bus 作为内部通信，phosphor-host-ipmid 处理 IPMI 命令：

```
IPMI Command → phosphor-host-ipmid → D-Bus → 服务
```

### 注册自定义 IPMI 命令

```cpp
// phosphor-host-ipmid 中添加命令
#include <ipmid/api.hpp>

// 定义 NetFn 和 Cmd
static constexpr uint8_t netfn = 0x2C;  // OEM NetFn
static constexpr uint8_t cmd = 0x01;    // 自定义命令

// 注册处理函数
void registerUserCommand()
{
    ipmi::registerHandler(ipmi::prioOpenBmcBase, netfn, cmd,
        ipmi::Privilege::Admin, handleCustomCommand);
}

// 处理函数实现
ipmi::RspType<std::vector<uint8_t>>
handleCustomCommand(const std::vector<uint8_t>& data)
{
    // 处理逻辑
    std::vector<uint8_t> response = {...};
    return ipmi::responseSuccess(response);
}
```

## 📊 常用传感器类型

| 传感器类型 | 说明 | 单位 |
|-----------|------|------|
| Temperature | 温度 | °C |
| Voltage | 电压 | V |
| Current | 电流 | A |
| Fan | 风扇转速 | RPM |
| Power | 功耗 | W |
| Processor | 处理器状态 | N/A |
| Memory | 内存状态 | N/A |

## 🛡️ IPMI 安全

### 最佳实践

1. **更改默认密码**
   ```bash
   ipmitool -I lanplus -H <BMC_IP> -U admin -P admin user set password 2 NewPassword
   ```

2. **禁用匿名访问**
   ```bash
   ipmitool -I lanplus -H <BMC_IP> -U admin -P admin raw 0x3C 0x02 0x00 0x01
   ```

3. **限制 IP 访问** (如果 BMC 支持)
   ```bash
   ipmitool -I lanplus -H <BMC_IP> -U admin -P admin lan set 1 access on
   ```

4. **使用加密** (RMCP+)
   ```bash
   ipmitool -I lanplus -H <BMC_IP> -U admin -P admin lan set 1 cipher_privs \
       xxxxxxxxxxxx
   ```

## 📚 更多资源

- [IPMITOOL 速查手册](../protocols/02-ipmitool.md)
- [OpenBMC IPMI 实现](https://github.com/openbmc/phosphor-host-ipmid)
- [IPMI 2.0 规范 (Intel)](https://www.intel.com/content/www/us/en/products/docs/servers/ipmi/ipmi-home.html)

---

*[返回首页](../README.md)* | *[目录](../_sidebar.md)*