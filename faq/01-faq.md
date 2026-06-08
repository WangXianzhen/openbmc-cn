# 常见问题 FAQ

> OpenBMC 开发中遇到的常见问题及解决方案

## 🚀 编译问题

### Q: bitbake 编译失败，提示内存不足

**症状：**
```
ERROR: oe_runtime_package.qtjsbackend-5.15.2-r0 do_package: was killed (signal 9)
```

**解决方案：**
```bash
# 方法1: 增加 swap
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 方法2: 减少并行编译数
echo 'BB_NUMBER_THREADS = "4"' >> conf/local.conf
echo 'PARALLEL_MAKE = "-j 4"' >> conf/local.conf

# 方法3: 使用 tmpfs 限制
echo 'BB_MAX_THREADS = "4"' >> conf/local.conf
```

### Q: 下载源码超时

**解决方案：**
```bash
# 使用国内镜像
export OECMAKE_NANO_RELOC=0

# 修改 conf/site.conf
SSTATE_MIRRORS ?= "file://.* http://example.com/sstate/PATH"

# 或使用代理
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890
```

### Q: 编译错误找不到头文件

**解决方案：**
```bash
# 清理并重新编译
bitbake -c cleanall <package>
bitbake <package>

# 查看依赖
bitbake -g <package> && cat package-depends.dot
```

## 🌐 网络问题

### Q: SSH 连接 BMC 超时

**排查步骤：**
```bash
# 1. 检查网络连接
ping <BMC_IP>

# 2. 检查端口是否开放
nc -zv <BMC_IP> 22

# 3. 检查 BMC 网络配置
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc lan print

# 4. 检查 SSH 服务状态
ssh -v -p 22 root@<BMC_IP>
```

**解决方案：**
```bash
# 通过 IPMI 重置网络
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc mc reset cold

# 或设置静态 IP
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc lan set 1 ipsrc static
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc lan set 1 ipaddr <NEW_IP>
```

### Q: IPMI 连接失败

**可能原因：**
1. IPMI 未启用
2. 密码错误
3. 网络配置问题
4. 端口被防火墙阻止

**解决方案：**
```bash
# 检查 IPMI 配置
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc raw 0x3C 0x01

# 启用 LAN IPMI
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc raw 0x3C 0x01 0x01 0x01
```

## 🔒 安全问题

### Q: 忘记 BMC 密码

**解决方案：**

1. 通过 IPMI 重置（如果知道管理员密码）
```bash
ipmitool -I lanplus -H <BMC_IP> -U admin -P admin user set password 2 NewPass123
```

2. 通过串口重置
```bash
# 连接串口后
root 用户登录
passwd root
# 输入新密码
```

3. 恢复出厂设置
```bash
# 通过 Redfish
curl -k -u root:0penBmc -X POST \
    -H "Content-Type: application/json" \
    -d '{"ResetType": "ResetAll"}' \
    https://<BMC_IP>/redfish/v1/Managers/bmc/Actions/Manager.ResetToDefaults
```

### Q: SSL 证书问题

**解决方案：**
```bash
# 忽略 SSL 证书验证（仅用于测试）
curl -k https://<BMC_IP>/redfish/v1/

# 或导入证书
curl -E /path/to/client.pem https://<BMC_IP>/redfish/v1/
```

## 💻 系统问题

### Q: BMC 无响应，无法远程管理

**解决方案：**

1. 尝试硬件复位
2. 通过 IPMI 软重启
```bash
ipmitool -I lanplus -H <BMC_IP> -U root -P 0penBmc mc reset cold
```

3. 检查日志
```bash
# 串口登录后
journalctl -xe
dmesg | tail -50
```

### Q: 文件系统只读

**解决方案：**
```bash
# 重新挂载
mount -o remount,rw /

# 检查磁盘空间
df -h

# 清理日志
journalctl --vacuum-size=10M
rm -rf /var/log/*.old
```

### Q: 服务启动失败

**解决方案：**
```bash
# 查看服务状态
systemctl status <service-name>

# 查看详细日志
journalctl -u <service-name> -n 100

# 重启服务
systemctl restart <service-name>

# 查看依赖
systemctl list-dependencies <service-name>
```

## 🛠️ 开发问题

### Q: D-Bus 调用超时

**可能原因：**
- 服务未运行
- 接口路径错误
- 服务卡死

**解决方案：**
```bash
# 检查服务状态
systemctl status <service>

# 查看 D-Bus 服务
busctl tree <service-name>

# 重启相关服务
systemctl restart <service>
```

### Q: 如何添加自定义传感器？

**步骤：**

1. 在 Entity Manager 配置文件中添加：
```json
{
    "Name": "CPU_Temp",
    "Type": "Temperature",
    "Readings": [{
        "Name": "CPU",
        "Address": "0x4A",
        "Multiplier": 1,
        "Divisor": 1,
        "Offset": 0,
        "Unit": "DegreesC"
    }]
}
```

2. 部署并重启
```bash
scp config.json root@<BMC_IP>:/etc/entity-manager/
systemctl restart entity-manager
```

## 📚 更多帮助

如果以上方案无法解决您的问题：

1. 查看 OpenBMC 官方文档
2. 在 GitHub Issues 中搜索类似问题
3. 在 Discord 社区寻求帮助
4. 在邮件列表中提问

---

*[返回首页](/README)* | *[目录](/_sidebar)*