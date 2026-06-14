# 接入真实大模型 — 改造方案

## Context（为什么做这个改造）

后端其实**已经完整且可用**：`interview-agent` Edge Function（541 行）会调用已发布的 Enter Agent（密钥 `AGENT_API_KEY` 已验证可通，实测返回 `PONG`），数据库 6 张表 + RLS 也建好了。

问题出在**前端**：之前几次 UI 重构把真实接入替换成了本地假数据——

- `NewTask.tsx` → 调 `generateAnalysis()`（本地模板）
- `Interview.tsx` → 调 `interviewQuestions()`（写死 5 道脚本题）、`generateFeedback()`（按"回答字数"算分）
- 数据全存 `localStorage`，**全程没有一处** `supabase.functions.invoke`

因此用户看到的面试问答是写死的，不是真实大模型。本方案把前端重新接到真实后端，并按用户决定：**(1) 标准邮箱登录/注册；(2) 面试问答改为逐字流式输出**。

---

## 改造范围

### A. 后端流式改造（SSE 透传）

后端当前 `runAgent()` 把整段文本攒完再返回。需要为**面试提问**与**反馈报告**两个动作改成边收边推。

**关键约束**：Agent 返回的是 JSON（如 `{"question": "..."}`），不是纯文本。逐字流式时不能直接把原始 JSON delta 吐给前端（用户会看到 `{"question":"` 这种）。方案：

1. 新增 `supabase/functions/interview-agent/index.ts` 的两个 action 支持 `stream: true`：
   - `interview_next`：以 `ReadableStream` 返回 `text/event-stream`。后端一边接收 Agent 的 SSE，一边对**累积文本做增量 JSON 解析**，只把 `question` 字段新增的字符作为 `data: {"type":"delta","text":"..."}` 推给前端；流结束时推一条 `data: {"type":"done","message":{...},"stage":"...","done":bool}`，并在此刻完成 `interview_messages` 落库 + `interview_sessions` 更新。
   - `finish`：同理流式推送 `summary.overview` 的增量文本作为"正在生成报告"的可视进度，结束时推 `data: {"type":"done","report":{...}}` 并落库 `feedback_reports`。
   - 提取 `question` 字段用轻量正则/状态机即可（找到 `"question"\s*:\s*"` 后累计转义安全的字符直到闭合引号），无需完整 JSON 流解析器。
2. `analyze` 保持整段返回（3 个子分析并行，非对话场景，无需逐字）。

**文件**：`supabase/functions/interview-agent/index.ts`

### B. 邮箱登录/注册

1. 新增 `src/contexts/AuthContext.tsx`：
   - `supabase.auth.onAuthStateChange` 先注册监听，再 `getSession()`。
   - 存 `user` + `session`，暴露 `signIn` / `signUp` / `signOut`。
   - `signUp` 带 `emailRedirectTo: \`${window.location.origin}/\``。
2. 新增 `src/pages/Auth.tsx`：登录/注册切换表单（复用 shadcn `Input`/`Button`/`Card`，沿用现有设计 token）。
3. 新增 `src/components/ProtectedRoute.tsx`：未登录跳 `/auth`。
4. `src/App.tsx`：用 `<AuthProvider>` 包裹 `RouterProvider`。
5. `src/router.tsx`：加 `/auth` 路由；`/`、`/analysis`、`/interview`、`/feedback` 包 `ProtectedRoute`。
6. 后端开启邮箱自动确认（`supabase_configure_auth(auto_confirm_email=true)`），免去邮件验证步骤。

### C. 前端接真实后端（替换 mock）

新增 `src/lib/api.ts`，集中封装对 `interview-agent` 的调用：
- `analyzeTask(taskId, lang)` → `functions.invoke('interview-agent', { body:{action:'analyze',...} })`
- `streamNextQuestion(sessionId, answer, lang, onDelta)` → 用 `fetch` 直连 Edge Function URL（带 `Authorization: Bearer <access_token>`）读取 SSE，逐字回调 `onDelta`，结束返回完整 message。（`functions.invoke` 不支持流，故流式接口用原生 `fetch` + `supabase.auth.getSession()` 拿 token。）
- `finishInterview(sessionId, lang, onDelta)` → 同上流式。

逐页改造：

1. **`NewTask.tsx`**：提交时 `insert` 到 `interview_tasks` 拿 `taskId` → 调 `analyzeTask` → 跳 `/analysis?taskId=...`。去掉 `generateAnalysis`/`store`。
2. **`Report.tsx`（/analysis）**：按 `taskId` 从 `analysis_reports` 读真实报告渲染（字段映射见 `src/lib/interview.ts` 里已有的 `AnalysisReport` 类型）。"开始面试"时 `insert` 一条 `interview_sessions` 拿 `sessionId` → 跳 `/interview?sessionId=...`。
3. **`Interview.tsx`**：进入即调 `streamNextQuestion`（首问 answer 为空）拿开场问题；用户作答 → 再次 `streamNextQuestion(answer)`，面试官回复逐字渲染。`done=true` 或达上限 → "生成报告"调 `finishInterview` 跳 `/feedback?sessionId=...`。删除 `interviewQuestions`/`generateFeedback`。
4. **`Feedback.tsx`**：按 `sessionId` 从 `feedback_reports` 读真实报告渲染（类型 `FeedbackReport` 已存在）。
5. 删除 `src/lib/mockGenerators.ts`；`src/lib/workspaceStore.ts` 中与当前面试流相关的 mock（task/analysis/messages/feedback）移除，保留无害的训练历史 seed（或一并清理，视引用而定）。

### D. 清理

- 删除临时诊断函数 `supabase/functions/agent-diagnose/index.ts`（验证已完成）。

---

## 复用的现有资产（不重造）

- 后端 `interview-agent` 所有 prompt 与落库逻辑——仅在其上加流式分支。
- `src/lib/interview.ts` 中已定义的 DB 行类型（`AnalysisReport` / `InterviewMessage` / `FeedbackReport` 等）直接用于前端渲染。
- `src/integrations/supabase/client.ts`（自动生成，不改）。
- 现有 UI 组件：`WorkbenchLayout` / `StepHeader` / `SectionCard` / `Card` / `Button` 等，页面骨架基本不动，只换数据源。

## 关键改动文件清单

- `supabase/functions/interview-agent/index.ts`（加 SSE 流式分支）
- `src/contexts/AuthContext.tsx`（新增）
- `src/pages/Auth.tsx`（新增）
- `src/components/ProtectedRoute.tsx`（新增）
- `src/lib/api.ts`（新增，封装后端调用 + SSE 读取）
- `src/App.tsx` / `src/router.tsx`（加 auth provider + 路由保护）
- `src/pages/NewTask.tsx` / `Report.tsx` / `Interview.tsx` / `Feedback.tsx`（换数据源）
- 删除 `src/lib/mockGenerators.ts`、`supabase/functions/agent-diagnose/index.ts`
- `public/locales/en.json` / `zh-CN.json`（补 auth 文案）

## 验证方式

1. 注册新账号 → 自动登录（邮箱自动确认已开）。
2. 新建任务（用"填充示例"）→ 提交 → `/analysis` 显示**真实** JD/简历/匹配分析（每次内容不同，非固定模板）。
3. 开始面试 → 面试官问题**逐字流式**出现；作答后追问与 JD 强相关。
4. 生成报告 → `/feedback` 显示真实能力雷达、优化答案。
5. 数据库核对：`select count(*) from analysis_reports / interview_messages / feedback_reports` 应 > 0（之前全为 0）。
6. `run_lint` 通过。
