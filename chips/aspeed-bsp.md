# ASPEED 芯片 BSP 开发

> ASPEED AST2400/2500/2600/2700 芯片的 OpenBMC 适配指南

## 📋 BSP 概述

BSP (Board Support Package) 负责：
- 设备树配置
- 内核驱动适配
- U-Boot 配置
- 外设初始化

## 🗂️ 目录结构

```
meta-aspeed/
├── conf/
│   └── machine/
│       ├── ast2400-evb.conf      # 机器配置
│       ├── ast2500-evb.conf
│       ├── ast2600-evb.conf
│       └── ast2700-evb.conf
├── recipes-bsp/
│   ├── ast-cfg/                   # BMC 配置
│   └── ast-misc/                  # 杂项工具
├── recipes-kernel/
│   └── linux/
│       └── linux-aspeed/          # ASPEED 内核补丁
├── recipes-phosphor/
│   └── flash/                      # Flash 布局
└── recipes-restrict/
    └── aspeed-restrict-conf/       # 限制配置
```

## 🔧 设备树开发

### 基础设备树

```dts
// aspeed-ast2600-evb.dts
/dts-v1/;
#include "aspeed-ast2600.dtsi"

/ {
    model = "AST2600 EVB";
    compatible = "aspeed,ast2600-evb", "aspeed,ast2600";

    chosen {
        stdout-path = &uart5;
        bootargs = "console=ttyS0,115200 earlyprintk";
    };

    memory@4 {
        device_type = "memory";
        reg = <0x4 0x00000000 0x2 0x00000000>;  // 512MB
    };
};

/* UART5 作为 console */
&uart5 {
    status = "okay";
};
```

### KCS 接口配置

```dts
/* KCS1 - IPMI 标准接口 */
&kcs1 {
    status = "okay";
    aspeed,lpc-io-reg = <0xCA2>;
    aspeed,lpc-io-reg-size = <1>;
};

/* KCS4 - 备用接口 */
&kcs4 {
    status = "okay";
    aspeed,lpc-io-reg = <0xCA8>;
    aspeed,lpc-io-reg-size = <1>;
};
```

### I2C 总线配置

```dts
/* I2C 总线 */
&i2c0 {
    status = "okay";
    /* 访问 FMC SPI Flash */
    eeprom@50 {
        compatible = "at24c256";
        reg = <0x50>;
        pagesize = <64>;
    };
    /* 温度传感器 */
    tmp75@48 {
        compatible = "ti,tmp75";
        reg = <0x48>;
    };
};

/* I2C 总线多路复用 */
&i2c_mux {
    channel@0 {
        reg = <0>;
        #address-cells = <1>;
        #size-cells = <0>;
        /* 连接 FRU EEPROM */
        eeprom@56 {
            compatible = "at24c256";
            reg = <0x56>;
        };
    };
};
```

### GPIO 配置

```dts
/* GPIO 引脚配置 */
&gpio {
    status = "okay";

    /* 复位按钮 */
    reset-button {
        gpio-hog;
        gpios = <&gpio ASPEED_GPIO(0, 0) GPIO_ACTIVE_LOW>;
        output-low;
        line-name = "reset-button";
    };

    /* LED 控制 */
    blue-led {
        gpio-hog;
        gpios = <&gpio ASPEED_GPIO(1, 0) GPIO_ACTIVE_HIGH>;
        output-high;
        line-name = "blue-led";
    };
};
```

## 🔨 内核驱动

### 编译内核

```bash
# 进入内核源码目录
cd openbmc/linux

# 检出 ASPEED 分支
git checkout openbmc/openbmc-linux-5.15

# 配置 ASPEED 芯片
make ARCH=arm aspeed_defconfig

# 编译
make ARCH=arm -j$(nproc)

# 输出
# arch/arm/boot/zImage
# arch/arm/boot/dts/aspeed-ast2600-evb.dtb
```

### 常用内核配置

```bash
# 必须启用的选项
CONFIG_MACH_ASPEED_ARM64=y
CONFIG_ARCH_ASPEED=y
CONFIG_ASPEED_LPC_CTRL=y
CONFIG_ASPEED_KCS_IPMI=y
CONFIG_ASPEED_SCU=y
CONFIG_ASPEED_P2A_CTRL=y
CONFIG_ASPEED_SOCINFO=y

# I2C 支持
CONFIG_I2C_ASPEED=y

# GPIO 支持
CONFIG_GPIO_ASPEED=y

# PWM 风扇控制
CONFIG_PWM_ASPEED=y
CONFIG_THERMAL_ASPEED=y
```

### 加载内核模块

```bash
# 手动加载模块
modprobe aspeed-kcs-bmc
modprobe aspeed-scu
modprobe aspeed-pwm-tacho

# 查看模块
lsmod | grep aspeed

# 查看设备
dmesg | grep -i aspeed
```

## 🖥️ U-Boot 开发

### 编译 U-Boot

```bash
# 获取源码
git clone https://github.com/openbmc/u-boot.git
cd u-boot

# 检出 OpenBMC 分支
git checkout openbmc/openbmc-v2024.01

# 配置
make CROSS_COMPILE=aarch64-linux-gnu- ast2600_evb_defconfig

# 编译
make CROSS_COMPILE=aarch64-linux-gnu- -j$(nproc)

# 输出
# u-boot.bin
# u-boot.dtb
```

### U-Boot 环境变量

```bash
# 常用命令
printenv              # 打印所有环境变量
setenv ipaddr 192.168.1.100
setenv serverip 192.168.1.1
saveenv              # 保存到 Flash

# 网络启动
tftp 0x83000000 uImage
tftp 0x84000000 uramdisk.image.backup
bootm 0x83000000 0x84000000 0x83080000
```

### 设备树覆盖

U-Boot 可以动态修改设备树：

```bash
# 修改启动参数
setenv bootargs "console=ttyS0,115200"

# 启用 Secure Boot
setenv secureboot 1

# 设置 MAC 地址
setenv ethaddr 00:01:2E:3F:4A:5B
```

## 🔧 Flash 布局

### MTD 分区

```
+------------------------+ 0x00000000
|     Boot Loader        | 256KB
+------------------------+ 0x00040000
|     U-Boot ENV         | 128KB
+------------------------+ 0x00060000
|     Kernel (fitImage)  | 8MB
+------------------------+ 0x00860000
|     initramfs          | 4MB
+------------------------+ 0x00C60000
|     Root Filesystem    | 剩余空间
+------------------------+
```

### 配置 MTD

```bash
# conf/machine/ast2600-evb.conf
IMAGE_BOOT_FILES ?= "fitImage-initramfs-${MACHINE}.bootfiles"

UBOOT_ENV ?= "u-boot.env"

# MTD 分区表
JFFS2_ERASEBLOCK ?= "256"
MTD_PARTS := "ast2600-user0@0x300000(0x7D00000)"
```

## 📝 常见问题

### Q: 设备树不生效

```bash
# 确保内核加载正确的 DTB
dmesg | grep -i dtb

# 在 U-Boot 中指定正确的 DTB
setenv fdtaddr 0x83080000
setenv fdtfile aspeed-ast2600-evb.dtb
```

### Q: I2C 总线不工作

```bash
# 检查 I2C 控制器
i2cdetect -l

# 扫描总线
i2cdetect -y 0

# 检查设备树配置
cat /sys/firmware/devicetree/base/i2c@1e78a000/status
```

### Q: KCS 接口无响应

```bash
# 检查 KCS 状态
dmesg | grep -i kcs

# 查看 LPC 寄存器
devmem 0x1E789084

# 测试 IPMI 命令
ipmitool -I open local
```

## 📚 参考资源

- [meta-aspeed 仓库](https://github.com/openbmc/meta-aspeed)
- [ASPEED SDK](https://www.aspeedtech.com/support)
- [Linux ASPEED 驱动](https://github.com/AspeedTech-BMC/linux)

---

*[返回首页](../README.md)* | *[目录](../_sidebar.md)*