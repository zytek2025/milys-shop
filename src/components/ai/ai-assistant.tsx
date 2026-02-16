'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: '¡Hola! Soy Mily, tu asistente personal. ✨ ¿En qué puedo ayudarte hoy?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user' as const, content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...messages, userMessage] }),
            });

            const data = await response.json();
            if (data.role) {
                setMessages(prev => [...prev, data]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, tuve un pequeño problema técnico. 🌸' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-[350px] max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-2xl border border-lavanda/30 overflow-hidden flex flex-col h-[500px]"
                    >
                        {/* Header */}
                        <div className="p-4 bg-slate-50 border-b border-lavanda/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                    <Sparkles className="w-4 h-4 text-lavanda" />
                                </div>
                                <div>
                                    <h3 className="font-serif text-sm font-medium text-slate-800">Mily</h3>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Asistente Personal</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full h-8 w-8">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Messages */}
                        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                            <div className="space-y-4">
                                {messages.map((m, i) => (
                                    <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                                        <div className={cn(
                                            "max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed",
                                            m.role === 'user'
                                                ? "bg-lavanda text-slate-800 rounded-tr-none"
                                                : "bg-crema text-slate-700 rounded-tl-none border border-crema"
                                        )}>
                                            {m.content}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-crema p-3 rounded-2xl rounded-tl-none border border-crema">
                                            <Loader2 className="w-4 h-4 animate-spin text-lavanda" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Input */}
                        <div className="p-4 border-t border-lavanda/10 bg-white">
                            <div className="flex gap-2">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Escribe a Mily..."
                                    className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-lavanda/50 outline-none"
                                />
                                <Button onClick={handleSend} disabled={isLoading} className="rounded-xl bg-lavanda hover:bg-lavanda/80 text-slate-800 h-10 w-10 p-0">
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                            <p className="text-[9px] text-center text-slate-400 mt-3 uppercase tracking-tighter">
                                Diseña tu Huella. Cuida tu Esencia.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300",
                    isOpen ? "bg-white text-lavanda rotate-90" : "bg-lavanda text-slate-800"
                )}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </motion.button>
        </div>
    );
}
