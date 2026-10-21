import { useEffect, useState } from 'react';
import { CloudRain, ExternalLink, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { usgsUrl, normaliseUsgs } from '../providers/usgs';
import { openMeteoUrl, normaliseOpenMeteo } from '../providers/openMeteo';
import { REGIONS, regionById } from '../data/regions';
import { PakMap, Marker } from '../components/PakMap';
import { Card, ModeBadge, SectionTitle } from '../components/primitives';

export default function IntelligenceLive() {
  const [quakes, setQuakes] = useState({ data: [], status: 'cached', checkedAt: new Date().toISOString() });
  const [forecast, setForecast] = useState({ data: [], status: 'cached', checkedAt: new Date().toISOString() });
  const [loading, setLoading] = useState(false);

  const fetchProviders = async () => {
    setLoading(true);

    // 1. Fetch USGS
    try {
      const res = await fetch(usgsUrl(), { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const json = await res.json();
        const norm = normaliseUsgs(json);
        setQuakes({ data: norm, status: 'live', checkedAt: new Date().toISOString() });
      } else {
        setQuakes((prev) => ({ ...prev, status: 'unavailable' }));
      }
    } catch {
      // Offline fallback: provide historical sample benchmark
      setQuakes({
        data: [
          { id: 'usgs-1', magnitude: 4.8, depthKm: 15, place: '22 km E of Quetta (Sample)', time: Date.now() - 3600000 * 14, coord: [67.2, 30.2], url: 'https://earthquake.usgs.gov' },
          { id: 'usgs-2', magnitude: 4.5, depthKm: 32, place: '45 km N of Khuzdar (Sample)', time: Date.now() - 3600000 * 48, coord: [66.6, 28.2], url: 'https://earthquake.usgs.gov' },
        ],
        status: 'sample',
        checkedAt: new Date().toISOString(),
      });
    }

    // 2. Fetch Open-Meteo
    try {
      const res = await fetch(openMeteoUrl(), { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const json = await res.json();
        const norm = normaliseOpenMeteo(json);
        setForecast({ data: norm, status: 'live', checkedAt: new Date().toISOString() });
      } else {
        setForecast((prev) => ({ ...prev, status: 'unavailable' }));
      }
    } catch {
      // Offline fallback: sample benchmark data
      setForecast({
        data: REGIONS.map((r, i) => ({
          regionId: r.id,
          rain3dMm: [42, 68, 15, 4, 85, 20, 12, 5, 18, 62, 74, 30][i] || 25,
          retrievedAt: new Date().toISOString(),
        })),
        status: 'sample',
        checkedAt: new Date().toISOString(),
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <SectionTitle
        eyebrow="Real-Time Data Feeds"
        title="Live Seismic & Meteorological Integration"
      >
        Integration with open public APIs: USGS Global Earthquake Hazards Program and Open-Meteo global meteorological forecasts. When offline or unreachable, feeds transparently indicate cached mode or unavailable state.
      </SectionTitle>

      {/* Refresh Control */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={fetchProviders}
          disabled={loading}
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Polling Providers...' : 'Check Live Providers Now'}
        </button>
      </div>

      {/* Provider Health Summary Cards */}
      <div className="intel-grid intel-grid--2">
        <Card title="USGS Global Seismic Feed" mode={quakes.status}>
          <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Status:</span>
              <strong style={{ color: quakes.status === 'live' ? 'var(--ok)' : 'var(--warn)' }}>
                {quakes.status === 'live' ? 'Connected (Live HTTP 200)' : 'Sample Benchmark (Offline Fallback)'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Data Provider:</span>
              <span>USGS Earthquake Hazards Program (FDSN)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Spatial Bounding Box:</span>
              <span style={{ fontFamily: 'monospace' }}>23.5°N - 37.2°N, 60.5°E - 77.5°E</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Threshold:</span>
              <span>Magnitude ≥ 4.0 within past 30 days</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Licensing:</span>
              <span>Public Domain (USGS Data Policy)</span>
            </div>
          </div>
        </Card>

        <Card title="Open-Meteo Weather Forecast" mode={forecast.status}>
          <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Status:</span>
              <strong style={{ color: forecast.status === 'live' ? 'var(--ok)' : 'var(--warn)' }}>
                {forecast.status === 'live' ? 'Connected (Live HTTP 200)' : 'Sample Benchmark (Offline Fallback)'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Data Provider:</span>
              <span>Open-Meteo Numerical Weather Models</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Metrics Tracked:</span>
              <span>Accumulated 3-day precipitation (mm)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>District Centroids:</span>
              <span>12 Monitored Pakistan Districts</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Licensing:</span>
              <span>Open Database License (ODbL) / CC-BY 4.0</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Feeds Inspector */}
      <div className="intel-grid intel-grid--2">
        {/* Earthquakes Map & Table */}
        <Card title="Detected Earthquakes (M4.0+)" mode={quakes.status}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ height: 260, position: 'relative' }}>
              <PakMap
                view={{ center: [67.0, 30.0], zoom: 5.4 }}
                ariaLabel="Live Earthquakes Map"
                screenOverlay={
                  <g>
                    {quakes.data.map((q) => (
                      <Marker
                        key={q.id}
                        at={q.coord}
                        r={4 + q.magnitude}
                        color="#dc2626"
                        pulse={q.magnitude >= 4.7}
                        label={`M${q.magnitude.toFixed(1)} - ${q.place}`}
                        showLabel
                      />
                    ))}
                  </g>
                }
              />
            </div>

            <div style={{ overflowX: 'auto', maxHeight: 220, overflowY: 'auto' }}>
              <table className="intel-table">
                <thead>
                  <tr>
                    <th>Magnitude</th>
                    <th>Depth</th>
                    <th>Location / Coordinates</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {quakes.data.map((q) => (
                    <tr key={q.id}>
                      <td style={{ fontWeight: 700, color: 'var(--critical)' }}>M{q.magnitude.toFixed(1)}</td>
                      <td>{q.depthKm} km</td>
                      <td>{q.place}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        {new Date(q.time).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Rainfall Watch Table */}
        <Card
          title="Monitored Districts 3-Day Precipitation"
          subtitle="Model forecast (not official PMD warning)"
          mode={forecast.status}
        >
          <div style={{ overflowX: 'auto', maxHeight: 520, overflowY: 'auto' }}>
            <table className="intel-table">
              <thead>
                <tr>
                  <th>District</th>
                  <th>Province</th>
                  <th>3-Day Rain</th>
                  <th>Screening Impact</th>
                </tr>
              </thead>
              <tbody>
                {forecast.data.map((f) => {
                  const reg = regionById(f.regionId);
                  const isHighRain = f.rain3dMm >= 50;

                  return (
                    <tr key={f.regionId}>
                      <td><strong>{reg?.name || f.regionId}</strong></td>
                      <td style={{ color: 'var(--muted)' }}>{reg?.province || 'Pakistan'}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: isHighRain ? 'var(--critical)' : 'var(--text)' }}>
                        {f.rain3dMm} mm
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.15rem 0.4rem',
                            borderRadius: 4,
                            background: isHighRain ? 'var(--critical-soft)' : 'var(--surface-2)',
                            color: isHighRain ? 'var(--critical)' : 'var(--text-soft)',
                            fontWeight: 600,
                          }}
                        >
                          {isHighRain ? 'Surge Risk Factor Elevated' : 'Nominal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
