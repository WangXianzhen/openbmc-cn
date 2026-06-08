# 编写自定义 IPMI 命令

> 在 OpenBMC 中添加 OEM 特定的 IPMI 命令

## 📖 IPMI NetFn 概述

IPMI 命令使用 NetFn (Network Function) 分类：

| NetFn | 名称 | 用途 |
|-------|------|------|
| 0x06 | App | BMC 信息、认证 |
| 0x0C | Chassis | 机箱管理 |
| 0x0E | Bridge | KCS 桥接 |
| 0x20 | Sensor/Event | 传感器、事件 |
| 0x22 | FRU | FRU 信息 |
| 0x28 | SEL | 系统事件日志 |
| 0x2C | OEM | OEM 特定命令 |

## 🏗️ OpenBMC IPMI 架构

```
IPMI 请求 (LAN/KCS)
        ↓
phosphor-host-ipmid
        ↓
  ┌─────┴─────┐
  │           │
NetFn 处理    D-Bus 桥接
  │           │
  │     ┌─────┴─────┐
  │     │           │
  │  Service A   Service B
  │     │           │
  └─────┴───────────┘
        ↓
    响应
```

## 💻 添加自定义命令

### 步骤 1: 修改 phosphor-host-ipmid

```bash
# 克隆仓库
git clone https://github.com/openbmc/phosphor-host-ipmid.git
cd phosphor-host-ipmid
```

### 步骤 2: 定义命令

```cpp
// mycustomnetfn.cpp

#include <ipmid/api.hpp>
#include <ipmid/types.hpp>
#include <ipmid/utils.hpp>
#include <nipmid/handler.hpp>
#include <phosphor-logging/log.hpp>

namespace phosphor
{
namespace ipmi
{

// 定义 NetFn 和 Cmd
static constexpr uint8_t netFn = 0x2C;  // OEM NetFn
static constexpr uint8_t cmdGetInfo = 0x01;
static constexpr uint8_t cmdSetConfig = 0x02;
static constexpr uint8_t cmdGetSensor = 0x03;

// 响应结构体
struct GetInfoRsp
{
    uint8_t version;
    uint8_t status;
    uint16_t capabilities;
} __attribute__((packed));

// 获取自定义信息
RspType<GetInfoRsp> getCustomInfo()
{
    GetInfoRsp rsp{};
    rsp.version = 0x01;
    rsp.status = 0x00;
    rsp.capabilities = 0x1234;

    return ipmi::responseSuccess(rsp);
}

// 请求结构体
struct SetConfigReq
{
    uint8_t configId;
    uint8_t configValue;
} __attribute__((packed));

// 设置配置
RspType<> setConfig(SetConfigReq& req)
{
    // 验证配置 ID
    if (req.configId > 10) {
        return ipmi::responseUnspecifiedError();
    }

    // 存储配置到 D-Bus 或文件
    // ...

    phosphor::logging::log<phosphor::logging::level::INFO>(
        "Custom config set",
        phosphor::logging::entry("ID=%d", req.configId),
        phosphor::logging::entry("VALUE=%d", req.configValue));

    return ipmi::responseSuccess();
}

// 获取传感器数据
RspType<uint16_t> getCustomSensorData()
{
    // 从传感器读取数据
    uint16_t value = readSensorValue();

    return ipmi::responseSuccess(value);
}

// 注册命令
void registerCustomCommands()
{
    // 注册获取信息命令
    ipmi::registerHandler(
        ipmi::prioOpenBmcBase,
        netFn,
        cmdGetInfo,
        ipmi::Privilege::Admin,
        getCustomInfo);

    // 注册设置配置命令
    ipmi::registerHandler(
        ipmi::prioOpenBmcBase,
        netFn,
        cmdSetConfig,
        ipmi::Privilege::Admin,
        setConfig);

    // 注册获取传感器命令
    ipmi::registerHandler(
        ipmi::prioOpenBmcBase,
        netFn,
        cmdGetSensor,
        ipmi::Privilege::Operator,
        getCustomSensorData);

    phosphor::logging::log<phosphor::logging::level::INFO>(
        "Custom IPMI commands registered");
}

} // namespace ipmi
} // namespace phosphor
```

### 步骤 3: 注册初始化

```cpp
// 在 main.cpp 或单独的初始化文件中

#include "mycustomnetfn.cpp"

// 在 main 函数中调用
int main(int argc, char** argv)
{
    // ... 其他初始化 ...

    // 注册自定义命令
    phosphor::ipmi::registerCustomCommands();

    // ... 继续启动 ...
}
```

### 步骤 4: 添加到构建

```bash
# 在 meson.build 或 Makefile 中添加源文件
# meson.build
mycustom_sources = ['mycustomnetfn.cpp']

# 或在现有构建文件中添加
sources += mycustom_sources
```

## 📡 测试命令

### 使用 ipmitool 测试

```bash
# 获取自定义信息
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc raw 0x2c 0x01

# 设置配置
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc raw 0x2c 0x02 0x05 0x10

# 获取传感器数据
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc raw 0x2c 0x03
```

### Python 测试脚本

```python
#!/usr/bin/env python3
import subprocess
import struct

def send_ipmi_raw(netfn, cmd, data=None):
    """发送 IPMI RAW 命令"""
    cmd_parts = ["ipmitool", "-I", "lanplus", "-H", "192.168.1.100",
                 "-U", "root", "-P", "0penBmc", "raw", "0x{:02x}".format(netfn),
                 "0x{:02x}".format(cmd)]

    if data:
        cmd_parts.extend(["0x{:02x}".format(d) for d in data])

    result = subprocess.run(cmd_parts, capture_output=True, text=True)
    return result.stdout.strip()

def get_custom_info():
    """获取自定义信息"""
    response = send_ipmi_raw(0x2C, 0x01)
    if response:
        data = bytes.fromhex(response.replace(' ', ''))
        version, status, caps = struct.unpack('BBH', data)
        return {
            'version': version,
            'status': status,
            'capabilities': caps
        }
    return None

def set_custom_config(config_id, value):
    """设置自定义配置"""
    response = send_ipmi_raw(0x2C, 0x02, [config_id, value])
    return response == ""

if __name__ == '__main__':
    # 测试
    info = get_custom_info()
    print(f"Custom Info: {info}")

    if set_custom_config(5, 0x10):
        print("Config set successfully")
```

## 🔒 权限控制

IPMI 支持不同权限级别：

| 权限 | 值 | 说明 |
|------|-----|------|
| Privilege::Callback | 1 | 只能读取 |
| Privilege::User | 2 | 用户权限 |
| Privilege::Operator | 3 | 操作员权限 |
| Privilege::Admin | 4 | 管理员权限 |
| Privilege::OEM | 5 | OEM 特定 |

```cpp
// 低权限命令（仅用户可访问）
ipmi::registerHandler(
    ipmi::prioOpenBmcBase,
    netFn,
    cmdGetSensor,
    ipmi::Privilege::User,  // 仅需用户权限
    getCustomSensorData);

// 高权限命令（需要管理员）
ipmi::registerHandler(
    ipmi::prioOpenBmcBase,
    netFn,
    cmdSetConfig,
    ipmi::Privilege::Admin,  // 需要管理员权限
    setConfig);
```

## 🔗 与 D-Bus 集成

```cpp
// 从 D-Bus 读取数据
RspType<> getConfigFromDbus()
{
    auto bus = sdbusplus::bus::new_default();

    auto method = bus.new_method_call(
        "xyz.openbmc_project.Settings",
        "/xyz/openbmc_project/settings/myconfig",
        "org.freedesktop.DBus.Properties",
        "Get");

    method.append("xyz.openbmc_project.MyConfig", "Value");

    auto reply = method.call();
    std::variant<std::string> value;
    reply.read(value);

    return ipmi::responseSuccess(std::get<std::string>(value));
}
```

## 📊 常用 NetFn 参考

| NetFn | 十进制 | 说明 |
|-------|--------|------|
| App | 6 | BMC 信息、认证、会话 |
| Chassis | 12 | 电源、热、重启 |
| Bridge | 14 | KCS 桥接 |
| SensorEvent | 32 | 传感器、事件 |
| Storage | 34 | FRU、SDR、SEL |
| Transport | 44 | LAN 配置 |
| PICMG | 42 | ATCA 扩展 |
| OEM | 44 | OEM 特定 (ASPEED 使用) |

## ⚠️ 注意事项

1. **NetFn 0x2C** 是 ASPEED 和许多厂商使用的 OEM NetFn
2. 确保命令 ID 不与其他厂商冲突
3. 添加足够的错误处理
4. 记录日志便于调试
5. 考虑安全性，避免暴露敏感信息

## 📚 参考资源

- [phosphor-host-ipmid 源码](https://github.com/openbmc/phosphor-host-ipmid)
- [IPMI 规范 (Intel)](https://www.intel.com/content/www/us/en/products/docs/servers/ipmi/ipmi-home.html)
- [OpenBMC IPMI 实现文档](https://github.com/openbmc/docs/blob/master/ipmi.md)

---

*[返回首页](/README)* | *[目录](/_sidebar)*