# Brokermint Helpdesk Gap Map

这份文档基于你提供的官方 Google Doc 导出整理而成。该导出本质上是 `BoldTrail BackOffice / Brokermint Helpdesk Offline Export`，包含 `143` 篇帮助中心文章。

用途不是“抄说明书”，而是把：

- 官方真实使用说明
- 我们当前 Acre 仓库的真实实现状态
- 下一步最该补的模块

放进同一份对照表里。

## 1. 这份官方导出给出的新增确认

相比我们之前的站内扫页和官网功能页，这份导出进一步确认了这些关键事实：

### 1.1 `Accounting` 远比当前 Acre 实现深

帮助中心明确覆盖了：

- `Understanding Accounting Transaction Types`
- `Finalizing a Transaction & Posting Commissions to the General Ledger`
- `Understanding Earnest Money Deposit (EMD)`
- `Getting Started: Using QuickBooks & BTBO Together`
- `How to Create 1099s for Agent Commissions and Expenses`
- `Print Checks with BoldTrail BackOffice and QuickBooks`
- `Bulk input one-time charges`
- `Paying multiple bills at once with bulk payments`

这说明官方产品里的 `Accounting` 不是“一个财务摘要页”，而是一个真正的会计工作流，至少包括：

- invoice / bill / credit memo / deposit / received payment
- general ledger posting
- earnest money tracking
- batch payments
- QuickBooks mapping 和同步
- 1099 相关数据准备

我们当前 Acre 只做到了最小 transaction finance 字段，还远没进入这个层级。

### 1.2 `Task list` 不是简单待办列表

帮助中心里有：

- `Navigating the new Task list page (ex Calendar)`
- `How to enable secondary approval for tasks`

文档内容说明 task 体系至少带有：

- 按任务视图统一看全公司 / 全用户任务
- 任务状态和文档 / eSign / approval 语义联动
- “secondary approval” 这类更细流程控制

我们当前 Acre 只做了 transaction detail 下的最小 checklist/task CRUD，还没有全局 task list，也没有文档联动语义。

### 1.3 `Folio` 集成说明了 transaction workflow 会吸收外部数据源

帮助中心里有：

- `BoldTrail BackOffice & Folio - Getting Started`
- `BoldTrail BackOffice & Folio Overview`
- `BoldTrail BackOffice & Folio - Information Sync`
- `BoldTrail BackOffice & Folio - Save Documents`
- `BoldTrail BackOffice & Folio - Sync Folio Smart Folder Details`

这些文章明确说明：

- 外部系统可以把 transaction 相关信息同步进 BackOffice
- 包括地址、日期、contact、timeline、emails、documents
- 未排序文档、邮件 PDF、Smart Folder details 都进入 transaction workflow

这比我们当前只做“手工录入 transaction”要深得多。

### 1.4 `Pipeline` / `Watch List` 的产品语义会变化

导出里出现了：

- `"Watch List" replaces "Pipeline"`

这说明官方产品在不同产品线 / 时间点里，pipeline 语义并不完全固定。  
对 Acre 来说，当前继续保留 `Pipeline` 页面是合理的，但后续做成可配置的 funnel / watch list 会更稳。

### 1.5 官方帮助中心说明比官网更适合作为实现依据

官网更多是销售文案。  
帮助中心则给出了真实实现边界：

- 必填字段
- 批量流程
- QuickBooks 映射规则
- payer/contact 选择规则
- task 状态含义
- office / agent / report 的真实工作方式

所以后续实现应优先参考帮助中心，而不是官网 marketing 页。

## 2. 当前 Acre 与官方能力的差距

下面按模块标记当前状态：

- `已接入真实数据库`
- `部分实现`
- `未实现`

### 2.1 Dashboard

官方产品：

- goal tracking
- recent transactions
- useful links
- training links
- 运营入口页

当前 Acre：

- `部分实现`
- 已有真实 business metrics：
  - recent transactions
  - transaction counts by status
  - contacts needing follow-up
- 静态块仍是静态：
  - weekly updates
  - useful links
  - training links

差距：

- 还没有官方 dashboard 上更深的 office widgets
- 还没有更多真实配置和编辑动作

### 2.2 Pipeline / Watch List

官方产品：

- funnel / watch-list 视图
- bucket count
- volume
- live transaction cards

当前 Acre：

- `已接入真实数据库`
- 已有：
  - `Opportunity / Active / Pending / Closed / Cancelled`
  - real count
  - real volume
  - real card -> transaction detail

差距：

- 没有 alternate mode
- 没有拖拽
- 没有官方后续 watch-list 语义扩展

### 2.3 Transactions

官方产品：

- list
- create transaction modal
- detail workflow
- contacts
- documents
- offers
- checklists/tasks
- approvals
- finance

当前 Acre：

- `部分实现`
- 已实现：
  - list
  - search
  - status filter
  - create transaction（最小）
  - detail
  - status update
  - contacts section
  - finance section
  - checklist/tasks section

差距：

- documents：`未实现`
- unsorted documents：`未实现`
- offers / buyer offers：`未实现`
- approvals：`未实现`
- eSign：`未实现`
- 更完整 create transaction 4-step 流程：`未实现`

### 2.4 Contacts

官方产品：

- 联系人可在 transaction 内选择 / 搜索 / 分配角色
- 联系人参与交易工作流

当前 Acre：

- `部分实现`
- 已实现：
  - contacts list
  - search
  - create / edit
  - detail
  - follow-up tasks
  - transaction linking
  - `TransactionContact` 多对多关系

差距：

- 还没有完整 transaction role matrix
- 还没有更复杂的 buyer / seller / title / attorney / lender 等角色体系

### 2.5 Checklist / Task List

官方产品：

- transaction checklist
- task list page
- document / approval / eSign 状态联动
- secondary approval

当前 Acre：

- `部分实现`
- 已实现：
  - transaction detail 下最小 checklist/tasks
  - create / edit / complete / incomplete

差距：

- 全局 task list：`未实现`
- secondary approval：`未实现`
- document requirement / approval coupling：`未实现`
- eSign follow-up 视图：`未实现`

### 2.6 Reports

官方产品：

- company reports
- custom reports
- filters
- exports

当前 Acre：

- `部分实现`
- 已实现：
  - total transactions
  - transactions by status
  - by owner
  - over time
  - contacts needing follow-up
  - date range / owner filter
  - CSV export

差距：

- 还没有官方 report family 全量覆盖
- 没有 custom report builder
- 没有 document review / deposit / signing status reports

### 2.7 Activity

官方产品：

- 更像真实 back-office feed
- 能承接 task / docs / event / workflow 信号

当前 Acre：

- `部分实现`
- 已实现：
  - upcoming events
  - notifications
  - follow-up needs
  - recent operational items

差距：

- 不是完整 audit log
- 没有 documents / approvals / eSign / accounting activity

### 2.8 Accounting

官方产品：

- accounting transaction types
- GL posting
- EMD
- QuickBooks integration
- bills / invoices / payments / bulk payments / print checks

当前 Acre：

- `未实现`
- 当前只有 transaction finance 上的最小字段：
  - gross commission
  - referral fee
  - office net
  - agent net
  - finance notes

差距：

- 这是当前最大能力缺口之一

### 2.9 Documents / Approvals / eSign

官方产品：

- transaction documents
- unsorted documents
- task-required documents
- approval queue
- eSign follow-up

当前 Acre：

- `未实现`

这是当前另一个最大能力缺口。

### 2.10 Users / Permissions / Onboarding

官方产品：

- user profiles
- permissions
- onboarding
- teams
- office-aware reporting / filtering

当前 Acre：

- `部分实现`
- 已实现：
  - 最小本地 session
  - office-role page protection

差距：

- user management UI：`未实现`
- fine-grained permissions：`未实现`
- onboarding：`未实现`
- teams：`未实现`

### 2.11 Integrations

官方产品：

- QuickBooks
- BHHS
- Folio
- MLS / franchise / reporting integrations

当前 Acre：

- `未实现`

## 3. 对我们当前实现最有指导意义的官方模块

如果按“下一步最该补什么”的优先级，我建议按这组顺序：

1. `Documents / Approvals / eSign`
原因：
- 它直接决定 transaction workflow 是否像 Brokermint
- 当前我们已有 transaction detail / contacts / finance / tasks，下一步自然就是 documents 和 approvals

2. `Global Task List`
原因：
- 官方帮助中心已经明确 task list 是独立页面和工作模式
- 我们已经有 `TransactionTask`，很适合顺着扩出去

3. `Accounting`
原因：
- 官方导出明确说明这不是一个“统计页”，而是一个完整会计模块
- 当前 Acre 在这块差距最大

4. `Users / Permissions / Onboarding`
原因：
- 这会直接影响 office 工作流可用性

5. `Folio / 外部来源同步`
原因：
- 官方 workflow 已经不是纯手工录入
- 但这个阶段比 documents/accounting 更重，适合稍后做

## 4. 当前 Acre 实现的真实定位

如果严格对照这份官方帮助中心导出，当前 Acre 更准确的定位是：

- 已经完成 `Back Office` 基础骨架
- 已经打通最小真实数据库能力
- 已经开始进入真实 workflow
- 但还没有进入 `Brokermint` 最强的中后段能力：
  - documents
  - approvals
  - eSign
  - accounting
  - integrations

换句话说：

- 我们现在不是“还没开始”
- 但也绝对不是“已经做成和官方一模一样”

## 5. 后续实现时的约束

基于这份官方导出，后面继续做时应该遵守：

1. 不再把 `Activity`、`Tasks`、`Finance` 这些概念做成泛后台小功能  
而要按官方 workflow 去收敛。

2. `Accounting` 不要继续停留在 transaction detail 上几个数字字段  
后续必须进入：
- ledger
- posting
- invoice / bill / payment
- QuickBooks mapping

3. `Transaction detail` 后续最应该补的不是新概念，而是官方已有子页：
- documents
- approvals
- eSign
- offers

4. 任何新模块如果在官方帮助中心已有明确字段/步骤，应优先按官方说明落，不再凭猜测扩字段。

## 6. 建议的下一步

最合理的下一步不是继续横向铺页面，而是从这份帮助中心导出里直接做一轮模块化拆解：

### 第一批建议优先精读的文章簇

- `How to create a transaction`
- `Approving documents`
- `Navigating the new Task list page`
- `How to enable secondary approval for tasks`
- `Understanding Accounting Transaction Types`
- `Finalizing a Transaction & Posting Commissions to the General Ledger`
- `Understanding Earnest Money Deposit (EMD)`
- `Getting Started: Using QuickBooks & BTBO Together`

### 然后按这个顺序做产品实现

1. transaction documents / approvals
2. task list page
3. accounting core
4. permissions / users
5. integrations

这条顺序最接近官方产品重心，也最能让 Acre 快速从“像后台”走到“像 Brokermint”。
