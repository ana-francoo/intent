import React from 'react'

interface NewPageProps {
  onBack: () => void
  onNext: () => void
}

export default function NewPage({ onBack, onNext }: NewPageProps) {
  return (
    <div>
      <h1>New Page</h1>
      <p>This is the new page between Home and How It Works.</p>
      
      <div className="card">
        <button type="button" onClick={onBack}>
          Back
        </button>
        <button type="button" onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  )
} 