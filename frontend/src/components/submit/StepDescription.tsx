import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { useWizard } from '@/contexts/WizardContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const descriptionSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description too long'),
});

type DescriptionFormData = z.infer<typeof descriptionSchema>;

export function StepDescription() {
  const { formData, updateFormData, goNext, goBack } = useWizard();
  const [photos, setPhotos] = useState<File[]>(formData.photos ?? []);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<DescriptionFormData>({
    resolver: zodResolver(descriptionSchema),
    defaultValues: { description: formData.description ?? '' },
  });

  // react-dropzone configuration (per locked decision)
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
    },
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024, // 10MB per file
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const reasons = rejectedFiles.map(r => r.errors.map(e => e.message).join(', ')).join('; ');
        setPhotoError(`Some files rejected: ${reasons}`);
      } else {
        setPhotoError(null);
      }
      setPhotos(prev => {
        const combined = [...prev, ...acceptedFiles];
        if (combined.length > 10) {
          setPhotoError('Maximum 10 photos allowed');
          return combined.slice(0, 10);
        }
        return combined;
      });
    },
    onDropRejected: () => {
      setPhotoError('Only JPEG, PNG, and GIF images accepted. Max 10MB per file.');
    },
  });

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: DescriptionFormData) => {
    updateFormData({ description: data.description, photos });
    goNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Description & Photos</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Description textarea */}
          <div>
            <label htmlFor="description" className="text-sm font-medium">
              Description * <span className="text-muted-foreground font-normal">(minimum 10 characters)</span>
            </label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe the issue in detail..."
              rows={5}
              className={cn(errors.description && 'border-destructive')}
            />
            {errors.description && (
              <p className="text-xs text-destructive mt-1" role="alert">{errors.description.message}</p>
            )}
          </div>

          {/* react-dropzone zone (per locked decision) */}
          <div>
            <label className="text-sm font-medium">Photos (optional, max 10)</label>
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50',
              )}
            >
              <input {...getInputProps()} aria-label="Upload photos" />
              {isDragActive ? (
                <p className="text-primary text-sm">Drop photos here…</p>
              ) : (
                <div>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Drag photos here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, GIF · Max 10MB each · Max 10 files</p>
                </div>
              )}
            </div>
            {photoError && <p className="text-xs text-destructive mt-1" role="alert">{photoError}</p>}
          </div>

          {/* Photo thumbnail previews with remove button */}
          {photos.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {photos.map((file, i) => (
                <div key={i} className="relative aspect-square">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs hover:bg-destructive"
                    aria-label={`Remove ${file.name}`}
                  >×</button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={goBack}>← Back</Button>
            <Button type="submit" className="flex-1">Review →</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
