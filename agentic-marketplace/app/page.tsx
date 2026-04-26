export default function Home() {
  return (
    <main className="min-h-screen bg-yellow-50 flex items-center justify-center px-6">
      <div className="bg-amber-50 p-12 rounded-3xl shadow-xl max-w-xl w-full text-center">

        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Agentic Marketplace
        </h1>

        <p className="text-gray-600 mb-10">
          AI-powered escrow, contract arbitration, and trust infrastructure
          for secure cross-border trade.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">

          <a
            href="/signup"
            className="px-8 py-3 bg-amber-400 text-gray-900 font-medium rounded-xl
                       hover:bg-amber-500 transition duration-200"
          >
            Get Started
          </a>

          <a
            href="/login"
            className="px-8 py-3 border border-amber-400 text-gray-800 font-medium
                       rounded-xl hover:bg-amber-100 transition duration-200"
          >
            Login
          </a>

        </div>

      </div>
    </main>
  )
}