'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { PlansTable } from '@/components/plans/plans-table';
import { PlanForm, PlanFormRef } from '@/components/plans/plan-form';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { plansApi, Plan } from '@/lib/api/plans';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function PlansPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createFormRef = useRef<PlanFormRef>(null);
  const editFormRef = useRef<PlanFormRef>(null);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  // Fetch plans with real-time updates
  const { data: plans, isLoading, error } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.list(),
    retry: 1,
    refetchInterval: 10000, // Refrescar cada 10 segundos
    refetchOnWindowFocus: true,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: plansApi.create,
    onSuccess: (newPlan) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.setQueryData(['plans'], (old: Plan[] | undefined) => {
        if (!old) return [newPlan];
        return [newPlan, ...old];
      });
      setIsCreateSheetOpen(false);
      toast.success('Plan creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al crear plan');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Plan> }) =>
      plansApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setIsEditSheetOpen(false);
      setSelectedPlan(null);
      toast.success('Plan actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar plan');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: plansApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setIsDeleteDialogOpen(false);
      setSelectedPlan(null);
      toast.success('Plan eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar plan');
    },
  });

  const handleCreate = async (data: Partial<Plan>) => {
    await createMutation.mutateAsync(data);
  };

  const handleEdit = async (data: Partial<Plan>) => {
    if (!selectedPlan) return;
    await updateMutation.mutateAsync({ id: selectedPlan.id, data });
  };

  const handleDelete = () => {
    if (!selectedPlan) return;
    deleteMutation.mutate(selectedPlan.id);
  };

  const handleView = (plan: Plan) => {
    router.push(`/superadmin/plans/${plan.id}`);
  };

  const handleEditClick = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsEditSheetOpen(true);
  };

  const handleDeleteClick = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsDeleteDialogOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-outfit mb-2 text-foreground">
          Gestión de Planes
        </h1>
        <p className="text-muted-foreground text-lg">
          Administra los planes de suscripción disponibles
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Planes de Suscripción</CardTitle>
              <CardDescription>
                Configura los planes disponibles para los clientes
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateSheetOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              <p>Error al cargar los planes</p>
              <p className="text-sm text-muted-foreground mt-2">
                {error instanceof Error ? error.message : 'Error desconocido'}
              </p>
            </div>
          ) : (
            <PlansTable
              data={plans || []}
              onView={handleView}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Sheet */}
      <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="sticky top-0 bg-background z-10 pb-4 border-b">
            <SheetTitle>Crear Nuevo Plan</SheetTitle>
            <SheetDescription>
              Completa la información para crear un nuevo plan de suscripción
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <PlanForm
              ref={createFormRef}
              onSubmit={handleCreate}
              onCancel={() => setIsCreateSheetOpen(false)}
              isLoading={createMutation.isPending}
              showActions={false}
            />
          </div>
          <div className="sticky bottom-0 bg-background border-t pt-4 mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsCreateSheetOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => createFormRef.current?.submit()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Plan
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="sticky top-0 bg-background z-10 pb-4 border-b">
            <SheetTitle>Editar Plan</SheetTitle>
            <SheetDescription>
              Modifica la información del plan de suscripción
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {selectedPlan && (
              <PlanForm
                ref={editFormRef}
                defaultValues={selectedPlan}
                onSubmit={handleEdit}
                onCancel={() => setIsEditSheetOpen(false)}
                isLoading={updateMutation.isPending}
                showActions={false}
              />
            )}
          </div>
          <div className="sticky bottom-0 bg-background border-t pt-4 mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditSheetOpen(false)}
              disabled={updateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => editFormRef.current?.submit()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar Plan
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el plan{' '}
              <strong>{selectedPlan?.displayName}</strong> y no podrá ser asignado a nuevos clientes.
              Los clientes existentes con este plan no se verán afectados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

