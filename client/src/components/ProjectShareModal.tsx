import { useState } from 'react';
import type { Project, ProjectShare } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { projectSharesAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

type ShareRole = 'viewer' | 'editor' | 'manager';

const ROLE_LABELS: Record<ShareRole | 'owner', string> = {
  viewer: 'Solo lectura',
  editor: 'Editor',
  manager: 'Gestor',
  owner: 'Propietario',
};

interface ProjectShareModalProps {
  project?: Project | null;
  shares: ProjectShare[];
  isOpen: boolean;
  onClose: () => void;
  refetch: () => Promise<any>;
}

export function ProjectShareModal({ project, shares, isOpen, onClose, refetch }: ProjectShareModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ShareRole>('editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canManage = project?.currentUserRole === 'owner' || project?.currentUserRole === 'manager';

  const resetForm = () => {
    setEmail('');
    setRole('editor');
  };

  const handleInvite = async () => {
    if (!project) return;
    if (!email.trim()) {
      toast.error('Introduce un email válido');
      return;
    }

    try {
      setIsSubmitting(true);
      await projectSharesAPI.upsert(project.id, { email: email.trim(), role });
      toast.success('Acceso actualizado');
      resetForm();
      await refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'No se pudo compartir el proyecto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (share: ProjectShare, newRole: ShareRole) => {
    if (!project) return;
    const collaboratorEmail = share.sharedWith?.email;
    if (!collaboratorEmail) {
      toast.error('No se pudo identificar el email del colaborador');
      return;
    }
    try {
      await projectSharesAPI.upsert(project.id, { email: collaboratorEmail, role: newRole });
      toast.success('Permisos actualizados');
      await refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'No se pudo actualizar el rol');
    }
  };

  const handleRemove = async (share: ProjectShare) => {
    if (!project) return;
    try {
      await projectSharesAPI.remove(project.id, share.id);
      toast.success('Acceso revocado');
      await refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'No se pudo revocar el acceso');
    }
  };

  const renderShares = () => {
    if (shares.length === 0) {
      return <p className="text-sm text-gray-500 dark:text-gray-400">Todavía no hay colaboradores.</p>;
    }

    return (
      <ScrollArea className="max-h-72 pr-2">
        <div className="space-y-3">
          {shares.map((share) => {
            const collaborator = share.sharedWith;
            return (
              <div
                key={share.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-slate-800/60 p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {collaborator?.nombre || collaborator?.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{collaborator?.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {canManage ? (
                    <Select
                      value={share.role}
                      onChange={(event) => handleRoleChange(share, event.target.value as ShareRole)}
                      className="w-32"
                    >
                      <option value="viewer">Solo lectura</option>
                      <option value="editor">Editor</option>
                      <option value="manager">Gestor</option>
                    </Select>
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{ROLE_LABELS[share.role]}</span>
                  )}
                  {canManage && (
                    <button
                      onClick={() => handleRemove(share)}
                      className="ui-button ui-button--ghost w-9 h-9"
                      aria-label={`Eliminar acceso de ${collaborator?.email}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Compartir proyecto"
      description={project ? `${project.nombre} · ${ROLE_LABELS[(project.currentUserRole || 'owner') as ShareRole | 'owner']}` : undefined}
      size="lg"
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Colaboradores</h3>
          {renderShares()}
        </div>

        {canManage ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Invitar por email</h3>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
              <Input
                placeholder="correo@ejemplo.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Select value={role} onChange={(event) => setRole(event.target.value as ShareRole)}>
                <option value="viewer">Solo lectura</option>
                <option value="editor">Editor</option>
                <option value="manager">Gestor</option>
              </Select>
              <Button onClick={handleInvite} disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Compartir'}
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              • Viewer: puede ver el proyecto. • Editor: puede crear y editar tareas. • Gestor: gestiona secciones y permisos.
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Solo los gestores o propietarios pueden invitar o cambiar permisos.
          </p>
        )}
      </div>
    </Modal>
  );
}


