import React, { useState } from "react";
import ReservaUrbano from "../pages/ReservaUrbano";

export default function HomeUrbano() {
  const [showModal, setShowModal] = useState(true);
  const [activeSection, setActiveSection] = useState("reserva");

  return (
    <div className="h-screen w-full flex flex-col bg-gray-100">
      {/* TOP BAR */}
      <header className="w-full h-16 bg-white shadow flex items-center justify-between px-4">
        {/* LOGO AREA */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-orange-500 rounded-full" />
          <h1 className="text-xl font-bold text-gray-700">TransporteUrbano</h1>
        </div>

        {/* MENU */}
        <nav className="flex gap-4 text-gray-600 font-medium">
          <button onClick={() => setActiveSection("motorista")}>Motorista Login</button>
          <button onClick={() => setActiveSection("cidade")}>Cidade</button>
          <button onClick={() => setActiveSection("transporte")}>Transporte</button>
          <button onClick={() => setActiveSection("reutilizar")}>Reutilizar</button>
        </nav>
      </header>

      {/* AD / BANNER SECTION */}
      <div className="w-full h-40 bg-gray-300 flex items-center justify-center text-lg text-gray-600">
        <p>📢 Espaço para anúncio — Imagem ou Vídeo rotativo</p>
      </div>

      {/* FLOATING MODAL */}
      {showModal && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl rounded-t-2xl p-4 h-[60vh] overflow-auto">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-700 capitalize">
              {activeSection === "reserva" && "Comprar Bilhete"}
              {activeSection === "motorista" && "Login Motorista"}
              {activeSection === "cidade" && "Selecionar Cidade"}
              {activeSection === "transporte" && "Tipo de Transporte"}
              {activeSection === "reutilizar" && "Reutilizar Bilhete"}
            </h2>

            <button
              className="text-gray-500 text-xl"
              onClick={() => setShowModal(false)}
            >
              ▼
            </button>
          </div>

          {/* CONTENT RENDER */}
          {activeSection === "reserva" && <ReservaUrbano />}
          {activeSection !== "reserva" && (
            <div className="text-center text-gray-500 mt-10">
              <p>Conteúdo desta secção será integrado.</p>
            </div>
          )}
        </div>
      )}

      {/* BUTTON TO REOPEN MODAL */}
      {!showModal && (
        <button
          className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-6 py-3 rounded-full shadow-xl"
          onClick={() => setShowModal(true)}
        >
          Abrir opções
        </button>
      )}
    </div>
  );
}
