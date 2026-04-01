import { Gavel } from 'lucide-react';

export default function DecisionsTable() {
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
              <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Decision</th>
              <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Rationale</th>
              <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant text-right">Owner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            <tr className="hover:bg-surface-container-low/30 transition-colors">
              <td className="px-8 py-6 font-medium">De-prioritize VR Beta for Q4</td>
              <td className="px-8 py-6 text-on-surface-variant text-sm">Focus engineering resources on core API stability first.</td>
              <td className="px-8 py-6 text-right"><span className="px-3 py-1 bg-surface-container-high rounded-full text-xs">Sarah Chen</span></td>
            </tr>
            <tr className="hover:bg-surface-container-low/30 transition-colors">
              <td className="px-8 py-6 font-medium">Adopt 'Atomic Design' for Web</td>
              <td className="px-8 py-6 text-on-surface-variant text-sm">Streamline design-to-code handoff for next-gen UI.</td>
              <td className="px-8 py-6 text-right"><span className="px-3 py-1 bg-surface-container-high rounded-full text-xs">Marcus Bell</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
