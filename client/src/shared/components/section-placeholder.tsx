import { Wallet } from 'lucide-react';
import { Button } from './ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './ui/empty';
export function SectionPlaceholder({
  title,
  description,
  onBack,
}: {
  title: string;
  description: string;
  onBack: () => void;
}) {
  return (
    <Empty className="business-empty">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Wallet size={28} strokeWidth={1.5} />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <Button className="button" onClick={onBack}>
        Volver al inicio
      </Button>
    </Empty>
  );
}
