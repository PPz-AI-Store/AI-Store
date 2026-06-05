# AI Store 数据库说明

AI Store 使用 **PostgreSQL** 作为持久化存储，通过 [Prisma](https://www.prisma.io/) 管理 Schema 与迁移。

连接串配置在环境变量 `DATABASE_URL` 中，格式示例：

```
postgresql://USER:PASSWORD@HOST:5432/ai_store?schema=public
```

## ER 关系概览

```
User (用户)
 ├── Order[]     一对多：AI 工具调用订单
 └── Recharge[]  一对多：余额充值记录
```

一个用户可有多笔订单和多次充值；删除用户时，其订单与充值记录会级联删除（`ON DELETE CASCADE`）。

## 表结构

### User — 用户表

存储通过微信登录（或开发模式）注册的用户信息与账户余额。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `TEXT` | 主键 | CUID，系统内部用户 ID |
| `openId` | `TEXT` | 唯一 | 微信 OpenID；开发模式下为 `dev_` 前缀的模拟 ID |
| `unionId` | `TEXT` | 可空 | 微信 UnionID（同一开放平台下多应用统一标识） |
| `nickname` | `TEXT` | 可空 | 用户昵称 |
| `avatar` | `TEXT` | 可空 | 头像 URL |
| `balance` | `DOUBLE PRECISION` | 默认 `0.1` | 账户余额（元）。新用户注册时自动获得 ¥0.1 体验余额 |
| `createdAt` | `TIMESTAMP(3)` | 非空 | 注册时间 |
| `updatedAt` | `TIMESTAMP(3)` | 非空 | 最后更新时间（余额变动等会触发更新） |

**索引：**

- `User_openId_key`：`openId` 唯一索引，用于登录时快速查找用户

---

### Order — 订单表

记录每次 AI 工具调用的计费信息。对应 `lib/products.ts` 中定义的 6 种产品（如 `body-segment`、`id-photo` 等）。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `TEXT` | 主键 | CUID，同时作为支付宝 `out_trade_no`（先用后付结算时） |
| `userId` | `TEXT` | 外键 → `User.id` | 下单用户 |
| `productId` | `TEXT` | 非空 | 产品标识，如 `body-segment`、`super-resolution` |
| `status` | `TEXT` | 默认 `PENDING` | 订单状态，见下方枚举 |
| `costPrice` | `DOUBLE PRECISION` | 非空 | 本次调用的阿里云成本价（元） |
| `chargePrice` | `DOUBLE PRECISION` | 非空 | 向用户收取的金额（元）。先用后付且实际价格 &lt; ¥0.1 时，此字段为 `0.1` |
| `paymentMethod` | `TEXT` | 可空 | 支付方式，见下方枚举 |
| `resultUrl` | `TEXT` | 可空 | 阿里云返回的结果图临时 URL（约 30 分钟有效） |
| `requestId` | `TEXT` | 可空 | 阿里云 API 请求 ID；支付宝支付时也可能写入交易号 |
| `metadata` | `TEXT` | 可空 | JSON 字符串，扩展信息（如先用后付的余额返还 `balanceCredit`） |
| `createdAt` | `TIMESTAMP(3)` | 非空 | 订单创建时间（即 AI 任务完成时间） |
| `paidAt` | `TIMESTAMP(3)` | 可空 | 付款完成时间 |

**`status` 取值：**

| 值 | 含义 |
|----|------|
| `PENDING` | 先用后付，待用户结算。有此状态订单时，用户无法使用任何收费功能 |
| `PAID` | 已付款（余额或支付宝） |
| `COMPLETED` | 已完成（预留，当前流程中创建后即视为完成） |
| `FAILED` | 失败（预留） |

**`paymentMethod` 取值：**

| 值 | 含义 |
|----|------|
| `balance` | 余额支付，下单时即扣款 |
| `pay_later` | 先用后付，任务完成后待结算 |
| `alipay` | 支付宝支付 |

**索引：**

- `Order_userId_status_idx`：`(userId, status)` 复合索引，用于快速查询某用户的待付款订单

---

### Recharge — 充值表

记录用户通过支付宝充值余额的流水。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `TEXT` | 主键 | CUID |
| `userId` | `TEXT` | 外键 → `User.id` | 充值用户 |
| `amount` | `DOUBLE PRECISION` | 非空 | 充值金额（元），支持自定义或快捷金额（0.1、0.5 等） |
| `status` | `TEXT` | 默认 `PENDING` | 充值状态，见下方枚举 |
| `alipayTradeNo` | `TEXT` | 可空 | 支付宝交易号（支付成功后写入） |
| `createdAt` | `TIMESTAMP(3)` | 非空 | 发起充值时间 |
| `paidAt` | `TIMESTAMP(3)` | 可空 | 支付成功时间 |

**`status` 取值：**

| 值 | 含义 |
|----|------|
| `PENDING` | 已创建充值单，等待支付宝付款 |
| `PAID` | 支付成功，对应金额已计入 `User.balance` |
| `FAILED` | 支付失败（预留） |

**索引：**

- `Recharge_userId_status_idx`：`(userId, status)` 复合索引，用于查询用户的充值记录

支付宝侧 `out_trade_no` 格式为 `recharge_{id}`，与订单 ID 区分。

## 常用运维命令
```bash
# 应用迁移（首次或 Schema 变更后）
npm run db:migrate
# 仅推送 Schema（开发快捷方式，不生成迁移文件）
npm run db:push
# 重新生成 Prisma Client
npx prisma generate
# 可视化查看数据
npx prisma studio
```
## 迁移文件
初始迁移位于 `prisma/migrations/20250605000000_init/migration.sql`，包含上述三张表及索引、外键定义。
