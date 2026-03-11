export default function Footer() {
  return (
    <footer className="bg-brand-black py-10 px-4 border-t border-brand-charcoal">
      <div className="max-w-2xl mx-auto text-center">
        {/* TODO: Pas aan naar jouw organisatienaam */}
        <p className="font-heading text-brand-primary font-bold uppercase tracking-widest text-sm mb-2">
          {"UW ORGANISATIE"}
        </p>
        <p className="text-white/40 text-sm">
          {"Samen maken we het mogelijk"}
        </p>
        <div className="mt-4 w-12 h-0.5 bg-brand-primary/30 mx-auto" />
        <p className="text-white/25 text-xs mt-4">
          {"Built with tikkie-donation-platform"}
        </p>
        <a
          href="/admin"
          className="inline-block mt-4 text-white/15 text-xs hover:text-white/40 transition-colors"
        >
          {"Beheer"}
        </a>
        <p className="text-white/20 text-xs mt-6 leading-relaxed">
          {"Created by "}
          <a
            href="https://rogier.live"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/40 transition-colors underline"
          >
            {"Rogier van Wagtendonk"}
          </a>
          {" \u2014 "}
          <a
            href="https://rogier.live"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/40 transition-colors underline"
          >
            {"rogier.live"}
          </a>
        </p>
      </div>
    </footer>
  );
}
