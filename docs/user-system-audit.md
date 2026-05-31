# 用户体系审计报告

## 📊 总体状态

| 模块 | 状态 | 存储位置 | 问题 |
|------|------|----------|------|
| 用户账号 | ✅ 完成 | Redis | 无 |
| 金币系统 | ✅ 完成 | Redis | 无 |
| 金币历史 | ✅ 完成 | Redis | 无 |
| 背包/库存 | ✅ 完成 | Redis | 无 |
| 邮箱验证 | ✅ 完成 | Redis | 无 |
| **签到系统** | ⚠️ 部分 | localStorage | 需要迁移到 Redis |
| **单词进度** | ⚠️ 部分 | localStorage | 需要迁移到 Redis |
| **宠物系统** | ⚠️ 部分 | localStorage | 需要迁移到 Redis |
| **阅读限制** | ⚠️ 部分 | localStorage | 需要迁移到 Redis |
| **导入限制** | ⚠️ 部分 | localStorage | 需要迁移到 Redis |
| **自定义文章** | ⚠️ 部分 | localStorage | 需要迁移到 Redis |
| 用户反馈 | ✅ 完成 | Redis | 无 |
| **活动追踪** | ⚠️ 部分 | Redis | 使用 IP 而非 userId |

---

## ✅ 已完成（绑定用户）

### 1. 用户账号体系
- **Redis Key**: `user:${userId}`, `user:email:${email}`
- **字段**: userId, email, passwordHash, createdAt, emailVerified, verificationToken
- **API**: `/api/auth/*`
- **状态**: ✅ 完整

### 2. 金币系统
- **Redis Key**: `coins:${userId}`, `coins:history:${userId}`
- **功能**: 查询、增加、消费、历史记录
- **API**: `/api/coins/*`
- **状态**: ✅ 完整

### 3. 背包/库存系统
- **Redis Key**: `inventory:${userId}`
- **字段**: food, accessories, equipped
- **API**: `/api/inventory/*`
- **状态**: ✅ 完整

### 4. 反馈系统
- **Redis Key**: `feedback:${id}`, `feedback:ids`
- **字段**: userId, message, contact, createdAt, read
- **API**: `/api/feedback`
- **状态**: ✅ 完整

---

## ⚠️ 需要完善（未绑定用户）

### 1. 签到系统 (`lib/checkin.ts`)
**当前问题**: 使用 localStorage，所有用户共享数据
```typescript
// 当前（错误）
const STORAGE_KEY = 'chineselearn-checkin' // 所有用户共用
localStorage.setItem(STORAGE_KEY, ...)

// 应该改为（Redis 已有函数）
getCheckin(userId) / setCheckin(userId, data)
```

**影响**:
- 切换账号后签到记录不变
- 多设备数据不同步
- 无法做真实的连续签到奖励

**需要修改的文件**:
- `lib/checkin.ts` - 迁移到 Redis
- `app/api/checkin/route.ts` - 添加 API 端点
- 相关组件调用

---

### 2. 单词学习进度 (`lib/words.ts`)
**当前问题**: 使用 localStorage，所有用户共享
```typescript
// 当前（错误）
const STORAGE_KEY = 'chineselearn-words'

// 应该改为（需要新增）
words:${userId}
```

**影响**:
- 切换账号后单词进度不变
- 多设备学习进度不同步
- 无法准确统计用户学习数据

**需要修改的文件**:
- `lib/words.ts` - 迁移到 Redis
- 需要新增 API 端点
- 所有使用单词进度的组件

---

### 3. 宠物系统 (`lib/pet.ts`)
**当前问题**: 大部分使用 localStorage，只有金币同步到 Redis
```typescript
// 当前（部分正确）
const PET_KEY = 'panda-pet'        // localStorage - 问题！
const INVENTORY_KEY = 'panda-inventory' // localStorage - 问题！

// 应该改为（Redis 已有函数）
getPet(userId) / setPet(userId, data)
getInventory(userId) / setInventory(userId, data) // 已存在
```

**影响**:
- 宠物状态不同步
- 喂食记录不保存
- 多设备状态不一致

**需要修改的文件**:
- `lib/pet.ts` - 迁移宠物状态到 Redis
- 宠物相关的组件

---

### 4. 阅读限制 (`lib/reading-limit.ts`)
**当前问题**: 使用 localStorage
```typescript
// 当前（错误）
const READING_LIMIT_KEY = 'daily_reading_count'
localStorage.getItem(READING_LIMIT_KEY)

// 应该改为（需要新增）
reading:${userId}:count
reading:${userId}:date
```

**影响**:
- 切换账号后阅读计数不重置
- 无法做真实的每日限制
- 付费用户限制不准确

---

### 5. 导入限制 (`lib/import-limit.ts`)
**当前问题**: 使用 localStorage
```typescript
// 当前（错误）
const IMPORT_COUNT_KEY = 'daily_import_count'
localStorage.getItem(IMPORT_COUNT_KEY)

// 应该改为（需要新增）
import:${userId}:count
import:${userId}:date
import:${userId}:articles
```

**影响**:
- 导入计数不准确
- 付费判断错误
- 金币扣费可能出错

---

### 6. 自定义文章 (`lib/custom-articles.ts`)
**当前问题**: 使用 localStorage
```typescript
// 当前（错误）
const STORAGE_KEY = 'pandahan-custom-articles'

// 应该改为（需要新增）
articles:${userId}:custom
```

**影响**:
- 多设备文章不同步
- 切换账号后文章还在
- 数据丢失风险

---

### 7. 活动追踪 (`app/api/activity/route.ts`)
**当前问题**: 使用 IP 而不是 userId
```typescript
// 当前（错误）
const ip = getClientIp(request)
createActivity(ip.slice(0, 100), action, detail)

// 应该改为
const userId = await getUserIdFromRequest(request)
createActivity(userId, action, detail)
```

**影响**:
- 无法追踪具体用户行为
- 同一 IP 多用户混淆
- 用户画像不准确

---

## 🎯 优先级建议

### 高优先级（影响核心功能）
1. **金币系统** - 已完成 ✅
2. **签到系统** - 影响每日奖励
3. **单词进度** - 影响学习体验
4. **活动追踪** - 影响数据分析

### 中优先级（影响用户体验）
5. **宠物系统** - 影响游戏化体验
6. **阅读限制** - 影响付费转化
7. **导入限制** - 影响付费转化

### 低优先级（优化类）
8. **自定义文章** - 多设备同步

---

## 📝 Redis Schema 建议

```
# 用户基础
user:${userId}              - 用户信息
user:email:${email}         - 邮箱索引

# 金币系统（已完成）
coins:${userId}             - 金币余额
coins:history:${userId}     - 金币历史

# 签到系统
checkin:${userId}           - 签到数据

# 单词进度
words:progress:${userId}    - 单词学习进度

# 宠物系统
pet:${userId}               - 宠物状态

# 阅读系统
reading:${userId}:count     - 今日阅读计数
reading:${userId}:date      - 最后阅读日期

# 导入系统
import:${userId}:count      - 今日导入计数
import:${userId}:date       - 最后导入日期
import:${userId}:articles   - 已导入文章ID列表

# 自定义文章
articles:${userId}:custom   - 自定义文章列表

# 活动追踪
activity:${id}              - 活动记录（已有）
activity:ids                - 活动ID索引
```

---

## 🔧 实施建议

### 方案 A: 逐个迁移（推荐）
每次迁移一个模块，测试后再进行下一个。

### 方案 B: 批量迁移
一次性完成所有迁移，风险较高。

### 方案 C: 兼容模式
新数据存 Redis，旧数据从 localStorage 迁移，支持回滚。

---

**报告生成时间**: 2026-05-31
