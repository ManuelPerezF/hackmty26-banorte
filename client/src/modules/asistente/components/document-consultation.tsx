'use client';
import { useId, useRef, useState } from 'react';
import { BookOpen, ChevronDown, ArrowUpRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

const products = ['Clásica', 'Oro', 'Platinum'];
const topics = [
  'Beneficios y puntos',
  'Comisiones y costos',
  'Seguros y protección',
  'Requisitos y condiciones',
  'Otra pregunta',
];

export function DocumentConsultation({
  disabled,
  onConsult,
}: {
  disabled: boolean;
  onConsult: (question: string) => void;
}) {
  const id = useId();
  const details = useRef<HTMLDetailsElement>(null);
  const [product, setProduct] = useState('');
  const [topic, setTopic] = useState('');
  const [question, setQuestion] = useState('');
  return (
    <details className="chat-document-guide" ref={details}>
      <summary>
        <BookOpen size={18} strokeWidth={1.5} />
        Consultar documentos
        <ChevronDown size={16} />
      </summary>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (
            disabled ||
            !product ||
            !topic ||
            (topic === 'Otra pregunta' && !question.trim())
          )
            return;
          const prompt = `Consulta los documentos de la tarjeta Banorte ${product}. Tema: ${topic}. ${question.trim() ? `Mi pregunta: ${question.trim()}. ` : ''}Muéstrame las fuentes, páginas, condiciones y vigencia. Si no hay evidencia suficiente, indícalo.`;
          onConsult(prompt);
          if (details.current) details.current.open = false;
        }}
      >
        <p>
          Elige una tarjeta y lo que quieres conocer de sus folletos y guías.
        </p>
        <fieldset disabled={disabled}>
          <legend className="sr-only">Consulta documental</legend>
          <div className="chat-document-fields">
            <label htmlFor={`${id}-product`}>
              Tarjeta
              <select
                id={`${id}-product`}
                value={product}
                required
                onChange={(e) => setProduct(e.target.value)}
              >
                <option value="" disabled>
                  Selecciona una tarjeta
                </option>
                {products.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label htmlFor={`${id}-topic`}>
              Tema
              <select
                id={`${id}-topic`}
                value={topic}
                required
                onChange={(e) => setTopic(e.target.value)}
              >
                <option value="" disabled>
                  ¿Qué quieres saber?
                </option>
                {topics.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
          <label htmlFor={`${id}-question`}>
            {topic === 'Otra pregunta'
              ? 'Tu pregunta'
              : 'Pregunta específica (opcional)'}
            <textarea
              id={`${id}-question`}
              rows={2}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={1500}
              required={topic === 'Otra pregunta'}
              placeholder="Por ejemplo: ¿qué condiciones tiene la garantía extendida?"
            />
          </label>
          <Button
            type="submit"
            disabled={
              disabled ||
              !product ||
              !topic ||
              (topic === 'Otra pregunta' && !question.trim())
            }
          >
            Consultar fuentes <ArrowUpRight size={16} />
          </Button>
        </fieldset>
      </form>
    </details>
  );
}
