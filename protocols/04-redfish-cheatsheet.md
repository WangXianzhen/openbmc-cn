# Redfish 速查手册

> Redfish API 常用操作快速参考

## 🔐 认证

### 方法 1: Basic Auth

```bash
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/
```

### 方法 2: Session Token

```bash
# 1. 创建 session
TOKEN=$(curl -k -X POST \
  -H "Content-Type: application/json" \
  -d '{"UserName":"root","Password":"0penBmc"}' \
  https://<BMC_IP>/redfish/v1/SessionService/Sessions \
  -D - 2>/dev/null | grep -i "x-auth-token" | cut -d' ' -f2 | tr -d '\r')

# 2. 使用 token
curl -k -H "X-Auth-Token: $TOKEN" https://<BMC_IP>/redfish/v1/
```

## 📂 服务根

```bash
# 获取服务根
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/

# OData 服务文档
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/$odata
```

## 🖥️ 系统管理

### 系统操作

| 操作 | 方法 | URL | Body |
|------|------|-----|------|
| 获取系统列表 | GET | `/redfish/v1/Systems` | - |
| 获取系统详情 | GET | `/redfish/v1/Systems/system` | - |
| 开机 | POST | `/redfish/v1/Systems/system/Actions/ComputerSystem.Reset` | `{"ResetType": "On"}` |
| 关机 | POST | `/redfish/v1/Systems/system/Actions/ComputerSystem.Reset` | `{"ResetType": "ForceOff"}` |
| 重启 | POST | `/redfish/v1/Systems/system/Actions/ComputerSystem.Reset` | `{"ResetType": "ForceRestart"}` |
| 优雅关机 | POST | `/redfish/v1/Systems/system/Actions/ComputerSystem.Reset` | `{"ResetType": "GracefulShutdown"}` |
| 强制重启 | POST | `/redfish/v1/Systems/system/Actions/ComputerSystem.Reset` | `{"ResetType": "ForceRestart"}` |

### 系统属性

```bash
# 查看系统基本属性
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/Systems/system | jq '{
  Id, Name, Model, Manufacturer,
  SerialNumber, PartNumber, UUID,
  PowerState, Boot,
  ProcessorSummary, MemorySummary
}'
```

### 处理器信息

```bash
# 获取处理器列表
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/Systems/system/Processors | jq '.Members[]'

# 获取处理器详情
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/Systems/system/Processors/CPU1 | jq
```

### 内存信息

```bash
# 获取内存列表
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/Systems/system/Memory | jq '.Members[]'

# 获取内存详情
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/Systems/system/Memory/DIMM1 | jq '{
  Name, Capacity, Speed, MemoryType, Manufacturer, SerialNumber
}'
```

### 存储信息

```bash
# 获取存储控制器
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/Systems/system/Storage | jq '.Members[]'

# 获取存储详情
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/Systems/system/Storage/RAID1 | jq
```

### 网络信息

```bash
# 获取网络接口
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/Systems/system/EthernetSwitches | jq '.Members[]'

# 获取网络端口
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/Systems/system/NetworkInterfaces | jq '.Members[]'
```

## 🌡️ 传感器和机箱

### 温度和散热

```bash
# 获取热信息
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/Chassis/1/Thermal | jq '{
  Temperatures: .Temperatures[] | {
    Name,
    ReadingCelsius,
    UpperThresholdNonCritical,
    UpperThresholdCritical,
    LowerThresholdNonCritical,
    LowerThresholdCritical
  }
}'

# 风扇控制
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/Chassis/1/Thermal#/Thermal.Fans
```

### 电源

```bash
# 获取电源信息
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/Chassis/1/Power | jq '{
  PowerSupplies: .PowerSupplies[] | {
    Name,
    Status,
    PowerOutputWatts,
    InputVoltage,
    Model,
    SerialNumber
  },
  Voltages: .Voltages[] | {
    Name,
    ReadingVolts,
    UpperThresholdNonCritical,
    UpperThresholdCritical
  }
}'
```

### 机箱信息

```bash
# 获取机箱详情
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/Chassis/1 | jq '{
  Id, Name, Model, Manufacturer,
  SerialNumber, AssetTag,
  Status, PowerState, ThermalState
}'
```

## 🖥️ BMC 管理

### BMC 信息

```bash
# 获取 BMC 详情
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/Managers/bmc | jq '{
  Id, Name, Model, Manufacturer,
  FirmwareVersion, SerialNumber,
  DateTime, DateTimeLocalOffset,
  PowerState, Health
}'
```

### BMC 操作

| 操作 | 方法 | URL | Body |
|------|------|-----|------|
| BMC 重启 | POST | `/redfish/v1/Managers/bmc/Actions/Manager.Reset` | `{"ResetType": "GracefulRestart"}` |
| BMC 恢复出厂 | POST | `/redfish/v1/Managers/bmc/Actions/Manager.ResetToDefaults` | `{"ResetType": "ResetAll"}` |

### 网络配置

```bash
# 获取网络配置
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/Managers/bmc/NetworkProtocol | jq '{
  HTTP, HTTPS, IPMI, SSH, Telnet, SNMP
}'

# 设置 NTP
curl -k -u root:0penBmc -X PATCH \
  -H "Content-Type: application/json" \
  -d '{
    "NTP": {
      "ProtocolEnabled": true,
      "NTPServers": ["pool.ntp.org", "time.google.com"]
    }
  }' \
  https://<BMC_IP>/redfish/v1/Managers/bmc/NetworkProtocol

# 启用 NTP
curl -k -u root:0penBmc -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"NTP":{"ProtocolEnabled": true}}' \
  https://<BMC_IP>/redfish/v1/Managers/bmc/NetworkProtocol
```

### 以太网接口

```bash
# 获取以太网接口列表
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/Managers/bmc/EthernetInterfaces | jq '.Members[]'

# 获取特定接口
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/Managers/bmc/EthernetInterfaces/eth0 | jq

# 设置静态 IP
curl -k -u root:0penBmc -X PATCH \
  -H "Content-Type: application/json" \
  -d '{
    "IPv4StaticAddresses": [{
      "Address": "192.168.1.100",
      "SubnetMask": "255.255.255.0",
      "Gateway": "192.168.1.1"
    }]
  }' \
  https://<BMC_IP>/redfish/v1/Managers/bmc/EthernetInterfaces/eth0
```

## 👤 账户管理

### 用户列表

```bash
# 获取账户服务
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/AccountService | jq '{
  Id, Name, Status,
  Accounts: .Accounts["@odata.id"],
  Roles: .Roles["@odata.id"]
}'

# 获取用户列表
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/AccountService/Accounts | jq '.Members[]'
```

### 用户操作

| 操作 | 方法 | URL | Body |
|------|------|-----|------|
| 创建用户 | POST | `/redfish/v1/AccountService/Accounts` | `{"UserName":"xxx","Password":"xxx","RoleId":"Administrator"}` |
| 修改密码 | PATCH | `/redfish/v1/AccountService/Accounts/root` | `{"Password": "NewPass123"}` |
| 启用用户 | PATCH | `/redfish/v1/AccountService/Accounts/<id>` | `{"Enabled": true}` |
| 删除用户 | DELETE | `/redfish/v1/AccountService/Accounts/<id>` | - |

### 角色

```bash
# 获取角色列表
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/AccountService/Roles | jq '.Members[]'
```

## 🔄 固件更新

### 更新服务

```bash
# 获取更新服务
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/UpdateService | jq

# 获取 HTTP Push URI
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/UpdateService | jq -r '.HttpPushUri'
```

### 固件更新方法

```bash
# 方法1: HTTP Push（推荐）
URI=$(curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/UpdateService | jq -r '.HttpPushUri')
curl -k -u root:0penBmc -X POST \
  -H "Content-Type: application/octet-stream" \
  -T /path/to/firmware.mtd.tar \
  https://<BMC_IP>${URI}

# 方法2: TFTP 更新
curl -k -u root:0penBmc -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "TransferProtocol": "TFTP",
    "ImageURI": "tftp://192.168.1.50/firmware.mtd.tar"
  }' \
  https://<BMC_IP>/redfish/v1/UpdateService/Actions/UpdateService.SimpleUpdate

# 方法3: HTTPS 更新
curl -k -u root:0penBmc -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "TransferProtocol": "HTTPS",
    "ImageURI": "https://server/firmware.mtd.tar"
  }' \
  https://<BMC_IP>/redfish/v1/UpdateService/Actions/UpdateService.SimpleUpdate
```

### 查看固件清单

```bash
# 获取固件清单
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/UpdateService/FirmwareInventory | jq '.Members[]'
```

## 📋 日志管理

### 事件日志

```bash
# 获取日志服务
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/Systems/system/LogServices | jq

# 获取日志条目
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/Systems/system/LogServices/EventLog/Entries | jq '.Members[]'

# 清空日志
curl -k -u root:0penBmc -X POST \
  -H "Content-Type: application/json" \
  https://<BMC_IP>/redfish/v1/Systems/system/LogServices/EventLog/Actions/LogService.Reset

# 获取单条日志
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/Systems/system/LogServices/EventLog/Entries/1 | jq
```

### BMC 日志

```bash
# 获取 BMC 日志
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/Managers/bmc/LogServices | jq

curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/Managers/bmc/LogServices/BMCLog/Entries | jq '.Members[]'
```

## 🔧 任务服务

```bash
# 获取任务列表
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/TaskService | jq

# 获取任务
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/TaskService/Tasks/1 | jq
```

## 🌐 事件订阅

```bash
# 获取事件订阅服务
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/EventService | jq

# 获取订阅列表
curl -k -u root:0penBmc https://<BMC_IP>/redfish/v1/EventService/Subscriptions | jq '.Members[]'

# 创建订阅
curl -k -u root:0penBmc -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "Destination": "https://192.168.1.100:8443/events",
    "EventTypes": ["Alert", "ResourceUpdated", "ResourceAdded", "ResourceRemoved"],
    "Context": "MyApp",
    "Protocol": "RedfishEvent"
  }' \
  https://<BMC_IP>/redfish/v1/EventService/Subscriptions

# 删除订阅
curl -k -u root:0penBmc -X DELETE \
  https://<BMC_IP>/redfish/v1/EventService/Subscriptions/<subscription_id>

# 测试事件
curl -k -u root:0penBmc -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "EventTimestamp": "2024-01-01T00:00:00Z",
    "Severity": "Warning",
    "Message": "Test event",
    "MessageId": "TestEvent.1.0"
  }' \
  https://<BMC_IP>/redfish/v1/EventService/Actions/EventService.SubmitTestEvent
```

## 🐍 Python 完整示例

```python
import requests
import json
import urllib3
urllib3.disable_warnings()

class RedfishClient:
    BASE_URL = "https://{}".format
    HEADERS = {"Content-Type": "application/json"}

    def __init__(self, host, username, password):
        self.host = host
        self.auth = (username, password)
        self.verify = False
        self.token = None

    def _request(self, method, path, data=None):
        url = self.BASE_URL(self.host) + path
        headers = self.HEADERS.copy()
        if self.token:
            headers["X-Auth-Token"] = self.token
        return requests.request(
            method, url, auth=self.auth,
            headers=headers, json=data, verify=self.verify
        )

    def get(self, path):
        return self._request("GET", path).json()

    def post(self, path, data):
        return self._request("POST", path, data).json()

    def patch(self, path, data):
        return self._request("PATCH", path, data).json()

    def delete(self, path):
        return self._request("DELETE", path)

    def login(self):
        resp = self.post("/redfish/v1/SessionService/Sessions",
                        {"UserName": self.auth[0], "Password": self.auth[1]})
        self.token = resp.headers.get("X-Auth-Token")
        return self.token

    def logout(self):
        if self.token:
            self.delete("/redfish/v1/SessionService/Sessions")
            self.token = None

    # 常用操作
    def get_power_state(self):
        return self.get("/redfish/v1/Systems/system")["PowerState"]

    def power_on(self):
        return self.post("/redfish/v1/Systems/system/Actions/ComputerSystem.Reset",
                        {"ResetType": "On"})

    def power_off(self):
        return self.post("/redfish/v1/Systems/system/Actions/ComputerSystem.Reset",
                        {"ResetType": "ForceOff"})

    def reboot(self):
        return self.post("/redfish/v1/Systems/system/Actions/ComputerSystem.Reset",
                        {"ResetType": "ForceRestart"})

    def get_temperatures(self):
        return self.get("/redfish/v1/Chassis/1/Thermal")["Temperatures"]

    def get_users(self):
        return self.get("/redfish/v1/AccountService/Accounts")["Members"]

    def create_user(self, username, password, role="Administrator"):
        return self.post("/redfish/v1/AccountService/Accounts",
                        {"UserName": username, "Password": password, "RoleId": role})

# 使用示例
client = RedfishClient("192.168.1.100", "root", "0penBmc")
client.login()
print(client.get_power_state())
client.power_on()
client.logout()
```

---

*[返回首页](../README.md)* | *[目录](../_sidebar.md)*