import {getDb} from './lib/db.mjs';
import {migrate} from './migrate.mjs';
import {seed} from './seed.mjs';
import {run,human} from './assortment.mjs';
const db=await getDb();try{await migrate(db);await seed(db);for(const cmd of ['range-review','slow-movers','gaps','attention'])console.log(`\n${cmd}\n${human(await run([cmd,'--store=DEMO-CBD'],db))}`);}finally{await db.close();}
