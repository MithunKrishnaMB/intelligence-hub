export default function SentimentDashboard({ score, segments, comment }) {
  // Determine overall vibe text
  let vibeText = "Neutral";
  if (score >= 75) vibeText = "Highly Positive";
  else if (score >= 60) vibeText = "Generally Positive";
  else if (score <= 40) vibeText = "High Tension / Conflict";

  // Calculate SVG stroke offset for the circular progress bar
  const circleCircumference = 351.85; // 2 * pi * r (where r is 56)
  const strokeDashoffset = circleCircumference - (score / 100) * circleCircumference;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
      {/* Sentiment Timeline */}
      <div className="md:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-1">Sentiment Timeline</h3>
            <p className="text-2xl font-semibold">{vibeText}</p>
          </div>
          <div className="flex gap-2">
            <span className="flex items-center gap-1 text-xs text-on-surface-variant"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Positive</span>
            <span className="flex items-center gap-1 text-xs text-on-surface-variant"><span className="w-2 h-2 rounded-full bg-slate-300"></span> Neutral</span>
            <span className="flex items-center gap-1 text-xs text-on-surface-variant"><span className="w-2 h-2 rounded-full bg-red-500"></span> Negative</span>
          </div>
        </div>
        
        {/* Dynamic Timeline Visualization based on Segments */}
        <div className="relative h-24 flex items-end gap-1">
          {segments && segments.length > 0 ? (
            segments.map((seg, idx) => {
              // Determine bar height and color based on AI vibe
              let barHeight = "h-1/2";
              let barColor = "bg-slate-300";
              
              if (seg.vibe === "enthusiasm" || seg.vibe === "agreement") {
                  barHeight = seg.vibe === "enthusiasm" ? "h-full" : "h-3/4";
                  barColor = "bg-emerald-500 opacity-80";
              } else if (seg.vibe === "conflict" || seg.vibe === "frustration") {
                  barHeight = seg.vibe === "conflict" ? "h-3/4" : "h-1/2";
                  barColor = "bg-red-500 opacity-80";
              }

              return (
                <div key={idx} title={seg.topic} className={`flex-1 ${barColor} ${barHeight} rounded-t-sm transition-all hover:opacity-100 cursor-help`}></div>
              )
            })
          ) : (
            <div className="w-full text-center text-sm text-slate-400 pb-4">Processing timeline data...</div>
          )}
        </div>
      </div>

      {/* Core Metrics */}
      <div className="md:col-span-4 bg-surface-container-low p-8 rounded-xl flex flex-col justify-between border border-outline-variant/10">
        <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">Overall Sentiment Score</h3>
        <div className="flex items-center justify-center relative">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle className="text-surface-container-highest" cx="64" cy="64" fill="transparent" r="56" stroke="currentColor" strokeWidth="8"></circle>
            <circle className={`${score >= 60 ? 'text-emerald-500' : score <= 40 ? 'text-red-500' : 'text-slate-400'} transition-all duration-1000`} cx="64" cy="64" fill="transparent" r="56" stroke="currentColor" strokeDasharray={circleCircumference} strokeDashoffset={strokeDashoffset} strokeWidth="8"></circle>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold">{score}%</span>
          </div>
        </div>
        <p className="text-xs text-center text-on-surface-variant mt-6 italic">
          "{comment || "Analyzing meeting sentiment patterns..."}"
        </p>
      </div>
    </div>
  );
}