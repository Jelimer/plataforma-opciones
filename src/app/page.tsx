import StrategyBuilder from "@/app/components/StrategyBuilder";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-gray-100 text-gray-800">
      <header className="w-full bg-gradient-to-r from-blue-800 to-blue-600 text-white p-5 text-center shadow-md">
        <h1 className="text-3xl font-bold">Constructor Dinámico de Estrategias</h1>
        <p className="opacity-90">Crea y analiza cualquier estrategia de opciones en tiempo real</p>
      </header>
      <div className="flex flex-1 w-full p-4">
        <StrategyBuilder />
      </div>
      <footer className="w-full bg-gray-800 text-white p-4 text-center text-sm">
        <p>Modernizado con Next.js y Gemini</p>
      </footer>
    </main>
  );
}