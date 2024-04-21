param (
    [string]$macValue
)
Write-Host "Valor de la mac: $macValue"
# CONVERTIMOS MAC A MATRIZ BYTES
$MacByteArray = $macValue -split "[:-]" | ForEach-Object { [Byte] "0x$_"}
[Byte[]] 
# LANZAMOS EL PAQUETE MAGICO
$MagicPacket = (,0xFF * 6) + ($MacByteArray  * 16)
$UdpClient = New-Object System.Net.Sockets.UdpClient
$UdpClient.Connect(([System.Net.IPAddress]::Broadcast),7)
$UdpClient.Send($MagicPacket,$MagicPacket.Length)
$UdpClient.Close()