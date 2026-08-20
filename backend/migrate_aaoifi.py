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
    sys.exit(1)

src_cur = src_conn.cursor()
dst_cur = dst_conn.cursor()

# Get column data types for aaoifi_screenings
src_cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'aaoifi_screenings'")
col_types = {row[0]: row[1] for row in src_cur.fetchall()}

dst_cur.execute("SET session_replication_role = 'replica';")

table = 'aaoifi_screenings'
print(f"Copying {table}...")
src_cur.execute(f'SELECT * FROM "{table}"')
rows = src_cur.fetchall()

dst_cur.execute(f'TRUNCATE TABLE "{table}" CASCADE')
dst_conn.commit()

cols = [desc[0] for desc in src_cur.description]
processed_rows = []
for row in rows:
    new_row = []
    for i, val in enumerate(row):
        cname = cols[i]
        ctype = col_types.get(cname, '')
        if 'json' in ctype and val is not None:
            if isinstance(val, (dict, list)):
                new_row.append(json.dumps(val))
            elif isinstance(val, str):
                try:
                    json.loads(val)
                    new_row.append(val)
                except ValueError:
                    new_row.append(json.dumps(val))
            else:
                new_row.append(json.dumps(val))
        else:
            new_row.append(val)
    processed_rows.append(tuple(new_row))

col_str = ','.join(f'"{c}"' for c in cols)
val_str = ','.join(['%s']*len(cols))

insert_query = f'INSERT INTO "{table}" ({col_str}) VALUES ({val_str})'

try:
    execute_batch(dst_cur, insert_query, processed_rows, page_size=1000)
except Exception as e:
    print(f"Error inserting into {table}: {e}")
    dst_conn.rollback()

dst_conn.commit()

dst_cur.execute("SET session_replication_role = 'origin';")
dst_conn.commit()

try:
    dst_cur.execute(f"SELECT column_default FROM information_schema.columns WHERE table_name = '{table}' AND column_name = 'id'")
    res = dst_cur.fetchone()
    if res and res[0] and 'nextval' in res[0]:
        seq_name = res[0].split("'")[1]
        dst_cur.execute(f"SELECT setval('{seq_name}', COALESCE((SELECT MAX(id)+1 FROM \"{table}\"), 1), false)")
        dst_conn.commit()
except Exception as e:
    dst_conn.rollback()

print("Done copying aaoifi_screenings.")
