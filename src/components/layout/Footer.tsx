export function Footer({ t }: { t: any }) {
  return (
    <footer className="mt-20 border-t border-black/5 bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-800 to-amber-600 rounded-lg flex items-center justify-center text-white font-bold">
                ☕
              </div>
              <h3 className="text-lg font-semibold">
                {t.language === 'zh' ? '第一杯' : 'First Cup'}
              </h3>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              {t.footerDesc}
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-bold text-sm mb-4">{t.product}</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <a href="/" className="hover:text-black transition-colors">
                  {t.dailyBriefing}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-black transition-colors">
                  {t.marketSignals}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-black transition-colors">
                  {t.agentDirectory}
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-sm mb-4">{t.company}</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <a href="#" className="hover:text-black transition-colors">
                  {t.about}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-black transition-colors">
                  {t.contact}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-black transition-colors">
                  {t.privacy}
                </a>
              </li>
            </ul>
          </div>

          {/* Subscribe */}
          <div>
            <h4 className="font-bold text-sm mb-4">{t.subscribe}</h4>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder={t.emailPlaceholder}
                className="bg-gray-50 border border-black/10 rounded-xl px-4 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
              <button className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors">
                {t.join}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-8 border-t border-black/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© 2026 {t.language === 'zh' ? '第一杯' : 'First Cup'} Intelligence. {t.rights}</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-black transition-colors">
              Twitter
            </a>
            <a href="#" className="hover:text-black transition-colors">
              LinkedIn
            </a>
            <a href="#" className="hover:text-black transition-colors">
              Discord
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
