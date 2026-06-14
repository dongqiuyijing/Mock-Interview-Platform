# AI 行业模拟面试 SaaS — 第一版实施计划

## Context（为什么做）
构建一个聚焦 AI 行业岗位的「面试准备 MVP」。用户粘贴目标岗位 JD + 自己的简历，系统生成
岗位分析、简历分析、JD 匹配度报告，进行一场定制化文本模拟面试（带动态追问），最后输出复盘报告
（评分 + 每题点评 + 优化版回答 + 练习建议）。

核心要验证的假设：用户愿意为「针对具体 JD 的模拟面试」付费。

技术选择（已与用户确认）：
- 完整版：启用 Enter Cloud（Supabase）做真实登录 + 数据库 + Edge Functions
- 真实 AI 智能体（5 个），通过 Edge Function 调用 Enter AI All
- 界面中英双语切换（zh-CN / en）
- 登录方式：邮箱+密码 + Google 登录

## 前置启用项（实现阶段第一步，按顺序）
1. `supabase_enable` — 启用 Enter Cloud（auth + database + edge functions）
2. `enable_ai_capability` — 启用 AI 能力（供 5 个智能体调用 LLM）
3. `i18n_enable` — 启用中英双语
4. 加载技能：`enter_llm_integration`（Edge Function 调 LLM 的标准写法）

## 数据模型（Supabase 表，含 RLS）
所有表带 `user_id`，RLS 限制本人可见。

- `profiles`：id(uid), email, name, plan(free/paid), created_at
- `interview_tasks`：id, user_id, job_title, job_direction(ai_pm/ai_engineer/prompt_engineer/ai_gtm),
  interview_type(product/technical/business/hr/founder), difficulty(normal/stress),
  duration(15/30), jd_text, resume_text, status, created_at, updated_at
- `analysis_reports`：id, task_id, jd_analysis(jsonb), resume_analysis(jsonb), match_score(int),
  strong_matches(jsonb), weak_matches(jsonb), risk_points(jsonb), interview_plan(jsonb), created_at
- `interview_sessions`：id, task_id, status, started_at, ended_at, current_stage, overall_score
- `interview_messages`：id, session_id, role(interviewer/candidate), content, question_type,
  jd_competency, created_at
- `feedback_reports`：id, session_id, summary(jsonb), ability_scores(jsonb), strengths(jsonb),
  weaknesses(jsonb), risk_answers(jsonb), question_feedback(jsonb), optimized_answers(jsonb),
  practice_plan(jsonb), created_at

## 5 个 AI 智能体（Edge Functions）
每个 Agent 一个 Edge Function，system prompt 按规格文档第 11 节方向编写，统一要求 JSON 输出。

1. `agent-jd-analyst` — 解析 JD → 岗位定位/核心职责/必备能力/加分能力/隐含要求/面试重点/能力权重
2. `agent-resume-analyst` — 解析简历 → 卖点/匹配经历/短板/风险/值得深挖的项目
3. `agent-match-scorer` — 对比 JD+简历 → 匹配度分数/强匹配/弱匹配/风险/准备建议
4. `agent-interviewer` — 基于 JD+简历+匹配报告 + 对话历史，一次问一个问题，动态判断追问/提难度/给提示
5. `agent-coach` — 基于整场对话 → 复盘报告（总评/能力评分/强弱项/高风险回答/每题点评/优化回答/练习计划）

编排：
- 「生成面试计划」按钮 → 顺序调用 1→2→3，写入 `analysis_reports`
- 「开始模拟面试」→ 创建 session，每次用户回答调用 agent-interviewer 返回下一题
- 「结束面试」→ 调用 agent-coach 生成 `feedback_reports`

## 前端页面与路由（在 `src/router.tsx` 注册）
新增页面放 `src/pages/`，业务组件放 `src/components/`，数据请求用 React Query hooks（`src/hooks/`）。
Supabase client 放 `src/lib/supabase.ts`（启用 Enter Cloud 后生成）。

- `/login`、`/signup` — 邮箱密码 + Google 登录（Auth）
- `/`（落地页 Index 改造）— 一句话卖点 + CTA + 登录入口
- `/dashboard` — 我的面试任务列表 + 「创建新任务」
- `/tasks/new` — **任务创建页**（4.1）：JD 文本、简历文本/上传、岗位方向、面试类型、时长、难度
- `/tasks/:id/report` — **分析报告页**（4.2）：总体匹配度 + 岗位分析/简历分析/JD匹配度/本场面试计划 5 模块 + 开始面试按钮
- `/sessions/:id` — **模拟面试页**（4.3）：左侧对话区 + 右侧（当前阶段/能力维度/进度/当前问题对应 JD 考点）
- `/sessions/:id/feedback` — **复盘报告页**（第 5 节）：总评/能力评分雷达/强弱项/高风险回答/每题点评/优化回答/练习建议

复用：现有 shadcn UI（card/button/textarea/select/radio-group/progress/badge/tabs/skeleton/sonner），
能力评分用 `components/ui/chart.tsx`（雷达/条形），路由守卫用一个 `ProtectedRoute` 包装。

## 设计系统
- 用 `designer` 工具产出一套面向「专业、AI 科技感、可信赖」的设计 token
- 改 `src/index.css` + `tailwind.config.ts`：主色/渐变/阴影/字体，全部走语义 token，不写裸色值
- 深浅色都验证对比度；移动端响应式

## 付费（Freemium，第一版轻量）
- `profiles.plan` 区分 free/paid
- 免费：1 次 JD+简历分析、模拟面试限 5 个问题、简版复盘
- 付费：完整模拟、完整匹配报告、每题详细点评+优化回答、多任务、压力面试
- 第一版仅做「前端门控 + plan 字段」，真实支付（Stripe）留到后续版本（前端展示升级入口即可）

## i18n
- 启用后用 `enter_i18n` 技能维护 `public/locales/{en,zh-CN}.json`
- 所有界面文案走 `t()`；语言切换用现有 `language-switcher.tsx`

## 验收标准（对齐规格第 12 节）
1. 可注册/登录（邮箱密码 + Google）
2. 可创建面试任务并粘贴 JD + 简历
3. 生成结构化 JD 分析 / 简历分析 / 匹配度报告
4. 可开始文本模拟面试，面试官能根据回答动态追问
5. 结束后生成复盘报告（评分 + 每题点评 + 优化回答 + 练习建议）
6. 中英文切换正常；数据按用户隔离（RLS）

## 验证方式
- 用一份真实 AI PM 的 JD + 简历跑完整流程，检查 3 份分析报告字段完整
- 模拟面试中给「太泛」的回答，确认面试官追问细节；给好回答确认提难度
- 结束生成复盘，确认评分/每题点评/优化回答渲染正确
- 切换中英文，确认无遗漏文案
- 用第二个账号确认看不到他人任务（RLS）
- `run_lint` 通过

## 范围外（第一版不做，规格第 7 节）
语音/视频面试、多人协作、企业招聘端、自动投递、LinkedIn 集成、完整简历改写、
大规模题库、真实面经库、长期学习档案、复杂支付套餐。
