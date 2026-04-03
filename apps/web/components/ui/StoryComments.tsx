'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, MessageCircle, Send } from 'lucide-react'
import type { StoryFull, StoryComment } from '@/lib/types'

// ─── Single comment row ────────────────────────────────────────────────────────

function CommentRow({ comment }: { comment: StoryComment }) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(comment.likes)
  const [showReplies, setShowReplies] = useState(false)

  const handleLike = () => {
    setLiked((prev) => {
      setLikeCount((c) => (prev ? c - 1 : c + 1))
      return !prev
    })
  }

  return (
    <div className="py-[14px] border-b border-[#1c2333] last:border-b-0">
      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className="w-[32px] h-[32px] rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-semibold text-white"
          style={{ background: comment.avatarGradient }}
        >
          {comment.alias.replace('@', '').slice(0, 2).toUpperCase()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-[8px] mb-[4px]">
            <span className="text-[12px] font-medium text-[#eeeef0]">{comment.alias}</span>
            <span className="text-[10px] text-[#6b7280]">{comment.timeAgo}</span>
          </div>
          <p className="text-[12.5px] text-[#c4c8d0] leading-[1.55] mb-[8px]">{comment.text}</p>

          {/* Actions */}
          <div className="flex gap-5 items-center">
            <button
              onClick={handleLike}
              className="flex items-center gap-[5px] text-[11px] transition-colors duration-150"
              style={{ color: liked ? '#e8607a' : '#6b7280' }}
            >
              <Heart
                size={11}
                fill={liked ? '#e8607a' : 'none'}
                color={liked ? '#e8607a' : '#6b7280'}
              />
              {likeCount}
            </button>

            {comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies((r) => !r)}
                className="text-[11px] transition-colors duration-150"
                style={{ color: showReplies ? '#eeeef0' : '#e8607a' }}
              >
                {showReplies
                  ? 'hide replies'
                  : `${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
              </button>
            )}
          </div>

          {/* Replies */}
          <AnimatePresence>
            {showReplies && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                className="mt-[12px] pl-3 border-l-2 space-y-3 overflow-hidden"
                style={{ borderColor: '#1c2333' }}
              >
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="flex gap-2">
                    <div
                      className="w-[24px] h-[24px] rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-semibold text-white"
                      style={{ background: reply.avatarGradient }}
                    >
                      {reply.alias.replace('@', '').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-[6px] mb-[2px]">
                        <span className="text-[11px] font-medium text-[#eeeef0]">{reply.alias}</span>
                        <span className="text-[10px] text-[#6b7280]">{reply.timeAgo}</span>
                      </div>
                      <p className="text-[11.5px] text-[#c4c8d0] leading-[1.45]">{reply.text}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ─── Main comments panel ──────────────────────────────────────────────────────

interface Props {
  story: StoryFull
  open: boolean
  onClose: () => void
}

export default function StoryComments({ story, open, onClose }: Props) {
  const [commentText, setCommentText] = useState('')

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[750]"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-0 right-0 z-[760] rounded-t-[20px] overflow-hidden flex flex-col"
            style={{
              bottom: '68px',
              maxHeight: '70vh',
              background: '#0d1117',
              border: '1px solid #1c2333',
              borderBottom: 'none',
            }}
          >
            {/* Top accent line */}
            <div
              className="h-[2px] flex-shrink-0"
              style={{ background: 'linear-gradient(90deg,transparent,#e8607a,transparent)' }}
            />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1c2333] flex-shrink-0">
              <div className="flex items-center gap-2">
                <MessageCircle size={15} color="#e8607a" />
                <span
                  className="text-[13.5px] font-medium text-[#eeeef0]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {story.commentCount.toLocaleString()} whispers
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-[30px] h-[30px] rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-white/[0.1]"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <X size={13} color="#6b7280" />
              </button>
            </div>

            {/* Comment list */}
            <div className="flex-1 overflow-y-auto px-5 scrollbar-thin">
              {story.comments.length === 0 ? (
                <p
                  className="text-center text-[13px] text-[#6b7280] py-10"
                  style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
                >
                  Nothing here yet. Be the first to whisper.
                </p>
              ) : (
                story.comments.map((comment) => (
                  <CommentRow key={comment.id} comment={comment} />
                ))
              )}
            </div>

            {/* Input */}
            <div
              className="flex-shrink-0 px-4 py-3 border-t border-[#1c2333]"
              style={{ background: '#0d1117' }}
            >
              <div className="flex gap-3 items-center">
                <div
                  className="w-[30px] h-[30px] rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#e8607a,#9b5fe0)' }}
                >
                  MW
                </div>
                <div
                  className="flex-1 flex items-center rounded-[20px] px-4 py-[8px] gap-2"
                  style={{ background: '#161d2a', border: '1px solid #1c2333' }}
                >
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Leave a whisper…"
                    className="flex-1 bg-transparent text-[12.5px] text-[#eeeef0] placeholder-[#6b7280] outline-none"
                  />
                  <AnimatePresence>
                    {commentText.trim() && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => setCommentText('')}
                      >
                        <Send size={14} color="#e8607a" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
