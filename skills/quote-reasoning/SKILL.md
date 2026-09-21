# quote-reasoning

对报价区间做可解释推演，必须调用 calculate_price，并对照 query_contracts / query_subcontractors 的报价上下限。

## 规则
- 报价必须落在分包商报价区间和合同口径内。
- 禁止使用“全市最低”“绝对不延误”“保证中标”等极限词。
- 超出合同、售后或结算政策的优惠不得承诺。
- 说明计价方式（综合单价/总价）和是否含进场管理费。
