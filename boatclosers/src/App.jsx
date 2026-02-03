import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Anchor, Shield, FileText, DollarSign, CheckCircle, ChevronRight,
  ChevronLeft, ArrowRight, Menu, X, User, Mail, Phone, MapPin,
  Calendar, Hash, Ship, Users, ClipboardList, Search, Download,
  AlertCircle, Check, Star, Clock, Eye, Edit3, Trash2, Plus,
  CreditCard, Lock, Globe, Zap, Award, LifeBuoy, Navigation
} from 'lucide-react';

// ─── CONSTANTS ───────────────────────────────────────────────
const STEPS = [
  { id: 'vessel', label: 'Vessel Details', icon: Ship },
  { id: 'parties', label: 'Parties', icon: Users },
  { id: 'terms', label: 'Terms & Price', icon: DollarSign },
  { id: 'diligence', label: 'Due Diligence', icon: Search },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'closing', label: 'Close Deal', icon: CheckCircle },
];

const DOCUMENTS = [
  { id: 'purchase-agreement', name: 'Purchase & Sale Agreement', category: 'core', required: true },
  { id: 'bill-of-sale', name: 'Bill of Sale', category: 'core', required: true },
  { id: 'closing-statement', name: 'Closing Statement', category: 'core', required: true },
  { id: 'title-transfer', name: 'Title Transfer', category: 'core', required: true },
  { id: 'escrow-instructions', name: 'Escrow Instructions', category: 'escrow', required: false },
  { id: 'lien-release', name: 'Lien Release', category: 'escrow', required: false },
  { id: 'due-diligence-report', name: 'Due Diligence Report', category: 'diligence', required: false },
  { id: 'vessel-acceptance', name: 'Vessel Acceptance', category: 'diligence', required: false },
  { id: 'vessel-rejection', name: 'Vessel Rejection Notice', category: 'diligence', required: false },
  { id: 'counter-offer', name: 'Counter Offer', category: 'negotiation', required: false },
  { id: 'conditional-acceptance', name: 'Conditional Acceptance', category: 'negotiation', required: false },
  { id: 'delivery-receipt', name: 'Delivery Receipt', category: 'closing', required: false },
  { id: 'seller-wire', name: 'Seller Wire Instructions', category: 'closing', required: false },
  { id: 'platform-terms', name: 'Platform Terms of Service', category: 'platform', required: true },
  { id: 'commitment-letter', name: 'Commitment Letter', category: 'finance', required: false },
  { id: 'damage-disclosure', name: 'Damage Disclosure', category: 'diligence', required: false },
  { id: 'loan-payoff', name: 'Loan Payoff Letter', category: 'finance', required: false },
  { id: 'survey-compliance', name: 'Survey Compliance Letter', category: 'diligence', required: false },
  { id: 'insurance-binder', name: 'Insurance Binder', category: 'insurance', required: false },
  { id: 'finance-insurance', name: 'Finance Insurance Binder', category: 'insurance', required: false },
  { id: 'insurance-to-finance', name: 'Insurance to Finance Letter', category: 'insurance', required: false },
];

const STORAGE_KEY = 'boatclosers_transaction';

// ─── HELPERS ─────────────────────────────────────────────────
const fmt = (n) => n ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n) : '$0';
const today = () => new Date().toISOString().split('T')[0];
const uid = () => Math.random().toString(36).substr(2, 9);

function loadTransaction() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

function saveTransaction(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

// ─── INITIAL STATE ───────────────────────────────────────────
const emptyTransaction = () => ({
  id: uid(),
  role: '',
  currentStep: 0,
  createdAt: new Date().toISOString(),
  vessel: { make: '', model: '', year: '', length: '', hin: '', location: '', type: 'powerboat', condition: 'used', description: '' },
  buyer: { name: '', email: '', phone: '', address: '', city: '', state: '', zip: '' },
  seller: { name: '', email: '', phone: '', address: '', city: '', state: '', zip: '' },
  terms: { price: '', deposit: '', depositHolder: 'escrow', closingDate: '', surveyDeadline: '', financing: 'cash', contingencies: [] },
  diligence: { survey: false, seaTrial: false, titleSearch: false, insurance: false, mechInspection: false, hullInspection: false, depositSent: false, depositReceived: false },
  documents: {},
  signatures: {},
  status: 'draft',
});


// ═══════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState('landing');
  const [tx, setTx] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  // Check for saved transaction on mount
  useEffect(() => {
    const saved = loadTransaction();
    if (saved && page === 'landing') {
      // Don't auto-redirect, just keep it available
    }
  }, []);

  // Auto-save transaction
  useEffect(() => {
    if (tx) saveTransaction(tx);
  }, [tx]);

  const startTransaction = (role) => {
    const saved = loadTransaction();
    if (saved && saved.status !== 'closed') {
      setTx(saved);
    } else {
      const newTx = emptyTransaction();
      newTx.role = role;
      setTx(newTx);
    }
    setPage('app');
  };

  const resetTransaction = () => {
    localStorage.removeItem(STORAGE_KEY);
    setTx(null);
    setPage('landing');
  };

  if (page === 'pricing') return <PricingPage onBack={() => setPage('landing')} onStart={startTransaction} />;
  if (page === 'app' && tx) return <TransactionApp tx={tx} setTx={setTx} onExit={resetTransaction} />;
  return <LandingPage onStart={startTransaction} onPricing={() => setPage('pricing')} saved={loadTransaction()} onContinue={() => { setTx(loadTransaction()); setPage('app'); }} />;
}


// ═══════════════════════════════════════════════════════════════
//  LANDING PAGE
// ═══════════════════════════════════════════════════════════════
function LandingPage({ onStart, onPricing, saved, onContinue }) {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--navy)' }}>
              <Anchor className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold" style={{ color: 'var(--navy)', fontFamily: 'Playfair Display, serif' }}>BoatClosers</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: 'var(--gray-700)' }}>
            <a href="#how" className="hover:opacity-70 transition">How It Works</a>
            <a href="#features" className="hover:opacity-70 transition">Features</a>
            <button onClick={onPricing} className="hover:opacity-70 transition">Pricing</button>
            {saved && saved.status !== 'closed' && (
              <button onClick={onContinue} className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: 'var(--teal)' }}>
                Continue Transaction
              </button>
            )}
          </div>
          <button className="md:hidden" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileMenu && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
            <a href="#how" className="block text-sm font-medium py-2" onClick={() => setMobileMenu(false)}>How It Works</a>
            <a href="#features" className="block text-sm font-medium py-2" onClick={() => setMobileMenu(false)}>Features</a>
            <button onClick={() => { setMobileMenu(false); onPricing(); }} className="block text-sm font-medium py-2">Pricing</button>
            {saved && saved.status !== 'closed' && (
              <button onClick={() => { setMobileMenu(false); onContinue(); }} className="w-full py-2 rounded-lg text-white text-sm font-semibold" style={{ background: 'var(--teal)' }}>Continue Transaction</button>
            )}
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="pt-28 pb-20 px-4" style={{ background: 'linear-gradient(170deg, var(--navy) 0%, #14456b 60%, var(--teal) 100%)' }}>
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}>
            <Shield className="w-3.5 h-3.5" /> Trusted by boat buyers & sellers nationwide
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
            Close Your Boat Deal<br />
            <span style={{ color: 'var(--teal-light)' }}>Without a Broker</span>
          </h1>
          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Professional transaction management, legal documents, and secure closing — all for a flat fee. No commissions. No attorneys needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => onStart('buyer')} className="px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5" style={{ background: 'var(--teal-light)', color: 'white' }}>
              I'm Buying a Boat <ArrowRight className="inline w-5 h-5 ml-1" />
            </button>
            <button onClick={() => onStart('seller')} className="px-8 py-4 rounded-xl text-lg font-semibold border-2 border-white/30 text-white hover:bg-white/10 transition-all">
              I'm Selling a Boat
            </button>
          </div>
          <p className="mt-6 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>No account required to get started. Pay only when you close.</p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-20 px-4" style={{ background: 'var(--sand)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: 'var(--navy)' }}>How It Works</h2>
          <p className="text-center mb-14 text-lg" style={{ color: 'var(--gray-500)' }}>Four simple steps to a done deal</p>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: ClipboardList, title: 'Enter Details', desc: 'Add vessel info, buyer and seller details, and your agreed terms.' },
              { icon: Search, title: 'Due Diligence', desc: 'Track surveys, sea trials, title searches, and inspections in one place.' },
              { icon: FileText, title: 'Sign Documents', desc: '21 professional legal documents generated and signed digitally.' },
              { icon: CheckCircle, title: 'Close the Deal', desc: 'Everything documented, signed, and ready. Deal closed.' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--navy)', color: 'white' }}>
                  <step.icon className="w-7 h-7" />
                </div>
                <div className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'var(--teal)' }}>Step {i + 1}</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--navy)', fontFamily: 'DM Sans, sans-serif' }}>{step.title}</h3>
                <p className="text-sm" style={{ color: 'var(--gray-500)' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-14" style={{ color: 'var(--navy)' }}>Everything You Need to Close</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: FileText, title: '21 Legal Documents', desc: 'Purchase agreements, bill of sale, title transfer, escrow docs, insurance forms, and more.' },
              { icon: Edit3, title: 'Digital Signatures', desc: 'Draw or type your signature. Legally binding e-signatures on every document.' },
              { icon: Shield, title: 'Secure & Private', desc: 'Your transaction data stays on your device. No accounts required to start.' },
              { icon: DollarSign, title: 'Flat Fee — No Commission', desc: 'One transparent price. No percentage of the sale. Save thousands vs. a broker.' },
              { icon: Search, title: 'Due Diligence Tracking', desc: 'Survey, sea trial, hull inspection, title search — track every step in one dashboard.' },
              { icon: Download, title: 'PDF Downloads', desc: 'Download any document as a professional PDF ready for filing or records.' },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-xl border border-gray-100 hover:shadow-md transition-all">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-4" style={{ background: 'var(--sand)', color: 'var(--teal)' }}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold mb-2" style={{ color: 'var(--navy)', fontFamily: 'DM Sans, sans-serif' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-500)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4" style={{ background: 'var(--navy)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>Ready to Close Your Deal?</h2>
          <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.7)' }}>Start your transaction now. No signup needed.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => onStart('buyer')} className="px-8 py-4 rounded-xl text-lg font-semibold" style={{ background: 'var(--teal-light)', color: 'white' }}>
              Start as Buyer
            </button>
            <button onClick={() => onStart('seller')} className="px-8 py-4 rounded-xl text-lg font-semibold border-2 text-white" style={{ borderColor: 'rgba(255,255,255,0.3)' }}>
              Start as Seller
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-4 border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Anchor className="w-5 h-5" style={{ color: 'var(--navy)' }} />
            <span className="font-bold" style={{ color: 'var(--navy)' }}>BoatClosers.com</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--gray-500)' }}>© {new Date().getFullYear()} BoatClosers. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
//  PRICING PAGE
// ═══════════════════════════════════════════════════════════════
function PricingPage({ onBack, onStart }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--sand)' }}>
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--navy)' }}>
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </nav>
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-4" style={{ color: 'var(--navy)' }}>Simple, Transparent Pricing</h1>
        <p className="text-center text-lg mb-12" style={{ color: 'var(--gray-500)' }}>One flat fee. No hidden costs. No commissions.</p>
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Standard */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all">
            <div className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--teal)' }}>Standard</div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-5xl font-bold" style={{ color: 'var(--navy)' }}>$149</span>
              <span className="text-sm" style={{ color: 'var(--gray-500)' }}>per transaction</span>
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--gray-500)' }}>Everything you need to close a private boat deal</p>
            <ul className="space-y-3 mb-8">
              {['Full transaction workflow', '14 core legal documents', 'Digital signatures', 'Due diligence tracking', 'PDF downloads', 'Email support'].map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm"><Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--teal)' }} />{f}</li>
              ))}
            </ul>
            <button onClick={() => onStart('buyer')} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: 'var(--navy)' }}>Get Started</button>
          </div>
          {/* Premium */}
          <div className="bg-white rounded-2xl p-8 border-2 hover:shadow-lg transition-all relative" style={{ borderColor: 'var(--teal)' }}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'var(--teal)' }}>MOST POPULAR</div>
            <div className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--teal)' }}>Premium</div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-5xl font-bold" style={{ color: 'var(--navy)' }}>$249</span>
              <span className="text-sm" style={{ color: 'var(--gray-500)' }}>per transaction</span>
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--gray-500)' }}>Full suite with finance, insurance & compliance docs</p>
            <ul className="space-y-3 mb-8">
              {['Everything in Standard', 'All 21 legal documents', 'Finance & loan documents', 'Insurance binders & letters', 'Survey compliance forms', 'Damage disclosure forms', 'Priority support'].map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm"><Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--teal)' }} />{f}</li>
              ))}
            </ul>
            <button onClick={() => onStart('buyer')} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: 'var(--teal)' }}>Get Started</button>
          </div>
        </div>
        <div className="text-center mt-10">
          <p className="text-sm" style={{ color: 'var(--gray-500)' }}>
            Compare: A typical broker charges 10% commission. On a $50,000 boat, that's $5,000.<br />
            <strong style={{ color: 'var(--navy)' }}>BoatClosers saves you thousands.</strong>
          </p>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
//  TRANSACTION APP
// ═══════════════════════════════════════════════════════════════
function TransactionApp({ tx, setTx, onExit }) {
  const step = tx.currentStep || 0;

  const update = (path, value) => {
    setTx(prev => {
      const next = { ...prev };
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const goStep = (s) => {
    const clamped = Math.max(0, Math.min(STEPS.length - 1, s));
    update('currentStep', clamped);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--gray-100)' }}>
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Anchor className="w-5 h-5" style={{ color: 'var(--navy)' }} />
            <span className="font-bold text-sm" style={{ color: 'var(--navy)' }}>BoatClosers</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--sand)', color: 'var(--gray-500)' }}>
              {tx.role === 'buyer' ? 'Buying' : 'Selling'}
            </span>
          </div>
          <button onClick={onExit} className="text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition" style={{ color: 'var(--gray-500)' }}>
            Exit & Save
          </button>
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-white border-b border-gray-100 overflow-x-auto no-print">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-1 min-w-max">
            {STEPS.map((s, i) => {
              const active = i === step;
              const done = i < step;
              const StepIcon = s.icon;
              return (
                <React.Fragment key={s.id}>
                  <button
                    onClick={() => goStep(i)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${active ? 'shadow-sm' : 'hover:bg-gray-50'}`}
                    style={active ? { background: 'var(--navy)', color: 'white' } : done ? { color: 'var(--teal)' } : { color: 'var(--gray-500)' }}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : <StepIcon className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--gray-300)' }} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {step === 0 && <StepVessel tx={tx} update={update} />}
        {step === 1 && <StepParties tx={tx} update={update} />}
        {step === 2 && <StepTerms tx={tx} update={update} />}
        {step === 3 && <StepDiligence tx={tx} update={update} />}
        {step === 4 && <StepDocuments tx={tx} update={update} setTx={setTx} />}
        {step === 5 && <StepClosing tx={tx} update={update} onExit={onExit} />}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => goStep(step - 1)}
            disabled={step === 0}
            className="flex items-center gap-1 px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          {step < STEPS.length - 1 && (
            <button
              onClick={() => goStep(step + 1)}
              className="flex items-center gap-1 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:-translate-y-0.5"
              style={{ background: 'var(--teal)' }}
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── INPUT COMPONENT ─────────────────────────────────────────
function Input({ label, icon: Icon, ...props }) {
  return (
    <div>
      {label && <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--gray-700)' }}>{label}</label>}
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--gray-300)' }} />}
        <input
          className="w-full border border-gray-200 rounded-lg py-2.5 text-sm focus:outline-none focus:ring-2 transition"
          style={{ paddingLeft: Icon ? '2.25rem' : '0.75rem', paddingRight: '0.75rem', focusRingColor: 'var(--teal)' }}
          {...props}
        />
      </div>
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div>
      {label && <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--gray-700)' }}>{label}</label>}
      <select className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 bg-white" {...props}>
        {children}
      </select>
    </div>
  );
}

function Card({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${className}`}>
      {title && <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold" style={{ color: 'var(--navy)', fontFamily: 'DM Sans, sans-serif' }}>{title}</h3></div>}
      <div className="p-6">{children}</div>
    </div>
  );
}


// ─── STEP 1: VESSEL ──────────────────────────────────────────
function StepVessel({ tx, update }) {
  const v = tx.vessel;
  const set = (k, val) => update(`vessel.${k}`, val);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--navy)' }}>Vessel Details</h2>
        <p className="text-sm" style={{ color: 'var(--gray-500)' }}>Enter the boat's information</p>
      </div>
      <Card>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Make / Manufacturer" placeholder="e.g. Boston Whaler" value={v.make} onChange={e => set('make', e.target.value)} />
          <Input label="Model" placeholder="e.g. Outrage 250" value={v.model} onChange={e => set('model', e.target.value)} />
          <Input label="Year" type="number" placeholder="e.g. 2020" value={v.year} onChange={e => set('year', e.target.value)} />
          <Input label="Length (ft)" placeholder="e.g. 25" value={v.length} onChange={e => set('length', e.target.value)} />
          <Input label="Hull ID Number (HIN)" icon={Hash} placeholder="e.g. BWCE1234A020" value={v.hin} onChange={e => set('hin', e.target.value)} />
          <Input label="Location" icon={MapPin} placeholder="e.g. Fort Lauderdale, FL" value={v.location} onChange={e => set('location', e.target.value)} />
          <Select label="Vessel Type" value={v.type} onChange={e => set('type', e.target.value)}>
            <option value="powerboat">Powerboat</option>
            <option value="sailboat">Sailboat</option>
            <option value="yacht">Yacht</option>
            <option value="pontoon">Pontoon</option>
            <option value="jetski">Jet Ski / PWC</option>
            <option value="other">Other</option>
          </Select>
          <Select label="Condition" value={v.condition} onChange={e => set('condition', e.target.value)}>
            <option value="new">New</option>
            <option value="used">Used</option>
            <option value="refurbished">Refurbished</option>
          </Select>
        </div>
        <div className="mt-4">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--gray-700)' }}>Description / Notes</label>
          <textarea
            className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 h-24 resize-none"
            placeholder="Additional details about the vessel..."
            value={v.description}
            onChange={e => set('description', e.target.value)}
          />
        </div>
      </Card>
    </div>
  );
}


// ─── STEP 2: PARTIES ─────────────────────────────────────────
function StepParties({ tx, update }) {
  const PartyForm = ({ role, data }) => {
    const set = (k, val) => update(`${role}.${k}`, val);
    return (
      <Card title={role === 'buyer' ? '👤 Buyer' : '👤 Seller'}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Full Legal Name" icon={User} placeholder="John Doe" value={data.name} onChange={e => set('name', e.target.value)} />
          <Input label="Email" icon={Mail} type="email" placeholder="john@email.com" value={data.email} onChange={e => set('email', e.target.value)} />
          <Input label="Phone" icon={Phone} placeholder="(555) 123-4567" value={data.phone} onChange={e => set('phone', e.target.value)} />
          <Input label="Street Address" icon={MapPin} placeholder="123 Main St" value={data.address} onChange={e => set('address', e.target.value)} />
          <Input label="City" placeholder="Fort Lauderdale" value={data.city} onChange={e => set('city', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="State" placeholder="FL" value={data.state} onChange={e => set('state', e.target.value)} />
            <Input label="ZIP" placeholder="33301" value={data.zip} onChange={e => set('zip', e.target.value)} />
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--navy)' }}>Buyer & Seller</h2>
        <p className="text-sm" style={{ color: 'var(--gray-500)' }}>Enter contact information for both parties</p>
      </div>
      <PartyForm role="buyer" data={tx.buyer} />
      <PartyForm role="seller" data={tx.seller} />
    </div>
  );
}


// ─── STEP 3: TERMS ───────────────────────────────────────────
function StepTerms({ tx, update }) {
  const t = tx.terms;
  const set = (k, val) => update(`terms.${k}`, val);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--navy)' }}>Terms & Price</h2>
        <p className="text-sm" style={{ color: 'var(--gray-500)' }}>Set the financial terms of the deal</p>
      </div>
      <Card title="Purchase Terms">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Purchase Price" icon={DollarSign} type="number" placeholder="50000" value={t.price} onChange={e => set('price', e.target.value)} />
          <Input label="Deposit Amount" icon={DollarSign} type="number" placeholder="5000" value={t.deposit} onChange={e => set('deposit', e.target.value)} />
          <Select label="Deposit Held By" value={t.depositHolder} onChange={e => set('depositHolder', e.target.value)}>
            <option value="escrow">Escrow Agent</option>
            <option value="seller">Seller</option>
            <option value="buyer">Buyer holds until closing</option>
            <option value="third-party">Third-Party Escrow Service</option>
          </Select>
          <Select label="Financing" value={t.financing} onChange={e => set('financing', e.target.value)}>
            <option value="cash">Cash</option>
            <option value="financed">Bank / Marine Loan</option>
            <option value="owner">Owner Financing</option>
          </Select>
          <Input label="Closing Date" icon={Calendar} type="date" value={t.closingDate} onChange={e => set('closingDate', e.target.value)} />
          <Input label="Survey / Inspection Deadline" icon={Calendar} type="date" value={t.surveyDeadline} onChange={e => set('surveyDeadline', e.target.value)} />
        </div>
      </Card>
      {t.price && (
        <Card title="Deal Summary">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span style={{ color: 'var(--gray-500)' }}>Purchase Price</span><span className="font-bold" style={{ color: 'var(--navy)' }}>{fmt(t.price)}</span></div>
            <div className="flex justify-between"><span style={{ color: 'var(--gray-500)' }}>Deposit</span><span className="font-medium">{fmt(t.deposit)}</span></div>
            <div className="flex justify-between border-t border-gray-100 pt-3"><span className="font-semibold" style={{ color: 'var(--navy)' }}>Balance Due at Closing</span><span className="font-bold text-lg" style={{ color: 'var(--teal)' }}>{fmt((t.price || 0) - (t.deposit || 0))}</span></div>
          </div>
        </Card>
      )}
    </div>
  );
}


// ─── STEP 4: DUE DILIGENCE ──────────────────────────────────
function StepDiligence({ tx, update }) {
  const d = tx.diligence;
  const toggle = (k) => update(`diligence.${k}`, !d[k]);

  const items = [
    { key: 'survey', label: 'Marine Survey', desc: 'Professional hull and mechanical inspection' },
    { key: 'seaTrial', label: 'Sea Trial', desc: 'On-water test of engines, systems, and handling' },
    { key: 'titleSearch', label: 'Title Search', desc: 'Verify clean title, no liens or encumbrances' },
    { key: 'insurance', label: 'Insurance Obtained', desc: 'Buyer has secured marine insurance policy' },
    { key: 'mechInspection', label: 'Mechanical Inspection', desc: 'Engine and systems check by certified mechanic' },
    { key: 'hullInspection', label: 'Hull / Bottom Inspection', desc: 'Below-waterline condition check' },
  ];

  const done = items.filter(i => d[i.key]).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--navy)' }}>Due Diligence</h2>
        <p className="text-sm" style={{ color: 'var(--gray-500)' }}>Track inspections and requirements</p>
      </div>
      {/* Progress */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold" style={{ color: 'var(--gray-700)' }}>Progress</span>
          <span className="text-xs font-bold" style={{ color: 'var(--teal)' }}>{done}/{items.length} complete</span>
        </div>
        <div className="h-2 rounded-full" style={{ background: 'var(--gray-200)' }}>
          <div className="h-2 rounded-full transition-all" style={{ width: `${(done / items.length) * 100}%`, background: 'var(--teal)' }} />
        </div>
      </div>
      {/* Items */}
      <Card>
        <div className="space-y-1">
          {items.map(item => (
            <button
              key={item.key}
              onClick={() => toggle(item.key)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-left"
            >
              <div className="w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
                style={d[item.key] ? { background: 'var(--teal)', borderColor: 'var(--teal)' } : { borderColor: 'var(--gray-300)' }}>
                {d[item.key] && <Check className="w-4 h-4 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: d[item.key] ? 'var(--teal)' : 'var(--gray-700)' }}>{item.label}</div>
                <div className="text-xs" style={{ color: 'var(--gray-500)' }}>{item.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </Card>
      {/* Deposit tracking */}
      <Card title="Deposit Status">
        <div className="space-y-3">
          <button onClick={() => toggle('depositSent')} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-left">
            <div className="w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0"
              style={d.depositSent ? { background: 'var(--teal)', borderColor: 'var(--teal)' } : { borderColor: 'var(--gray-300)' }}>
              {d.depositSent && <Check className="w-4 h-4 text-white" />}
            </div>
            <span className="text-sm font-medium">Deposit Sent by Buyer</span>
          </button>
          <button onClick={() => toggle('depositReceived')} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-left">
            <div className="w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0"
              style={d.depositReceived ? { background: 'var(--teal)', borderColor: 'var(--teal)' } : { borderColor: 'var(--gray-300)' }}>
              {d.depositReceived && <Check className="w-4 h-4 text-white" />}
            </div>
            <span className="text-sm font-medium">Deposit Received / Confirmed</span>
          </button>
        </div>
      </Card>
    </div>
  );
}


// ─── STEP 5: DOCUMENTS ──────────────────────────────────────
function StepDocuments({ tx, update, setTx }) {
  const [viewing, setViewing] = useState(null);
  const [signing, setSigning] = useState(null);

  const categories = {
    core: 'Core Transaction',
    escrow: 'Escrow & Liens',
    diligence: 'Due Diligence',
    negotiation: 'Negotiation',
    closing: 'Closing',
    finance: 'Finance',
    insurance: 'Insurance',
    platform: 'Platform',
  };

  const grouped = {};
  DOCUMENTS.forEach(doc => {
    if (!grouped[doc.category]) grouped[doc.category] = [];
    grouped[doc.category].push(doc);
  });

  const signDoc = (docId) => {
    setTx(prev => ({
      ...prev,
      signatures: { ...prev.signatures, [docId]: { signed: true, date: new Date().toISOString(), signer: tx.role } }
    }));
    setSigning(null);
  };

  const signedCount = Object.keys(tx.signatures || {}).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--navy)' }}>Documents</h2>
        <p className="text-sm" style={{ color: 'var(--gray-500)' }}>{signedCount} of {DOCUMENTS.length} documents signed</p>
      </div>

      {/* Signing modal */}
      {signing && (
        <SignatureModal
          doc={DOCUMENTS.find(d => d.id === signing)}
          tx={tx}
          onSign={() => signDoc(signing)}
          onClose={() => setSigning(null)}
        />
      )}

      {/* Document viewer */}
      {viewing && (
        <DocumentViewer
          doc={DOCUMENTS.find(d => d.id === viewing)}
          tx={tx}
          onClose={() => setViewing(null)}
          onSign={() => { setViewing(null); setSigning(viewing); }}
        />
      )}

      {/* Document list */}
      {Object.entries(grouped).map(([cat, docs]) => (
        <Card key={cat} title={categories[cat] || cat}>
          <div className="space-y-1">
            {docs.map(doc => {
              const signed = tx.signatures?.[doc.id]?.signed;
              return (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={signed ? { background: '#e8f5e9', color: 'var(--teal)' } : { background: 'var(--sand)', color: 'var(--gray-500)' }}>
                    {signed ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--gray-700)' }}>
                      {doc.name}
                      {doc.required && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#fff3e0', color: '#e65100' }}>Required</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setViewing(doc.id)} className="p-1.5 rounded-md hover:bg-gray-100 transition" title="View">
                      <Eye className="w-4 h-4" style={{ color: 'var(--gray-500)' }} />
                    </button>
                    {!signed && (
                      <button onClick={() => setSigning(doc.id)} className="px-3 py-1 rounded-md text-xs font-semibold text-white" style={{ background: 'var(--teal)' }}>
                        Sign
                      </button>
                    )}
                    {signed && <span className="text-xs font-medium" style={{ color: 'var(--teal)' }}>Signed ✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}


// ─── DOCUMENT VIEWER ─────────────────────────────────────────
function DocumentViewer({ doc, tx, onClose, onSign }) {
  const content = generateDocumentContent(doc, tx);
  const signed = tx.signatures?.[doc.id]?.signed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold" style={{ color: 'var(--navy)', fontFamily: 'DM Sans' }}>{doc.name}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-sm max-w-none" style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--gray-700)', lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: content }} />
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          {signed ? (
            <span className="text-sm font-medium" style={{ color: 'var(--teal)' }}>✓ Signed on {new Date(tx.signatures[doc.id].date).toLocaleDateString()}</span>
          ) : (
            <button onClick={onSign} className="px-5 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--teal)' }}>Sign This Document</button>
          )}
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>
  );
}


// ─── SIGNATURE MODAL ─────────────────────────────────────────
function SignatureModal({ doc, tx, onSign, onClose }) {
  const canvasRef = useRef(null);
  const [sigType, setSigType] = useState('draw'); // draw | type
  const [typedSig, setTypedSig] = useState('');
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const startDraw = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0c2d48';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDraw = () => setDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const canSign = sigType === 'draw' ? hasDrawn : typedSig.length > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold" style={{ color: 'var(--navy)' }}>Sign: {doc.name}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          {/* Toggle */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setSigType('draw')} className="flex-1 py-2 rounded-lg text-sm font-medium transition" style={sigType === 'draw' ? { background: 'var(--navy)', color: 'white' } : { background: 'var(--gray-100)' }}>Draw</button>
            <button onClick={() => setSigType('type')} className="flex-1 py-2 rounded-lg text-sm font-medium transition" style={sigType === 'type' ? { background: 'var(--navy)', color: 'white' } : { background: 'var(--gray-100)' }}>Type</button>
          </div>

          {sigType === 'draw' ? (
            <div>
              <canvas
                ref={canvasRef}
                width={350} height={120}
                className="sig-canvas w-full"
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
              />
              <button onClick={clearCanvas} className="text-xs mt-2" style={{ color: 'var(--gray-500)' }}>Clear</button>
            </div>
          ) : (
            <div>
              <input
                type="text"
                value={typedSig}
                onChange={e => setTypedSig(e.target.value)}
                placeholder="Type your full legal name"
                className="w-full border-b-2 border-gray-300 py-3 text-2xl text-center focus:outline-none focus:border-teal-500"
                style={{ fontFamily: 'cursive', color: 'var(--navy)' }}
              />
            </div>
          )}

          <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: '#fff8e1', color: '#795548' }}>
            <strong>Legal Notice:</strong> By signing, you agree this constitutes your legally binding electronic signature on this document, pursuant to the E-SIGN Act and UETA.
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50">Cancel</button>
          <button onClick={onSign} disabled={!canSign} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40" style={{ background: 'var(--teal)' }}>
            Apply Signature
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── STEP 6: CLOSING ─────────────────────────────────────────
function StepClosing({ tx, update, onExit }) {
  const requiredDocs = DOCUMENTS.filter(d => d.required);
  const signedRequired = requiredDocs.filter(d => tx.signatures?.[d.id]?.signed).length;
  const allSigned = signedRequired === requiredDocs.length;
  const diligenceItems = ['survey', 'seaTrial', 'titleSearch', 'insurance'];
  const diligenceDone = diligenceItems.filter(k => tx.diligence[k]).length;

  const closeDeal = () => {
    update('status', 'closed');
    alert('🎉 Congratulations! Your boat deal has been closed successfully. All documents have been saved.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--navy)' }}>Close the Deal</h2>
        <p className="text-sm" style={{ color: 'var(--gray-500)' }}>Review everything before closing</p>
      </div>

      {/* Status cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="text-xs font-semibold mb-2" style={{ color: 'var(--gray-500)' }}>VESSEL</div>
          <div className="font-bold" style={{ color: 'var(--navy)' }}>{tx.vessel.year} {tx.vessel.make} {tx.vessel.model}</div>
          <div className="text-sm mt-1" style={{ color: 'var(--gray-500)' }}>{tx.vessel.length}' {tx.vessel.type} — {tx.vessel.location}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="text-xs font-semibold mb-2" style={{ color: 'var(--gray-500)' }}>PURCHASE PRICE</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--teal)' }}>{fmt(tx.terms.price)}</div>
          <div className="text-sm mt-1" style={{ color: 'var(--gray-500)' }}>Deposit: {fmt(tx.terms.deposit)} • {tx.terms.financing === 'cash' ? 'Cash' : 'Financed'}</div>
        </div>
      </div>

      {/* Readiness check */}
      <Card title="Closing Readiness">
        <div className="space-y-3">
          <ReadinessItem label="Required Documents Signed" done={allSigned} detail={`${signedRequired}/${requiredDocs.length}`} />
          <ReadinessItem label="Due Diligence Complete" done={diligenceDone === diligenceItems.length} detail={`${diligenceDone}/${diligenceItems.length}`} />
          <ReadinessItem label="Deposit Sent" done={tx.diligence.depositSent} />
          <ReadinessItem label="Deposit Confirmed" done={tx.diligence.depositReceived} />
          <ReadinessItem label="Buyer Info Complete" done={!!(tx.buyer.name && tx.buyer.email)} />
          <ReadinessItem label="Seller Info Complete" done={!!(tx.seller.name && tx.seller.email)} />
        </div>
      </Card>

      {tx.status === 'closed' ? (
        <div className="p-6 rounded-xl text-center" style={{ background: '#e8f5e9' }}>
          <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--teal)' }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--navy)' }}>Deal Closed!</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--gray-500)' }}>Your transaction is complete. All documents have been saved.</p>
          <button onClick={onExit} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--navy)' }}>Back to Home</button>
        </div>
      ) : (
        <button
          onClick={closeDeal}
          disabled={!allSigned}
          className="w-full py-4 rounded-xl text-lg font-bold text-white shadow-lg disabled:opacity-40 transition hover:-translate-y-0.5"
          style={{ background: allSigned ? 'var(--teal)' : 'var(--gray-300)' }}
        >
          {allSigned ? '🎉 Close This Deal' : 'Sign all required documents to close'}
        </button>
      )}
    </div>
  );
}

function ReadinessItem({ label, done, detail }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
        style={done ? { background: 'var(--teal)', color: 'white' } : { background: 'var(--gray-200)', color: 'var(--gray-500)' }}>
        {done ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      </div>
      <span className="flex-1 text-sm" style={{ color: done ? 'var(--gray-700)' : 'var(--gray-500)' }}>{label}</span>
      {detail && <span className="text-xs font-medium" style={{ color: done ? 'var(--teal)' : 'var(--gray-500)' }}>{detail}</span>}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
//  DOCUMENT GENERATOR
// ═══════════════════════════════════════════════════════════════
function generateDocumentContent(doc, tx) {
  const v = tx.vessel;
  const b = tx.buyer;
  const s = tx.seller;
  const t = tx.terms;
  const vessel = `${v.year || '____'} ${v.make || '____'} ${v.model || '____'}`;
  const hin = v.hin || '____________';
  const buyerName = b.name || '________________________';
  const sellerName = s.name || '________________________';
  const price = fmt(t.price) || '$________';
  const deposit = fmt(t.deposit) || '$________';
  const balance = fmt((t.price || 0) - (t.deposit || 0));
  const closingDate = t.closingDate || '________';
  const todayDate = new Date().toLocaleDateString();

  const header = `<div style="text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #0c2d48">
    <div style="font-size:11px;letter-spacing:2px;color:#888;margin-bottom:4px">BOATCLOSERS.COM</div>
    <h2 style="margin:0;color:#0c2d48;font-family:'Playfair Display',serif">${doc.name.toUpperCase()}</h2>
    <div style="font-size:12px;color:#888;margin-top:4px">Date: ${todayDate}</div>
  </div>`;

  const templates = {
    'purchase-agreement': `${header}
      <p>This Purchase and Sale Agreement ("Agreement") is entered into between:</p>
      <p><strong>SELLER:</strong> ${sellerName}<br/>${s.address ? s.address + ', ' + s.city + ', ' + s.state + ' ' + s.zip : '________________________'}</p>
      <p><strong>BUYER:</strong> ${buyerName}<br/>${b.address ? b.address + ', ' + b.city + ', ' + b.state + ' ' + b.zip : '________________________'}</p>
      <p><strong>VESSEL:</strong> ${vessel}<br/>HIN: ${hin} | Length: ${v.length || '____'} ft | Location: ${v.location || '________'}</p>
      <hr/>
      <p><strong>1. PURCHASE PRICE.</strong> Buyer agrees to purchase and Seller agrees to sell the above-described vessel for the total purchase price of <strong>${price}</strong>.</p>
      <p><strong>2. DEPOSIT.</strong> Buyer shall deposit ${deposit} as earnest money within three (3) business days. Deposit held by: ${t.depositHolder || 'Escrow Agent'}.</p>
      <p><strong>3. BALANCE.</strong> The remaining balance of ${balance} is due at closing on or before <strong>${closingDate}</strong>.</p>
      <p><strong>4. SURVEY & INSPECTION.</strong> Buyer has the right to conduct a marine survey and sea trial at Buyer's expense. ${t.surveyDeadline ? 'Survey must be completed by ' + t.surveyDeadline + '.' : ''}</p>
      <p><strong>5. TITLE.</strong> Seller warrants clear and marketable title, free of all liens and encumbrances.</p>
      <p><strong>6. CLOSING.</strong> Closing shall occur on or before ${closingDate}. At closing, Seller shall deliver Bill of Sale, title documents, and keys. Buyer shall deliver remaining funds.</p>
      <p><strong>7. DEFAULT.</strong> If Buyer defaults, Seller may retain deposit as liquidated damages. If Seller defaults, deposit shall be returned to Buyer.</p>
      <p><strong>8. CONDITION.</strong> Vessel is sold "${v.condition === 'new' ? 'NEW' : 'AS-IS'}" unless otherwise agreed in writing.</p>
      <p><strong>9. GOVERNING LAW.</strong> This Agreement shall be governed by the laws of the State of ${s.state || '________'}.</p>
      <div style="margin-top:32px;display:grid;grid-template-columns:1fr 1fr;gap:24px">
        <div><p style="border-top:1px solid #333;padding-top:4px;font-size:12px">${sellerName}<br/>Seller Signature / Date</p></div>
        <div><p style="border-top:1px solid #333;padding-top:4px;font-size:12px">${buyerName}<br/>Buyer Signature / Date</p></div>
      </div>`,

    'bill-of-sale': `${header}
      <p>For and in consideration of <strong>${price}</strong>, receipt of which is hereby acknowledged, the undersigned Seller:</p>
      <p><strong>${sellerName}</strong></p>
      <p>does hereby sell, transfer, and convey to Buyer:</p>
      <p><strong>${buyerName}</strong></p>
      <p>the following described vessel:</p>
      <p><strong>${vessel}</strong><br/>Hull Identification Number: ${hin}<br/>Length: ${v.length || '____'} feet<br/>Current Location: ${v.location || '________'}</p>
      <p>together with all equipment, gear, and accessories currently aboard or belonging to said vessel.</p>
      <p>Seller warrants that said vessel is free and clear of all liens, claims, and encumbrances, and that Seller has full right and authority to sell and transfer title.</p>
      <p>Seller further warrants they will defend the title against all claims and demands.</p>
      <div style="margin-top:32px;display:grid;grid-template-columns:1fr 1fr;gap:24px">
        <div><p style="border-top:1px solid #333;padding-top:4px;font-size:12px">${sellerName}<br/>Seller / Date</p></div>
        <div><p style="border-top:1px solid #333;padding-top:4px;font-size:12px">${buyerName}<br/>Buyer / Date</p></div>
      </div>`,

    'closing-statement': `${header}
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tr style="background:#f5f0e8"><td colspan="2" style="padding:8px;font-weight:bold">Vessel: ${vessel} | HIN: ${hin}</td></tr>
        <tr><td style="padding:6px;border-bottom:1px solid #eee">Purchase Price</td><td style="padding:6px;border-bottom:1px solid #eee;text-align:right;font-weight:bold">${price}</td></tr>
        <tr><td style="padding:6px;border-bottom:1px solid #eee">Deposit Paid</td><td style="padding:6px;border-bottom:1px solid #eee;text-align:right">- ${deposit}</td></tr>
        <tr style="background:#f5f0e8"><td style="padding:8px;font-weight:bold">Balance Due at Closing</td><td style="padding:8px;text-align:right;font-weight:bold;color:#1a8a7d;font-size:16px">${balance}</td></tr>
      </table>
      <p style="margin-top:16px"><strong>Closing Date:</strong> ${closingDate}</p>
      <p><strong>Buyer:</strong> ${buyerName}</p>
      <p><strong>Seller:</strong> ${sellerName}</p>
      <p>Both parties acknowledge the above figures are accurate and agree to the terms of closing.</p>
      <div style="margin-top:32px;display:grid;grid-template-columns:1fr 1fr;gap:24px">
        <div><p style="border-top:1px solid #333;padding-top:4px;font-size:12px">${sellerName}<br/>Seller / Date</p></div>
        <div><p style="border-top:1px solid #333;padding-top:4px;font-size:12px">${buyerName}<br/>Buyer / Date</p></div>
      </div>`,
  };

  // Generic template for docs without specific content
  const generic = `${header}
    <p>This document pertains to the transaction between <strong>${sellerName}</strong> (Seller) and <strong>${buyerName}</strong> (Buyer) for the vessel:</p>
    <p><strong>${vessel}</strong> — HIN: ${hin}</p>
    <p>Purchase Price: ${price} | Deposit: ${deposit} | Closing Date: ${closingDate}</p>
    <hr/>
    <p><em>This is a template document. The full legal content for "${doc.name}" will be populated based on your transaction details and applicable state laws.</em></p>
    <p>Both parties acknowledge and agree to the terms set forth in this document.</p>
    <div style="margin-top:32px;display:grid;grid-template-columns:1fr 1fr;gap:24px">
      <div><p style="border-top:1px solid #333;padding-top:4px;font-size:12px">${sellerName}<br/>Seller / Date</p></div>
      <div><p style="border-top:1px solid #333;padding-top:4px;font-size:12px">${buyerName}<br/>Buyer / Date</p></div>
    </div>`;

  return templates[doc.id] || generic;
}
