'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Circle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { api } from '@/lib/api';
import { useUserPresence } from '@/hooks/useWebSocket';

interface OnlineUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: string;
  lastActivity: string;
}

export function OnlineUsers() {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  // Fetch all users
  const { data: usersData } = useQuery({
    queryKey: ['users-online'],
    queryFn: async () => {
      const response = await api.get('/users/online');
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const users: OnlineUser[] = usersData?.data || [];

  // Listen for user presence updates
  useUserPresence(
    (user) => {
      // User came online
      setOnlineUserIds((prev) => new Set(prev).add(user.id));
    },
    (user) => {
      // User went offline
      setOnlineUserIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
    }
  );

  // Initialize online users from API
  useEffect(() => {
    if (users.length > 0) {
      setOnlineUserIds(new Set(users.map((u) => u.id)));
    }
  }, [users]);

  const onlineUsers = users.filter((u) => onlineUserIds.has(u.id));

  if (onlineUsers.length === 0) {
    return null;
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">
          Usuarios en línea ({onlineUsers.length})
        </h3>
      </div>
      <div className="flex flex-wrap gap-2">
        <TooltipProvider>
          {onlineUsers.map((user) => (
            <Tooltip key={user.id}>
              <TooltipTrigger>
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatarUrl} alt={user.firstName} />
                    <AvatarFallback>
                      {getInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-green-500 text-green-500" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <p className="font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                  <p className="text-xs text-muted-foreground">
                    Activo hace{' '}
                    {Math.floor(
                      (Date.now() - new Date(user.lastActivity).getTime()) /
                        60000
                    )}{' '}
                    min
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </Card>
  );
}
