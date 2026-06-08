# Bitbake 常用命令

> OpenBMC 编译构建工具详解

## 📋 基本语法

```bash
bitbake <recipe> [options]
```

## 🔨 常用命令

### 构建

```bash
# 构建完整镜像
bitbake obmc-phosphor-image

# 构建特定包
bitbake <package-name>

# 重新构建
bitbake -f <package-name>
```

### 清理

```bash
# 清理构建缓存
bitbake -c clean <package>

# 清理所有缓存和构建产物
bitbake -c cleansstate <package>

# 清理整个构建目录
bitbake -c cleanall <package>
```

### 查看依赖

```bash
# 查看包依赖关系
bitbake -g <package>
cat pn-depends.dot

# 查看任务依赖
bitbake -v -c compile <package>
```

### 查看信息

```bash
# 查看可用机器配置
bitbake-layers show-machines

# 查看已加载的层
bitbake-layers show-recipes

# 查看配方信息
bitbake -e <package> | grep ^DESCRIPTION
```

## ⚙️ 高级选项

```bash
# 指定并行任务数
bitbake -j 8 obmc-phosphor-image

# 显示详细日志
bitbake -v <package>

# 仅执行特定任务
bitbake -c compile <package>
bitbake -c install <package>
bitbake -c package <package>

# 模拟构建（不实际执行）
bitbake -n <package>
```

## 📊 查看构建状态

```bash
# 显示构建历史
bitbake-layers layerindex-fetch meta-openembedded

# 查看编译时间统计
bitbake -c listtasks <package>
```

---

*[返回首页](../README.md)* | *[目录](../_sidebar.md)*
