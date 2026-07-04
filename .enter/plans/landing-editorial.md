# RoleReady — Editorial Landing Page

## Context
RoleReady 目前 `/` 直接指向受保护的 Dashboard,访客/未登录用户没有任何"第一眼"营销页面。目标:新建一个**惊世骇俗但克制**的营销 Landing,强化现有黑白 editorial 杂志风(超大字体、网格线、非对称排版),并严格遵循 impeccable 设计规范(无渐变字、无霓虹青、无纯黑纯白、无侧边条、无等距卡片阵列)。

## 设计方向(impeccable-compliant)
- **风格**: Swiss/editorial 杂志排版。超大 display 标题 + 细网格线 + 大量留白 + 非对称栅格。
- **字体**: 引入 **Bricolage Grotesque**(免费、distinctive、非 reflex 默认字体)作 display 大标题;正文沿用现有字栈。通过 `index.css` `@import` 引入,并加 `--font-display` token。
- **配色**: 沿用现有黑白 token,但把纯白/纯黑略微收敛——`--background` 从 `0 0% 100%` 调为 `36 8% 98%`(暖白微染),`--foreground` 微调带极低 chroma,满足 impeccable BAN 4。仅此两处微调,不破坏 app 内部页面观感。
- **强调色**: 保持 10% 稀有强调 = 纯 ink 反白块(黑底白字大 CTA 区),不引入第二主色。
- **无 BAN 命中**: 不用 border-left 条、不用 background-clip:text、不用 glow shadow、标题左对齐非居中、正文 max-w-[65ch]。

## 页面结构(单页,section 化)
1. **Nav** — 极简顶栏:左 wordmark「RoleReady」,右「Sign in」+「Start free」。sticky、下边框 1px。
2. **Hero** — 左对齐超大 display(clamp 流体):如 "Rehearse the interview. / Own the room."。副文案 max-w-[60ch] + 双 CTA(Start free → /auth,See how it works → 锚点)。右/下方叠一个大号编号 eyebrow(如 "01 — AI MOCK INTERVIEW")形成杂志感。
3. **Marquee / 关键词横条** — 一行缓慢横移的关键词(JD ANALYSIS · STRESS ROUND · VIDEO CALL · SCORECARD…),纯排版动效,呼应"惊艳"。
4. **How it works** — 非对称 3 步(大编号 01/02/03 + 标题 + 说明),用网格线分隔而非卡片阵列,避免 BAN 7。
5. **Feature bento** — 变尺寸 bento 网格(2-3 个不等大区块:JD×简历匹配、实时视频面试、能力雷达报告),尺寸有主次,非等距。
6. **Big statement** — 整屏 ink 反白区(黑底白字)一句大话 + CTA,作为唯一 10% 强调块。
7. **Footer** — 极简:wordmark + 版权 + 次级链接。

## 交互/动效(克制)
- Section 进入用现有 `animate-fade-in`(已在 tailwind config)。
- 关键词横条 CSS marquee keyframes(加到 tailwind config `keyframes`/`animation` 或 index.css)。
- Hero 数字/大标题不做花哨滚动,仅淡入 + 轻微 translateY。

## 路由改动
- `/` → 新的 `Landing`(公开,不包 ProtectedRoute)。
- Dashboard 移到 `/dashboard`(仍 ProtectedRoute)。
- 更新所有跳转到 dashboard 的 `navigate("/")` 引用为 `/dashboard`。
- 登录成功后 `Auth.tsx` 的 `navigate("/")` 改为 `navigate("/dashboard")`。
- Landing 内:若已登录显示「Go to dashboard」,否则「Start free」→ `/auth`。用 `useAuth()` 判断。

## 需修改/新增文件
- **新增** `src/pages/Landing.tsx` — 主页面。
- **新增** `src/components/landing/`(拆分 Hero / Marquee / Steps / Bento / CTA / Footer 小组件,保持文件精简)。
- `src/router.tsx` — 加 `/` = Landing,Dashboard 改 `/dashboard`。
- `src/pages/Auth.tsx` — 登录后跳 `/dashboard`。
- `src/index.css` — 加 `--font-display`、`@import` Bricolage Grotesque、微调 background/foreground token、marquee keyframes(或放 tailwind config)。
- `tailwind.config.ts` — `fontFamily.display` 映射 `--font-display`;可选 marquee animation。
- 复用现有 `Button`(含 rounded-full 用法)、`label-eyebrow`、`display` utility class。
- 文案:英文硬编码在组件内(app 为英文-only),或按需加 `landing.*` 键到 `public/locales/en.json`。**推荐**加 i18n 键,保持一致性。

## 复用点
- `Button`(variant: default/outline/secondary/ghost)已足够,无需新组件。
- `.label-eyebrow` / `.display` utility 已在 index.css,直接用于 eyebrow 与大标题。
- `animate-fade-in` / `pulse-soft` 已在 tailwind config。
- `useAuth()`(`src/contexts/AuthContext.tsx`)判断登录态。

## 验证
- `/` 未登录:显示 Landing,CTA 跳 `/auth`;impeccable 视觉自查(无居中通篇、无渐变字、正文限宽)。
- `/` 已登录:显示 Landing,CTA 显示「Go to dashboard」→ `/dashboard`。
- `/dashboard` 受保护逻辑不变。
- 登录/注册成功 → 落到 `/dashboard`。
- 运行 `run_lint` 无新增错误。
- 响应式:移动端 Hero 大字用 clamp 不溢出;bento 单列堆叠。
- (可选)`npx impeccable detect src/pages/Landing.tsx src/components/landing` 无 error 级违规。
