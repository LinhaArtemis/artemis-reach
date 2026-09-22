"use client"

import { Suspense, useEffect, useState } from "react"
import { auth } from "./firebase"
import { useSearchParams, useRouter } from "next/navigation"
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth"
import { Shield, CheckCircle2, Eye, EyeOff } from "lucide-react"

const cores = {
  fundo: "#EEEAF8",
  roxo: "#5A4997",
  roxoEscuro: "#2F195F",
  roxoClaro: "#BB99FF",
  branco: "#FFFFFF",
}

function RedefinirSenhaInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const oobCode = searchParams.get("oobCode")

  const [estado, setEstado] = useState("carregando") // carregando | invalido | expirado | formulario | sucesso
  const [email, setEmail] = useState("")
  const [novaSenha,   setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!oobCode) { setEstado("invalido"); return }

    verifyPasswordResetCode(auth, oobCode)
      .then((emailDoCodigo) => {
        setEmail(emailDoCodigo)
        setEstado("formulario")
      })
      .catch((e: any) => {
        if (e.code === "auth/expired-action-code") setEstado("expirado")
        else setEstado("invalido")
      })
  }, [oobCode])

  async function salvarNovaSenha() {
    setErro("")

    if (novaSenha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.")
      return
    }
    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem.")
      return
    }

    setSalvando(true)
    try {
      await confirmPasswordReset(auth, oobCode as string, novaSenha)
      setEstado("sucesso")
    } catch (e: any) {
      if (e.code === "auth/expired-action-code") setEstado("expirado")
      else if (e.code === "auth/weak-password") setErro("Senha muito fraca. Use pelo menos 6 caracteres.")
      else setErro("Não foi possível salvar sua senha. Tente novamente.")
    }
    setSalvando(false)
  }

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: cores.fundo,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", fontFamily: "sans-serif"
    }}>
      <div style={{
        backgroundColor: cores.branco, borderRadius: "20px",
        padding: "32px", maxWidth: "420px", width: "100%",
        boxShadow: "0 4px 24px rgba(90,73,151,0.12)", textAlign: "center"
      }}>

        {estado === "carregando" && <>
          <div style={{
            width: "56px", height: "56px", borderRadius: "50%",
            backgroundColor: `rgba(90,73,151,0.1)`, display: "flex",
            alignItems: "center", justifyContent: "center", margin: "0 auto 20px"
          }}>
            <Shield size={24} color={cores.roxo} />
          </div>
          <p style={{ color: cores.roxo || "#888" }}>Verificando link...</p>
        </>}

        {estado === "invalido" && <>
          <div style={{
            width: "56px", height: "56px", borderRadius: "50%",
            backgroundColor: "rgba(239,68,68,0.1)", display: "flex",
            alignItems: "center", justifyContent: "center", margin: "0 auto 20px"
          }}>
            <Shield size={24} color="#ef4444" />
          </div>
          <h2 style={{ color: cores.roxoEscuro, margin: "0 0 8px" }}>Link inválido</h2>
          <p style={{ color: "#888", fontSize: "13px", marginBottom: "24px" }}>
            Este link de redefinição de senha não existe ou já foi usado.
          </p>
          <button onClick={() => router.push("/")} style={{
            width: "100%", padding: "14px", backgroundColor: cores.roxo,
            color: cores.branco, border: "none", borderRadius: "12px",
            fontSize: "15px", fontWeight: "bold", cursor: "pointer"
          }}>
            Voltar para o login
          </button>
        </>}

        {estado === "expirado" && <>
          <div style={{
            width: "56px", height: "56px", borderRadius: "50%",
            backgroundColor: "rgba(239,68,68,0.1)", display: "flex",
            alignItems: "center", justifyContent: "center", margin: "0 auto 20px"
          }}>
            <Shield size={24} color="#ef4444" />
          </div>
          <h2 style={{ color: cores.roxoEscuro, margin: "0 0 8px" }}>Link expirado</h2>
          <p style={{ color: "#888", fontSize: "13px", marginBottom: "24px" }}>
            Este link expirou. Peça um novo link de recuperação de senha.
          </p>
          <button onClick={() => router.push("/")} style={{
            width: "100%", padding: "14px", backgroundColor: cores.roxo,
            color: cores.branco, border: "none", borderRadius: "12px",
            fontSize: "15px", fontWeight: "bold", cursor: "pointer"
          }}>
            Voltar para o login
          </button>
        </>}

        {estado === "formulario" && <>
          <div style={{
            width: "56px", height: "56px", borderRadius: "50%",
            backgroundColor: `rgba(90,73,151,0.1)`, display: "flex",
            alignItems: "center", justifyContent: "center", margin: "0 auto 20px"
          }}>
            <Shield size={24} color={cores.roxo} />
          </div>

          <h2 style={{ color: cores.roxoEscuro, margin: "0 0 8px", fontSize: "20px" }}>Criar nova senha</h2>
          <p style={{ color: "#888", fontSize: "13px", marginBottom: "24px" }}>
            Definindo uma nova senha para <strong style={{ color: cores.roxoEscuro }}>{email}</strong>
          </p>

          <div style={{ textAlign: "left", marginBottom: "16px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: cores.roxoEscuro, display: "block", marginBottom: "8px" }}>
              Nova senha
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", border: "1.5px solid #E8E0F5", borderRadius: "12px", padding: "12px 16px" }}>
              <input
                type={mostrarSenha ? "text" : "password"}
                placeholder="••••••••"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                style={{ border: "none", outline: "none", flex: 1, fontSize: "14px", color: "#333", background: "transparent" }}
              />
              <span onClick={() => setMostrarSenha(!mostrarSenha)} style={{ cursor: "pointer", color: cores.roxo, display: "flex" }}>
                {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
              </span>
            </div>
          </div>

          <div style={{ textAlign: "left", marginBottom: "20px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: cores.roxoEscuro, display: "block", marginBottom: "8px" }}>
              Confirmar nova senha
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", border: "1.5px solid #E8E0F5", borderRadius: "12px", padding: "12px 16px" }}>
              <input
                type={mostrarSenha ? "text" : "password"}
                placeholder="••••••••"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                style={{ border: "none", outline: "none", flex: 1, fontSize: "14px", color: "#333", background: "transparent" }}
              />
            </div>
          </div>

          {erro && <p style={{ color: "#ef4444", fontSize: "13px", marginBottom: "16px" }}>{erro}</p>}

          <button
            onClick={salvarNovaSenha}
            disabled={salvando}
            style={{
              width: "100%", padding: "14px", backgroundColor: cores.roxo,
              color: cores.branco, border: "none", borderRadius: "12px",
              fontSize: "15px", fontWeight: "bold", cursor: "pointer",
              opacity: salvando ? 0.7 : 1
            }}
          >
            {salvando ? "Salvando..." : "Salvar nova senha"}
          </button>
        </>}

        {estado === "sucesso" && <>
          <div style={{
            width: "56px", height: "56px", borderRadius: "50%",
            backgroundColor: "rgba(34,197,94,0.1)", display: "flex",
            alignItems: "center", justifyContent: "center", margin: "0 auto 20px"
          }}>
            <CheckCircle2 size={26} color="#16a34a" />
          </div>
          <h2 style={{ color: cores.roxoEscuro, margin: "0 0 8px" }}>Senha alterada!</h2>
          <p style={{ color: "#888", fontSize: "13px", marginBottom: "24px" }}>
            Sua senha foi redefinida com sucesso. Agora você já pode entrar com a nova senha.
          </p>
          <button onClick={() => router.push("/")} style={{
            width: "100%", padding: "14px", backgroundColor: cores.roxo,
            color: cores.branco, border: "none", borderRadius: "12px",
            fontSize: "15px", fontWeight: "bold", cursor: "pointer"
          }}>
            Ir para o login
          </button>
        </>}

      </div>
    </div>
  )
}

export default function RedefinirSenha() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", backgroundColor: cores.fundo, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#888", fontFamily: "sans-serif" }}>Carregando...</p>
      </div>
    }>
      <RedefinirSenhaInner />
    </Suspense>
  )
}