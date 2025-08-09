import React, { useState, useEffect } from "react";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { format } from "date-fns";

import { app } from "./firebaseConfig";

// Ícones (você pode instalar lucide-react ou usar outros, aqui vai simplificado)
const GoogleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="20" fill="#4285F4" />
  </svg>
);

const TrashIcon = () => (
  <svg width="24" height="24" fill="red" viewBox="0 0 24 24">
    <path
      d="M3 6h18M9 6v12M15 6v12M6 6l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12"
      stroke="red"
      strokeWidth="2"
    />
  </svg>
);

const auth = getAuth(app);
const db = getFirestore(app);

const ambientes = [
  { id: "informatica1", nome: "Laboratório de Informática I" },
  { id: "informatica2", nome: "Laboratório de Informática II" },
  { id: "salaVideo", nome: "Sala de Vídeo" },
  { id: "labCiencias", nome: "Laboratório de Ciências" },
  { id: "biblioteca", nome: "Biblioteca" },
];

// Horários de aula, sem os intervalos
const horarios = [
  "07:15 - 08:05",
  "08:05 - 08:55",
  "09:15 - 10:05",
  "10:05 - 10:55",
  "10:55 - 11:45",
  "13:10 - 14:00",
  "14:00 - 14:50",
  "15:10 - 16:00",
  "16:00 - 16:50",
];

const turmas = [
  "1ª Série A (Integral)",
  "1ª Série B (Integral)",
  "2ª Série A (Integral)",
  "2ª Série B (Integral)",
  "3ª Série A (Integral)",
  "3ª Série B (Integral)",
];

const professores = [
  "ALBERTO JUNIOR GONCALVES RIBEIRO",
  "ANA ANDREIA DE ARAUJO GOMES",
  "ANA LIVIA MARIA MACEDO E CAMPOS",
  "ANTONIO GENILSON VIEIRA DE PAIVA",
  "AVELINO GOMES FERREIRA NETO",
  "DAIANE OLIVEIRA MIRANDA",
  "DENILSON SAMPAIO SOARES",
  "DOMINGOS MESQUITA ALVES",
  "ELAINE CRISTINA SALES BEZERRA DA SILVA",
  "FRANCISCA MIRELY SAMPAIO CARVALHO",
  "FRANCISCO ALAN DOS SANTOS ALMEIDA",
  "FRANCISCO CLEIGIVAN DA ROCHA MARTINS",
  "GABRIEL CAMELO DA COSTA",
  "JOSE IRAN PEREIRA VERAS",
  "LUIZ ROGEAN VIEIRA BATISTA",
  "MARIA DO MONTE SERRAT VERAS DE MESQUITA",
  "MARIA GLEYCIENE SOARES DE SOUZA",
  "WENITHON CARLOS DE SOUSA",
].sort();

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [dataSelecionada, setDataSelecionada] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [ambienteSelecionado, setAmbienteSelecionado] = useState("");
  const [horariosSelecionados, setHorariosSelecionados] = useState([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [professorSelecionado, setProfessorSelecionado] = useState("");

  const [reservas, setReservas] = useState([]);
  const [loadingReservas, setLoadingReservas] = useState(false);
  const [relatorioReservas, setRelatorioReservas] = useState([]);

  const [mensagem, setMensagem] = useState(null);

  // Observa login do usuário
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (usuario) => {
      setUser(usuario);
      setLoadingUser(false);
    });
    return () => unsub();
  }, []);

  // Busca reservas para o ambiente e data selecionados
  useEffect(() => {
    if (!ambienteSelecionado || !dataSelecionada) {
      setReservas([]);
      return;
    }
    setLoadingReservas(true);
    const q = query(
      collection(db, "reservas"),
      where("ambienteId", "==", ambienteSelecionado),
      where("data", "==", dataSelecionada)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReservas(lista);
        setLoadingReservas(false);
      },
      (error) => {
        console.error("Erro ao buscar reservas:", error);
        setLoadingReservas(false);
      }
    );

    return () => unsub();
  }, [ambienteSelecionado, dataSelecionada]);

  // Novo useEffect para buscar TODAS as reservas do dia para o relatório
  useEffect(() => {
    if (!dataSelecionada) {
      setRelatorioReservas([]);
      return;
    }
    const q = query(
      collection(db, "reservas"),
      where("data", "==", dataSelecionada)
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const listaComNomes = lista.map((reserva) => ({
          ...reserva,
          nomeAmbiente:
            ambientes.find((amb) => amb.id === reserva.ambienteId)?.nome ||
            "Desconhecido",
        }));
        setRelatorioReservas(
          listaComNomes.sort((a, b) => a.horario.localeCompare(b.horario))
        );
      },
      (error) => {
        console.error("Erro ao buscar reservas para o relatório:", error);
      }
    );
    return () => unsub();
  }, [dataSelecionada]);

  const handleHorarioSelection = (horario, isChecked) => {
    if (isChecked) {
      setHorariosSelecionados([...horariosSelecionados, horario]);
    } else {
      setHorariosSelecionados(
        horariosSelecionados.filter((h) => h !== horario)
      );
    }
  };

  const loginGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch((error) => {
      setMensagem({ tipo: "erro", texto: error.message });
    });
  };

  const logout = () => {
    signOut(auth).catch((error) => {
      setMensagem({ tipo: "erro", texto: error.message });
    });
  };

  const salvarReserva = async () => {
    if (
      !ambienteSelecionado ||
      !dataSelecionada ||
      horariosSelecionados.length === 0 ||
      !turmaSelecionada ||
      !professorSelecionado
    ) {
      setMensagem({
        tipo: "erro",
        texto: "Preencha todos os campos para reservar.",
      });
      return;
    }

    const conflitos = horariosSelecionados.filter((h) =>
      reservas.some((r) => r.horario === h)
    );
    if (conflitos.length > 0) {
      setMensagem({
        tipo: "erro",
        texto: `Os seguintes horários já estão reservados: ${conflitos.join(
          ", "
        )}`,
      });
      return;
    }

    const promessasDeSalvar = horariosSelecionados.map((horario) =>
      addDoc(collection(db, "reservas"), {
        ambienteId: ambienteSelecionado,
        data: dataSelecionada,
        horario: horario,
        turma: turmaSelecionada,
        professor: professorSelecionado,
        usuarioId: user.uid,
        usuarioNome: user.displayName,
        criadoEm: new Date().toISOString(),
      })
    );

    try {
      await Promise.all(promessasDeSalvar);
      setMensagem({
        tipo: "sucesso",
        texto: "Reservas realizadas com sucesso!",
      });
      setHorariosSelecionados([]);
      setTurmaSelecionada("");
      setProfessorSelecionado("");
    } catch (error) {
      setMensagem({
        tipo: "erro",
        texto: "Erro ao salvar reservas: " + error.message,
      });
    }
  };

  const excluirReserva = async (id) => {
    try {
      await deleteDoc(doc(db, "reservas", id));
      setMensagem({ tipo: "sucesso", texto: "Reserva excluída com sucesso!" });
    } catch (error) {
      setMensagem({
        tipo: "erro",
        texto: "Erro ao excluir reserva: " + error.message,
      });
    }
  };

  if (loadingUser) return <div>Carregando...</div>;

  if (!user)
    return (
      <div
        style={{
          padding: 20,
          textAlign: "center",
          backgroundColor: "#f0f4f8",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <h1 style={{ color: "#0056b3" }}>EEMTI Jader de Figueiredo Correia</h1>
        <h2 style={{ marginBottom: "30px" }}>Agendamento de Ambientes</h2>
        <button
          onClick={loginGoogle}
          style={{
            padding: "12px 24px",
            fontSize: 16,
            cursor: "pointer",
            backgroundColor: "#4285F4",
            color: "white",
            border: "none",
            borderRadius: "5px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <GoogleIcon /> Entrar com Google
        </button>
        {mensagem && (
          <p style={{ color: "rgb(185,1,1)", marginTop: "20px" }}>
            {mensagem.texto}
          </p>
        )}
      </div>
    );

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "auto",
        padding: 20,
        backgroundColor: "#f9fafb",
        minHeight: "100vh",
        boxShadow: "0 0 10px rgba(0,0,0,0.1)",
      }}
    >
      <header
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderBottom: "2px solid #e2e8f0",
          paddingBottom: "20px",
          marginBottom: "20px",
        }}
      >
        <h1 style={{ color: "#0056b3" }}>EEMTI Jader de Figueiredo Correia</h1>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            marginTop: "10px",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: "1.2rem", color: "#333" }}>
            Olá, {user.displayName}
          </h2>
          <button
            onClick={logout}
            style={{
              cursor: "pointer",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "5px",
            }}
          >
            Sair
          </button>
        </div>
      </header>

      <section style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            gap: "20px",
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <label style={{ flex: 1, minWidth: "200px" }}>
            Ambiente:
            <select
              value={ambienteSelecionado}
              onChange={(e) => setAmbienteSelecionado(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            >
              <option value="">-- Selecione --</option>
              {ambientes.map((amb) => (
                <option key={amb.id} value={amb.id}>
                  {amb.nome}
                </option>
              ))}
            </select>
          </label>

          <label style={{ flex: 1, minWidth: "200px" }}>
            Data:
            <input
              type="date"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
          </label>
        </div>
      </section>

      {ambienteSelecionado && (
        <>
          <section
            style={{
              marginBottom: 20,
              border: "1px solid #e2e8f0",
              padding: "20px",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ color: "#0056b3", marginBottom: "15px" }}>
              Nova Reserva
            </h3>
            <div
              style={{
                display: "flex",
                gap: "20px",
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: "200px" }}>
                <label>Horários:</label>
                <div
                  style={{
                    marginTop: "5px",
                    maxHeight: "200px",
                    overflowY: "auto",
                    border: "1px solid #ccc",
                    padding: "8px",
                    borderRadius: "4px",
                    backgroundColor: "#fff",
                  }}
                >
                  {horarios.map((h, i) => {
                    const reservado = reservas.some((r) => r.horario === h);
                    const isChecked = horariosSelecionados.includes(h);
                    return (
                      <div key={i} style={{ marginBottom: "5px" }}>
                        <label>
                          <input
                            type="checkbox"
                            value={h}
                            checked={isChecked}
                            onChange={(e) =>
                              handleHorarioSelection(h, e.target.checked)
                            }
                            disabled={reservado}
                          />
                          <span
                            style={{
                              marginLeft: "8px",
                              color: reservado ? "#999" : "#000",
                            }}
                          >
                            {h} {reservado ? "(Reservado)" : ""}
                          </span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <label style={{ flex: 1, minWidth: "200px" }}>
                Turma:
                <select
                  value={turmaSelecionada}
                  onChange={(e) => setTurmaSelecionada(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "5px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                >
                  <option value="">-- Selecione --</option>
                  {turmas.map((t, i) => (
                    <option key={i} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ flex: 1, minWidth: "200px" }}>
                Professor:
                <select
                  value={professorSelecionado}
                  onChange={(e) => setProfessorSelecionado(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "5px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                >
                  <option value="">-- Selecione --</option>
                  {professores.map((p, i) => (
                    <option key={i} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              onClick={salvarReserva}
              style={{
                marginTop: 20,
                padding: "10px 20px",
                cursor: "pointer",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "5px",
              }}
            >
              Reservar
            </button>
          </section>

          <section style={{ marginTop: 40 }}>
            <h2
              style={{
                color: "#0056b3",
                borderBottom: "2px solid #e2e8f0",
                paddingBottom: "10px",
              }}
            >
              Reservas para {dataSelecionada} no ambiente{" "}
              {ambientes.find((a) => a.id === ambienteSelecionado)?.nome}
            </h2>

            {loadingReservas ? (
              <p>Carregando reservas...</p>
            ) : reservas.length === 0 ? (
              <p>Nenhuma reserva para essa data.</p>
            ) : (
              <table
                border="1"
                cellPadding="10"
                cellSpacing="0"
                style={{
                  width: "100%",
                  marginTop: 10,
                  borderCollapse: "collapse",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <thead style={{ backgroundColor: "#0056b3", color: "white" }}>
                  <tr>
                    <th style={{ padding: "12px" }}>Horário</th>
                    <th style={{ padding: "12px" }}>Turma</th>
                    <th style={{ padding: "12px" }}>Professor</th>
                    <th style={{ padding: "12px" }}>Usuário</th>
                    <th style={{ padding: "12px" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {reservas.map((r) => (
                    <tr
                      key={r.id}
                      style={{
                        backgroundColor: "#fff",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <td style={{ padding: "12px" }}>{r.horario}</td>
                      <td style={{ padding: "12px" }}>{r.turma}</td>
                      <td style={{ padding: "12px" }}>{r.professor}</td>
                      <td style={{ padding: "12px" }}>{r.usuarioNome}</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {r.usuarioId === user.uid ? (
                          <button
                            onClick={() => excluirReserva(r.id)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            <TrashIcon />
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}

      <section style={{ marginTop: 40 }}>
        <h2
          style={{
            color: "#0056b3",
            borderBottom: "2px solid #e2e8f0",
            paddingBottom: "10px",
          }}
        >
          Relatório de Reservas do Dia
        </h2>
        {relatorioReservas.length === 0 ? (
          <p>Nenhuma reserva registrada para esta data.</p>
        ) : (
          <table
            border="1"
            cellPadding="10"
            cellSpacing="0"
            style={{
              width: "100%",
              marginTop: 10,
              borderCollapse: "collapse",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <thead style={{ backgroundColor: "#0056b3", color: "white" }}>
              <tr>
                <th style={{ padding: "12px" }}>Ambiente</th>
                <th style={{ padding: "12px" }}>Horário</th>
                <th style={{ padding: "12px" }}>Turma</th>
                <th style={{ padding: "12px" }}>Professor</th>
              </tr>
            </thead>
            <tbody>
              {relatorioReservas.map((r) => (
                <tr
                  key={r.id}
                  style={{
                    backgroundColor: "#fff",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <td style={{ padding: "12px" }}>{r.nomeAmbiente}</td>
                  <td style={{ padding: "12px" }}>{r.horario}</td>
                  <td style={{ padding: "12px" }}>{r.turma}</td>
                  <td style={{ padding: "12px" }}>{r.professor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {mensagem && (
        <div
          style={{
            marginTop: 20,
            padding: 15,
            backgroundColor:
              mensagem.tipo === "sucesso" ? "#d4edda" : "#f8d7da",
            color: mensagem.tipo === "sucesso" ? "#155724" : "#721c24",
            borderRadius: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            border: `1px solid ${
              mensagem.tipo === "sucesso" ? "#c3e6cb" : "#f5c6cb"
            }`,
          }}
        >
          {mensagem.texto}
          <button
            style={{
              marginLeft: 10,
              cursor: "pointer",
              background: "none",
              border: "none",
              fontSize: "1.2rem",
            }}
            onClick={() => setMensagem(null)}
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
