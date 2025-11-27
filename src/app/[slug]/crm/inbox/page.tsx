'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Inbox as InboxIcon,
  Search,
  MessageSquare,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  MoreVertical,
  Archive,
  Tag,
} from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { QueryLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { queryKeys } from '@/lib/query-client';
import { toast } from 'sonner';
import { inboxApi, Conversation } from '@/lib/api/crm';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function InboxPage() {
  const queryClient = useQueryClient();
  const { route } = useTenantRoutes();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch conversations
  const { data: conversationsData, isLoading, isError, error, refetch } = useApiQuery(
    queryKeys.crm.inbox.conversations({ status: statusFilter, channel: channelFilter, search: searchQuery }),
    () => inboxApi.getConversations({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      channel: channelFilter !== 'all' ? channelFilter : undefined,
      search: searchQuery || undefined,
      limit: 50,
    }),
    {
      refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    }
  );

  // Fetch inbox statistics
  const { data: statsData } = useApiQuery(
    queryKeys.crm.inbox.stats(),
    () => inboxApi.getStats(),
    {
      refetchInterval: 60000, // Refetch every minute
    }
  );

  const conversations = (conversationsData?.data || []) as Conversation[];
  const stats = statsData?.data || { total: 0, unread: 0, open: 0, pending: 0, resolved: 0 };

  const updateStatusMutation = useApiMutation(
    ({ id, status }: { id: string; status: string }) =>
      inboxApi.updateStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.inbox.conversations() });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.inbox.stats() });
        toast.success('Estado actualizado');
      },
    }
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      open: 'default',
      pending: 'secondary',
      resolved: 'outline',
      spam: 'destructive',
    };
    return variants[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: 'Abierto',
      pending: 'Pendiente',
      resolved: 'Resuelto',
      spam: 'Spam',
    };
    return labels[status] || status;
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'email':
        return <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'sms':
        return <Phone className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getChannelLabel = (channel: string) => {
    const labels: Record<string, string> = {
      whatsapp: 'WhatsApp',
      email: 'Email',
      sms: 'SMS',
    };
    return labels[channel] || channel;
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority || priority === 'normal') return null;
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return (
      <Badge className={colors[priority] || ''} variant="outline">
        {priority === 'urgent' ? 'Urgente' : priority === 'high' ? 'Alta' : 'Baja'}
      </Badge>
    );
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SectionHeader
          title="Bandeja Unificada"
          description="Todas tus conversaciones de WhatsApp, Email y SMS en un solo lugar"
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <InboxIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Conversaciones</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sin leer</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.unread || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Pendientes de revisar</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abiertas</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.open || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">En proceso</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resueltas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.resolved || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Completadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        {conversations.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar conversaciones, clientes, mensajes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="open">Abiertos</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="resolved">Resueltos</SelectItem>
                    <SelectItem value="spam">Spam</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los canales</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conversations List */}
        <QueryLoading
          isLoading={isLoading}
          isError={isError}
          error={error as Error}
          emptyFallback={null}
          onRetry={refetch}
        >
          {conversations.length > 0 ? (
            <div className="space-y-2">
              {conversations.map((conversation: Conversation) => (
                <Card
                  key={conversation.id}
                  className={`hover:shadow-md transition-all cursor-pointer ${
                    conversation.unreadCount > 0 ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getChannelIcon(conversation.channel)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm truncate">
                                {conversation.customer?.companyName || 
                                 `${conversation.customer?.firstName || ''} ${conversation.customer?.lastName || ''}`.trim() ||
                                 conversation.recipientName ||
                                 conversation.recipient}
                              </h4>
                              {conversation.unreadCount > 0 && (
                                <Badge variant="default" className="bg-blue-600">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                              {getPriorityBadge(conversation.priority)}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <span>{getChannelLabel(conversation.channel)}</span>
                              <span>•</span>
                              <span>{conversation.recipient}</span>
                              {conversation.assignedToUser && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span>
                                      {conversation.assignedToUser.firstName} {conversation.assignedToUser.lastName}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{conversation.messageCount} mensajes</span>
                              <span>•</span>
                              <span>
                                {formatDistanceToNow(new Date(conversation.lastMessageAt), { 
                                  addSuffix: true, 
                                  locale: es 
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant={getStatusBadge(conversation.status)}>
                              {getStatusLabel(conversation.status)}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newStatus = conversation.status === 'open' ? 'resolved' : 'open';
                                updateStatusMutation.mutate({
                                  id: conversation.id,
                                  status: newStatus,
                                });
                              }}
                            >
                              {conversation.status === 'resolved' ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Clock className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <TenantLink href={route(`/crm/inbox/${conversation.id}`)} className="absolute inset-0" />
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-16">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="mb-6">
                    <svg
                      width="200"
                      height="160"
                      viewBox="0 0 200 160"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="opacity-40"
                    >
                      <rect x="40" y="40" width="120" height="80" rx="4" fill="currentColor" className="text-muted-foreground" opacity="0.1" />
                      <rect x="40" y="40" width="120" height="80" rx="4" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" fill="none" />
                      <circle cx="60" cy="60" r="8" fill="currentColor" className="text-muted-foreground" opacity="0.2" />
                      <circle cx="80" cy="60" r="8" fill="currentColor" className="text-muted-foreground" opacity="0.2" />
                      <circle cx="100" cy="60" r="8" fill="currentColor" className="text-muted-foreground" opacity="0.2" />
                      <rect x="50" y="80" width="100" height="4" rx="2" fill="currentColor" className="text-muted-foreground" opacity="0.2" />
                      <rect x="50" y="90" width="80" height="4" rx="2" fill="currentColor" className="text-muted-foreground" opacity="0.2" />
                      <rect x="50" y="100" width="90" height="4" rx="2" fill="currentColor" className="text-muted-foreground" opacity="0.2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No hay conversaciones aún</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md leading-relaxed">
                    Las conversaciones con tus clientes aparecerán aquí cuando recibas mensajes por WhatsApp, Email o SMS
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </QueryLoading>
      </div>
    </ErrorBoundary>
  );
}
