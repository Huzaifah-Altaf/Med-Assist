import { useState, useEffect, useRef } from 'react'
import './App.css'

const KNOWN_CONDITIONS = ['CKD']
const KNOWN_MEDICATIONS = ['Metformin', 'Ibuprofen', 'Warfarin', 'Aspirin']

function MultiSelectDropdown({ label, options, selected, setSelected }) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleOption = (value) => {
    if (selected.includes(value)) {
      setSelected(selected.filter(s => s !== value))
    } else {
      setSelected([...selected, value])
    }
  }

  const filteredOptions = options.filter(o =>
    o.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div ref={ref} style={{ marginBottom: '15px', position: 'relative' }}>
      <label>{label}:</label><br />
      <div
        onClick={() => setOpen(!open)}
        style={{
          border: '1px solid #555', borderRadius: '4px', padding: '8px',
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}
      >
        <span style={{ color: selected.length ? 'inherit' : '#888' }}>
          {selected.length > 0 ? selected.join(', ') : `Select ${label.toLowerCase()}...`}
        </span>
        <span>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
          background: '#222', border: '1px solid #555', borderRadius: '4px',
          marginTop: '4px', maxHeight: '220px', overflowY: 'auto'
        }}>
          <input
            type="text"
            placeholder="Type to filter..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            autoFocus
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: 'none', borderBottom: '1px solid #555' }}
          />
          {filteredOptions.map(o => (
            <label key={o} style={{ display: 'block', padding: '6px 8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selected.includes(o)}
                onChange={() => toggleOption(o)}
              />{' '}
              {o}
            </label>
          ))}
          {filteredOptions.length === 0 && (
            <p style={{ padding: '8px', color: '#888', margin: 0 }}>No matches</p>
          )}
        </div>
      )}
    </div>
  )
}

function App() {
  const [allSymptoms, setAllSymptoms] = useState([])
  const [symptoms, setSymptoms] = useState([])
  const [conditions, setConditions] = useState([])
  const [medications, setMedications] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('http://127.0.0.1:5000/symptoms')
      .then(res => res.json())
      .then(data => setAllSymptoms(data))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const response = await fetch('http://127.0.0.1:5000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms, conditions, medications })
    })

    const data = await response.json()
    setResult(data)
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>MedAssist</h1>
      <p>Clinical Decision Support System</p>

      <form onSubmit={handleSubmit}>
        <MultiSelectDropdown
          label="Symptoms"
          options={allSymptoms}
          selected={symptoms}
          setSelected={setSymptoms}
        />
        <MultiSelectDropdown
          label="Existing Conditions"
          options={KNOWN_CONDITIONS}
          selected={conditions}
          setSelected={setConditions}
        />
        <MultiSelectDropdown
          label="Current Medications"
          options={KNOWN_MEDICATIONS}
          selected={medications}
          setSelected={setMedications}
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Get Recommendation'}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>Predicted Condition: {result.predicted_condition}</h3>

          {result.safety_warnings && result.safety_warnings.length > 0 && (
            <div style={{ color: 'red' }}>
              <strong>⚠️ Safety Warnings:</strong>
              <ul>
                {result.safety_warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          <p><strong>Explanation:</strong></p>
          <p>{result.explanation}</p>
        </div>
      )}
    </div>
  )
}

export default App