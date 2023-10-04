export type ExodusOptions = {
  onlyIfTrusted: boolean
}

export type WindowExtended = { exodus: { algorand: Exodus } } & Window & typeof globalThis

export type Bytes = Readonly<Uint8Array>

export type Exodus = {
  isConnected: boolean
  address: string | null
  connect: ({ onlyIfTrusted }: { onlyIfTrusted: boolean }) => Promise<{
    address: string
  }>
  disconnect: () => void
  signAndSendTransaction(transactions: Bytes[]): Promise<{
    txId: string
  }>
  signTransaction(transactions: Bytes[]): Promise<Bytes[]>
}
