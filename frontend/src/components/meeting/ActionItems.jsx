import { CheckCircle, CircleDashed } from 'lucide-react';

export default function ActionItems() {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-4 mb-6">
        <CheckCircle className="text-primary w-8 h-8" />
        <h2 className="text-2xl font-bold tracking-tight">Action Items</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Action Card 1 */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 hover:border-outline-variant/30 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <CircleDashed className="text-primary-fixed-dim w-5 h-5" />
            <span className="text-xs font-bold text-on-surface-variant/60 uppercase">High Priority</span>
          </div>
          <h4 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">Refactor authentication flow</h4>
          <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">Update the JWT implementation to support multi-device session management.</p>
          <div className="flex justify-between items-center pt-4 border-t border-surface-container">
            <div className="flex items-center gap-2">
              <img className="w-6 h-6 rounded-full" alt="David Miller" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAxyU3rBG_zWJyDpOAd3fYc7k3xhr74xZ04Gmsw1PoWwaTaFUosL4fqV6XXlE40L-eekwencbiy7JJQDGnMyH-mUg-lBZm0LfDwyDue8YbRuDAgg_LAkigoTxZjr9oGtmMcS6_kG4Wpj20Ls1HyLXGib1hoQP9ZvyMuxPpH93NyCZvUSzllgTafQicQ6X25yqqbB3I7pXdrnRcCbdYo6llJB5zscfrz8WlbF_SYrc419oBN8VQ3ooEHLdxOmGKd-EjdPJOwXRuDCL05"/>
              <span className="text-xs font-medium">David Miller</span>
            </div>
            <span className="text-xs text-on-surface-variant font-medium">Oct 29</span>
          </div>
        </div>
        {/* Action Card 2 */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 hover:border-outline-variant/30 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <CircleDashed className="text-primary-fixed-dim w-5 h-5" />
            <span className="text-xs font-bold text-on-surface-variant/60 uppercase">Design</span>
          </div>
          <h4 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">Review Q4 Brand Assets</h4>
          <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">Final sign-off on the new editorial color palette for the marketing site.</p>
          <div className="flex justify-between items-center pt-4 border-t border-surface-container">
            <div className="flex items-center gap-2">
              <img className="w-6 h-6 rounded-full" alt="Elena Rodriguez" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0Mg42YIcuw8ZLvD7v8zQbxGqvOCjZCrwYg3ZWj74WAre1V24DzdrjYfPnxyhBFcXWslLRunNTFjoLQEaRIGsi4Do9a1UnKlEDknI3Nu0sRkuS3_MfO9zR-0tck_80T9PQ3qOANys6NILEDvNRrkRKFYg2TTVvq-rWLQX_-CSO71JXvLR0GxWjr1HCKrMVwYo7JmVCI8VRO-PRzWIBpvOqmgKjODVwBYuiK_f2xiqRx3qsqA2EsJgnV1NlgvTMMzTPCZHlNFWsEe-Y"/>
              <span className="text-xs font-medium">Elena Rodriguez</span>
            </div>
            <span className="text-xs text-on-surface-variant font-medium">Nov 02</span>
          </div>
        </div>
      </div>
    </section>
  );
}
