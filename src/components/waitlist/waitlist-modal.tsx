'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WaitlistModal({ open, onOpenChange }: WaitlistModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación
    if (!name.trim()) {
      setErrorMessage('Por favor, ingresa tu nombre');
      setStatus('error');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Por favor, ingresa tu correo electrónico');
      setStatus('error');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage('Por favor, ingresa un correo electrónico válido');
      setStatus('error');
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      // Obtener la URL del Apps Script desde variables de entorno
      const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL;
      
      if (!scriptUrl) {
        throw new Error('La URL del Google Apps Script no está configurada. Por favor, verifica la configuración en .env.local');
      }

      // Validar que la URL tenga el formato correcto
      if (!scriptUrl.includes('script.google.com') || !scriptUrl.includes('/exec')) {
        throw new Error('La URL del Google Apps Script no tiene el formato correcto. Debe terminar en /exec');
      }

      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        timestamp: new Date().toISOString(),
      };

      console.log('Enviando datos a:', scriptUrl);
      console.log('Payload:', payload);

      // Intentar primero con CORS normal para poder leer la respuesta
      try {
        const response = await fetch(scriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        // Si la respuesta es exitosa, leer el JSON
        if (response.ok) {
          const result = await response.json();
          console.log('Respuesta del servidor:', result);
          
          if (result.success) {
            setIsSubmitting(false);
            setStatus('success');
            setName('');
            setEmail('');
            setTimeout(() => {
              onOpenChange(false);
              setStatus('idle');
            }, 2000);
            return;
          } else {
            throw new Error(result.message || 'Error al guardar los datos');
          }
        } else {
          // Si hay error HTTP, intentar con no-cors como fallback
          throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (corsError) {
        // Si falla por CORS, intentar con no-cors (no podemos leer la respuesta)
        console.warn('Error CORS, intentando con mode: no-cors:', corsError);
        
        await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        // Con no-cors, asumimos éxito si no hay error de red
        setIsSubmitting(false);
        setStatus('success');
        setName('');
        setEmail('');
        setTimeout(() => {
          onOpenChange(false);
          setStatus('idle');
        }, 2000);
      }
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      setIsSubmitting(false);
      setStatus('error');
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet e intenta nuevamente.'
      );
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      // Resetear estado después de cerrar
      setTimeout(() => {
        setName('');
        setEmail('');
        setStatus('idle');
        setErrorMessage('');
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-8">
        <DialogHeader className="space-y-3 pb-2">
          <DialogTitle className="text-2xl font-bold font-outfit text-center text-foreground">
            Únete a la Lista de Espera
          </DialogTitle>
          <DialogDescription className="text-center font-outfit text-base leading-relaxed">
            Sé el primero en conocer cuando NIDIA Flow esté disponible. Te notificaremos tan pronto como podamos darte acceso.
          </DialogDescription>
        </DialogHeader>

        {status === 'success' ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="w-20 h-20 rounded-full bg-nidia-green/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-nidia-green" />
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-xl font-semibold font-outfit text-foreground">
                ¡Te has unido exitosamente!
              </h3>
              <p className="text-sm font-outfit text-muted-foreground leading-relaxed">
                Te notificaremos por correo cuando NIDIA Flow esté disponible.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            <div className="space-y-3">
              <Label htmlFor="name" className="font-outfit font-medium text-foreground text-base">
                Nombre completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre completo"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (status === 'error') {
                    setStatus('idle');
                    setErrorMessage('');
                  }
                }}
                disabled={isSubmitting}
                className="font-outfit h-12 text-base"
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="font-outfit font-medium text-foreground text-base">
                Correo electrónico <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') {
                    setStatus('idle');
                    setErrorMessage('');
                  }
                }}
                disabled={isSubmitting}
                className="font-outfit h-12 text-base"
                required
              />
            </div>

            {status === 'error' && errorMessage && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm font-outfit text-destructive leading-relaxed">{errorMessage}</p>
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                size="lg"
                className="w-full bg-nidia-green hover:bg-nidia-green/90 text-black font-outfit font-semibold text-base h-12 shadow-md hover:shadow-lg transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Unirme a la Lista de Espera'
                )}
              </Button>
            </div>

            <p className="text-xs text-center font-outfit text-muted-foreground leading-relaxed pt-2">
              Al unirte, aceptas que te contactemos cuando NIDIA Flow esté disponible.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

