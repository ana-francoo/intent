import { useState } from 'react'
import { saveBlockedSites } from '../utils/storage'

interface WebsiteBlockingProps {
  _onBack: () => void;
  onNext: () => void;
}

interface WebsiteOption {
  id: string
  name: string
  logo: string
  selected: boolean
}

export default function WebsiteBlocking({ _onBack, onNext }: WebsiteBlockingProps) {
  const [selectedWebsites, setSelectedWebsites] = useState<WebsiteOption[]>([
    { id: 'instagram', name: 'Instagram', logo: '📷', selected: false },
    { id: 'youtube', name: 'YouTube', logo: '📺', selected: false },
    { id: 'linkedin', name: 'LinkedIn', logo: '💼', selected: false },
    { id: 'pinterest', name: 'Pinterest', logo: '📌', selected: false },
    { id: 'tiktok', name: 'TikTok', logo: '🎵', selected: false },
    { id: 'facebook', name: 'Facebook', logo: '📘', selected: false },
    { id: 'twitter', name: 'Twitter', logo: '🐦', selected: false },
    { id: 'reddit', name: 'Reddit', logo: '🤖', selected: false },
  ])
  
  const [customUrls, setCustomUrls] = useState<string[]>([])
  const [newUrl, setNewUrl] = useState('')

  const toggleWebsite = (id: string) => {
    setSelectedWebsites(prev => 
      prev.map(site => 
        site.id === id ? { ...site, selected: !site.selected } : site
      )
    )
  }

  const addCustomUrl = () => {
    if (newUrl.trim() && !customUrls.includes(newUrl.trim())) {
      setCustomUrls(prev => [...prev, newUrl.trim()])
      setNewUrl('')
    }
  }

  const removeCustomUrl = (index: number) => {
    setCustomUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addCustomUrl()
    }
  }

  const handleDone = async () => {
    try {
      // Collect all blocked URLs
      const blockedUrls: string[] = [];
      
      // Add selected popular websites
      selectedWebsites.forEach(website => {
        if (website.selected) {
          // Convert website names to URLs
          const urlMap: { [key: string]: string } = {
            'instagram': 'https://instagram.com',
            'youtube': 'https://youtube.com',
            'linkedin': 'https://linkedin.com',
            'pinterest': 'https://pinterest.com',
            'tiktok': 'https://tiktok.com',
            'facebook': 'https://facebook.com',
            'twitter': 'https://twitter.com',
            'reddit': 'https://reddit.com'
          };
          
          if (urlMap[website.id]) {
            blockedUrls.push(urlMap[website.id]);
          }
        }
      });
      
      // Add custom URLs
      blockedUrls.push(...customUrls);
      
      // Save to Supabase if there are any blocked URLs
      if (blockedUrls.length > 0) {
        await saveBlockedSites(blockedUrls);
      }
      
      // Proceed to next step
      onNext();
    } catch (error) {
      console.error('Failed to save blocked sites:', error);
      // You might want to show an error message to the user here
      // For now, we'll still proceed to the next step
      onNext();
    }
  }

  return (
    <>
      <h1>What websites would you like to block?</h1>

      <div className="card">
        <h3>Popular Websites</h3>
        
        <div className="website-grid">
          {selectedWebsites.map((website) => (
            <div 
              key={website.id}
              className={`website-option ${website.selected ? 'selected' : ''}`}
              onClick={() => toggleWebsite(website.id)}
            >
              <div className="checkbox">
                <input 
                  type="checkbox" 
                  checked={website.selected}
                  onChange={() => toggleWebsite(website.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="website-info">
                <span className="name">{website.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Custom URLs</h3>
        
        <div className="url-input-container">
          <div className="url-input-group">
            <input
              type="url"
              placeholder="Enter website URL (e.g., https://example.com)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              className="url-input"
            />
            <button 
              type="button" 
              onClick={addCustomUrl}
              className="add-url-btn"
              disabled={!newUrl.trim()}
            >
              +
            </button>
          </div>
        </div>

        {customUrls.length > 0 && (
          <div className="custom-urls-list">
            {customUrls.map((url, index) => (
              <div key={index} className="custom-url-item">
                <span className="url-text">{url}</span>
                <button 
                  type="button" 
                  onClick={() => removeCustomUrl(index)}
                  className="remove-url-btn"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <button type="button" className="back-button" onClick={handleDone}>
          Done!
        </button>
      </div>
    </>
  )
} 