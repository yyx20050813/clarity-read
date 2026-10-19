# 澄阅 ClarityRead

专注阅读浏览器扩展 + 介绍官网。

## 在线官网

部署到 GitHub Pages 后访问：

`https://yyx20050813.github.io/clarity-read/`

## 下载扩展

官网「下载扩展包」按钮指向：

`downloads/clarity-read.zip`

## 本地安装扩展

1. 下载并解压 `clarity-read.zip`
2. 打开 Chrome / Edge 扩展管理页，开启「开发者模式」
3. 选择「加载已解压的扩展程序」，指向解压后的 `extension` 目录（或 zip 解压出的根目录）

## 开发结构

```
extension/          # Chrome Manifest V3 扩展源码
downloads/          # 可直接下载的 zip 包
index.html          # 介绍官网
styles.css
```

## 快捷键

- `Alt+Shift+R`：开关阅读模式
- `Alt+Shift+H`：收藏当前选中文字

