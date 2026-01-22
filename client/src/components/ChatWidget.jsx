import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const SUGGESTED_QUESTIONS = [
  "Where is my most recent payment?",
  "Which invoices are still pending?",
  "How much have I received this month?",
  "How do I change my payment method?"
]

function ChatWidget() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || loading) return

    const userMessage = { role: 'user', content: messageText }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch(`/api/chat/${user.vendor_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversationId
        })
      })

      const data = await response.json()

      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          isError: true
        }])
      } else {
        setConversationId(data.conversationId)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message
        }])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting. Please try again.',
        isError: true
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleSuggestionClick = (question) => {
    sendMessage(question)
  }

  const clearChat = async () => {
    if (conversationId) {
      try {
        await fetch(`/api/chat/${user.vendor_id}/${conversationId}`, {
          method: 'DELETE'
        })
      } catch (error) {
        console.error('Clear chat error:', error)
      }
    }
    setMessages([])
    setConversationId(null)
  }

  const formatMessage = (content) => {
    // Convert markdown-style formatting to HTML
    return content
      .split('\n')
      .map((line, i) => {
        // Bold text
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Bullet points
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return `<li key=${i}>${line.substring(2)}</li>`
        }
        return line
      })
      .join('<br/>')
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        className="chat-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--corpay-blue), var(--corpay-dark-blue))',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)'
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)'
        }}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="chat-panel"
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '24px',
            width: '400px',
            height: '550px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 999,
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, var(--corpay-blue), var(--corpay-dark-blue))',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                Payment Assistant
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.8 }}>
                Powered by AI
              </p>
            </div>
            <button
              onClick={clearChat}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Clear Chat
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: '#f9fafb'
          }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  margin: '0 auto 16px',
                  background: 'linear-gradient(135deg, var(--corpay-teal), var(--corpay-blue))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <h4 style={{ margin: '0 0 8px', color: '#1f2937' }}>
                  Hi, {user?.vendor_name?.split(' ')[0] || 'there'}!
                </h4>
                <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: '14px' }}>
                  I can help you with payment inquiries, invoice status, and more.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {SUGGESTED_QUESTIONS.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(question)}
                      style={{
                        padding: '10px 14px',
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#374151',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--corpay-blue)'
                        e.currentTarget.style.background = '#f0f7ff'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb'
                        e.currentTarget.style.background = 'white'
                      }}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: msg.role === 'user' 
                      ? '16px 16px 4px 16px' 
                      : '16px 16px 16px 4px',
                    background: msg.role === 'user' 
                      ? 'var(--corpay-blue)' 
                      : msg.isError 
                        ? '#fee2e2' 
                        : 'white',
                    color: msg.role === 'user' 
                      ? 'white' 
                      : msg.isError 
                        ? '#dc2626' 
                        : '#1f2937',
                    boxShadow: msg.role === 'assistant' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}
                >
                  {msg.role === 'assistant' ? (
                    <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '16px 16px 16px 4px',
                  background: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span className="typing-dot" style={{
                      width: '8px',
                      height: '8px',
                      background: '#9ca3af',
                      borderRadius: '50%',
                      animation: 'typing 1.4s infinite',
                      animationDelay: '0ms'
                    }} />
                    <span className="typing-dot" style={{
                      width: '8px',
                      height: '8px',
                      background: '#9ca3af',
                      borderRadius: '50%',
                      animation: 'typing 1.4s infinite',
                      animationDelay: '200ms'
                    }} />
                    <span className="typing-dot" style={{
                      width: '8px',
                      height: '8px',
                      background: '#9ca3af',
                      borderRadius: '50%',
                      animation: 'typing 1.4s infinite',
                      animationDelay: '400ms'
                    }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: '16px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '8px',
              background: 'white'
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your payments..."
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '24px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--corpay-blue)'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: loading || !input.trim() 
                  ? '#e5e7eb' 
                  : 'var(--corpay-blue)',
                border: 'none',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
            >
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke={loading || !input.trim() ? '#9ca3af' : 'white'} 
                strokeWidth="2"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Typing animation styles */}
      <style>{`
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  )
}

export default ChatWidget
