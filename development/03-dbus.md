# D-Bus 编程入门

> OpenBMC 使用 D-Bus 作为进程间通信机制

## 📖 D-Bus 概述

D-Bus 是 Linux 系统中常用的进程间通信 (IPC) 机制：

```
┌─────────────┐     D-Bus      ┌─────────────┐
│   服务 A    │◄─────────────►│   服务 B    │
└─────────────┘                └─────────────┘
       │                              │
       └─────────── D-Bus ────────────┘
              (系统/会话总线)
```

## 🚌 D-Bus 基础

### 总线类型

| 类型 | 路径 | 说明 |
|------|------|------|
| 系统总线 | `/usr/share/dbus-1/system.conf` | 系统服务共享 |
| 会话总线 | 用户私有 | 桌面应用使用 |

### 服务和对象

```
D-Bus 服务 (Service)
└── 对象路径 (Object Path)
    └── 接口 (Interface)
        ├── 属性 (Properties)
        ├── 方法 (Methods)
        └── 信号 (Signals)
```

## 🔧 查看 D-Bus

### 使用 busctl

```bash
# 列出所有服务
busctl list

# 查看对象树
busctl tree <service-name>

# 查看接口详情
busctl introspect <service> <object-path>

# 读取属性
busctl get-property <service> <path> <interface> <property>

# 设置属性
busctl set-property <service> <path> <interface> <property> <type> <value>

# 调用方法
busctl call <service> <path> <interface> <method> <signature> <args>

# 监控消息
busctl monitor
```

### 使用 D-Feet

```bash
# D-Feet 是图形化 D-Bus 浏览器
apt install d-feet

# 启动
d-feet &
```

## 💻 C++ 编程

### 基础示例

```cpp
#include <sdbusplus/bus.hpp>
#include <sdbusplus/server/object.hpp>
#include <sdbusplus/exception.hpp>

// 定义接口
namespace MyInterface {
constexpr char name[] = "xyz.openbmc_project.MyService";
} // namespace MyInterface

// 服务类
class MyService {
public:
    MyService(sdbusplus::bus_t& bus, const char* path)
        : bus_(bus), obj_(bus_, path) {

        // 注册对象
        obj_.add_interface(MyInterface::name, *this);

        // 注册服务名
        bus_.request_name(MyInterface::name);
    }

    // 方法实现
    int32_t myMethod(int32_t arg) {
        return arg * 2;
    }

private:
    sdbusplus::bus_t& bus_;
    sdbusplus::server::object_t<> obj_;
};

int main() {
    auto bus = sdbusplus::bus::new_default();
    MyService service(bus, "/xyz/openbmc_project/MyService");
    bus.loop();
    return 0;
}
```

### 使用 sdbusplus::asio

```cpp
#include <sdbusplus/asio/connection.hpp>
#include <sdbusplus/asio/object_server.hpp>

int main() {
    auto bus = std::make_shared<sdbusplus::asio::connection>(
        sdbusplus::bus::new_default());

    auto server = sdbusplus::asio::object_server(bus);

    // 创建服务
    auto obj = server.add_object("/xyz/openbmc_project/MyService");

    // 添加接口
    obj->add_interface(
        "xyz.openbmc_project.MyService",
        [](sdbusplus::message_t& msg) {
            // 处理方法调用
            std::string method;
            msg.read(method);
            // ...
        });

    // 添加属性
    obj->add_property("Version", "1.0");

    // 添加信号
    obj->add_signal("xyz.openbmc_project.MyService", "MySignal");

    bus->loop();
}
```

### 读取属性

```cpp
auto method = bus->new_method_call(
    "xyz.openbmc_project.Settings",
    "/xyz/openbmc_project/settings",
    "org.freedesktop.DBus.Properties",
    "Get");

method.append("xyz.openbmc_project.Network", "DHCPEnabled");

auto reply = method.call();
bool dhcpEnabled;
reply.read(dhcpEnabled);
```

## 🐍 Python 编程

### 使用 python-dbus

```python
#!/usr/bin/env python3
import dbus
import dbus.service
import dbus.mainloop.glib

from gi.repository import GLib

class MyObject(dbus.service.Object):
    def __init__(self, bus, path):
        super().__init__(bus, path)
        self._value = 0

    @dbus.service.method(in_signature='i', out_signature='i')
    def MyMethod(self, value):
        """My D-Bus method"""
        self._value = value * 2
        return self._value

    @dbus.service.method(in_signature='', out_signature='i')
    def GetValue(self):
        return self._value

    @dbus.service.signal(signature='i')
    def ValueChanged(self, value):
        return value

def main():
    dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)

    bus = dbus.SystemBus()
    name = dbus.service.BusName("xyz.openbmc_project.MyService", bus)

    obj = MyObject(bus, "/xyz/openbmc_project/MyService")

    print("D-Bus service running...")
    GLib.MainLoop().run()

if __name__ == '__main__':
    main()
```

### 调用 D-Bus 方法

```python
#!/usr/bin/env python3
import dbus

def main():
    bus = dbus.SystemBus()

    # 获取代理对象
    obj = bus.get_object(
        "xyz.openbmc_project.Logging",
        "/xyz/openbmc_project/logging"
    )

    # 获取接口
    iface = dbus.Interface(obj, "xyz.openbmc_project.Logging.Create")

    # 调用方法
    result = iface.Create(
        "OpenBMC.0.1.TestEvent",
        "xyz.openbmc_project.Logging.Entry.Level.Error",
        0  # 额外数据
    )

    print(f"Created log entry: {result}")

if __name__ == '__main__':
    main()
```

## 📡 信号订阅

### C++ 信号处理

```cpp
#include <sdbusplus/bus.hpp>
#include <sdbusplus/exception.hpp>

// 订阅信号
void subscribeToSignals() {
    auto bus = sdbusplus::bus::new_default();

    // 匹配规则
    bus.add_match(
        "type='signal',"
        "interface='xyz.openbmc_project.Association',"
        "member='PropertiesChanged'",
        [](sdbusplus::message_t& msg) {
            // 处理信号
            std::string interface, property;
            msg.read(interface, property);

            if (property == "Endpoints") {
                // 处理 Endpoints 变更
            }
        });
}
```

### Python 信号处理

```python
#!/usr/bin/env python3
import dbus
import dbus.mainloop.glib
from gi.repository import GLib

def on_signal(*args, **kwargs):
    print("Received signal:")
    print(f"  Args: {args}")
    print(f"  Kwargs: {kwargs}")

def main():
    dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)
    bus = dbus.SystemBus()

    # 订阅信号
    bus.add_signal_receiver(
        on_signal,
        signal_name="PropertiesChanged",
        dbus_interface="org.freedesktop.DBus.Properties",
        bus_name="xyz.openbmc_project.EntityManager"
    )

    print("Listening for signals...")
    GLib.MainLoop().run()

if __name__ == '__main__':
    main()
```

## 🏗️ 添加自定义服务

### 1. 创建配方

```bash
# my-service_1.0.bb
SUMMARY = "My D-Bus Service"
DESCRIPTION = "A custom service for OpenBMC"
LICENSE = "MIT"
LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/MIT;md5=0835ade698e0bcf8506ecda2f7b4f302"

SRC_URI = "file://my-service.cpp \
           file://my-service.service"

S = "${WORKDIR}"

inherit systemd

SYSTEMD_SERVICE:${PN} = "my-service.service"

do_compile() {
    ${CXX} ${CXXFLAGS} -o my-service my-service.cpp \
        $(pkg-config --cflags --libs sdbusplus)
}

do_install() {
    install -d ${D}${systemd_unitdir}/system
    install -m 0644 my-service.service ${D}${systemd_unitdir}/system/
    install -d ${D}${bindir}
    install -m 0755 my-service ${D}${bindir}/
}
```

### 2. 创建 Systemd 服务

```ini
# my-service.service
[Unit]
Description=My D-Bus Service
After=dbus.service
Wants=dbus.service

[Service]
Type=dbus
BusName=xyz.openbmc_project.MyService
ExecStart=/usr/bin/my-service
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### 3. 在镜像中启用

```bash
# local.conf
IMAGE_INSTALL_append = " my-service"
```

## 🛠️ 常用 OpenBMC D-Bus 服务

| 服务 | 路径 | 说明 |
|------|------|------|
| Entity Manager | `/xyz/openbmc_project/entity` | 实体管理 |
| Logging | `/xyz/openbmc_project/logging` | 日志服务 |
| Settings | `/xyz/openbmc_project/settings` | 设置管理 |
| Inventory | `/xyz/openbmc_project/inventory` | 资产清单 |
| Network | `/xyz/openbmc_project/network` | 网络管理 |
| User Manager | `/xyz/openbmc_project/User` | 用户管理 |

## 📚 参考资源

- [sdbusplus 文档](https://github.com/openbmc/sdbusplus)
- [D-Bus 规范](https://dbus.freedesktop.org/doc/dbus-specification.html)
- [GIO/D-Bus](https://docs.gtk.org/gio/)

---

*[返回首页](/README)* | *[目录](/_sidebar)*