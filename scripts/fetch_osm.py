"""Fetch the area around the site (site.config.json → origin) from OpenStreetMap (Overpass API) and write map/osm.json,
the compact local-metre geometry the 3D map loads. Re-run to refresh: python3 scripts/fetch_osm.py
Map data © OpenStreetMap contributors, ODbL."""
import json, math, subprocess
from pathlib import Path

_C = json.loads((Path(__file__).resolve().parent.parent / 'site.config.json').read_text())
LAT0, LON0, R = _C['origin']['lat'], _C['origin']['lon'], _C['origin']['radius']  # centre, radius in metres
dlat, dlon = R / 110540, R / (111320 * math.cos(math.radians(LAT0)))
bbox = f'{LAT0 - dlat},{LON0 - dlon},{LAT0 + dlat},{LON0 + dlon}'
Q = f'''[out:json][timeout:120];
( way["building"]({bbox}); relation["building"]({bbox}); way["building:part"]({bbox});
  way["highway"]({bbox}); way["railway"]({bbox}); node["railway"~"station|stop|subway_entrance"]({bbox}); node["public_transport"]({bbox}); node["highway"="bus_stop"]({bbox});
  way["landuse"]({bbox}); way["leisure"]({bbox}); way["natural"]({bbox}); way["waterway"]({bbox}); way["amenity"="parking"]({bbox});
  node["natural"="tree"]({bbox}); node["entrance"]({bbox}); node["amenity"="parking_entrance"]({bbox});
  node["name"]["amenity"]({bbox}); node["name"]["shop"]({bbox}); node["name"]["tourism"]({bbox}); node["name"]["leisure"]({bbox}); node["name"]["office"]({bbox}); node["name"]["healthcare"]({bbox});
  way["name"]["amenity"]({bbox}); way["name"]["shop"]({bbox}); way["name"]["tourism"]({bbox}); );
out body geom;'''
raw = subprocess.run(['curl', '-sf', '--max-time', '180', '-A', '3D-map-site/1.0', '--data-urlencode', 'data=' + Q,
                      'https://overpass-api.de/api/interpreter'], capture_output=True, check=True).stdout
els = json.loads(raw)['elements']

def xy(lat, lon):  # local tangent plane, metres: x east, y north
    return [round((lon - LON0) * 111320 * math.cos(math.radians(LAT0)), 1), round((lat - LAT0) * 110540, 1)]
def num(v):
    try: return float(str(v).split()[0].replace(',', '.'))
    except Exception: return None
def clean(d): return {k: v for k, v in d.items() if v is not None}

out = {'origin': [LAT0, LON0], 'radius': R, 'buildings': [], 'roads': [], 'rails': [], 'areas': [], 'trees': [], 'pois': [], 'water': [], 'entrances': [], 'stops': []}
for e in els:
    t = e.get('tags', {}); g = e.get('geometry')
    pts = [xy(p['lat'], p['lon']) for p in g] if g else None
    if e['type'] == 'relation' and 'building' in t:
        outer = [m for m in e.get('members', []) if m.get('role') == 'outer' and m.get('geometry')]
        pts = [xy(p['lat'], p['lon']) for p in outer[0]['geometry']] if outer else None
    if e['type'] == 'node':
        p = xy(e['lat'], e['lon'])
        if t.get('natural') == 'tree': out['trees'].append(p)
        elif 'entrance' in t or t.get('amenity') == 'parking_entrance' or t.get('railway') == 'subway_entrance':
            out['entrances'].append(clean({'p': p, 't': t.get('entrance') or t.get('amenity') or t.get('railway'), 'name': t.get('name') or t.get('ref')}))
        elif t.get('highway') == 'bus_stop' or (t.get('public_transport') == 'platform' and t.get('bus') == 'yes'):
            out['stops'].append(clean({'p': p, 'name': t.get('name')}))
        elif t.get('railway') in ('station', 'stop') or t.get('public_transport') == 'station':
            out['pois'].append(clean({'p': p, 'name': t.get('name') or 'Station', 'kind': 'station', 'sub': t.get('network') or t.get('operator')}))
        elif t.get('name'):
            kind = next((k for k in ('amenity', 'shop', 'tourism', 'leisure', 'office', 'healthcare') if k in t), 'place')
            out['pois'].append({'p': p, 'name': t['name'], 'kind': kind, 'sub': t.get(kind)})
        continue
    if not pts or len(pts) < 2: continue
    if ('building' in t or 'building:part' in t) and len(pts) > 3:
        h = num(t.get('height')) or ((num(t.get('building:levels')) or 0) * 3.3) or None
        out['buildings'].append(clean({'id': e['id'], 'p': pts, 'h': h, 'min': num(t.get('min_height')), 'type': t.get('building') or 'part',
            'name': t.get('name'), 'mat': t.get('building:material'), 'col': t.get('building:colour'), 'roof': t.get('roof:colour'), 'part': 1 if 'building:part' in t else None}))
    elif 'highway' in t:
        out['roads'].append(clean({'p': pts, 't': t['highway'], 'name': t.get('name'), 'bridge': 1 if t.get('bridge') in ('yes', 'viaduct') else None,
            'layer': num(t.get('layer')), 'lanes': num(t.get('lanes')), 'oneway': 1 if t.get('oneway') == 'yes' else None}))
    elif 'railway' in t:
        out['rails'].append(clean({'p': pts, 't': t['railway'], 'name': t.get('name'), 'bridge': 1 if t.get('bridge') in ('yes', 'viaduct') else None, 'layer': num(t.get('layer'))}))
    elif t.get('waterway'):
        out['water'].append(clean({'p': pts, 't': t['waterway'], 'name': t.get('name')}))
    elif (t.get('landuse') or t.get('leisure') or t.get('natural') or t.get('amenity') == 'parking') and len(pts) > 3 and pts[0] == pts[-1]:
        out['areas'].append(clean({'p': pts, 't': t.get('landuse') or t.get('leisure') or t.get('natural') or 'parking', 'name': t.get('name')}))
    if t.get('name') and any(k in t for k in ('amenity', 'shop', 'tourism')) and 'building' not in t:
        cx = sum(q[0] for q in pts) / len(pts); cy = sum(q[1] for q in pts) / len(pts)
        k = next(k for k in ('amenity', 'shop', 'tourism') if k in t)
        out['pois'].append({'p': [round(cx, 1), round(cy, 1)], 'name': t['name'], 'kind': k, 'sub': t.get(k)})
# re-centre on the EkoCheras Mall building so (0, 0) is the mall and everything is in metres from it
mall = next(b for b in out['buildings'] if b.get('name') == 'EkoCheras Mall')
mx = sum(q[0] for q in mall['p']) / len(mall['p']); my = sum(q[1] for q in mall['p']) / len(mall['p'])
def shift(v):
    if isinstance(v, list) and len(v) == 2 and all(isinstance(c, (int, float)) for c in v): return [round(v[0] - mx, 1), round(v[1] - my, 1)]
    if isinstance(v, list): return [shift(x) for x in v]
    if isinstance(v, dict): return {k: (shift(x) if k == 'p' else x) for k, x in v.items()}
    return v
for k in ('buildings', 'roads', 'rails', 'areas', 'trees', 'pois', 'water', 'entrances', 'stops'): out[k] = shift(out[k])
out['origin'] = [round(LAT0 + my / 110540, 7), round(LON0 + mx / (111320 * math.cos(math.radians(LAT0))), 7)]
Path('map').mkdir(exist_ok=True)
Path('map/osm.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
print({k: len(v) for k, v in out.items() if isinstance(v, list)}, round(Path('map/osm.json').stat().st_size / 1e6, 2), 'MB')
