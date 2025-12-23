'use client';

import { useState } from 'react';

export default function TestInputPage() {
  const [value, setValue] = useState('');

  return (
    <div style={{ padding: '50px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Input Test Page</h1>
      <p>This is a simple test to check if inputs work</p>
      
      <div style={{ marginTop: '20px' }}>
        <label htmlFor="test-input" style={{ display: 'block', marginBottom: '10px' }}>
          Test Input:
        </label>
        <input
          id="test-input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type something here..."
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '2px solid #ccc',
            borderRadius: '4px',
          }}
        />
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
        <strong>Value:</strong> {value || '(empty)'}
      </div>

      <div style={{ marginTop: '20px' }}>
        <p>Length: {value.length} characters</p>
        <p>Can you see what you type above?</p>
      </div>
    </div>
  );
}
