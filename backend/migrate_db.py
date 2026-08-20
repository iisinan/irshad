import psycopg2
from psycopg2.extras import execute_batch
import sys
import json

src_url = "postgresql://neondb_owner:npg_u8hqs1ZlpKNS@ep-royal-butterfly-asgx2yna.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require"
dst_url = "postgresql://postgres:ytLYyUzdrrHlVoTPakRbrqBHvATCjBax@hopper.proxy.rlwy.net:34219/railway"

try:
    src_conn = psycopg2.connect(src_url)
    dst_conn = psycopg2.connect(dst_url)
except Exception as e:
    print(f"Connection error: {e}")
    sys.exit(1)

src_cur = src_conn.cursor()
dst_cur = dst_conn.cursor()

src_cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name != 'migrations';
""")
tables = [row[0] for row in src_cur.fetchall()]

dst_cur.execute("SET session_replication_role = 'replica';")

for table in tables:
    print(f"Copying {table}...")
    src_cur.execute(f'SELECT * FROM "{table}"')
    rows = src_cur.fetchall()
    
    # Always truncate first to avoid duplicates
    try:
        dst_cur.execute(f'TRUNCATE TABLE "{table}" CASCADE')
        dst_conn.commit()
    except Exception as e:
        dst_conn.rollback()
        print(f"Could not truncate {table}: {e}")
    
    if not rows:
        continue
        
    processed_rows = []
    for row in rows:
        processed_row = tuple(json.dumps(val) if isinstance(val, (dict, list)) else val for val in row)
        processed_rows.append(processed_row)
        
    cols = [desc[0] for desc in src_cur.description]
    col_str = ','.join(f'"{c}"' for c in cols)
    val_str = ','.join(['%s']*len(cols))
    
    insert_query = f'INSERT INTO "{table}" ({col_str}) VALUES ({val_str})'
    
    try:
        execute_batch(dst_cur, insert_query, processed_rows, page_size=1000)
    except Exception as e:
        print(f"Error inserting into {table}: {e}")
        dst_conn.rollback()
        continue
        
    dst_conn.commit()

dst_cur.execute("SET session_replication_role = 'origin';")
dst_conn.commit()

for table in tables:
    try:
        dst_cur.execute(f"SELECT column_default FROM information_schema.columns WHERE table_name = '{table}' AND column_name = 'id'")
        res = dst_cur.fetchone()
        if res and res[0] and 'nextval' in res[0]:
            seq_name = res[0].split("'")[1]
            dst_cur.execute(f"SELECT setval('{seq_name}', COALESCE((SELECT MAX(id)+1 FROM \"{table}\"), 1), false)")
            dst_conn.commit()
    except Exception as e:
        dst_conn.rollback()
        pass

print("Done copying data.")
