// Making the video file: frame rate, progress, and the download.
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../shared/ui/Button.jsx';
import { FORMATS } from '../../shared/scene/formats.js';
import { Choice } from '../../shared/ui/Choice.jsx';
import { Icon } from '../../shared/ui/Icon.jsx';
import { Panel } from '../../shared/ui/Panel.jsx';

const FRAME_RATES = [
  { id: 30, label: '30 fps' },
  { id: 60, label: '60 fps' },
];

const fileName = (title, format) =>
  `${(title || 'lumora').replace(/[^\w\s-]/g, '').trim() || 'lumora'} ${format.label.replace(':', 'x')}.mp4`;

export function ExportPanel({ scene, audio, look, format, onFormat, name, disabled }) {
  const [fps, setFps] = useState(30);
  const [job, setJob] = useState(null); // { progress } while running
  const [result, setResult] = useState(null); // { url, name, size }
  const [error, setError] = useState('');
  const abort = useRef(null);

  useEffect(() => () => result && URL.revokeObjectURL(result.url), [result]);

  const start = async () => {
    setError('');
    setResult(null);
    setJob({ progress: 0 });
    abort.current = new AbortController();
    try {
      const { exportVideo } = await import('./exportVideo.js');
      const blob = await exportVideo({
        scene,
        audio,
        look,
        fps,
        signal: abort.current.signal,
        onProgress: (progress) => setJob({ progress }),
      });
      setResult({ url: URL.createObjectURL(blob), name: fileName(name, format), size: blob.size });
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error(e);
        setError(e.name === 'ExportError' ? e.message : 'The video could not be made. Please try again.');
      }
    } finally {
      setJob(null);
    }
  };

  return (
    <Panel
      title="Video"
      summary={
        job
          ? `Making the video… ${Math.round(job.progress * 100)}%`
          : result
            ? `Ready to download · ${result.name}`
            : `${format.label} · ${fps} fps`
      }
    >
      <Choice
        label="Shape"
        options={FORMATS}
        value={format.id}
        onChange={onFormat}
        render={(f) => (
          <>
            {f.label} <span className="text-faint">{f.hint}</span>
          </>
        )}
      />
      <Choice label="Smoothness" options={FRAME_RATES} value={fps} onChange={setFps} />
      <p className="text-sm text-faint">
        MP4 · {format.width} × {format.height} · made on this computer, nothing is uploaded.
      </p>
      {job ? (
        <div className="flex flex-col gap-3" role="status">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Making the video… {Math.round(job.progress * 100)}%</span>
            <Button label="Stop" icon="x" onClick={() => abort.current.abort()} />
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-raised">
            <div className="h-full origin-left bg-accent" style={{ transform: `scaleX(${job.progress})` }} />
          </div>
        </div>
      ) : (
        <Button label="Make the video" icon="film" variant="primary" size="lg" disabled={disabled} onClick={start} />
      )}
      {result && (
        <a
          href={result.url}
          download={result.name}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-accent px-6 font-semibold text-accent hover:bg-accent/10"
        >
          <Icon name="download" />
          Download {result.name} ({(result.size / 1e6).toFixed(1)} MB)
        </a>
      )}
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </Panel>
  );
}
