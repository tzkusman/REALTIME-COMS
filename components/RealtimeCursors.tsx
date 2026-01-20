
import React, { useEffect, useState } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

interface RealtimeCursorsProps {
  supabase: SupabaseClient;
  user: any;
}

const COLORS = [
  '#3ecf8e', '#3b82f6', '#ef4444', '#f59e0b', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'
];

export const RealtimeCursors: React.FC<RealtimeCursorsProps> = ({ supabase, user }) => {
  const [cursors, setCursors] = useState<Record<string, any>>({});
  const [myColor] = useState(() => COLORS[Math.floor(Math.random() * COLORS.length)]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('online_users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setCursors(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('join', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('leave', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            username: user.user_metadata?.username || 'Anonymous',
            x: 0,
            y: 0,
            color: myColor,
          });
        }
      });

    const handleMouseMove = (e: MouseEvent) => {
      channel.track({
        user_id: user.id,
        username: user.user_metadata?.username || 'Anonymous',
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
        color: myColor,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      channel.unsubscribe();
    };
  }, [supabase, user, myColor]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {Object.entries(cursors).map(([key, presence]: [string, any]) => {
        if (key === user?.id) return null;
        const data = presence[0];
        if (!data) return null;

        return (
          <div
            key={key}
            className="absolute transition-all duration-75 ease-out"
            style={{
              left: `${data.x}%`,
              top: `${data.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              style={{ color: data.color }}
              className="drop-shadow-lg"
            >
              <path
                d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                fill="currentColor"
                stroke="white"
                strokeWidth="1"
              />
            </svg>
            <div 
              className="ml-3 mt-3 px-2 py-1 rounded-md text-[10px] font-bold text-white shadow-xl whitespace-nowrap uppercase tracking-tighter"
              style={{ backgroundColor: data.color }}
            >
              {data.username}
            </div>
          </div>
        );
      })}
    </div>
  );
};
