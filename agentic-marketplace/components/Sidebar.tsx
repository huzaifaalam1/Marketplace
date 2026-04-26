'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Sidebar({ sidebarOpen, setSidebarOpen, wallet, onAddFunds }: any) {
  const router = useRouter()
  const [amount, setAmount] = useState('')

  const [dealOpen, setDealOpen] = useState(false)
  const [productOpen, setProductOpen] = useState(false)

  const handleDeposit = () => {
    const parsed = Number(amount)
    if (parsed > 0) {
      onAddFunds(parsed)
      setAmount('')
    }
  }

  return (
    <>
      {/* OVERLAY */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/30 z-40"
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-amber-50 shadow-xl p-6 z-50
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >

        {/* CLOSE BUTTON */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-2xl font-bold"
        >
          ✕
        </button>

        <h2 className="text-lg font-semibold mb-6 text-gray-800">
          Marketplace
        </h2>

        {/* WALLET */}
        {wallet && (
          <div className="bg-white rounded-2xl p-4 shadow-md mb-6">
            <p className="text-sm text-gray-500">Wallet</p>

            <p className="text-2xl font-semibold text-gray-800 mt-1">
              ${wallet.available_balance?.toFixed(2) || '0.00'}
            </p>

            <p className="text-xs text-gray-500">Available Balance</p>

            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-3 w-full border rounded-lg p-2 text-sm"
            />

            <button
              onClick={handleDeposit}
              className="mt-2 w-full bg-amber-400 hover:bg-amber-500 text-gray-900 py-2 rounded-lg text-sm font-medium"
            >
              Add Funds
            </button>
          </div>
        )}

        {/* NAVIGATION */}
        <div className="flex flex-col gap-2">

          {/* HOME */}
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-100 hover:text-amber-700"
          >
            Home
          </button>

          {/* INITIATE DEALS */}
          <div>
            <button
              onClick={() => {
                setDealOpen(!dealOpen)
                setProductOpen(false)
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-100 hover:text-amber-700 flex justify-between items-center"
            >
              Initiate Deals
              <span>{dealOpen ? '▾' : '▸'}</span>
            </button>

            {dealOpen && (
              <div className="ml-4 mt-1 flex flex-col gap-1">
                <button
                  onClick={() => router.push('/dashboard/find-buyers')}
                  className="text-left px-3 py-2 rounded-lg hover:bg-amber-100"
                >
                  Find Buyers
                </button>

                <button
                  onClick={() => router.push('/dashboard/find-suppliers')}
                  className="text-left px-3 py-2 rounded-lg hover:bg-amber-100"
                >
                  Find Suppliers
                </button>
              </div>
            )}
          </div>

          {/* ACTIVE DEALS */}
          <button
            onClick={() => router.push('/dashboard/active-deals')}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-100 hover:text-amber-700">
            Active Deals
          </button>

          {/* ANALYTICS */}
          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-100 hover:text-amber-700">
            Business Analytics
          </button>

          {/* ADD PRODUCTS */}
          <div>
            <button
              onClick={() => {
                setProductOpen(!productOpen)
                setDealOpen(false)
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-100 hover:text-amber-700 flex justify-between items-center"
            >
              Add Products
              <span>{productOpen ? '▾' : '▸'}</span>
            </button>

            {productOpen && (
              <div className="ml-4 mt-1 flex flex-col gap-1">
                <button
                  onClick={() => router.push('/dashboard/create-supplier')}
                  className="text-left px-3 py-2 rounded-lg hover:bg-amber-100"
                >
                  Create Listing
                </button>

                <button
                  onClick={() => router.push('/dashboard/create-buyer')}
                  className="text-left px-3 py-2 rounded-lg hover:bg-amber-100"
                >
                  Create Request
                </button>

                <button
                  onClick={() => router.push('/dashboard/my-listings')}
                  className="text-left px-3 py-2 rounded-lg hover:bg-amber-100"
                >
                  Edit Requests/Listings
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </>
  )
}