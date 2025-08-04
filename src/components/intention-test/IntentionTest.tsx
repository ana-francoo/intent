import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function IntentionTest() {
  const [intentionText, setIntentionText] = useState('');
  const [pageContent, setPageContent] = useState('');
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; reason: string } | null>(null);
  const [matchResult, setMatchResult] = useState<{ match: boolean } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  const testIntentionValidation = async () => {
    if (!intentionText.trim()) {
      alert('Please enter an intention to test');
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const { validateIntention } = await import('../../utils/intentionMatcher');
      const [isValid, reason] = await validateIntention(intentionText);
      
      setValidationResult({
        isValid,
        reason: reason || (isValid ? 'Valid intention' : 'Invalid intention')
      });
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({
        isValid: false,
        reason: 'Error occurred during validation'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const testIntentionMatching = async () => {
    if (!intentionText.trim() || !pageContent.trim()) {
      alert('Please enter both intention and page content to test');
      return;
    }

    setIsMatching(true);
    setMatchResult(null);

          try {
        // Mock the checkIntentionMatch function to work with our test inputs
        const mockCheckIntentionMatch = async (intention: string, content: string) => {
          // We need to access the private function, so we'll recreate the logic
          const CONFIG = (await import('../../utils/config')).CONFIG;
          const getOpenRouterHeaders = (await import('../../utils/config')).getOpenRouterHeaders;
        
        if (!CONFIG.OPENROUTER.API_KEY) {
          throw new Error('OpenRouter API key not configured');
        }

        const prompt = `Intention:${intention},Content:${content}`;
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: getOpenRouterHeaders(),
          body: JSON.stringify({
            model: CONFIG.OPENROUTER.DEFAULT_MODEL,
            messages: [
              {
                role: 'system',
                content: `You are an AI that determines whether a user's intention aligns with a short snippet of webpage content.

Be SEMANTIC and TOLERANT:
- If the content could plausibly help the user achieve their goal, return match: true.
- If the content is clearly irrelevant, return match: false.

Reply only with:
{ "match": true } or { "match": false }`
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: CONFIG.OPENROUTER.MAX_TOKENS,
            temperature: CONFIG.OPENROUTER.TEMPERATURE,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0]?.message?.content;
        
        if (!aiResponse) {
          throw new Error('No response from AI model');
        }

        // Parse the response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return { match: Boolean(parsed.match) };
        }
        if (/true/i.test(aiResponse)) return { match: true };
        if (/false/i.test(aiResponse)) return { match: false };
        return { match: false };
      };

      const result = await mockCheckIntentionMatch(intentionText, pageContent);
      setMatchResult(result);
    } catch (error) {
      console.error('Matching error:', error);
      setMatchResult({ match: false });
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Intention Logic Test</h1>
        <p className="text-muted-foreground">Test intention validation and matching logic</p>
      </div>

      {/* Intention Validation Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Intention Validation Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Intention Statement</label>
            <Textarea
              value={intentionText}
              onChange={(e) => setIntentionText(e.target.value)}
              placeholder="Enter an intention to test validation..."
              className="min-h-[100px]"
            />
          </div>
          
          <Button 
            onClick={testIntentionValidation}
            disabled={isValidating || !intentionText.trim()}
            className="w-full"
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              'Test Validation'
            )}
          </Button>

          {validationResult && (
            <div className="mt-4 p-4 rounded-lg border">
                             <div className="flex items-center gap-2 mb-2">
                 {validationResult.isValid ? (
                   <CheckCircle className="h-5 w-5 text-green-500" />
                 ) : (
                   <XCircle className="h-5 w-5 text-red-500" />
                 )}
                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                   validationResult.isValid 
                     ? 'bg-green-100 text-green-800' 
                     : 'bg-red-100 text-red-800'
                 }`}>
                   {validationResult.isValid ? 'Valid' : 'Invalid'}
                 </span>
               </div>
              <p className="text-sm">{validationResult.reason}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Intention Matching Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Intention Matching Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Page Content</label>
            <Textarea
              value={pageContent}
              onChange={(e) => setPageContent(e.target.value)}
              placeholder="Enter page content to test matching..."
              className="min-h-[100px]"
            />
          </div>
          
          <Button 
            onClick={testIntentionMatching}
            disabled={isMatching || !intentionText.trim() || !pageContent.trim()}
            className="w-full"
          >
            {isMatching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Match...
              </>
            ) : (
              'Test Matching'
            )}
          </Button>

          {matchResult && (
            <div className="mt-4 p-4 rounded-lg border">
                             <div className="flex items-center gap-2 mb-2">
                 {matchResult.match ? (
                   <CheckCircle className="h-5 w-5 text-green-500" />
                 ) : (
                   <XCircle className="h-5 w-5 text-red-500" />
                 )}
                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                   matchResult.match 
                     ? 'bg-green-100 text-green-800' 
                     : 'bg-red-100 text-red-800'
                 }`}>
                   {matchResult.match ? 'Match' : 'No Match'}
                 </span>
               </div>
              <p className="text-sm">
                {matchResult.match 
                  ? 'The page content aligns with your intention' 
                  : 'The page content does not align with your intention'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Example Data */}
      <Card>
        <CardHeader>
          <CardTitle>Example Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Example Valid Intentions:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• "Research React hooks for my project"</li>
              <li>• "Check my email for work updates"</li>
              <li>• "Find a recipe for dinner tonight"</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Example Invalid Intentions:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• "Just browsing"</li>
              <li>• "Killing time"</li>
              <li>• "Don't know"</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 