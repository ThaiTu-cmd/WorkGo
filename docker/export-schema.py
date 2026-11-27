"""Maintainer tool: export runtime schema from local WorkGo.sql, without demo seeds.

Docker startup uses the exported files; Python and WorkGo.sql are not required on
the receiving machine. Re-run this tool after updating the canonical schema.
"""
from pathlib import Path
import re

root = Path(__file__).resolve().parent.parent
source = (root / 'WorkGo.sql').read_text(encoding='utf-8')
marker = 'communication-service/src/main/resources/db/manual/dev06-communication-audit.js'
match = re.search(r'^-- BEGIN WORKGO SCRIPT: ' + re.escape(marker) + r'\n(.*?)^-- END WORKGO SCRIPT:', source, re.M | re.S)
if not match:
    raise SystemExit('Canonical Mongo index block is missing; no export written.')
mongo = match.group(1).rstrip() + '\n'

lines = []
skip_depth = 0
seed_blocks = 0
for line in source.splitlines():
    directive = line.strip()
    if not skip_depth and directive == r'\if :workgo_seed':
        skip_depth = 1
        seed_blocks += 1
        continue
    if skip_depth:
        if directive.startswith(r'\if '): skip_depth += 1
        elif directive == r'\endif': skip_depth -= 1
        continue
    lines.append(line)
if skip_depth or seed_blocks != 2:
    raise SystemExit('Unexpected seed block structure; no export written.')
sql = '\n'.join(lines) + '\n'
sql, removed = re.subn(r'/\*\nMongoDB / mongosh.*?\*/\n', '', sql, count=1, flags=re.S)
if removed != 1:
    raise SystemExit('Expected standalone Mongo comment block; no export written.')
# Replace local instructions with a public runtime header; keep SQL/migration bodies intact.
sql = sql[sql.index(r'\set ON_ERROR_STOP on'):]
sql = ('-- WorkGo PostgreSQL schema and additive migrations; no demo account/business seeds.\n'
       '-- Exported by docker/export-schema.py from the canonical local schema.\n'
       '-- Fresh empty DB: psql -v workgo_service=identity -v workgo_mode=fresh -f postgres-schema.sql\n'
       '-- Existing DB: back up and review before using workgo_mode=upgrade.\n' + sql)
for unsafe in ['INSERT INTO users ', 'Provider@123', 'nguyenvana', 'tranthib']:
    if unsafe in sql:
        raise SystemExit('Unexpected demo content in schema export: ' + unsafe)
(root / 'docker/postgres-schema.sql').write_text(sql, encoding='utf-8', newline='\n')
(root / 'docker/mongo-indexes.js').write_text('// Runtime collections/indexes; no fixture data.\n' + mongo, encoding='utf-8', newline='\n')
print(f'Exported runtime schema; removed {seed_blocks} demo seed blocks.')
