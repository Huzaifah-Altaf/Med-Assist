import { useEffect, useId, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import './App.css'

const API_BASE = 'http://127.0.0.1:5000'

const KNOWN_CONDITIONS = ['CKD', 'Hypertension', 'Diabetes']
const KNOWN_MEDICATIONS = [
  'Metformin',
  'Ibuprofen',
  'Warfarin',
  'Aspirin',
  'Lisinopril',
]

function Icon({ name, size = 20, strokeWidth = 1.8 }) {
  const paths = {
    activity: <path d="M3 12h4l2.2-7 4.2 14 2.1-7H21" />,
    arrow: <path d="M5 12h13m-5-5 5 5-5 5" />,
    chevron: <path d="m6 9 6 6 6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    clipboard: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 14h7M8.5 18h4" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    database: (
      <>
        <ellipse cx="12" cy="5" rx="7" ry="3" />
        <path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7" />
      </>
    ),
    file: (
      <>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v5h5M9 12h6M9 16h6" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    minus: <path d="M5 12h14" />,
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.3" />
        <path d="m16 16 4.2 4.2" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 19 6v5c0 4.5-2.9 8-7 10-4.1-2-7-5.5-7-10V6z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4z" />
        <path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6z" />
      </>
    ),
    moon: <path d="M20.5 15.4A8.5 8.5 0 0 1 8.6 3.5 8.5 8.5 0 1 0 20.5 15.4Z" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
    warning: (
      <>
        <path d="m12 3 9 16H3z" />
        <path d="M12 9v4M12 16h.01" />
      </>
    ),
  }

  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      width={size}
    >
      {paths[name] || paths.info}
    </svg>
  )
}

function valueToText(value) {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(valueToText).filter(Boolean).join(', ')
  if (value && typeof value === 'object') {
    return value.message || value.description || value.text || value.name || ''
  }
  return ''
}

function normalizeGuidelines(value) {
  if (!Array.isArray(value)) return []

  return value
    .map((guideline, index) => {
      const text = typeof guideline === 'string' ? guideline : valueToText(guideline?.text)
      if (!text) return null

      const lines = text.split('\n')
      const hasTitle = lines.length > 1 && lines[0].trim().length > 0

      return {
        id: `${index}-${text.slice(0, 12)}`,
        title: hasTitle ? lines[0].trim() : `Guideline ${index + 1}`,
        text: hasTitle ? lines.slice(1).join('\n').trim() : text,
        source:
          typeof guideline === 'object' && guideline?.source
            ? valueToText(guideline.source)
            : 'Source not provided',
      }
    })
    .filter(Boolean)
}

function normalizeList(value) {
  if (!Array.isArray(value)) return []
  return value.map(valueToText).filter(Boolean)
}

//added later
function formatLabel(value) {
  const text = String(value).replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function MultiSelectDropdown({
  id,
  label,
  helper,
  icon,
  options,
  selected,
  setSelected,
  placeholder,
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const ref = useRef(null)
  const searchRef = useRef(null)
  const listboxId = `${id}-listbox`
  const filteredOptions = options.filter((option) =>
    formatLabel(option).toLowerCase().includes(filter.toLowerCase()),
  )

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const toggleOption = (value) => {
    setSelected(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    )
  }

  const removeOption = (event, value) => {
    event.stopPropagation()
    setSelected(selected.filter((item) => item !== value))
  }

  const openMenu = () => {
    if (disabled) return
    setOpen((current) => !current)
    window.setTimeout(() => searchRef.current?.focus(), 0)
  }

  const handleTriggerKeyDown = (event) => {
    if (disabled) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openMenu()
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      window.setTimeout(() => searchRef.current?.focus(), 0)
    }
  }

  const handleListKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => Math.min(current + 1, filteredOptions.length - 1))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, 0))
    }
    if (event.key === 'Enter' && filteredOptions[activeIndex]) {
      event.preventDefault()
      toggleOption(filteredOptions[activeIndex])
    }
  }

  return (
    <div className="field-group" ref={ref}>
      <div className="field-heading">
        <label htmlFor={`${id}-trigger`}>
          <span className="field-icon"><Icon name={icon} size={17} /></span>
          {label}
        </label>
        {selected.length > 0 && <span className="selection-count">{selected.length} selected</span>}
      </div>
      {helper && <p className="field-helper">{helper}</p>}

      <div className={`multi-select ${open ? 'is-open' : ''}`}>
        <button
          aria-controls={listboxId}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="select-trigger"
          disabled={disabled}
          id={`${id}-trigger`}
          onClick={openMenu}
          onKeyDown={handleTriggerKeyDown}
          type="button"
        >
          <span className={selected.length ? 'select-value' : 'select-placeholder'}>
            {selected.length ? `${selected.length} item${selected.length === 1 ? '' : 's'} selected` : placeholder}
          </span>
          <span className="select-chevron"><Icon name="chevron" size={17} /></span>
        </button>

        {selected.length > 0 && (
          <div className="selected-chips" aria-label={`${label} selected`}>
            {selected.map((value) => (
              <span className="chip" key={value}>
                {formatLabel(value)}
                <button aria-label={`Remove ${formatLabel(value)}`} onClick={(event) => removeOption(event, value)} type="button">
                  <Icon name="close" size={13} />
                </button>
              </span>
            ))}
          </div>
        )}

        {open && (
          <div className="options-panel" id={listboxId} onKeyDown={handleListKeyDown} role="listbox" aria-label={label}>
            <div className="options-search">
              <Icon name="search" size={16} />
              <input
                aria-label={`Search ${label.toLowerCase()}`}
                autoFocus
                onChange={(event) => {
                  setFilter(event.target.value)
                  setActiveIndex(0)
                }}
                placeholder={`Search ${label.toLowerCase()}...`}
                ref={searchRef}
                type="search"
                value={filter}
              />
            </div>
            <div className="option-list">
              {filteredOptions.map((option, index) => {
                const isSelected = selected.includes(option)
                return (
                  <button
                    aria-selected={isSelected}
                    className={`option-row ${isSelected ? 'is-selected' : ''} ${activeIndex === index ? 'is-active' : ''}`}
                    key={option}
                    onClick={() => toggleOption(option)}
                    onMouseEnter={() => setActiveIndex(index)}
                    role="option"
                    type="button"
                  >
                    <span className={`option-check ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <Icon name="check" size={13} strokeWidth={2.5} />}
                    </span>
                    <span>{formatLabel(option)}</span>
                  </button>
                )
              })}
              {!filteredOptions.length && <p className="no-options">No matching options</p>}
            </div>
            <div className="options-hint">Press <kbd>Enter</kbd> to select · <kbd>Esc</kbd> to close</div>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyRecommendation() {
  return (
    <div className="empty-recommendation">
      <div className="empty-orbit">
        <div className="empty-icon"><Icon name="spark" size={28} /></div>
      </div>
      <span className="empty-kicker">Ready when you are</span>
      <h2>Your clinical recommendation will appear here</h2>
      <p>Complete the patient profile to receive a model prediction, safety review, and evidence-backed context.</p>
      <div className="empty-steps">
        <span><b>01</b> Add symptoms</span>
        <span><b>02</b> Add context</span>
        <span><b>03</b> Review insights</span>
      </div>
    </div>
  )
}

function LoadingRecommendation() {
  return (
    <div aria-busy="true" aria-live="polite" className="loading-recommendation">
      <div className="loading-visual" aria-hidden="true">
        <span className="loading-orbit loading-orbit-one" />
        <span className="loading-orbit loading-orbit-two" />
        <span className="loading-orbit loading-orbit-three" />
        <div className="loading-core"><Icon name="spark" size={29} /></div>
      </div>
      <span className="loading-kicker">Building your review</span>
      <h2>Connecting the clinical picture</h2>
      <p>Reviewing symptoms, patient context, safety signals, and evidence-backed guidance.</p>
      <div className="loading-progress" aria-hidden="true"><span /></div>
      <div className="loading-steps" aria-hidden="true">
        <span className="is-active">01 Symptoms</span>
        <span>02 Safety</span>
        <span>03 Evidence</span>
      </div>
    </div>
  )
}

function Guidelines({ guidelines }) {
  return (
    <section className="evidence-section">
      <div className="section-title-row">
        <div>
          <span className="section-eyebrow">Evidence context</span>
          <h3>Related guidelines <span className="count-badge">{guidelines.length}</span></h3>
        </div>
        <Icon name="file" size={21} />
      </div>
      {guidelines.length ? (
        <div className="guideline-list">
          {guidelines.map((guideline) => (
            <details className="guideline-item" key={guideline.id}>
              <summary>
                <span className="guideline-title">{guideline.title}</span>
                <Icon name="chevron" size={16} />
              </summary>
              <div className="guideline-body">
                <p>{guideline.text}</p>
                <span className="source-label"><Icon name="database" size={13} /> {guideline.source}</span>
              </div>
            </details>
          ))}
        </div>
      ) : (
        <p className="empty-section">No related guidelines were returned for this assessment.</p>
      )}
    </section>
  )
}

function App() {
  const titleId = useId()
  const themeToggleRef = useRef(null)
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false)
  const [theme, setTheme] = useState(() => {
    try {
      return window.localStorage.getItem('medassist-theme') === 'dark' ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })
  const [allSymptoms, setAllSymptoms] = useState([])
  const [symptomsLoading, setSymptomsLoading] = useState(true)
  const [symptoms, setSymptoms] = useState([])
  const [conditions, setConditions] = useState([])
  const [medications, setMedications] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.documentElement.style.colorScheme = theme
    try {
      window.localStorage.setItem('medassist-theme', theme)
    } catch {
      // Theme still works for the current session if storage is unavailable.
    }
  }, [theme])

  const handleThemeToggle = () => {
    if (isThemeTransitioning) return

    const nextTheme = theme === 'light' ? 'dark' : 'light'
    const root = document.documentElement
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const startViewTransition = typeof document.startViewTransition === 'function'
      ? document.startViewTransition.bind(document)
      : null

    if (!startViewTransition || prefersReducedMotion || !themeToggleRef.current) {
      setTheme(nextTheme)
      return
    }

    const toggleBounds = themeToggleRef.current.getBoundingClientRect()
    const originX = toggleBounds.left + toggleBounds.width / 2
    const originY = toggleBounds.top + toggleBounds.height / 2
    const radius = Math.max(
      Math.hypot(originX, originY),
      Math.hypot(window.innerWidth - originX, originY),
      Math.hypot(originX, window.innerHeight - originY),
      Math.hypot(window.innerWidth - originX, window.innerHeight - originY),
    )

    // Use viewport percentages for the snapshot's coordinate space. This
    // keeps the origin pinned to the button even when the page is scrolled or
    // the viewport changes between desktop and mobile layouts.
    root.style.setProperty('--theme-transition-x', `${(originX / window.innerWidth) * 100}%`)
    root.style.setProperty('--theme-transition-y', `${(originY / window.innerHeight) * 100}%`)
    root.style.setProperty('--theme-transition-radius', `${radius}px`)
    setIsThemeTransitioning(true)

    try {
      const transition = startViewTransition(() => {
        // React must commit the new theme before the View Transition API takes
        // its second snapshot; otherwise the browser only captures a ripple.
        flushSync(() => setTheme(nextTheme))
      })

      void transition.finished
        .catch(() => {})
        .finally(() => {
          root.style.removeProperty('--theme-transition-x')
          root.style.removeProperty('--theme-transition-y')
          root.style.removeProperty('--theme-transition-radius')
          setIsThemeTransitioning(false)
        })
    } catch {
      root.style.removeProperty('--theme-transition-x')
      root.style.removeProperty('--theme-transition-y')
      root.style.removeProperty('--theme-transition-radius')
      setIsThemeTransitioning(false)
      setTheme(nextTheme)
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    fetch(`${API_BASE}/symptoms`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load symptoms')
        return response.json()
      })
      .then((data) => {
        const rawSymptoms = Array.isArray(data) ? data : data?.symptoms
        if (!Array.isArray(rawSymptoms)) throw new Error('Invalid symptoms response')
        setAllSymptoms(rawSymptoms.filter((item) => typeof item === 'string' && item.trim()))
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          console.error('Symptoms loading error:', requestError)
          setError('Unable to load symptoms. Make sure the Flask backend is running, then retry.')
        }
      })
      .finally(() => setSymptomsLoading(false))

    return () => controller.abort()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms, conditions, medications }),
      })

      if (!response.ok) throw new Error(`Server returned status ${response.status}`)
      const data = await response.json()
      const isValid = data && typeof data === 'object' && !Array.isArray(data)
      if (!isValid || !('predicted_condition' in data || 'explanation' in data || 'safety_warnings' in data)) {
        throw new Error('Invalid prediction response')
      }
      setResult(data)
    } catch (requestError) {
      console.error('Prediction error:', requestError)
      setError('Something went wrong while reviewing this assessment. Check the Flask terminal and try again.')
    } finally {
      setLoading(false)
    }
  }

  const warnings = normalizeList(result?.safety_warnings)
  const graphRelationships = Array.isArray(result?.graph_relationships) ? result.graph_relationships : []
  const guidelines = normalizeGuidelines(result?.relevant_guidelines)
  const explanation = valueToText(result?.explanation) || 'No explanation was returned for this assessment.'
  const predictedCondition = valueToText(result?.predicted_condition) || 'No condition predicted'
  const profileCount = symptoms.length + conditions.length + medications.length

  return (
    <div className={`app-shell ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="MedAssist home">
          <span className="brand-mark"><Icon name="activity" size={23} strokeWidth={2.2} /></span>
          <span className="brand-copy"><strong>MedAssist</strong><small>Clinical intelligence</small></span>
        </a>
        <div className="topbar-meta">
           <span className="system-status"><i /> Workspace ready</span>
           <span className="secure-label"><Icon name="lock" size={14} /> Local mode</span>
          <button
           aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
           className="theme-toggle"
             disabled={isThemeTransitioning}
             onClick={handleThemeToggle}
             ref={themeToggleRef}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            type="button"
          >
            <Icon name={theme === 'light' ? 'moon' : 'sun'} size={15} />
            <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
          </button>
        </div>
      </header>

      <main className="main-content" id="top">
        <div className="intro-row">
          <div className="intro-copy">
            <span className="eyebrow"><span className="eyebrow-line" /> AI-assisted clinical review</span>
            <h1 id={titleId}>Make a clearer<br /><em>clinical decision.</em></h1>
            <p>Bring symptoms, patient context, and medication history together for a focused decision-support review.</p>
          </div>
          <div className="intro-note">
            <div className="note-icon"><Icon name="shield" size={19} /></div>
            <div><strong>Designed for clinical context</strong><span>Review every output with a qualified healthcare professional.</span></div>
          </div>
        </div>

        <div className="workspace-grid">
          <section className="panel patient-panel" aria-labelledby="patient-title">
            <div className="panel-header">
              <div className="panel-title-wrap">
                <span className="panel-number">01</span>
                <div><span className="panel-eyebrow">Patient profile</span><h2 id="patient-title">Assessment inputs</h2></div>
              </div>
              <span className="profile-count">{profileCount} input{profileCount === 1 ? '' : 's'}</span>
            </div>

            <div className="patient-form-wrap">
              <div className="form-intro"><Icon name="clipboard" size={18} /><span>Select what is relevant to this patient. Multiple selections are supported.</span></div>
              <form onSubmit={handleSubmit}>
                <MultiSelectDropdown
                  disabled={symptomsLoading}
                  helper={symptomsLoading ? 'Connecting to symptom library…' : 'Choose all symptoms currently reported'}
                  icon="activity"
                  id="symptoms"
                  label="Reported symptoms"
                  options={allSymptoms}
                  placeholder={symptomsLoading ? 'Loading symptoms…' : 'Search and select symptoms'}
                  selected={symptoms}
                  setSelected={setSymptoms}
                />
                <MultiSelectDropdown
                  helper="Known diagnoses that may influence the review"
                  icon="plus"
                  id="conditions"
                  label="Existing conditions"
                  options={KNOWN_CONDITIONS}
                  placeholder="Select existing conditions"
                  selected={conditions}
                  setSelected={setConditions}
                />
                <MultiSelectDropdown
                  helper="Current medicines and therapies"
                  icon="database"
                  id="medications"
                  label="Current medications"
                  options={KNOWN_MEDICATIONS}
                  placeholder="Select current medications"
                  selected={medications}
                  setSelected={setMedications}
                />

                <div className="form-footer">
                  <p className="form-disclaimer"><Icon name="info" size={14} /> No patient-identifying information is collected.</p>
                  <button className="primary-button" disabled={loading || symptomsLoading} type="submit">
                    {loading ? <><span className="button-spinner" /> Reviewing information…</> : <>Run clinical review <Icon name="arrow" size={17} /></>}
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className={`panel recommendation-panel ${result ? 'has-result' : ''}`} aria-live="polite" aria-labelledby="recommendation-title">
            <div className="panel-header recommendation-header">
              <div className="panel-title-wrap">
                <span className="panel-number">02</span>
                <div><span className="panel-eyebrow">Decision support</span><h2 id="recommendation-title">Clinical recommendation</h2></div>
              </div>
              {loading ? <span className="result-status is-loading"><i /><span>Reviewing</span></span> : result && <span className="result-status"><i /><span>Review complete</span></span>}
            </div>

            {error && (
              <div className="error-banner" role="alert"><Icon name="warning" size={18} /><span>{error}</span><button onClick={() => window.location.reload()} type="button">Retry</button></div>
            )}

            {loading ? <LoadingRecommendation /> : !result ? <EmptyRecommendation /> : (
              <div className="recommendation-content">
                <div className="prediction-block">
                  <div className="prediction-label"><span className="prediction-dot" /> Model prediction</div>
                  <h3>{predictedCondition}</h3>
                  <p>Based on the symptoms and patient context provided.</p>
                </div>

                {warnings.length ? (
                  <div className="warning-card" role="alert">
                    <div className="alert-heading"><span className="alert-icon"><Icon name="warning" size={17} /></span><div><strong>Safety review requires attention</strong><span>{warnings.length} potential concern{warnings.length === 1 ? '' : 's'} identified</span></div></div>
                    <ul>{warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}</ul>
                  </div>
                ) : (
                  <div className="clear-card"><span className="clear-icon"><Icon name="check" size={16} /></span><div><strong>No rule-based safety warnings returned</strong><span>Continue with professional clinical judgment.</span></div></div>
                )}

                <div className="explanation-card">
                  <div className="section-title-row"><div><span className="section-eyebrow">AI summary</span><h3>Clinical interpretation</h3></div><span className="ai-badge"><Icon name="spark" size={13} /> Gemini</span></div>
                  <p>{explanation}</p>
                </div>

                {graphRelationships.length > 0 && (
                  <div className="interaction-card">
                    <div className="section-title-row"><div><span className="section-eyebrow">Knowledge graph</span><h3>Related interactions <span className="count-badge">{graphRelationships.length}</span></h3></div><Icon name="database" size={20} /></div>
                    <div className="interaction-list">
                      {graphRelationships.map((relationship, index) => (
                        <div className="interaction-row" key={index}><span className="interaction-type">{valueToText(relationship?.type) || 'Interaction'}</span><span>{valueToText(relationship?.between) || 'Patient medication relationship'}</span><small>{valueToText(relationship?.description) || 'Relationship recorded in Neo4j'}</small></div>
                      ))}
                    </div>
                  </div>
                )}

                <Guidelines guidelines={guidelines} />
                <div className="result-footnote"><Icon name="info" size={14} /> This output is decision-support information, not a diagnosis or treatment plan.</div>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="app-footer"><span>MedAssist <b>•</b> Clinical Decision Support System</span><span>For professional review only</span></footer>
    </div>
  )
}


export default App
