import React from 'react';
import { motion } from 'motion/react';
import { Mail, MessageCircle, ExternalLink } from 'lucide-react';

export default function AdvertiseWidget() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 p-8 shadow-2xl cinematic-glow group border border-white/10"
    >
      {/* Decorative Elements */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
      
      <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
              فرصة إعلانية
            </span>
          </div>
          <h2 className="text-3xl font-black text-white leading-tight">
            أعلن معنا في تطبيق <br /> 
            <span className="text-accent underline decoration-white/20 underline-offset-8">قناة الاتحاد</span>
          </h2>
          <p className="text-sm text-white/80 font-bold max-w-sm mt-2">
            صل لآلاف المشجعين السكندريين العاشقين لنادي الاتحاد يومياً من خلال باقاتنا الإعلانية المميزة.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <a 
            href="mailto:ads@ittihad.club" 
            className="h-14 px-8 bg-white text-indigo-700 rounded-2xl text-sm font-black shadow-xl flex items-center justify-center gap-2 hover:bg-opacity-90 hover:scale-105 active:scale-95 transition-all group/btn"
          >
            <Mail size={18} />
            تواصل عبر البريد
          </a>
          <a 
            href="https://wa.me/201234567890" 
            target="_blank"
            rel="noopener noreferrer"
            className="h-14 px-8 bg-[#25D366] text-white rounded-2xl text-sm font-black shadow-xl flex items-center justify-center gap-2 hover:bg-opacity-90 hover:scale-105 active:scale-95 transition-all"
          >
            <MessageCircle size={18} />
            واتساب مباشر
          </a>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap justify-center md:justify-start gap-6 opacity-60">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-accent animate-pulse"></div>
          <span className="text-[10px] font-black text-white">تغطية واسعة</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-accent animate-pulse"></div>
          <span className="text-[10px] font-black text-white">استهداف دقيق</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-accent animate-pulse"></div>
          <span className="text-[10px] font-black text-white">نتائج ملموسة</span>
        </div>
      </div>
    </motion.div>
  );
}
