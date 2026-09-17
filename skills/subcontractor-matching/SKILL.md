# subcontractor-matching

根据抽取的需求匹配可合作分包商。

## 步骤
1. 调用 query_subcontractors、query_qualifications、query_projects。
2. 按工种、区域、档期、履约评分排序。
3. 资质缺失、过期、黑名单或暂停接单的不得作为推荐。

## 规则
- 不得承诺一定能进场或中标。
- 新分包商只可提示“需准入核验”，不可包装成优质履约。
