create table stores (
 id uuid primary key default gen_random_uuid(), code text not null unique check(btrim(code)<>''),
 name text not null check(btrim(name)<>''), cluster text not null check(btrim(cluster)<>''),
 currency text not null check(currency ~ '^[A-Z]{3}$'), owner text not null check(btrim(owner)<>''),
 review_due date not null, unit_pricing_applies boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index stores_code_ci on stores(lower(code));
create table products (
 id uuid primary key default gen_random_uuid(), sku text not null unique check(btrim(sku)<>''),
 name text not null check(btrim(name)<>''), category text not null check(btrim(category)<>''),
 brand text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table ranges (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references stores,
 product_id uuid not null references products, status text not null check(status in ('active','paused','delisted')),
 reason text not null check(btrim(reason)<>''), unit_price_evidence text, label_checked_on date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(store_id,product_id)
);
create table reports (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references stores,
 period_start date not null, period_end date not null check(period_end>=period_start),
 currency text not null check(currency ~ '^[A-Z]{3}$'), source_ref text not null check(btrim(source_ref)<>''),
 source_sha256 text not null, mapping jsonb not null, row_count integer not null check(row_count>0),
 actor text not null check(btrim(actor)<>''), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(store_id, period_start, period_end)
);
create table observations (
 id uuid primary key default gen_random_uuid(), report_id uuid not null references reports,
 product_id uuid not null references products, source_sku text not null, source_name text not null,
 source_category text not null, source_brand text not null default '',
 units numeric(16,3) not null check(units>=0), sales_amount numeric(16,2) not null check(sales_amount>=0),
 cost_amount numeric(16,2) check(cost_amount>=0), stock_units numeric(16,3) check(stock_units>=0),
 facings integer check(facings>=0), width_mm numeric(12,3) check(width_mm>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(report_id,product_id)
);
create table decisions (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references stores, product_id uuid not null references products,
 recommendation text not null check(recommendation in ('keep','review','delist')),
 rationale text not null check(btrim(rationale)<>''), evidence_ref text not null check(btrim(evidence_ref)<>''),
 actor text not null check(btrim(actor)<>''), snapshot jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table actions (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references stores, title text not null check(btrim(title)<>''),
 owner text not null check(btrim(owner)<>''), due_on date not null, closed_on date, resolution text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check ((closed_on is null and resolution is null) or (closed_on is not null and length(btrim(resolution))>0))
);
create table events (
 id uuid primary key default gen_random_uuid(), store_id uuid references stores, kind text not null, actor text not null check(btrim(actor)<>''),
 detail jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function touch_assortment() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create function preserve_assortment() returns trigger language plpgsql as $$ begin raise exception 'Evidence is append-only'; end $$;
create function check_report_window() returns trigger language plpgsql as $$ begin
 perform 1 from stores where id=new.store_id for update;
 if new.currency<>(select currency from stores where id=new.store_id) then raise exception 'Report currency differs from store currency'; end if;
 if exists(select 1 from reports where store_id=new.store_id and period_start<=new.period_end and period_end>=new.period_start) then
 raise exception 'Report periods overlap for this store'; end if;
 return new; end $$;
create trigger reports_window before insert on reports for each row execute function check_report_window();
do $$ declare t text; begin
 foreach t in array array['stores','products','ranges','reports','observations','decisions','actions','events'] loop
 execute format('create trigger %I before update on %I for each row execute function touch_assortment()',t||'_touch',t);
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
 end loop;
 foreach t in array array['reports','observations','decisions','events'] loop
 execute format('create trigger %I before update or delete on %I for each row execute function preserve_assortment()',t||'_immutable',t);
 end loop;
end $$;
create view latest_reports as select distinct on(store_id) * from reports order by store_id,period_end desc;
create view range_performance as
 select s.id store_id,s.code store_code,s.name store,s.cluster,s.owner,s.currency,
 r.id report_id,r.period_start,r.period_end,r.source_ref,
 p.id product_id,p.sku, o.source_name product,o.source_category category,o.source_brand brand,
 coalesce(g.status,'not ranged') range_status,o.units,o.sales_amount,o.cost_amount,
 (o.sales_amount-o.cost_amount) gross_margin_amount,
 round(100*(o.sales_amount-o.cost_amount)/nullif(o.sales_amount,0),2) margin_percent,
 o.stock_units,o.facings,o.width_mm,
 round(o.stock_units*(r.period_end-r.period_start+1)/nullif(o.units,0),1) stock_days,
 round(o.sales_amount/nullif(o.facings,0),2) sales_per_facing_amount,
 round(o.sales_amount*1000/nullif(o.facings*o.width_mm,0),2) sales_per_metre_amount
 from stores s join latest_reports r on r.store_id=s.id
 join observations o on o.report_id=r.id join products p on p.id=o.product_id
 left join ranges g on g.store_id=s.id and g.product_id=p.id;
create view assortment_gaps as
 select s.id store_id,s.code store_code,p.sku,p.name product,'active range missing from latest report' issue
 from ranges g join stores s on s.id=g.store_id join products p on p.id=g.product_id
 where g.status='active' and not exists(select 1 from range_performance v where v.store_id=s.id and v.product_id=p.id)
 union all
 select store_id,store_code,sku,product,'observed outside active range' from range_performance where range_status<>'active';
create view category_performance as
 select cluster,store_code,category,currency,period_start,period_end,count(*) product_count,
 sum(units) units,sum(sales_amount) sales_amount,
 case when count(cost_amount)=count(*) then sum(gross_margin_amount) end gross_margin_amount,
 count(*)-count(cost_amount) missing_costs
 from range_performance group by cluster,store_code,category,currency,period_start,period_end;
create view assortment_attention as
 select s.id store_id,s.code store_code,'review' kind,s.name item,s.owner,s.review_due due_on
 from stores s where s.review_due<current_date
 union all
 select s.id,s.code,'data',coalesce('Latest report ended '||r.period_end::text,'No performance report'),s.owner,r.period_end+14
 from stores s left join latest_reports r on r.store_id=s.id where r.id is null or r.period_end<current_date-14
 union all
 select s.id,s.code,'action',a.title,a.owner,a.due_on from actions a join stores s on s.id=a.store_id
 where a.closed_on is null and a.due_on<current_date;
create view assortment_compliance as
 select s.id store_id,s.code store_code,p.sku,'UNIT-01' rule,'Missing unit-price display evidence' finding,
 'https://www.accc.gov.au/business/industry-codes/unit-pricing-code' source
 from ranges g join stores s on s.id=g.store_id join products p on p.id=g.product_id
 where g.status='active' and s.unit_pricing_applies and (nullif(btrim(g.unit_price_evidence),'') is null or g.label_checked_on is null)
 union all
 select s.id,s.code,p.sku,'LOCAL-01','Unit-price display evidence review older than 90 days',
 'Local review policy, not a statutory period'
 from ranges g join stores s on s.id=g.store_id join products p on p.id=g.product_id
 where g.status='active' and s.unit_pricing_applies and g.label_checked_on<current_date-90;
