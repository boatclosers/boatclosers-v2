// ============================================================
// TransactionsPage.jsx — Drop-in replacement for boatclosers.com
//
// HOW TO ADD TO YOUR PROJECT:
//   1. Copy this file to: src/pages/TransactionsPage.jsx
//   2. In your App.jsx router, add:
//        import TransactionsPage from './pages/TransactionsPage'
//        <Route path="/transactions" element={<TransactionsPage />} />
//   3. Link to it wherever you have the old transactions link:
//        <Link to="/transactions">My Transactions</Link>
// ============================================================

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Anchor, DollarSign, ArrowRight, Clock, CheckCircle,
  AlertCircle, XCircle, ChevronRight, Loader, Plus,
  RotateCcw, FileText, Shield, Waves
} from 'lucide-react'
import { supabase } from '../lib/supabase'

// ─── helpers ───────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)

const fmtDate = (d) => {
  if (!d) return ''
  const date = new Date(d)
  const now = new Date()
  const diffDays = Math.floor((now - date) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const STEPS = ['Offer', 'Agreement', 'Due Diligence', 'Closing', 'Done']

const statusMeta = (status, paymentStatus) => {
  if (status === 'offer_pending')
    return { label: 'Offer pending', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock, step: 0 }
  if (status === 'offer_accepted' && paymentStatus !== 'paid')
    return { label: 'Pay to activate', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertCircle, step: 0 }
  if (status === 'offer_accepted')
    return { label: 'Accepted', color: 'bg-teal-50 text-teal-700 border-teal-200', icon: CheckCircle, step: 1 }
  if (status === 'in_escrow')
    return { label: 'In escrow', color: 'bg-teal-50 text-teal-700 border-teal-200', icon: Shield, step: 1 }
  if (status === 'due_diligence')
    return { label: 'Due diligence', color: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: FileText, step: 2 }
  if (status === 'pending_closing')
    return { label: 'Closing', color: 'bg-violet-50 text-violet-700 border-violet-200', icon: FileText, step: 3 }
  if (status === 'completed')
    return { label: 'Closed', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle, step: 4 }
  if (status === 'offer_rejected' || status === 'cancelled')
    return { label: 'Declined', color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle, step: -1 }
  return { label: status, color: 'bg-gray-100 text-gray-600 border-gray-200', icon: Clock, step: 0 }
}

// ─── sub-components ─────────────────────────────────────────

function StatusBadge({ status, paymentStatus }) {
  const meta = statusMeta(status, paymentStatus)
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${meta.color}`}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  )
}

function ProgressBar({ status, paymentStatus }) {
  const meta = statusMeta(status, paymentStatus)
  const active = meta.step
  if (active < 0) return null
  return (
    <div className="flex items-center gap-0 w-full mt-3 mb-1">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-2.5 h-2.5 rounded-full transition-all ${
              i < active ? 'bg-teal-500' :
              i === active ? 'bg-teal-600 ring-2 ring-teal-100' :
              'bg-gray-200'
            }`} />
            <span className={`text-[9px] font-medium whitespace-nowrap ${
              i === active ? 'text-teal-700' :
              i < active ? 'text-teal-500' :
              'text-gray-400'
            }`}>{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px flex-1 mx-1 -mt-3 ${i < active ? 'bg-teal-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Seller Tab ──────────────────────────────────────────────
function SellerTab({ listing, offers, loading }) {
  if (loading) return <TabLoader />

  const newOffers = offers.filter(o => o.status === 'offer_pending')
  const activeDeals = offers.filter(o => !['offer_pending', 'offer_rejected', 'cancelled'].includes(o.status))
  const pastOffers = offers.filter(o => ['offer_rejected', 'cancelled'].includes(o.status))

  return (
    <div className="space-y-6">
      {/* Your boat card */}
      {listing ? (
        <div className="rounded-2xl overflow-hidden border border-teal-100">
          <div className="bg-gradient-to-br from-navy-900 to-teal-800 p-5 text-white"
               style={{ background: 'linear-gradient(135deg, #0d2137 0%, #0a4a3a 100%)' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-teal-300 mb-1">Your listing</p>
                <h2 className="text-xl font-bold text-white">
                  {listing.year} {listing.make} {listing.model}
                </h2>
                {listing.name && (
                  <p className="text-sm text-teal-200 mt-0.5">"{listing.name}"</p>
                )}
              </div>
              <Waves className="w-8 h-8 text-teal-400 opacity-60" />
            </div>
            <div className="flex gap-6 mt-4">
              <div>
                <p className="text-xs text-teal-400">Asking price</p>
                <p className="text-lg font-bold text-white">{fmt(listing.asking_price || listing.price)}</p>
              </div>
              <div>
                <p className="text-xs text-teal-400">Offers received</p>
                <p className="text-lg font-bold text-white">{offers.length}</p>
              </div>
              <div>
                <p className="text-xs text-teal-400">Active deals</p>
                <p className="text-lg font-bold text-white">{activeDeals.length}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <EmptyListing />
      )}

      {/* New offers inbox */}
      {newOffers.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">New offers</h3>
            <span className="bg-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {newOffers.length}
            </span>
          </div>
          <div className="space-y-3">
            {newOffers.map(offer => (
              <SellerOfferCard key={offer.id} offer={offer} highlight />
            ))}
          </div>
        </section>
      )}

      {/* Active deals */}
      {activeDeals.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">Active deals</h3>
          <div className="space-y-3">
            {activeDeals.map(offer => (
              <SellerOfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </section>
      )}

      {/* No offers yet */}
      {offers.length === 0 && listing && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-600">Waiting for offers</p>
          <p className="text-sm text-gray-400 mt-1">Share your listing link to start receiving offers</p>
          {listing.share_token && (
            <button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/offer/${listing.share_token}`)}
              className="mt-4 text-sm font-medium text-teal-600 border border-teal-200 px-4 py-2 rounded-lg hover:bg-teal-50 transition"
            >
              Copy listing link
            </button>
          )}
        </div>
      )}

      {/* Past / declined */}
      {pastOffers.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Past offers</h3>
          <div className="space-y-2 opacity-60">
            {pastOffers.map(offer => (
              <SellerOfferCard key={offer.id} offer={offer} muted />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SellerOfferCard({ offer, highlight, muted }) {
  const buyerName = offer.buyer?.name || offer.buyer?.email || 'Buyer'
  const price = offer.offer_price || offer.terms?.purchase_price

  return (
    <div className={`bg-white rounded-xl border transition ${
      highlight ? 'border-teal-200 shadow-sm shadow-teal-50' : 'border-gray-100'
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0 text-sm font-bold text-teal-700">
              {buyerName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{buyerName}</p>
              <p className="text-xs text-gray-400">{fmtDate(offer.created_at)}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            {price && <p className="font-bold text-gray-900">{fmt(price)}</p>}
            <StatusBadge status={offer.status} paymentStatus={offer.payment_status} />
          </div>
        </div>

        {offer.status === 'offer_pending' && !muted && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
            <button className="flex-1 py-2 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              Decline
            </button>
            <button className="flex-1 py-2 text-xs font-semibold text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition">
              Counter
            </button>
            <Link
              to={`/transaction/${offer.id}`}
              className="flex-1 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition text-center"
            >
              Accept →
            </Link>
          </div>
        )}

        {!['offer_pending', 'offer_rejected', 'cancelled'].includes(offer.status) && (
          <Link
            to={`/transaction/${offer.id}`}
            className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 text-sm font-semibold text-teal-600 hover:text-teal-700"
          >
            Continue deal <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  )
}

function EmptyListing() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
      <Anchor className="w-10 h-10 text-gray-300 mx-auto mb-3" />
      <p className="font-semibold text-gray-600">No listing yet</p>
      <p className="text-sm text-gray-400 mt-1 mb-4">List your boat to start receiving offers</p>
      <Link
        to="/sell"
        className="inline-flex items-center gap-2 bg-teal-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-700 transition"
      >
        <Plus className="w-4 h-4" /> List my boat
      </Link>
    </div>
  )
}

// ─── Buyer Tab ───────────────────────────────────────────────
function BuyerTab({ activeDeal, allOffers, loading }) {
  if (loading) return <TabLoader />

  const pendingOffers = allOffers.filter(o => o.status === 'offer_pending')
  const declinedOffers = allOffers.filter(o => ['offer_rejected', 'cancelled'].includes(o.status))

  return (
    <div className="space-y-6">
      {/* Active deal — featured */}
      {activeDeal ? (
        <section>
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">Active deal</h3>
          <ActiveDealCard deal={activeDeal} />
        </section>
      ) : allOffers.length === 0 ? (
        <EmptyBuyer />
      ) : null}

      {/* Pending offers waiting on seller */}
      {pendingOffers.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">
            Offers waiting on seller
          </h3>
          <div className="space-y-3">
            {pendingOffers.map(o => <BuyerOfferCard key={o.id} offer={o} />)}
          </div>
        </section>
      )}

      {/* Declined */}
      {declinedOffers.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Past offers</h3>
          <div className="space-y-2 opacity-60">
            {declinedOffers.map(o => <BuyerOfferCard key={o.id} offer={o} />)}
          </div>
        </section>
      )}

      {/* Make new offer CTA */}
      <div className="pt-2">
        <Link
          to="/buy"
          className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-teal-200 text-teal-600 text-sm font-semibold rounded-xl hover:bg-teal-50 transition"
        >
          <Plus className="w-4 h-4" /> Make a new offer
        </Link>
      </div>
    </div>
  )
}

function ActiveDealCard({ deal }) {
  const meta = statusMeta(deal.status, deal.payment_status)
  const boatName = deal.boats
    ? `${deal.boats.year || ''} ${deal.boats.make || ''} ${deal.boats.model || ''}`.trim()
    : deal.vessel_name || 'Vessel'
  const sellerName = deal.seller?.name || deal.seller?.email || 'Seller'

  const nextActionMap = {
    offer_accepted: 'Purchase agreement ready — review and sign',
    in_escrow: 'Escrow confirmed — schedule your survey',
    due_diligence: 'Survey in progress — check due diligence items',
    pending_closing: 'All clear — final documents ready to sign',
  }
  const nextAction = nextActionMap[deal.status]

  return (
    <div className="rounded-2xl overflow-hidden border border-teal-100 shadow-sm">
      <div className="p-5"
           style={{ background: 'linear-gradient(135deg, #0d2137 0%, #0a4a3a 100%)' }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-teal-300 uppercase tracking-widest mb-1">Active deal</p>
            <h2 className="text-lg font-bold text-white">{boatName}</h2>
            <p className="text-sm text-teal-200">Seller: {sellerName}</p>
          </div>
          <p className="text-xl font-bold text-white">{fmt(deal.offer_price)}</p>
        </div>
        <ProgressBar status={deal.status} paymentStatus={deal.payment_status} />
      </div>
      <div className="bg-white p-4">
        {nextAction && (
          <div className="flex items-center gap-2 mb-3 text-sm">
            <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">→</span>
            <span className="text-teal-700 font-medium">{nextAction}</span>
          </div>
        )}
        <Link
          to={`/transaction/${deal.id}`}
          className="flex items-center justify-center gap-2 w-full py-3 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 transition"
        >
          Continue deal <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

function BuyerOfferCard({ offer }) {
  const boatName = offer.boats
    ? `${offer.boats.year || ''} ${offer.boats.make || ''} ${offer.boats.model || ''}`.trim()
    : offer.vessel_name || 'Vessel'
  const sellerName = offer.seller?.name || offer.seller?.email || 'Seller'
  const price = offer.offer_price || offer.terms?.purchase_price

  const isPending = offer.status === 'offer_pending'
  const expiry = offer.expires_at ? new Date(offer.expires_at) : null
  const hoursLeft = expiry ? Math.max(0, Math.round((expiry - Date.now()) / 3600000)) : null

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{boatName}</p>
          <p className="text-xs text-gray-400 mt-0.5">Seller: {sellerName} · {fmtDate(offer.created_at)}</p>
          {isPending && hoursLeft !== null && (
            <p className={`text-xs mt-1 font-medium ${hoursLeft < 6 ? 'text-red-500' : 'text-amber-500'}`}>
              {hoursLeft > 0 ? `Expires in ${hoursLeft}h` : 'Expired'}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {price && <p className="font-bold text-gray-900 text-sm">{fmt(price)}</p>}
          <StatusBadge status={offer.status} paymentStatus={offer.payment_status} />
        </div>
      </div>
      {offer.status === 'offer_accepted' && offer.payment_status !== 'paid' && (
        <Link
          to={`/transaction/${offer.id}/pay`}
          className="flex items-center justify-center gap-2 mt-3 w-full py-2 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 transition"
        >
          Pay platform fee to activate →
        </Link>
      )}
    </div>
  )
}

function EmptyBuyer() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
      <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-3" />
      <p className="font-semibold text-gray-600">No offers yet</p>
      <p className="text-sm text-gray-400 mt-1 mb-4">Find a boat and make your first offer</p>
      <Link
        to="/buy"
        className="inline-flex items-center gap-2 bg-teal-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-700 transition"
      >
        <Plus className="w-4 h-4" /> Start an offer
      </Link>
    </div>
  )
}

function TabLoader() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader className="w-6 h-6 animate-spin text-teal-500" />
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────
export default function TransactionsPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('buyer') // 'seller' | 'buyer'
  const [loading, setLoading] = useState(true)

  // Seller data
  const [listing, setListing] = useState(null)
  const [sellerOffers, setSellerOffers] = useState([])

  // Buyer data
  const [activeDeal, setActiveDeal] = useState(null)
  const [buyerOffers, setBuyerOffers] = useState([])

  // Role detection
  const [hasSeller, setHasSeller] = useState(false)
  const [hasBuyer, setHasBuyer] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { navigate('/login'); return }
      setUser(u)

      // ── Seller side: load their boat listing + all offers on it ──
      const { data: boats } = await supabase
        .from('boats')
        .select('*')
        .eq('seller_id', u.id)
        .order('created_at', { ascending: false })
        .limit(1)

      const myBoat = boats?.[0] || null
      setListing(myBoat)

      if (myBoat) {
        // Get all offers/transactions where this user is the seller
        const { data: incoming } = await supabase
          .from('transactions')
          .select(`
            id, status, payment_status, offer_price, created_at, expires_at,
            vessel_name, terms,
            boats(year, make, model),
            buyer:profiles!transactions_buyer_id_fkey(name, email)
          `)
          .eq('seller_id', u.id)
          .order('created_at', { ascending: false })

        const offers = incoming || []
        setSellerOffers(offers)
        if (offers.length > 0) setHasSeller(true)
      }

      // ── Buyer side: all offers this user submitted ──
      const { data: myOffers } = await supabase
        .from('transactions')
        .select(`
          id, status, payment_status, offer_price, created_at, expires_at,
          vessel_name, terms,
          boats(year, make, model),
          seller:profiles!transactions_seller_id_fkey(name, email)
        `)
        .eq('buyer_id', u.id)
        .order('created_at', { ascending: false })

      const allBuyerOffers = myOffers || []
      setBuyerOffers(allBuyerOffers)

      if (allBuyerOffers.length > 0) setHasBuyer(true)

      // Active deal = paid, in-progress
      const active = allBuyerOffers.find(t =>
        t.payment_status === 'paid' &&
        !['completed', 'cancelled', 'offer_rejected'].includes(t.status)
      )
      setActiveDeal(active || null)

      // Default to the tab that has activity
      if (allBuyerOffers.length > 0) setTab('buyer')
      else if (myBoat) setTab('seller')

    } catch (err) {
      console.error('TransactionsPage load error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-gray-50">
        <Loader className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Transactions</h1>
          <p className="text-sm text-gray-400 mt-1">{user?.email}</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border border-gray-100 rounded-2xl p-1 mb-6 shadow-sm">
          <button
            onClick={() => setTab('buyer')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition ${
              tab === 'buyer'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            My Offers
            {buyerOffers.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                tab === 'buyer' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}>{buyerOffers.length}</span>
            )}
          </button>
          <button
            onClick={() => setTab('seller')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition ${
              tab === 'seller'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Anchor className="w-4 h-4" />
            My Listing
            {sellerOffers.filter(o => o.status === 'offer_pending').length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                tab === 'seller' ? 'bg-pink-400 text-white' : 'bg-pink-500 text-white'
              }`}>
                {sellerOffers.filter(o => o.status === 'offer_pending').length}
              </span>
            )}
          </button>
        </div>

        {/* Tab content */}
        {tab === 'seller' ? (
          <SellerTab listing={listing} offers={sellerOffers} loading={false} />
        ) : (
          <BuyerTab activeDeal={activeDeal} allOffers={buyerOffers} loading={false} />
        )}

      </div>
    </div>
  )
}
