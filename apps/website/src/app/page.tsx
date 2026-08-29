import React from 'react';

export default function Home() {
  // Use the dashboard URL if defined in env, otherwise fallback to local port 3001
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3001';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-white">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight">SearchSAAS</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Features</a>
            <a 
              href={`${dashboardUrl}/login`} 
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block"
            >
              Sign In
            </a>
            <a 
              href={`${dashboardUrl}/signup`} 
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-full transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)]"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center justify-center text-center px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8 animate-fade-in">
          <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
          Now in Public Beta
        </div>

        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-slate-400 max-w-4xl mx-auto mb-6">
          Lightning Fast Search for Your Website.
        </h1>
        
        <p className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Add typo-tolerant, instant search to your documentation, blog, or ecommerce site in minutes. No complex infrastructure to manage.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <a 
            href={`${dashboardUrl}/signup`} 
            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-medium px-8 py-4 rounded-full transition-all hover:scale-105 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
          >
            Start for free
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-900/50 border-y border-white/5 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need in a search engine</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Built on top of powerful open-source technologies, optimized for the modern web.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Typo Tolerance", desc: "Built-in tolerance for spelling mistakes. Don't lose customers just because of a typo.", icon: "M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" },
              { title: "Auto Crawling", desc: "Just provide your domain or sitemap. We'll automatically crawl and index your content.", icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" },
              { title: "Drop-in Widget", desc: "Install our search widget with just two lines of code. Instantly beautiful UI out of the box.", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-800/50 border border-white/5 hover:border-blue-500/50 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-blue-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-slate-500 border-t border-white/10 mt-20 px-6">
        <p>&copy; {new Date().getFullYear()} SearchSAAS. All rights reserved.</p>
      </footer>
    </div>
  );
}
