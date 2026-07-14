"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Bubble = {
  from: "customer" | "ai";
  text: string;
  tag?: string;
};

// Scripted around what the AI agent actually does — collect requirement,
// budget, timeline — so the demo doubles as product explanation, not just
// decoration.
const SCRIPT: Bubble[] = [
  { from: "customer", text: "Hi, I saw your 2BHK listing in Andheri. Still available?" },
  { from: "ai", text: "Yes, it is! Could I get your name, and are you looking to buy or rent?" },
  { from: "customer", text: "I'm Rohit. Looking to buy, budget around 1.2Cr." },
  { from: "ai", text: "Got it, Rohit. This one's listed at ₹1.15Cr — within range. When are you looking to move in?", tag: "Budget captured" },
  { from: "customer", text: "Ideally within 2 months." },
  { from: "ai", text: "Perfect — I can set up a site visit this weekend. Saturday 11am or Sunday 4pm work better?", tag: "Lead scored: HOT" },
];

export function ConversationDemo() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= SCRIPT.length) {
      const reset = setTimeout(() => setVisibleCount(0), 2600);
      return () => clearTimeout(reset);
    }
    const delay = visibleCount === 0 ? 700 : 1500;
    const t = setTimeout(() => setVisibleCount((c) => c + 1), delay);
    return () => clearTimeout(t);
  }, [visibleCount]);

  return (
    <div className="glass-panel rounded-2xl p-5 w-full max-w-md">
      <div className="flex items-center gap-2 pb-4 mb-4 border-b border-white/[0.06]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-signal-400" />
        </span>
        <span className="text-xs font-mono text-mist-400">
          live on WhatsApp · Sunrise Realty
        </span>
      </div>

      <div className="flex flex-col gap-3 min-h-[340px]">
        <AnimatePresence>
          {SCRIPT.slice(0, visibleCount).map((bubble, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className={cnBubble(bubble.from)}
            >
              <div
                className={
                  bubble.from === "ai"
                    ? "bg-signal-600/90 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[85%] ml-auto"
                    : "bg-ink-700 text-mist-50 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-[85%]"
                }
              >
                {bubble.text}
              </div>
              {bubble.tag && (
                <span className="text-[10px] font-mono uppercase tracking-wide text-amber-400 mt-1 block text-right pr-1">
                  {bubble.tag}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function cnBubble(from: Bubble["from"]) {
  return from === "ai" ? "flex flex-col items-end" : "flex flex-col items-start";
}
