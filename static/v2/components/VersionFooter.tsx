import { useState } from "react";
import { APP_COMMIT, APP_VERSION, CHANGELOG } from "../../changelog";

export function VersionFooter() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <footer className="version-footer">
        <span>
          Versió <strong>{APP_VERSION}</strong> · <code>{APP_COMMIT}</code>
        </span>
        <button type="button" className="version-changelog-link" onClick={() => setOpen(true)}>
          Novetats
        </button>
      </footer>
      {open && (
        <div className="changelog-overlay" role="dialog" aria-modal="true" aria-label="Historial de millores">
          <div className="changelog-panel">
            <header>
              <h2>Historial de millores</h2>
              <button type="button" className="changelog-close" onClick={() => setOpen(false)} aria-label="Tancar">
                ×
              </button>
            </header>
            <div className="changelog-list">
              {CHANGELOG.map((entry) => (
                <article className="changelog-entry" key={entry.version}>
                  <header>
                    <strong>v{entry.version}</strong>
                    <span>{entry.date}</span>
                  </header>
                  <h3>{entry.title}</h3>
                  <ul>
                    {entry.changes.map((change) => (
                      <li key={change}>{change}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
