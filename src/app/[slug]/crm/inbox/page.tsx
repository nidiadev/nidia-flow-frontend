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
  Filter,
  MessageSquare,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { QueryLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from 'sonner';
import { inboxApi, Conversation } from '@/lib/api/crm';

export default function InboxPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['conversations', statusFilter, channelFilter, searchQuery],
    queryFn: () => inboxApi.getConversations({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      channel: channelFilter !== 'all' ? channelFilter : undefined,
      search: searchQuery || undefined,
    }),
  });

  const conversations = data?.data?.data || [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      inboxApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Estado actualizado');
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      open: 'default',
      pending: 'secondary',
      resolved: 'outline',
      spam: 'destructive',
    };
    return variants[status] || 'default';
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <Phone className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <ErrorBoundary>
      <div>
        <PageHeader
          title="Bandeja de Comunicaciones"
          description="Todas tus conversaciones unificadas en un solo lugar"
          variant="gradient"
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversaciones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
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
            <SelectTrigger className="w-full sm:w-[200px]">
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

        {/* Conversations List */}
        <QueryLoading
          isLoading={isLoading}
          isError={isError}
          error={error as Error}
          isEmpty={conversations.length === 0}
          onRetry={refetch}
          emptyFallback={
            <div className="text-center py-12">
              <InboxIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay conversaciones</h3>
              <p className="text-muted-foreground">
                Las conversaciones aparecerán aquí cuando recibas mensajes
              </p>
            </div>
          }
        >
          <div className="space-y-2">
            {conversations.map((conversation: Conversation) => (
              <Card
                key={conversation.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getChannelIcon(conversation.channel)}
                        <h4 className="font-medium">
                          {conversation.customer?.companyName || 
                           `${conversation.customer?.firstName} ${conversation.customer?.lastName}`}
                        </h4>
                        <Badge variant={getStatusBadge(conversation.status)}>
                          {conversation.status}
                        </Badge>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="default">{conversation.unreadCount}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {conversation.recipient}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {conversation.messageCount} mensajes
                        </span>
                        <span>
                          Último: {new Date(conversation.lastMessageAt).toLocaleString('es-ES')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({
                          id: conversation.id,
                          status: conversation.status === 'open' ? 'resolved' : 'open',
                        })}
                      >
                        {conversation.status === 'resolved' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </Button>
                      <TenantLink href={`/crm/inbox/${conversation.id}`}>
                        <Button variant="outline" size="sm">
                          Abrir
                        </Button>
                      </TenantLink>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </QueryLoading>
      </div>
    </ErrorBoundary>
  );
}

