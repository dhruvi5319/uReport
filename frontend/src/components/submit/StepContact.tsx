import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWizard } from '@/contexts/WizardContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const contactSchema = z.object({
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function StepContact() {
  const { formData, updateFormData, goNext } = useWizard();

  const { register, handleSubmit, formState: { errors } } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstname: formData.firstname ?? '',
      lastname: formData.lastname ?? '',
      email: formData.email ?? '',
      phone: formData.phone ?? '',
    },
  });

  const onSubmit = (data: ContactFormData) => {
    updateFormData({
      firstname: data.firstname || undefined,
      lastname: data.lastname || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
    });
    goNext();
  };

  const handleSkip = () => {
    updateFormData({ firstname: undefined, lastname: undefined, email: undefined, phone: undefined });
    goNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
        <CardDescription>Optional — provide your details if you'd like to receive updates</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstname" className="text-sm font-medium">First Name</label>
              <Input id="firstname" {...register('firstname')} placeholder="Jane" />
            </div>
            <div>
              <label htmlFor="lastname" className="text-sm font-medium">Last Name</label>
              <Input id="lastname" {...register('lastname')} placeholder="Doe" />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input id="email" {...register('email')} type="email" placeholder="jane@example.com" />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="phone" className="text-sm font-medium">Phone</label>
            <Input id="phone" {...register('phone')} type="tel" placeholder="(314) 555-0100" />
          </div>

          <div className="flex gap-3 pt-2">
            {/* Skip button — advances without saving any contact data */}
            <Button type="button" variant="outline" onClick={handleSkip}>
              Skip
            </Button>
            <Button type="submit" className="flex-1">Next: Category →</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
