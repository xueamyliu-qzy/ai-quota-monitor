# ChatGPT 适配器说明

**鉴权 kind：** 优先 `session`（Bearer / Cookie），亦可 `api_key`（若有可用用量 API）。

**端点（可配置）：** 默认 `https://chatgpt.com/backend-api/usage`（私有接口，结构可能变更）。

**期望 JSON 字段：**
- `five_hour_remaining_ratio`（0–1）
- `weekly_remaining_ratio`（0–1）
- 可选 `five_hour_resets_at` / `weekly_resets_at`

**阻塞：** 真实会话 Cookie / 令牌需用户本机登录后粘贴；官方公开 API 通常不暴露 ChatGPT Plus 的 5h/周额度。演示模式使用 fake 适配器。
