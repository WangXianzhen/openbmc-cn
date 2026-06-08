# OpenBMC 架构解析

> 深入理解 OpenBMC 系统架构

## 🏗️ 系统架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    应用层 (Application Layer)                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │ Web UI  │  │ Redfish │  │ IPMI    │  │  Custom Apps    │ │
│  │(React)  │  │  API    │  │ Handler │  │                 │ │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────────┬────────┘ │
└───────┼────────────┼────────────┼────────────────┼──────────┘
        │            │            │                │
        └────────────┴────────────┴────────────────┘
                              │ D-Bus
┌─────────────────────────────▼───────────────────────────────┐
│                   服务层 (Service Layer)                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐ │
│  │phosphor-   │ │phosphor-   │ │phosphor-   │ │ sdbusplus │ │
│  │logging     │ │settingsd   │ │objmgr      │ │  server   │ │
│  └────────────┘ └────────────┘ └────────────┘ └───────────┘ │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐ │
│  │phosphor-   │ │phosphor-   │ │phosphor-   │ │ Entity    │ │
│  │hwmon       │ │networkd    │ │host-ipmid  │ │ Manager   │ │
│  └────────────┘ └────────────┘ └────────────┘ └───────────┘ │
└─────────────────────────────┬───────────────────────────────┘
                              │ D-Bus
┌─────────────────────────────▼───────────────────────────────┐
│                    系统接口层 (System Interface)              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐ │
│  │   BMC HW   │ │   Host     │ │    I2C     │ │   GPIO    │ │
│  │   Driver   │ │  Interface │ │   Bus      │ │  Driver   │ │
│  └────────────┘ └────────────┘ └────────────┘ └───────────┘ │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                    Bootloader (U-Boot)                       │
│                    Linux Kernel                              │
│                    Systemd Init                              │
└─────────────────────────────────────────────────────────────┘
```

## 📂 目录结构

```
openbmc/
├── bitbake/                    # BitBake 构建工具
├── meta-openbmc/               # OpenBMC 通用层
├── meta-openbmc-machines/      # 机器配置
├── meta-aspeed/                # ASPEED 芯片 BSP
├── meta-facebook/              # Facebook 特定层
├── openbmc/                    # 构建脚本
│   ├── scripts/                # 构建辅助脚本
│   └── meta-*/                 # 各种 meta 层
└── build/                      # 构建输出目录
```

## 🔌 D-Bus 架构

OpenBMC 使用 D-Bus 作为进程间通信机制：

### 服务注册

```cpp
// 注册一个 D-Bus 服务
auto method = sdbusplus::asio::registerMethod(
    objPath, "InterfaceName", "MethodName",
    [](...) { /* 处理逻辑 */ return response; }
);
```

### 常见服务

| 服务名 | 说明 | D-Bus 路径 |
|--------|------|-----------|
| Entity Manager | 实体管理 | /xyz/openbmc_project/entity |
| Logging | 日志服务 | /xyz/openbmc_project/logging |
| Settings | 设置管理 | /xyz/openbmc_project/settings |
| Inventory | 资产清单 | /xyz/openbmc_project/inventory |

### 查看 D-Bus 服务

```bash
# 列出所有 D-Bus 服务
busctl list

# 查看特定服务
busctl tree xyz.openbmc_project.Logging

# 查看接口方法
busctl introspect xyz.openbmc_project.Logging /xyz/openbmc_project/logging
```

## 🖥️ 核心组件

### phosphor-objmgr

对象管理器，维护 D-Bus 对象的注册表：

```bash
# 查看所有对象
busctl tree xyz.openbmc_project.object
```

### phosphor-host-ipmid

IPMI 命令处理器：

```
IPMI Request
    ↓
KCS/BT Interface
    ↓
phosphor-host-ipmid
    ↓
D-Bus Call
    ↓
Response
```

### bmcweb

Redfish HTTP 服务：

```
HTTP Request (Redfish)
    ↓
bmcweb
    ↓
D-Bus Mapping
    ↓
Service Call
    ↓
JSON Response
```

## 🔧 开发流程

### 添加新的 D-Bus 服务

1. **创建服务目录**
   ```bash
   mkdir -p meta-myboard/recipes-phosphor/myservice/my-service_git.bb
   ```

2. **编写服务代码**
   ```cpp
   // myservice.cpp
   #include <sdbusplus/bus.hpp>
   #include <sdbusplus/exception.hpp>

   int main() {
       auto bus = sdbusplus::bus::new_default();
       bus.request_name("xyz.openbmc_project.myservice");

       // 添加接口和方法
       auto server = sdbusplus::asio::object_server(bus);

       // 创建对象路径
       sd_bus_add_object_manager(bus.get(), nullptr, "/xyz/openbmc_project/myservice");

       bus.loop();
   }
   ```

3. **编写 BitBake 配方**
   ```bash
   # my-service_git.bb
   SUMMARY = "My OpenBMC Service"
   LICENSE = "MIT"
   inherit systemd

   SRC_URI = "git://github.com/myrepo/my-service.git;branch=main"
   S = "${WORKDIR}/git"

   SYSTEMD_SERVICE:${PN} = "my-service.service"

   do_install() {
       install -d ${D}${systemd_unitdir}/system
       install -m 0644 ${S}/my-service.service ${D}${systemd_unitdir}/system/
       install -m 0755 ${S}/myservice ${D}${bindir}/
   }
   ```

## 📊 Yocto 层结构

```
┌─────────────────────────────────────────────────────────────┐
│                    Distribution Layer                        │
│              (openbmc-distro / meta-phosphor)               │
├─────────────────────────────────────────────────────────────┤
│                    Machine Layer                             │
│         (meta-aspeed, meta-facebook, etc.)                  │
├─────────────────────────────────────────────────────────────┤
│                    BSP Layer                                 │
│               (meta-openbmc-machines)                       │
├─────────────────────────────────────────────────────────────┤
│                    Common Layer                              │
│                  (meta-openbmc)                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔍 调试工具

```bash
# 查看 D-Bus 消息
busctl monitor

# 查看特定接口的消息
busctl monitor --match "interface='xyz.openbmc_project.Logging'"

# 查看进程打开的文件
lsof | grep my-service

# 查看系统日志
journalctl -u my-service -f

# 查看 D-Bus 服务依赖
busctl tree --no-pager
```

---

*[返回首页](/README)* | *[目录](/_sidebar)*