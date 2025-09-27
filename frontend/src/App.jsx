import { useEffect, useState } from 'react'
import axios from 'axios'

const defaultForm = {
  name: 'Jordan',
  age: 30,
  fitness_level: 'Intermediate',
  goal: 'Endurance',
  available_equipment: 'Dumbbells, Resistance bands',
  preferences: '4 sessions per week, include mobility work'
}

export default function App() {
  const [form, setForm] = useState(defaultForm)
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiStatus, setApiStatus] = useState('checking...')

  useEffect(() => {
    axios
      .get('/health')
      .then(() => setApiStatus('Online'))
      .catch(() => setApiStatus('Offline'))
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setPlan(null)

    try {
      const payload = {
        ...form,
        available_equipment: form.available_equipment
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      }

      const { data } = await axios.post('/api/workouts', payload)
      setPlan(data)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to generate plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <header>
        <h1>AI Fitness Coach</h1>
        <p className={`status ${apiStatus === 'Online' ? 'online' : 'offline'}`}>
          API: {apiStatus}
        </p>
      </header>

      <section className="panel">
        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="field">
            <label htmlFor="age">Age</label>
            <input
              id="age"
              name="age"
              type="number"
              min="10"
              max="100"
              value={form.age}
              onChange={handleChange}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="fitness_level">Fitness Level</label>
            <input
              id="fitness_level"
              name="fitness_level"
              value={form.fitness_level}
              onChange={handleChange}
              placeholder="Beginner / Intermediate / Advanced"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="goal">Primary Goal</label>
            <input id="goal" name="goal" value={form.goal} onChange={handleChange} required />
          </div>
          <div className="field">
            <label htmlFor="available_equipment">Available Equipment</label>
            <input
              id="available_equipment"
              name="available_equipment"
              value={form.available_equipment}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="preferences">Preferences</label>
            <textarea
              id="preferences"
              name="preferences"
              rows="3"
              value={form.preferences}
              onChange={handleChange}
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Workout Plan'}
          </button>
        </form>
      </section>

      {error && <p className="error">{error}</p>}

      {plan && (
        <section className="panel">
          <h2>Plan Summary</h2>
          <p>{plan.summary}</p>

          <h3>Schedule</h3>
          <div className="schedule">
            {plan.schedule.map((day) => (
              <article key={day.day} className="day">
                <h4>
                  {day.day}: {day.focus}
                </h4>
                <ul>
                  {day.exercises.map((exercise, index) => (
                    <li key={index}>{exercise}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <h3>Tips</h3>
          <ul>
            {plan.tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
