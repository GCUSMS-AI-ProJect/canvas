# WorkStudio Draw

把想法变成可编辑的图。先描述，在独立窗口预览与调整，满意后再放到画布。

**在线体验：** [首页](https://share.workstudioai.top/draw/) · [画布](https://share.workstudioai.top/draw/editor.html)

![WorkStudio Draw 首页](docs/preview.png)

## 可以做什么

- 手绘白板：形状、文字、图片、连线、缩放、撤销与重做。
- AI 绘图：描述想法生成流程图、思维导图或界面草图；支持继续修改、切换历史版本。确认前不会改变原画布。
- 八种可编辑模板：实验流程、系统架构、研究思维导图、PPT 布局、鱼骨图、论文技术路线、时间轴与对比矩阵。
- 字体与字号预设，同时作用于 AI 预览和插入后的图表。
- 当前浏览器 IndexedDB 自动保存，支持 PNG、SVG、可编辑工程文件导出与重新导入。
- 中英文、明暗主题、桌面与手机布局。

仓库提供当前网站的前端、独立的 AI 图表任务模块及本地开发服务器。**线上 Share 的注册、登录、作品管理和完整管理后台不包含在此仓库。** 本地服务器自动使用一个开发账号，方便运行；公网部署时需接入自己的身份验证系统，见 [部署与 API 接入](docs/deployment.md)。

## 快速运行

需要 Node.js 20.19+ / 22.12+（推荐 24 LTS）和 Python 3.10+。后端使用 Python 标准库，不需要 pip 安装。

```bash
git clone https://github.com/GCUSMS-AI-ProJect/canvas.git
cd canvas
npm ci
npm run build
python3 backend/server.py
```

打开 **http://127.0.0.1:8082/draw/**。`editor.html` 是画布入口。若 8082 已占用，运行 `python3 backend/server.py --port 8083`。

不配置模型也可以使用手动绘图、模板、保存与导出。

## 启用 AI

将 `.env.example` 复制为 `.env`，在自己电脑上填写：

```dotenv
OPENAI_API_KEY=你的服务端密钥
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=你的服务商支持的模型名称
OPENAI_REASONING_EFFORT=low
```

模型接口需支持 Responses API 和严格 JSON Schema 输出。原网站使用 `gpt-6.1-sol` 服务商别名；这不是所有服务商通用的模型名称，请以自己服务商的支持列表为准。保存配置后重新启动 Python 服务器。

密钥仅由后端读取，前端不接收密钥。`.env`、数据库、运行日志和 `node_modules` 均被 Git 忽略。本仓库不会附带线上账号、密码、密钥或用户画作。

## 开发

```bash
# 终端一：AI 后端
python3 backend/server.py
# 终端二：前端热更新
npm run dev
```

浏览器打开 http://127.0.0.1:5173/draw/。Vite 将 `/api` 代理至本机 8082。

```bash
npm run test:backend
npm run build
```

测试覆盖图表校验、每日配额、任务隔离、错误脱敏与并发控制；不调用在线模型。

## 文件结构

```text
src/home.js, home.css       首页与流程介绍
src/main.jsx, style.css     画布、AI 预览、导入导出及本地保存
src/diagrams.js             八种模板与图表布局
backend/share_draw.py      AI 请求、图表校验、异步任务和配额
backend/server.py          仅监听回环地址的开发服务器
backend/test_share_draw.py 后端测试
public/                    品牌 SVG 与自托管中文字体
docs/deployment.md         部署和认证接入说明
build.mjs                  跨机器构建及字体/许可证打包
```

## 当前范围

画作保存在当前浏览器，不自动跨设备同步。没有多人协作、云端文档库、公开画作链接、图片生成或代码执行。导出工程文件可备份画作。AI 对话只发送本次描述和选中的草稿，不发送整个主画布。

## 许可证

WorkStudio 自编代码使用 [MIT](LICENSE)。底层编辑器来自 MIT 许可的 Excalidraw，布局使用 Dagre，界面使用 React；中文字体 Noto Serif SC 使用 SIL OFL 1.1。保留 [编辑器许可证](EXCALIDRAW-LICENSE.txt) 和字体许可证，构建时生成第三方许可说明。本项目为独立实现，与 Excalidraw Plus 服务无关联。
