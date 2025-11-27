'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft,
  Send,
  MessageSquare,
  Mail,
  Phone,
  User,
  Building2,
  MoreVertical,
  Archive,
  Tag,
  Paperclip,
  Smile,
} from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { QueryLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { queryKeys } from '@/lib/query-client';
import { toast } from 'sonner';
import { inboxApi, Conversation, Message, SendMessageDto } from '@/lib/api/crm';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { route } = useTenantRoutes();
  const conversationId = params.id as string;
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageContent, setMessageContent] = useState('');

  // Fetch conversation
  const { data: conversationData, isLoading: isLoadingConversation, refetch: refetchConversation } = useApiQuery(
    queryKeys.crm.inbox.conversation(conversationId),
    () => inboxApi.getConversation(conversationId),
    {
      enabled: !!conversationId,
      refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    }
  );

  // Fetch messages
  const { data: messagesData, isLoading: isLoadingMessages, refetch: refetchMessages } = useApiQuery(
    queryKeys.crm.inbox.messages(conversationId),
    () => inboxApi.getMessages(conversationId, { limit: 100 }),
    {
      enabled: !!conversationId,
      refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    }
  );

  const conversation = conversationData?.data as Conversation | undefined;
  const messages = (messagesData?.data?.data || []) as Message[];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useApiMutation(
    (data: SendMessageDto) => inboxApi.sendMessage(conversationId, data),
    {
      onSuccess: () => {
        setMessageContent('');
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.inbox.messages(conversationId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.inbox.conversation(conversationId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.inbox.conversations() });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.inbox.stats() });
        toast.success('Mensaje enviado');
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Error al enviar el mensaje');
      },
    }
  );

  // Update status mutation
  const updateStatusMutation = useApiMutation(
    (status: string) => inboxApi.updateStatus(conversationId, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.inbox.conversation(conversationId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.inbox.conversations() });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.inbox.stats() });
        toast.success('Estado actualizado');
      },
    }
  );

  const handleSendMessage = () => {
    if (!messageContent.trim()) return;
    
    sendMessageMutation.mutate({
      content: messageContent.trim(),
      type: 'text',
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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

  if (isLoadingConversation) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <QueryLoading isLoading={true} />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Conversación no encontrada</p>
        <Button asChild className="mt-4">
          <TenantLink href={route('/crm/inbox')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la bandeja
          </TenantLink>
        </Button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(route('/crm/inbox'))}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                {getChannelIcon(conversation.channel)}
                <div>
                  <h2 className="font-semibold text-lg">
                    {conversation.customer?.companyName || 
                     `${conversation.customer?.firstName || ''} ${conversation.customer?.lastName || ''}`.trim() ||
                     conversation.recipientName ||
                     conversation.recipient}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{getChannelLabel(conversation.channel)}</span>
                    <span>•</span>
                    <span>{conversation.recipient}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={conversation.status}
                onValueChange={(value) => updateStatusMutation.mutate(value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Abierto</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="resolved">Resuelto</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                </SelectContent>
              </Select>
              {conversation.customerId && (
                <Button variant="outline" asChild>
                  <TenantLink href={route(`/crm/customers/${conversation.customerId}`)}>
                    <User className="h-4 w-4 mr-2" />
                    Ver Cliente
                  </TenantLink>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
          <QueryLoading
            isLoading={isLoadingMessages}
            isEmpty={messages.length === 0}
          >
            {messages.length > 0 ? (
              <>
                {messages.map((message: Message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.direction === 'outbound'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <div className={`flex items-center justify-end gap-2 mt-2 text-xs ${
                        message.direction === 'outbound' 
                          ? 'text-primary-foreground/70' 
                          : 'text-muted-foreground'
                      }`}>
                        <span>
                          {format(new Date(message.sentAt), 'HH:mm', { locale: es })}
                        </span>
                        {message.direction === 'outbound' && (
                          <span>
                            {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No hay mensajes aún</p>
              </div>
            )}
          </QueryLoading>
        </div>

        {/* Message Input */}
        <div className="border-t bg-card p-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Textarea
                placeholder="Escribe un mensaje..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                onKeyPress={handleKeyPress}
                rows={3}
                className="resize-none"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!messageContent.trim() || sendMessageMutation.isPending}
              size="lg"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

