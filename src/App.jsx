// src/App.jsx
import { useState } from "react";
import { scenariosData } from "./mockdata";
import "./App.css";

export default function App() {
  const [activeScenario, setActiveScenario] = useState(null);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [behaviorLogs, setBehaviorLogs] = useState([]);

  // Memulai skenario yang dipilih dari katalog
  const startScenario = (scenario) => {
    const firstNode = scenario.nodes[scenario.initialNodeId];
    setActiveScenario(scenario);
    setCurrentNodeId(scenario.initialNodeId);
    setChatHistory(firstNode.messages || []);
    setTotalScore(0);
    setBehaviorLogs([]);
  };

    const handleSelectChoice = (choice) => {
    const userBubble = {
      id: `user-${choice.id}-${chatHistory.length}`,
      sender: "Kamu (Saksi)",
      role: choice.behaviorTag,
      time: "Sekarang",
      text: choice.text,
      isUser: true,
    };

    const nextNode = activeScenario.nodes[choice.nextNodeId];
    const nextMessages = nextNode?.messages || [];

    setChatHistory((prev) => [...prev, userBubble, ...nextMessages]);
    setTotalScore((prev) => prev + choice.score);
    setBehaviorLogs((prev) => [
      ...prev,
      { tag: choice.behaviorTag, score: choice.score, text: choice.text },
    ]);
    setCurrentNodeId(choice.nextNodeId);
  };

  const resetToCatalog = () => {
    setActiveScenario(null);
    setCurrentNodeId(null);
    setChatHistory([]);
  };

  const currentNode = activeScenario
    ? activeScenario.nodes[currentNodeId]
    : null;

  return (
    <div className="app-container">
      {/* Header Navigasi */}
      <header className="navbar">
        <div>
          <span className="brand-badge">CAPSTONE SI</span>
          <h1 className="brand-title">RuangRespek</h1>
        </div>
        {activeScenario && (
          <div className="score-indicator">
            <span>Skor Empati: <strong>{totalScore} Poin</strong></span>
            <button className="btn-outline" onClick={resetToCatalog}>
              ← Kembali ke Katalog
            </button>
          </div>
        )}
      </header>

      {/* HALAMAN 1: Katalog Skenario */}
      {!activeScenario && (
        <main className="catalog-section">
          <div className="section-header">
            <h2>Pilih Skenario Simulasi Bystander</h2>
            <p>
              Latih pengambilan keputusanmu saat menyaksikan insiden perundungan
              siber atau penyebaran data pribadi (doxing) di grup percakapan.
            </p>
          </div>

          <div className="scenario-grid">
            {scenariosData.map((item) => (
              <div key={item.id} className="scenario-card">
                <div className="card-meta">
                  <span className="pill">{item.category}</span>
                  <span className="difficulty">{item.difficulty}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <button
                  className="btn-primary"
                  onClick={() => startScenario(item)}
                >
                  Mulai Simulasi →
                </button>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* HALAMAN 2: Ruang Simulasi Chat Bercabang */}
      {activeScenario && currentNode && (
        <main className="simulator-layout">
          <div className="chat-window">
            <div className="chat-header">
              <strong>{activeScenario.groupName}</strong>
              <span>Topik: {activeScenario.title}</span>
            </div>

            <div className="chat-body">
              {chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-bubble-wrapper ${
                    msg.isUser
                      ? "align-right"
                      : msg.isSystem
                      ? "align-center"
                      : "align-left"
                  }`}
                >
                  <div
                    className={`chat-bubble ${
                      msg.isUser
                        ? "bubble-user"
                        : msg.isSystem
                        ? "bubble-system"
                        : msg.isAlert
                        ? "bubble-alert"
                        : "bubble-other"
                    }`}
                  >
                    {!msg.isSystem && (
                      <div className="bubble-meta">
                        <strong>{msg.sender}</strong>
                        <span>{msg.role} • {msg.time}</span>
                      </div>
                    )}
                    <p>{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Area Pilihan Tombol atau Kartu Evaluasi Akhir */}
            {!currentNode.isEnding ? (
              <div className="choices-panel">
                <p className="choices-prompt">
                  Pilih tindakanmu sebagai anggota grup:
                </p>
                <div className="choices-list">
                  {currentNode.choices.map((choice) => (
                    <button
                      key={choice.id}
                      className="choice-btn"
                      onClick={() => handleSelectChoice(choice)}
                    >
                      {choice.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="evaluation-card">
                <span className="pill-ending">{currentNode.endingType}</span>
                <h3>Evaluasi Keputusan Simulasi</h3>
                <p>{currentNode.evaluationText}</p>

                <div className="behavior-summary">
                  <h4>Rekaman Jejak Perilaku (Data Analytics SI):</h4>
                  <ul>
                    {behaviorLogs.map((log, index) => (
                      <li key={index}>
                        Tahap {index + 1}: <strong>{log.tag}</strong> (
                        {log.score >= 0 ? `+${log.score}` : log.score} poin)
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="eval-actions">
                  <button
                    className="btn-primary"
                    onClick={() => startScenario(activeScenario)}
                  >
                    Ulangi Skenario Ini
                  </button>
                  <button className="btn-outline" onClick={resetToCatalog}>
                    Pilih Kasus Lain
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}