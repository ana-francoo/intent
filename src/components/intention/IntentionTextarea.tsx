import { useFormStatus } from 'react-dom';
import { Textarea } from '@/components/ui/textarea';
import { PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface IntentionTextareaProps {
  domain: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function IntentionTextarea({
  domain,
  value,
  onChange,
  placeholder,
  className,
}: IntentionTextareaProps) {
  const { pending } = useFormStatus();

  return (
    <>
      <PenLine className="absolute left-4 top-4.5 size-4 text-muted-foreground z-10" />
      <Textarea
        name="intention"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'p-4 text-lg focus-visible:ring-0 border-border focus-visible:border-border resize-none focus:outline-none rounded-xl shadow-lg pl-10 pr-10',
          className
        )}
        placeholder={
          placeholder ?? `What is your intention for ${domain}?`
        }
        required
        disabled={pending}
        aria-describedby="intention-help"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const form = (e.currentTarget as HTMLTextAreaElement).closest('form');
            form?.requestSubmit();
          }
        }}
      />
    </>
  );
}


