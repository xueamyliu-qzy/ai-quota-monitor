# Gemini 适配器说明

**鉴权 kind：** `api_key`（Google AI Studio / Gemini API Key）。

**探测：** `generativelanguage.googleapis.com` list models（校验密钥）。

**额度：** 官方 list models **不**提供标准 5h/周剩余。适配器支持通过 `AuthProfile.meta.fiveHourRatio` / `weeklyRatio` 注入（便于 fixture）。否则返回 `unavailable` 并中文说明。

**阻塞：** 需 Google 账号侧用量 API 或控制台抓取方案；MVP 真机验证依赖用户提供可用数据源。
