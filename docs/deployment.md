# 部署与 API 接入

## 静态站点

运行 `npm ci && npm run build` 后，将 **整个 `dist/`** 放到 Web 服务的根目录。首页在 `/draw/`，编辑器在 `/draw/editor.html`；`draw/assets` 和 `draw/fonts` 也需要保留。

项目目前固定使用 `/draw/` 路径。换成根目录或其他前缀时，需要同步调整 Vite `base`、首页入口链接、`EXCALIDRAW_ASSET_PATH` 和构建输出目录。

手动绘图、模板及导出不需要后端。AI 需要同源 `/api`，可通过反向代理连接后端。

## 本地服务器与公网区别

`backend/server.py` 只绑定 `127.0.0.1`，自动使用本地开发账号，没有注册或真实用户登录。开发账号是管理员，因此没有每日次数上限。开发服务器校验 Host/Origin 和写请求 CSRF，但**不是公网多用户服务**，不要通过 Tunnel 或反向代理把它直接暴露为公开 AI 接口。

公网部署应接入自己的账号系统：使用服务端验证的会话 Cookie、Origin 与 CSRF 校验；登录后从会话提取用户 ID 和角色。配额方法由 `DrawJobs` 提供，普通用户按北京时间每日 3 次，失败退还，管理员无每日上限。还应设置登录/提交速率限制及请求体大小限制。

## 前端需要的接口

| 方法 | 路径 | 返回 / 作用 |
| --- | --- | --- |
| GET | `/api/session` | `{user, csrf}`；匿名 `user: null` |
| POST | `/api/login` | 接收 `{email,password,source:'draw'}`；返回 `{user,csrf}` |
| POST | `/api/logout` | 撤销当前会话 |
| GET | `/api/draw/quota` | `{quota}` |
| POST | `/api/draw/jobs` | `{prompt,previous,language}` → `{id,status,quota}` |
| GET | `/api/draw/jobs/:id` | `{id,status,diagram?,error?,quota}`；只允许任务所属用户访问 |
| GET | `/api/admin/draw` | 管理员可查看使用汇总，前端画布不依赖此接口 |

所有写请求发送 `X-CSRF-Token`。用户对象至少含 `id,nickname,role,avatar`。`quota` 含 `unlimited,limit,remaining,day`。任务状态为 `pending,ready,failed`；成功的 `diagram` 结构由 `backend/share_draw.py` 中的 Schema 定义。

`DrawJobs` 依赖 `Store.connect()` 返回启用 `sqlite3.Row` 的 SQLite 连接，及 `Store.state` 路径。管理报告另需 `users` 表，示例结构见 `backend/server.py`。生产账号认证不应照搬本地固定账号。

任务最多全局并发 2 个，同一用户同时 1 个；结果在进程内保存一小时，重启后无法恢复旧结果，数据库中的未完成任务会标记失败。画布内容仍保留在浏览器中。

当前账号菜单的 `/me`、注册入口及“返回作品广场”是原 Share 平台入口。独立部署时可换成自己的网站或移除这些链接；本地预览的 `/` 与 `/me` 会返回 Draw 首页。

## 模型适配

模型配置来自服务端环境变量。`OPENAI_BASE_URL` 必须是 HTTPS 的 API 根路径，不包含 `/responses`。请求使用结构化 JSON 输出及 low 推理深度，草稿校验最多 60 个节点与 100 条连线；原始服务商报错不会返回到浏览器。如果服务商不支持该接口、Schema 或推理参数，需要在 `generate_diagram()` 中适配。

## 字体和第三方许可

仓库自带当前界面用字的中文字体子集。新增中文文案后，建议重新生成子集或替换为带完整字符的 Noto Serif SC 字体，保持原文件名，并保留 `public/fonts/OFL.txt`。构建脚本复制编辑器自带字体及第三方许可说明，无需访问者在线拉取字体。
