# 第一个 Hello World

> 在 OpenBMC 上运行你的第一个程序

## 🛠️ 准备工作

确保你已经完成：
- [开发环境搭建](01-environment.md)
- [QEMU 模拟运行](02-qemu.md)

## 📦 添加新程序

### 方法一：使用 devtool

```bash
# 进入构建目录
cd ~/openbmc/build

# 激活开发环境
source tmp/deploy/images/<machine>/obmc-phosphor-image-<machine>.sh

# 添加新程序
devtool add hello https://github.com/yourname/hello-world.git

# 编辑代码
devtool edit-recipe hello

# 编译
devtool build hello

# 部署到镜像
devtool deploy-target hello root@<BMC_IP>
```

### 方法二：直接添加 Recipe

```bash
# 创建配方文件
cat > meta-custom/recipes-apps/hello/hello_1.0.bb << EOF
SUMMARY = "Hello World application"
DESCRIPTION = "My first OpenBMC application"
LICENSE = "MIT"
LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/MIT;md5=0835ade698e0bcf8506ecda2f7b4f302"

SRC_URI = "file://hello.c"

S = "${WORKDIR}"

do_compile() {
    \${CC} \${CFLAGS} \${LDFLAGS} -o hello hello.c
}

do_install() {
    install -d \${D}\${bindir}
    install -m 0755 hello \${D}\${bindir}
}
EOF
```

## 💻 Hello World 代码

```c
// hello.c
#include <stdio.h>
#include <stdlib.h>
#include <systemd/sd-bus.h>

int main(int argc, char *argv[]) {
    printf("Hello from OpenBMC!\n");
    printf("Build time: %s %s\n", __DATE__, __TIME__);
    
    // 打印系统信息
    FILE *fp = fopen("/etc/os-release", "r");
    if (fp) {
        char line[256];
        while (fgets(line, sizeof(line), fp)) {
            if (strstr(line, "PRETTY_NAME")) {
                printf("%s", line);
            }
        }
        fclose(fp);
    }
    
    return 0;
}
```

## 🔨 编译和部署

### 编译

```bash
bitbake hello
```

### 部署

```bash
# 方案1: 通过 SSH 复制
scp tmp/deploy/image/<machine>/hello root@<BMC_IP>:/usr/bin/

# 方案2: 打包进镜像重新烧录
bitbake obmc-phosphor-image
```

### 运行

```bash
# SSH 登录 BMC
ssh root@<BMC_IP>

# 运行程序
hello
```

输出示例：
```
Hello from OpenBMC!
Build time: Jun  8 2024 12:00:00
PRETTY_NAME="OpenBMC Phoshpor"
```

## 📝 使用 D-Bus 服务

创建系统服务：

```c
// hello-service.c
#include <sdbusplus/bus.hpp>
#include <sdbusplus/server/object.hpp>

int main() {
    auto bus = sdbusplus::bus::new_system();
    
    // 注册服务名
    bus.request_name("xyz.openbmc_project.Hello");
    
    // 创建对象
    auto obj = sdbusplus::server::object_t<>(
        bus, "/xyz/openbmc_project/Hello");
    
    // 添加接口
    obj.add_interface("xyz.openbmc_project.Hello",
        [](void) {
            printf("Hello called via D-Bus!\n");
        });
    
    bus.loop();
}
```

服务配置文件：

```ini
# hello.service
[Unit]
Description=Hello World Service
After=dbus.service

[Service]
ExecStart=/usr/bin/hello-service
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## 🎉 下一步

- [Yocto 开发指南](../development/02-yocto.md)
- [D-Bus 编程入门](../development/03-dbus.md)

---

*[返回首页](../README.md)* | *[目录](../_sidebar.md)*
