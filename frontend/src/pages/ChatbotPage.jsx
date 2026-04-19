import { useState, useRef, useEffect } from 'react'
import api from '../api/axios'
import { Send, Bot, User, Trash2, Sparkles } from 'lucide-react'

const SUGGESTIONS = [
  'What is my current debt-to-income ratio?',
  'Which loan should I pay off first?',
  'How can I reduce my EMI burden?',
  'Explain snowball vs avalanche method',
  'When will I be debt-free?',
]

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m FinBot, your AI financial advisor 👋\n\nI have access to your loan data and can help with repayment strategies, EMI queries, and personalized financial advice. What would you like to know?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text) => {
    const userMsg = text || input.trim()
    if (!userMsg || loading) return
    setInput('')

    const newMessages = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await api.post('/ai/chat', {
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        includeContext: true,
      })
      setMessages([...newMessages, { role: 'assistant', content: res.data.data.reply }])
    } catch (err) {
      setMessages([...newMessages, {
        role: 'assistant',
        content: err.response?.data?.message === 'AI service quota exceeded.'
          ? '⚠️ AI quota exceeded. Please check your OpenAI billing at platform.openai.com.'
          : '❌ Sorry, I encountered an error. Please try again.'
      }])
    } finally { setLoading(false) }
  }

  const clear = () => setMessages([{ role: 'assistant', content: 'Chat cleared. How can I help you?' }])

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-600/20 flex items-center justify-center">
            <Bot size={18} className="text-primary-400" />
          </div>
          <div>
            <h1 className="font-bold text-white">FinBot</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <p className="text-xs text-slate-400">AI Financial Assistant · Context-aware</p>
            </div>
          </div>
        </div>
        <button onClick={clear} className="btn-ghost text-xs flex items-center gap-1.5">
          <Trash2 size={13}/> Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-primary-600/20' : 'bg-slate-700'}`}>
              {msg.role === 'assistant' ? <Bot size={14} className="text-primary-400" /> : <User size={14} className="text-slate-300" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'assistant'
                ? 'bg-surface-800 text-slate-200 rounded-tl-sm border border-slate-700/50'
                : 'bg-primary-600 text-white rounded-tr-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary-600/20 flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-primary-400" />
            </div>
            <div className="bg-surface-800 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{animationDelay:'0ms'}}/>
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{animationDelay:'150ms'}}/>
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{animationDelay:'300ms'}}/>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-6 pb-3 flex gap-2 flex-wrap">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)}
              className="text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-6 flex-shrink-0">
        <div className="flex gap-3 bg-surface-800 border border-slate-700 rounded-2xl p-2">
          <input
            className="flex-1 bg-transparent text-white placeholder:text-slate-500 text-sm px-3 focus:outline-none"
            placeholder="Ask about your loans, EMIs, repayment strategy…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            disabled={loading}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition flex-shrink-0">
            <Send size={15} className="text-white" />
          </button>
        </div>
        <p className="text-center text-xs text-slate-600 mt-2">FinBot uses your actual loan data for personalized advice</p>
      </div>
    </div>
  )
}
