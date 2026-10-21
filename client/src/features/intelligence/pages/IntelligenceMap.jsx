import { useMemo, useState } from 'react';
import { Layers, MapPin, ZoomIn } from 'lucide-react';
import { HISTORICAL_EVENTS } from '../data/historical';
import { REGIONS, regionById } from '../data/regions';
import { assessAll } from '../risk/engine';
import { ROAD_GRAPH_META } from '../geo/data';
import { PakMap, Marker } from '../components/PakMap';
import { Card, ModeBadge, SectionTitle, Toggle } from '../components/primitives';

export default function IntelligenceMap() {
  const [layers, setLayers] = useState({
    provinces: true,
    rivers: true,
    roads: true,
    risk: true,
    history: true,
    quakes: true,
  });
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [featureInfo, setFeatureInfo] = useState(null);

  const riskList = useMemo(() => assessAll('flood', {}), []);

  const handleSelectRegion = (id) => {
    setSelectedRegionId(id);
    const r = regionById(id);
    if (r) {
      setFeatureInfo({
        title: `${r.name} (${r.province})`,
        lines: [
          `Type: District centroid`,
          `Historical disaster exposure: ${r.historicalEvents.length} major events documented`,
          `Coordinates: ${r.coord[1].toFixed(2)}°N, ${r.coord[0].toFixed(2)}°E`,
          `Waterway proximity: ${r.majorRivers.join(', ') || 'None'}`,
        ],
        mode: 'historical',
      });
    }
  };

  const focusRegion = regionById(selectedRegionId);
  const mapView = focusRegion
    ? { center: focusRegion.coord, zoom: 7.0 }
    : { center: [69.6, 30.2], zoom: 5.2 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <SectionTitle
        eyebrow="Geospatial Vector Viewer"
        title="Interactive Maps & Geospatial Layers"
      >
        Inspect vector layers of Pakistan bundled for complete offline capability: Natural Earth 1:10m administrative boundaries, hydrological river corridors, and the 4,251-node routable road network.
      </SectionTitle>

      <div className="intel-grid intel-grid--split">
        {/* Layer Controls Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card title="Toggle Vector Layers" subtitle="Offline bundled geometries">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Toggle
                  label="Administrative Boundaries"
                  description="Provinces, territories, and international border"
                  checked={layers.provinces}
                  onChange={(v) => setLayers((prev) => ({ ...prev, provinces: v }))}
                />
                <ModeBadge mode="historical" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Toggle
                  label="Hydrological Rivers"
                  description="Indus, Jhelum, Chenab, Ravi, Sutlej, Kabul"
                  checked={layers.rivers}
                  onChange={(v) => setLayers((prev) => ({ ...prev, rivers: v }))}
                />
                <ModeBadge mode="historical" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Toggle
                  label="Road Network Graph"
                  description="4,251 routable nodes and 4,307 edges"
                  checked={layers.roads}
                  onChange={(v) => setLayers((prev) => ({ ...prev, roads: v }))}
                />
                <ModeBadge mode="historical" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Toggle
                  label="Regional Risk Indicators"
                  description="Relative multi-hazard screening index"
                  checked={layers.risk}
                  onChange={(v) => setLayers((prev) => ({ ...prev, risk: v }))}
                />
                <ModeBadge mode="estimated" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Toggle
                  label="Historical Disasters"
                  description="2010 Indus Flood, 2005 Kashmir Earthquake, etc."
                  checked={layers.history}
                  onChange={(v) => setLayers((prev) => ({ ...prev, history: v }))}
                />
                <ModeBadge mode="historical" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Toggle
                  label="Seismic Event Monitor"
                  description="USGS earthquake monitoring in Pakistan bounding box"
                  checked={layers.quakes}
                  onChange={(v) => setLayers((prev) => ({ ...prev, quakes: v }))}
                />
                <ModeBadge mode="simulated" />
              </div>
            </div>
          </Card>

          {/* Quick Zoom District Selector */}
          <Card title="Quick Zoom to District">
            <select
              value={selectedRegionId}
              onChange={(e) => handleSelectRegion(e.target.value)}
              style={{ width: '100%', padding: '0.45rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
            >
              <option value="">All Pakistan (National View)</option>
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.province})
                </option>
              ))}
            </select>
          </Card>

          {/* Feature Info Card */}
          {featureInfo && (
            <Card
              title={featureInfo.title}
              mode={featureInfo.mode}
              actions={
                <button
                  type="button"
                  onClick={() => setFeatureInfo(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  Close
                </button>
              }
            >
              <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {featureInfo.lines.map((l, idx) => (
                  <li key={idx}>{l}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Map Viewport Column */}
        <div style={{ height: 620, position: 'relative' }}>
          <PakMap
            view={mapView}
            layers={{ provinces: layers.provinces, rivers: layers.rivers, roads: layers.roads, labels: true }}
            ariaLabel="Comprehensive Pakistan Geospatial Map"
            screenOverlay={
              <g>
                {/* Historical Events */}
                {layers.history &&
                  HISTORICAL_EVENTS.map((e) => (
                    <Marker
                      key={e.id}
                      at={e.coord}
                      r={6}
                      shape="diamond"
                      color="#0284c7"
                      label={e.title}
                      showLabel
                      onSelect={() =>
                        setFeatureInfo({
                          title: e.title,
                          lines: [
                            `Date: ${e.date}`,
                            `Impact: ${e.impact}`,
                            `Affected Area: ${e.location}`,
                            `NDMA Historical Reference Archive`,
                          ],
                          mode: 'historical',
                        })
                      }
                    />
                  ))}

                {/* Quakes */}
                {layers.quakes && (
                  <Marker
                    at={[67.0, 30.2]}
                    r={9}
                    shape="circle"
                    color="#dc2626"
                    pulse
                    label="M5.1 — Quetta (Simulated Benchmark)"
                    showLabel
                    onSelect={() =>
                      setFeatureInfo({
                        title: 'Seismic Event: M5.1 Quetta (Simulated)',
                        lines: [
                          'Magnitude: 5.1',
                          'Depth: 10 km',
                          'Source: USGS Earthquake Hazards Program Benchmark',
                          'Region: 24 km NW of Quetta, Balochistan',
                        ],
                        mode: 'simulated',
                      })
                    }
                  />
                )}

                {/* Risk Indicators */}
                {layers.risk &&
                  riskList.map((a) => {
                    const r = regionById(a.regionId);
                    if (!r) return null;
                    const isSelected = a.regionId === selectedRegionId;
                    return (
                      <Marker
                        key={a.regionId}
                        at={r.coord}
                        r={isSelected ? 9 : 5 + a.riskScore / 18}
                        color={a.riskBand === 'critical' ? '#b91c1c' : a.riskBand === 'high' ? '#ea580c' : '#0b5cab'}
                        selected={isSelected}
                        label={`${r.name}: ${a.riskBand}`}
                        onSelect={() => handleSelectRegion(a.regionId)}
                      />
                    );
                  })}
              </g>
            }
          />
        </div>
      </div>
    </div>
  );
}
