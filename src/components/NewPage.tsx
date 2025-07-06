import React, { useState } from 'react'
import { isIntentionMatchingAvailable } from '../utils/intentionMatcher'
import { validateConfig, CONFIG } from '../utils/config'

interface TestResult {
  matches: boolean
  confidence: number
  reasoning: string
  loading: boolean
  error?: string
}

export default function NewPage() {
  const [intention, setIntention] = useState('')
  const [scrapedContent, setScrapedContent] = useState('')
  const [selectedModel, setSelectedModel] = useState('openai/gpt-4o')
  const [result, setResult] = useState<TestResult | null>(null)
  const [isAIAvailable, setIsAIAvailable] = useState(false)

  // Available models for testing
  const availableModels = [
    { value: 'openai/gpt-4o', label: 'GPT-4o (OpenAI)' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (Anthropic)' },
    { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku (Anthropic) - Fastest' },
    { value: 'mistralai/mistral-7b-instruct', label: 'Mistral 7B (Free tier)' },
    { value: 'google/gemini-pro', label: 'Gemini Pro (Google)' }
  ]

  // Check if AI features are available on component mount
  React.useEffect(() => {
    const checkAIAvailability = () => {
      const available = isIntentionMatchingAvailable()
      setIsAIAvailable(available)
      
      if (!available) {
        const validation = validateConfig()
        console.log('Configuration validation:', validation)
      }
    }
    
    checkAIAvailability()
  }, [])

  const handleTestIntentionMatch = async () => {
    if (!intention.trim() || !scrapedContent.trim()) {
      alert('Please enter both intention and scraped content')
      return
    }

    setResult({ matches: false, confidence: 0, reasoning: '', loading: true })

    try {
      // Debug logging
      console.log('🔧 Debug Info:')
      console.log('API Key configured:', !!CONFIG.OPENROUTER.API_KEY)
      console.log('API Key length:', CONFIG.OPENROUTER.API_KEY?.length || 0)
      console.log('API Key starts with:', CONFIG.OPENROUTER.API_KEY?.substring(0, 10) + '...')
      console.log('Model:', CONFIG.OPENROUTER.DEFAULT_MODEL)
      console.log('Site URL:', CONFIG.OPENROUTER.SITE_URL)
      console.log('Site Name:', CONFIG.OPENROUTER.SITE_NAME)

      // Direct API call to OpenRouter for testing
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.OPENROUTER.API_KEY}`,
          'HTTP-Referer': CONFIG.OPENROUTER.SITE_URL,
          'X-Title': CONFIG.OPENROUTER.SITE_NAME,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant that determines whether a piece of online content is relevant to a user\'s intention. Your job is not to match keywords exactly, but to understand the meaning and concepts behind the intention and content. Focus on **semantic relevance**.'
            },
            {
              role: 'user',
              content: `Analyze whether the **content meaningfully helps or relates to the user's intention**, even if it doesn't use the same words.

Return:
- \`Match: Yes\` or \`No\`
- \`Confidence: [0.0–1.0]\`
- \`Reason: [brief explanation]\`

Examples:

---
**Intention**: I want to learn about influencer marketing for my Chrome extension.  
**Content**: "HOW I MADE $$$ IN 1 MONTH WITH MY CHROME EXTENSION – Building an Audience Fast"  
**Match**: Yes  
**Confidence**: 0.82  
**Reason**: The content discusses audience building and monetization for a Chrome extension, which is closely related to influencer marketing strategies even if not stated explicitly.

---
**Intention**: I want to learn about electric eels.  
**Content**: "Rob Kardashian gets into fight at party"  
**Match**: No  
**Confidence**: 0.01  
**Reason**: The content is about celebrity drama and has no connection to electric eels.

---

Now evaluate:

**Intention**: ${intention}  
**Content**: ${scrapedContent}`
            }
          ],
          max_tokens: CONFIG.OPENROUTER.MAX_TOKENS,
          temperature: CONFIG.OPENROUTER.TEMPERATURE,
        }),
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Full error response:', errorText)
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      const aiResponse = data.choices[0]?.message?.content
      
      if (!aiResponse) {
        throw new Error('No response from AI model')
      }

      // Debug: Log the raw AI response
      console.log('🤖 Raw AI Response:', aiResponse)

      // Parse the AI response
      let confidence = 0.5
      let reasoning = 'Unable to parse AI response'
      let matches = false
      
      try {
        // Parse the new format: Match: Yes/No, Confidence: X.X, Reason: ...
        const matchMatch = aiResponse.match(/Match:\s*(Yes|No)/i)
        const confidenceMatch = aiResponse.match(/Confidence:\s*([0-9]*\.?[0-9]+)/i)
        const reasonMatch = aiResponse.match(/Reason:\s*(.+?)(?=\n|$)/i)
        
        console.log('🔍 Parsing Debug:')
        console.log('Match regex result:', matchMatch)
        console.log('Confidence regex result:', confidenceMatch)
        console.log('Reason regex result:', reasonMatch)
        
        if (matchMatch) {
          matches = matchMatch[1].toLowerCase() === 'yes'
          console.log('✅ Parsed match result:', matches)
        } else {
          // Fallback: look for "Yes" or "No" in the response
          const hasYes = aiResponse.toLowerCase().includes('yes')
          const hasNo = aiResponse.toLowerCase().includes('no')
          console.log('🔍 Fallback parsing - hasYes:', hasYes, 'hasNo:', hasNo)
          
          if (hasYes && !hasNo) {
            matches = true
            console.log('✅ Fallback: Found "Yes" without "No"')
          } else if (hasNo && !hasYes) {
            matches = false
            console.log('❌ Fallback: Found "No" without "Yes"')
          } else if (hasYes && hasNo) {
            // If both are present, check which comes first or look for context
            const yesIndex = aiResponse.toLowerCase().indexOf('yes')
            const noIndex = aiResponse.toLowerCase().indexOf('no')
            matches = yesIndex < noIndex
            console.log('🤔 Both Yes/No found - using position:', matches ? 'Yes first' : 'No first')
          }
        }
        
        if (confidenceMatch) {
          confidence = Math.max(0, Math.min(1, parseFloat(confidenceMatch[1])))
          console.log('📊 Parsed confidence:', confidence)
        }
        
        if (reasonMatch) {
          reasoning = reasonMatch[1].trim()
          console.log('💭 Parsed reasoning:', reasoning)
        } else {
          // Fallback: try to extract reasoning from the rest of the response
          const lines = aiResponse.split('\n')
          const reasonLine = lines.find((line: string) => line.toLowerCase().includes('reason'))
          if (reasonLine) {
            reasoning = reasonLine.replace(/reason:\s*/i, '').trim()
          } else {
            reasoning = 'No reasoning provided'
          }
        }
        
        // If we couldn't parse the new format, try the old JSON format as fallback
        if (!matchMatch && !confidenceMatch) {
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            confidence = Math.max(0, Math.min(1, parsed.confidence || 0))
            reasoning = parsed.reasoning || parsed.reason || 'No reasoning provided'
            matches = confidence >= CONFIG.INTENTION_MATCHING.CONFIDENCE_THRESHOLD
          }
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError)
        reasoning = 'Unable to parse AI response'
      }

      console.log('🎯 Final parsed result:', { matches, confidence, reasoning })

      // Use the parsed match result instead of calculating from confidence
      const finalMatches = matches
      
      setResult({
        matches: finalMatches,
        confidence,
        reasoning,
        loading: false
      })

    } catch (error) {
      console.error('Error testing intention match:', error)
      setResult({
        matches: false,
        confidence: 0,
        reasoning: '',
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 Intention Matching Test</h1>
      <p>Test the AI-powered intention matching utility with custom inputs.</p>
      
      {/* AI Availability Status */}
      <div style={{ 
        padding: '10px', 
        marginBottom: '20px', 
        borderRadius: '8px',
        backgroundColor: isAIAvailable ? '#d4edda' : '#f8d7da',
        color: isAIAvailable ? '#155724' : '#721c24',
        border: `1px solid ${isAIAvailable ? '#c3e6cb' : '#f5c6cb'}`
      }}>
        <strong>AI Status:</strong> {isAIAvailable ? '✅ Available' : '❌ Not Available'}
        {!isAIAvailable && (
          <div style={{ marginTop: '5px', fontSize: '14px' }}>
            Please check your OpenRouter API key configuration in .env.local
          </div>
        )}
      </div>

      {/* Test Inputs */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            User Intention:
          </label>
          <textarea
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="Enter the user's intention (e.g., 'I want to learn about React hooks')"
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Scraped Content:
          </label>
          <textarea
            value={scrapedContent}
            onChange={(e) => setScrapedContent(e.target.value)}
            placeholder="Enter the scraped webpage content (e.g., 'React Hooks are functions that let you use state and other React features in functional components...')"
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            AI Model:
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '14px'
            }}
          >
            {availableModels.map(model => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
          <small style={{ color: '#666', fontSize: '12px' }}>
            Try different models if you hit rate limits. Claude 3 Haiku is fastest, Mistral 7B is free tier.
          </small>
        </div>

        <button
          onClick={handleTestIntentionMatch}
          disabled={!isAIAvailable || result?.loading}
          style={{
            padding: '10px 20px',
            backgroundColor: isAIAvailable ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isAIAvailable ? 'pointer' : 'not-allowed',
            fontSize: '16px'
          }}
        >
          {result?.loading ? 'Analyzing...' : 'Test Intention Match'}
        </button>
      </div>

      {/* Results Display */}
      {result && (
        <div style={{ 
          padding: '15px', 
          borderRadius: '8px',
          backgroundColor: result.error ? '#f8d7da' : (result.matches ? '#d4edda' : '#fff3cd'),
          border: `1px solid ${result.error ? '#f5c6cb' : (result.matches ? '#c3e6cb' : '#ffeaa7')}`,
          color: result.error ? '#721c24' : (result.matches ? '#155724' : '#856404')
        }}>
          <h3>Analysis Results:</h3>
          
          {result.error ? (
            <div>
              <strong>❌ Error:</strong> {result.error}
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Match Result:</strong> {result.matches ? '✅ Yes' : '❌ No'}
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <strong>Confidence Score:</strong> {(result.confidence * 100).toFixed(1)}%
                <div style={{ 
                  width: '100%', 
                  height: '20px', 
                  backgroundColor: '#e9ecef', 
                  borderRadius: '10px', 
                  overflow: 'hidden',
                  marginTop: '5px'
                }}>
                  <div style={{
                    width: `${result.confidence * 100}%`,
                    height: '100%',
                    backgroundColor: result.confidence > 0.7 ? '#28a745' : result.confidence > 0.4 ? '#ffc107' : '#dc3545',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
              
              <div>
                <strong>AI Reasoning:</strong>
                <div style={{ 
                  marginTop: '5px', 
                  padding: '10px', 
                  backgroundColor: 'rgba(0,0,0,0.05)', 
                  borderRadius: '4px',
                  fontSize: '14px',
                  lineHeight: '1.4'
                }}>
                  {result.reasoning}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Example Data */}
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h4>💡 Example Test Data:</h4>
        <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
          <p><strong>Intention:</strong> "I want to learn about influencer marketing for my Chrome extension"</p>
          <p><strong>Content:</strong> "HOW I MADE $$$ IN 1 MONTH WITH MY CHROME EXTENSION – Building an Audience Fast"</p>
          <p><em>Expected Result: TRUE (high confidence) - Content discusses audience building and monetization for Chrome extensions</em></p>
          
          <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #dee2e6' }} />
          
          <p><strong>Intention:</strong> "I want to learn about electric eels"</p>
          <p><strong>Content:</strong> "Rob Kardashian gets into fight at party"</p>
          <p><em>Expected Result: FALSE (low confidence) - Content is about celebrity drama, unrelated to electric eels</em></p>
        </div>
      </div>
    </div>
  );
}
