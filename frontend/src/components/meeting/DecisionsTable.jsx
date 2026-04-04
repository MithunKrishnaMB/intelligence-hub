import { Gavel } from 'lucide-react';

export default function DecisionsTable({ decisions }) {
  if (!decisions || decisions.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-4 mb-6">
        <Gavel className="text-primary w-8 h-8" />
        <h2 className="text-2xl font-bold tracking-tight">Key Decisions</h2>
      </div>
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low">
              <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Agreed Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {decisions.map((decision) => (
              <tr key={decision.id} className="hover:bg-surface-container-low/30 transition-colors">
                <td className="px-8 py-6 font-medium text-slate-800">{decision.content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}