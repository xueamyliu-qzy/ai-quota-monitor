# Grok / xAI 适配器说明

**鉴权 kind：** `api_key`（`Authorization: Bearer`）。

**端点（可配置）：** 默认 `https://api.x.ai/v1/usage`（若官方路径变更，在创建适配器时覆盖 `usageUrl`）。

**期望 JSON 字段：** `remaining_5h`、`remaining_weekly`（0–1）。

**阻塞：** 需真实 xAI API Key；若官方无对等用量字段，将返回 `unavailable`。单测以 mock HTTP 覆盖。
