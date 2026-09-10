import { Capacitor } from "@capacitor/core"

const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
const CHAR_SOS_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8"
const NOME_DISPOSITIVO = "SOS_DEVICE"

export function isApp() {
  return Capacitor.isNativePlatform()
}

// Conecta ao dispositivo e escuta o botão SOS
export async function conectarDispositivo(
  onLog: (msg: string, tipo?: string) => void,
  onSOS: () => void
): Promise<any> {
  if (isApp()) {
    // ─── APP NATIVO ───
    const { BleClient } = await import("@capacitor-community/bluetooth-le")

    onLog("Inicializando Bluetooth...", "info")
    await BleClient.initialize({ androidNeverForLocation: false })

    onLog("Buscando SOS_DEVICE...", "info")
    const device = await BleClient.requestDevice({
      services: [SERVICE_UUID],
      name: NOME_DISPOSITIVO,
    })

    onLog("Dispositivo encontrado: " + (device.name || "SOS_DEVICE"), "sucesso")

    await BleClient.connect(device.deviceId, () => {
      onLog("Dispositivo desconectado.", "aviso")
    })
    onLog("Conectado!", "sucesso")

    // Escuta notificações da característica
    await BleClient.startNotifications(
      device.deviceId,
      SERVICE_UUID,
      CHAR_SOS_UUID,
      (value) => {
        const decoder = new TextDecoder()
        const texto = decoder.decode(value.buffer)
        onLog("Valor recebido: " + texto, "info")
        if (texto === "SOS_ATIVADO" || texto.includes("SOS") || texto.length > 3) {
          onLog("BOTÃO SOS PRESSIONADO!", "erro")
          onSOS()
        }
      }
    )

    onLog("Aguardando SOS...", "sucesso")

    // Retorna função para desconectar
    return {
      desconectar: async () => {
        await BleClient.stopNotifications(device.deviceId, SERVICE_UUID, CHAR_SOS_UUID)
        await BleClient.disconnect(device.deviceId)
      },
      deviceId: device.deviceId,
      nome: device.name || "SOS_DEVICE"
    }
  } else {
    // ─── SITE (WEB BLUETOOTH) ───
    if (!(navigator as any).bluetooth) {
      onLog("Bluetooth não suportado. Use Chrome ou Edge.", "erro")
      throw new Error("Bluetooth não suportado")
    }

    onLog("Buscando SOS_DEVICE...", "info")
    const device = await (navigator as any).bluetooth.requestDevice({
      filters: [{ name: NOME_DISPOSITIVO }],
      optionalServices: [SERVICE_UUID]
    })

    onLog("Dispositivo encontrado: " + device.name, "sucesso")

    device.addEventListener("gattserverdisconnected", () => {
      onLog("Dispositivo desconectado.", "aviso")
    })

    const server = await device.gatt.connect()
    onLog("Conectado ao servidor GATT!", "sucesso")

    const service = await server.getPrimaryService(SERVICE_UUID)
    const sosChar = await service.getCharacteristic(CHAR_SOS_UUID)

    await sosChar.startNotifications()
    onLog("Aguardando SOS...", "sucesso")

    sosChar.addEventListener("characteristicvaluechanged", (event: any) => {
      const decoder = new TextDecoder()
      const texto = decoder.decode(event.target.value)
      onLog("Valor recebido: " + texto, "info")
      if (texto === "SOS_ATIVADO" || texto.includes("SOS") || texto.length > 3) {
        onLog("BOTÃO SOS PRESSIONADO!", "erro")
        onSOS()
      }
    })

    return {
      desconectar: async () => {
        if (device.gatt?.connected) device.gatt.disconnect()
      },
      deviceId: device.id,
      nome: device.name || "SOS_DEVICE"
    }
  }
}