export default function SentimentDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
      {/* Sentiment Timeline */}
      <div className="md:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-1">Sentiment Timeline</h3>
            <p className="text-2xl font-semibold">Generally Positive</p>
          </div>
          <div className="flex gap-2">
            <span className="flex items-center gap-1 text-xs text-on-surface-variant"><span className="w-2 h-2 rounded-full bg-primary"></span> High</span>
            <span className="flex items-center gap-1 text-xs text-on-surface-variant"><span className="w-2 h-2 rounded-full bg-secondary-container"></span> Neutral</span>
            <span className="flex items-center gap-1 text-xs text-on-surface-variant"><span className="w-2 h-2 rounded-full bg-error-container"></span> Low</span>
          </div>
        </div>
        {/* Visual Timeline Visualization */}
        <div className="relative h-24 flex items-end gap-1">
          <div className="flex-1 bg-primary h-1/2 rounded-t-sm opacity-60"></div>
          <div className="flex-1 bg-primary h-3/4 rounded-t-sm opacity-60"></div>
          <div className="flex-1 bg-primary h-full rounded-t-sm opacity-60"></div>
          <div className="flex-1 bg-secondary-container h-1/2 rounded-t-sm"></div>
          <div className="flex-1 bg-secondary-container h-1/3 rounded-t-sm"></div>
          <div className="flex-1 bg-error-container h-1/4 rounded-t-sm opacity-60"></div>
          <div className="flex-1 bg-error-container h-1/2 rounded-t-sm opacity-60"></div>
          <div className="flex-1 bg-secondary-container h-2/3 rounded-t-sm"></div>
          <div className="flex-1 bg-primary h-3/4 rounded-t-sm opacity-60"></div>
          <div className="flex-1 bg-primary h-full rounded-t-sm opacity-60"></div>
          <div className="flex-1 bg-primary h-5/6 rounded-t-sm opacity-60"></div>
          <div className="flex-1 bg-primary h-4/5 rounded-t-sm opacity-60"></div>
        </div>
      </div>
      {/* Core Metrics */}
      <div className="md:col-span-4 bg-surface-container-low p-8 rounded-xl flex flex-col justify-between border border-outline-variant/10">
        <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">Focus Score</h3>
        <div className="flex items-center justify-center relative">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle className="text-surface-container-highest" cx="64" cy="64" fill="transparent" r="56" stroke="currentColor" strokeWidth="8"></circle>
            <circle className="text-primary" cx="64" cy="64" fill="transparent" r="56" stroke="currentColor" strokeDasharray="351.85" strokeDashoffset="52.77" strokeWidth="8"></circle>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold">85%</span>
          </div>
        </div>
        <p className="text-xs text-center text-on-surface-variant mt-4">High topical consistency detected throughout the call.</p>
      </div>
    </div>
  );
}
