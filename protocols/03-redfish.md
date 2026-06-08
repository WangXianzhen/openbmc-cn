# Redfish API 入门

> DMTF 标准 - 现代化 BMC 管理接口

## 📖 什么是 Redfish？

Redfish 是 DMTF（Distributed Management Task Force）制定的服务器管理标准，提供：
- RESTful API 接口
- JSON 数据格式
- 统一的数据模型
- 更好的安全性

## 🔗 API 基础

### 认证方式

```bash
# 方式1: Basic Authentication
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/

# 方式2: Session Token
# 1. 创建 Session
curl -k -X POST -H "Content-Type: application/json" \
    -d '{"UserName":"root","Password":"0penBmc"}' \
    https://<BMC_IP>/redfish/v1/SessionService/Sessions

# 2. 获取 X-Auth-Token
# 3. 使用 Token 访问
curl -k -H "X-Auth-Token: <token>" \
    https://<BMC_IP>/redfish/v1/
```

### 常用端点

| 端点 | 说明 |
|------|------|
| `/redfish/v1/` | 服务根目录 |
| `/redfish/v1/Systems/` | 服务器系统 |
| `/redfish/v1/Chassis/` | 机箱信息 |
| `/redfish/v1/Managers/` | BMC 管理器 |
| `/redfish/v1/AccountService/` | 账户服务 |
| `/redfish/v1/UpdateService/` | 固件更新 |

## 🖥️ 系统管理

### 获取系统信息

```bash
# 获取系统列表
curl -k -u root:0penBmc \
    https://<BMC_IP>/redfish/v1/Systems | jq '.Members[]'

# 获取单个系统详情
curl -k -u root:0penBmc \
    https://<BMC_IP>/redfish/v1/Systems/system | jq
```

### 电源控制

```bash
# 开机
curl -k -u root:0penBmc -X POST \
    -H "Content-Type: application/json" \
    -d '{"ResetType": "On"}' \
    https://<BMC_IP>/redfish/v1/Systems/system/Actions/ComputerSystem.Reset

# 关机
curl -k -u root:0penBmc -X POST \
    -H "Content-Type: application/json" \
    -d '{"ResetType": "ForceOff"}' \
    https://<BMC_IP>/redfish/v1/Systems/system/Actions/ComputerSystem.Reset

# 重启
curl -k -u root:0penBmc -X POST \
    -H "Content-Type: application/json" \
    -d '{"ResetType": "ForceRestart"}' \
    https://<BMC_IP>/redfish/v1/Systems/system/Actions/ComputerSystem.Reset

# 优雅关机
curl -k -u root:0penBmc -X POST \
    -H "Content-Type: application/json" \
    -d '{"ResetType": "GracefulShutdown"}' \
    https://<BMC_IP>/redfish/v1/Systems/system/Actions/ComputerSystem.Reset
```

### 设置引导顺序

```bash
# 设置从 PXE 启动
curl -k -u root:0penBmc -X PATCH \
    -H "Content-Type: application/json" \
    -d '{
        "Boot": {
            "BootSourceOverrideEnabled": "Once",
            "BootSourceOverrideTarget": "Pxe"
        }
    }' \
    https://<BMC_IP>/redfish/v1/Systems/system
```

## 🌡️ 传感器数据

```bash
# 获取所有传感器
curl -k -u root:0penBmc \
    https://<BMC_IP>/redfish/v1/Chassis/1/Thermal | jq '.Temperatures[]'

# 获取电源信息
curl -k -u root:0penBmc \
    https://<BMC_IP>/redfish/v1/Chassis/1/Power | jq '.PowerSupplies[]'
```

## 👤 账户管理

### 查看用户

```bash
curl -k -u root:0penBmc \
    https://<BMC_IP>/redfish/v1/AccountService/Accounts | jq '.Members[]'
```

### 修改密码

```bash
curl -k -u root:0penBmc -X PATCH \
    -H "Content-Type: application/json" \
    -d '{"Password": "NewPassword123"}' \
    https://<BMC_IP>/redfish/v1/AccountService/Accounts/root
```

### 创建用户

```bash
curl -k -u root:0penBmc -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "UserName": "newadmin",
        "Password": "Password123",
        "RoleId": "Administrator",
        "Enabled": true
    }' \
    https://<BMC_IP>/redfish/v1/AccountService/Accounts
```

## 🔄 固件更新

```bash
# 获取更新服务信息
curl -k -u root:0penBmc \
    https://<BMC_IP>/redfish/v1/UpdateService | jq

# 通过 HTTP Push 更新
uri=$(curl -k -u root:0penBmc \
    https://<BMC_IP>/redfish/v1/UpdateService | jq -r '.HttpPushUri')

curl -k -u root:0penBmc -X POST \
    -H "Content-Type: application/octet-stream" \
    -T /path/to/firmware.mtd.tar \
    https://<BMC_IP>${uri}

# TFTP 更新
curl -k -u root:0penBmc -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "TransferProtocol": "TFTP",
        "ImageURI": "tftp://192.168.1.50/firmware.mtd.tar"
    }' \
    https://<BMC_IP>/redfish/v1/UpdateService/Actions/UpdateService.SimpleUpdate
```

## 📋 日志管理

```bash
# 查看事件日志
curl -k -u root:0penBmc \
    https://<BMC_IP>/redfish/v1/Systems/system/LogServices/EventLog/Entries | jq '.Members[]'

# 清空日志
curl -k -u root:0penBmc -X POST \
    -H "Content-Type: application/json" \
    https://<BMC_IP>/redfish/v1/Systems/system/LogServices/EventLog/Actions/LogService.Reset
```

## 🐍 Python 示例

```python
import requests
import json

class RedfishClient:
    def __init__(self, host, username, password):
        self.host = host
        self.auth = (username, password)
        self.session_url = None
        self.token = None

    def login(self):
        """创建 session 获取 token"""
        response = requests.post(
            f"https://{self.host}/redfish/v1/SessionService/Sessions",
            auth=self.auth,
            headers={"Content-Type": "application/json"},
            data=json.dumps({"UserName": self.auth[0], "Password": self.auth[1]}),
            verify=False
        )
        if response.status_code == 201:
            self.token = response.headers.get("X-Auth-Token")
            self.session_url = response.headers.get("Location")
            return True
        return False

    def get(self, path):
        """GET 请求"""
        response = requests.get(
            f"https://{self.host}{path}",
            headers={"X-Auth-Token": self.token},
            verify=False
        )
        return response.json()

    def post(self, path, data):
        """POST 请求"""
        response = requests.post(
            f"https://{self.host}{path}",
            headers={"X-Auth-Token": self.token, "Content-Type": "application/json"},
            data=json.dumps(data),
            verify=False
        )
        return response

    def power_on(self):
        """开机"""
        return self.post(
            "/redfish/v1/Systems/system/Actions/ComputerSystem.Reset",
            {"ResetType": "On"}
        )

    def power_off(self):
        """关机"""
        return self.post(
            "/redfish/v1/Systems/system/Actions/ComputerSystem.Reset",
            {"ResetType": "ForceOff"}
        )

# 使用示例
client = RedfishClient("192.168.1.100", "root", "0penBmc")
client.login()
client.power_on()
```

## 📚 更多资源

- [Redfish 速查手册](04-redfish-cheatsheet.md)
- [DMTF Redfish 规范](https://www.dmtf.org/standards/redfish)
- [OpenBMC bmcweb](https://github.com/openbmc/bmcweb)

---

*[返回首页](../README.md)* | *[目录](../_sidebar.md)*