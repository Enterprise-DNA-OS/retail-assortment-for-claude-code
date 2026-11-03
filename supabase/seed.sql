insert into stores(id,code,name,cluster,currency,owner,review_due,unit_pricing_applies) values
('10000000-0000-4000-8000-000000000001','DEMO-CBD','Harbour Grocery Central','City','AUD','Aroha Demo',current_date-3,true),
('10000000-0000-4000-8000-000000000002','DEMO-BAY','Harbour Grocery Bay','Coastal','AUD','Lee Demo',current_date+4,false)
on conflict do nothing;
insert into products(id,sku,name,category,brand) values
('20000000-0000-4000-8000-000000000001','COF-250','Harbour Coffee 250g','Coffee','Harbour'),
('20000000-0000-4000-8000-000000000002','COF-500','Harbour Coffee 500g','Coffee','Harbour'),
('20000000-0000-4000-8000-000000000003','TEA-40','Bay Tea 40 bags','Tea','Bay'),
('20000000-0000-4000-8000-000000000004','TEA-80','Bay Tea 80 bags','Tea','Bay'),
('20000000-0000-4000-8000-000000000005','COF-NEW','Decaf Coffee 250g','Coffee','Harbour') on conflict do nothing;
insert into ranges(store_id,product_id,status,reason,unit_price_evidence,label_checked_on)
select s.id,p.id,'active','Fictional opening range',case when p.sku='COF-250' then 'DEMO label check only' end,
case when p.sku='COF-250' then current_date-100 end from stores s cross join products p
where (s.code='DEMO-CBD' and p.sku<>'TEA-80') or(s.code='DEMO-BAY' and p.sku in('COF-250','TEA-40')) on conflict do nothing;
insert into reports(id,store_id,period_start,period_end,currency,source_ref,source_sha256,mapping,row_count,actor)
select '30000000-0000-4000-8000-000000000001',id,current_date-8,current_date-2,'AUD','Fictional demo report','demo-central','{}',4,'Demo seed'
from stores where code='DEMO-CBD' and not exists(select 1 from reports where id='30000000-0000-4000-8000-000000000001');
insert into reports(id,store_id,period_start,period_end,currency,source_ref,source_sha256,mapping,row_count,actor)
select '30000000-0000-4000-8000-000000000002',id,current_date-28,current_date-22,'AUD','Fictional stale report','demo-bay','{}',2,'Demo seed'
from stores where code='DEMO-BAY' and not exists(select 1 from reports where id='30000000-0000-4000-8000-000000000002');
insert into observations(report_id,product_id,source_sku,source_name,source_category,source_brand,units,sales_amount,cost_amount,stock_units,facings,width_mm)
select r.id,p.id,p.sku,p.name,p.category,p.brand,x.units,x.sales,x.cost,x.stock,x.facings,x.width
from (values
('DEMO-CBD','COF-250',70,700,420,30,2,80),('DEMO-CBD','COF-500',7,126,105,100,4,100),
('DEMO-CBD','TEA-40',0,0,0,60,3,90),('DEMO-CBD','TEA-80',20,160,null,15,2,100),
('DEMO-BAY','COF-250',35,350,210,20,2,80),('DEMO-BAY','TEA-40',14,70,42,30,2,90)
)x(code,sku,units,sales,cost,stock,facings,width)
join stores s on s.code=x.code join reports r on r.store_id=s.id and r.source_ref like 'Fictional%'
join products p on p.sku=x.sku on conflict do nothing;
insert into actions(id,store_id,title,owner,due_on) values
('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Check slow coffee range with supplier','Aroha Demo',current_date-2)
on conflict do nothing;
