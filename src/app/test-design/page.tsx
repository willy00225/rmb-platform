export default function TestDesign() {
  return (
    <div className="min-h-screen bg-brand-500 flex items-center justify-center">
      <div className="p-10 bg-white/20 backdrop-blur-lg rounded-3xl border border-white/30 shadow-2xl">
        <h1 className="text-4xl font-bold text-white drop-shadow-lg">
          Test Style
        </h1>
        <button className="mt-4 px-6 py-3 bg-white text-brand-800 font-semibold rounded-xl hover:bg-brand-100 transition">
          Bouton test
        </button>
      </div>
    </div>
  );
}