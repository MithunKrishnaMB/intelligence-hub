import { CheckCircle, CircleDashed } from 'lucide-react';

export default function ActionItems({ actionItems }) {
  if (!actionItems || actionItems.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-4 mb-6">
        <CheckCircle className="text-primary w-8 h-8" />
        <h2 className="text-2xl font-bold tracking-tight">Action Items</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {actionItems.map((item) => (
          <div key={item.id} className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 hover:border-outline-variant/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <CircleDashed className="text-primary-fixed-dim w-5 h-5" />
              <span className="text-xs font-bold text-on-surface-variant/60 uppercase">Task</span>
            </div>
            <h4 className="text-lg font-semibold mb-6 group-hover:text-primary transition-colors">{item.task}</h4>
            <div className="flex justify-between items-center pt-4 border-t border-surface-container">
              <div className="flex items-center gap-2">
                {/* Fallback avatar */}
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                    {item.owner.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium">{item.owner}</span>
              </div>
              <span className="text-xs text-on-surface-variant font-medium text-right">{item.due_date}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}